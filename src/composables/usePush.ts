import { ref } from 'vue';
import { useApi } from './useApi';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePush() {
  const status = ref<'subscribed' | 'not' | 'denied' | 'unsupported'>('unsupported');
  const loading = ref(false);
  const api = useApi();

  function isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async function checkStatus() {
    if (!isSupported()) {
      status.value = 'unsupported';
      return;
    }

    if (Notification.permission === 'denied') {
      status.value = 'denied';
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        status.value = 'subscribed';
      } else {
        status.value = 'not';
      }
    } catch (e) {
      console.error('[Push] Error checking subscription status', e);
      status.value = 'not';
    }
  }

  async function requestAndSubscribe() {
    if (!isSupported()) return;
    loading.value = true;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        status.value = 'denied';
        return;
      }
      if (permission !== 'granted') {
        status.value = 'not';
        return;
      }

      const keyRes = await api.getVapidPublicKey();
      const vapidKey = keyRes.publicKey;

      if (!vapidKey) {
        throw new Error('VAPID public key is missing on the server');
      }

      const reg = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      const keys = subscription.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) {
        throw new Error('Push keys are missing');
      }

      await api.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        }
      });

      status.value = 'subscribed';
    } catch (e) {
      console.error('[Push] Subscription failed', e);
      await checkStatus();
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function unsubscribe() {
    if (!isSupported()) return;
    loading.value = true;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.unsubscribePush(sub.endpoint);
      }
      status.value = 'not';
    } catch (e) {
      console.error('[Push] Unsubscription failed', e);
      await checkStatus();
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    status,
    loading,
    isSupported: isSupported(),
    checkStatus,
    requestAndSubscribe,
    unsubscribe
  };
}
