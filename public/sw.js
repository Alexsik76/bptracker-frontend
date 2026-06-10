const CACHE = 'bp-tracker-shell-v1';
const SHARE_CACHE = 'share-target-v1';

self.addEventListener('install', event => {
    // Cache the app shell so navigation fallback works offline
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.add('/index.html'))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Delete old cache versions
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE && k !== SHARE_CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Web Share Target: browser POSTs a shared image
    if (event.request.method === 'POST' && (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/'))) {
        event.respondWith((async () => {
            const formData = await event.request.formData();
            const file = formData.get('image');
            if (file instanceof File) {
                const cache = await caches.open(SHARE_CACHE);
                await cache.put('shared-image', new Response(file, {
                    headers: { 'Content-Type': file.type || 'image/jpeg' }
                }));
            }
            return Response.redirect('?shared=1', 303);
        })());
        return;
    }

    // Skip cross-origin requests (API calls, CDN, etc.)
    if (url.origin !== self.location.origin) return;

    // Navigation requests (opening any route of the SPA):
    // Always fetch fresh index.html from network; fall back to cache if offline.
    // This is the critical SPA fix: /settings, /measurement/new, etc. all get index.html.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch('/index.html', { cache: 'no-store' })
                .then(resp => {
                    const toCache = resp.clone();
                    caches.open(CACHE).then(c => c.put('/index.html', toCache));
                    return resp;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Hashed assets (/assets/...) are immutable — cache first, then network
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(resp => {
                    if (resp.ok) {
                        const toCache = resp.clone();
                        caches.open(CACHE).then(c => c.put(event.request, toCache));
                    }
                    return resp;
                });
            })
        );
        return;
    }

    // config.js, manifest.json, icons: network first, cache as fallback
    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
            .then(resp => {
                if (resp.ok) {
                    const toCache = resp.clone();
                    caches.open(CACHE).then(c => c.put(event.request, toCache));
                }
                return resp;
            })
            .catch(() => caches.match(event.request))
    );
});

// -- Push Notifications Integration --

function getApiBaseUrl() {
    if (!self.CONFIG) {
        const window = self;
        importScripts('/config.js');
    }
    return self.CONFIG.API_BASE_URL;
}

self.addEventListener('push', event => {
    if (!event.data) return;

    try {
        const payload = event.data.json();
        const title = payload.title || 'BP Tracker';
        const body = payload.body || '';
        const period = payload.period;
        const date = payload.date;
        const templateId = payload.templateId;

        // Tag based on period+date so repeats replace rather than stack
        const tag = period && date ? `${period}-${date}` : undefined;

        const options = {
            body: body,
            icon: '/icons/icon.svg',
            badge: '/icons/icon.svg',
            tag: tag,
            requireInteraction: true,
            data: {
                period: period,
                date: date,
                templateId: templateId
            },
            actions: period ? [
                { action: 'confirm', title: '✓ Прийняв' }
            ] : []
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error('[SW] Error parsing push data', e);
    }
});

self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'confirm') {
        const period = notification.data?.period;
        if (period) {
            const apiBase = getApiBaseUrl();

            event.waitUntil(
                fetch(`${apiBase}/reminders/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ period: period }),
                    credentials: 'include' // session cookie
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to confirm intake: ${response.status}`);
                    }
                    notification.close();
                })
                .catch(err => {
                    console.error('[SW] Error confirming intake', err);
                    notification.close();
                })
            );
        } else {
            notification.close();
        }
    } else {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    for (const client of clientList) {
                        if ('focus' in client) {
                            if ('navigate' in client) {
                                client.navigate('/meds');
                            }
                            return client.focus();
                        }
                    }
                    if (self.clients.openWindow) {
                        return self.clients.openWindow('/meds');
                    }
                })
                .then(() => {
                    notification.close();
                })
        );
    }
});
