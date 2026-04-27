import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let nextId = 0;
const toasts = ref<Toast[]>([]);

export function useToast() {
  function add(type: ToastType, message: string, ttl = 4000) {
    const id = ++nextId;
    toasts.value.push({ id, type, message });
    setTimeout(() => dismiss(id), ttl);
  }

  function success(message: string) {
    add('success', message);
  }
  function error(message: string) {
    add('error', message);
  }
  function info(message: string) {
    add('info', message);
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, success, error, info, dismiss };
}
