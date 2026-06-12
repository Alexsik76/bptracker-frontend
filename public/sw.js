self.window = self;
importScripts('/config.js');
const CACHE = 'bp-tracker-shell-v5';
const SHARE_CACHE = 'share-target-v5';

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

    // Skip API requests and non-GET requests
    if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') return;

    // Navigation requests (opening any route of the SPA):
    // Always fetch fresh index.html from network; fall back to cache if offline.
    // This is the critical SPA fix: /settings, /measurement/new, etc. all get index.html.
    if (event.request.mode === 'navigate') {
        if (url.pathname.endsWith('.html')) {
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
            return;
        }

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
    return self.CONFIG.API_BASE_URL;
}

function openPushDebugDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("push-debug", 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("events")) {
                db.createObjectStore("events", { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        request.onerror = event => {
            reject(request.error || new Error("Failed to open IndexedDB"));
        };
    });
}

function logPushEvent(entry) {
    return openPushDebugDb().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["events"], "readwrite");
            const store = transaction.objectStore("events");

            const keysRequest = store.getAllKeys();
            keysRequest.onsuccess = () => {
                const keys = keysRequest.result;
                if (keys.length >= 200) {
                    const toDeleteCount = keys.length - 199;
                    for (let i = 0; i < toDeleteCount && i < keys.length; i++) {
                        store.delete(keys[i]);
                    }
                }
                const addRequest = store.add(entry);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error || new Error("Failed to add entry"));
            };

            keysRequest.onerror = () => {
                const addRequest = store.add(entry);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error || new Error("Failed to add entry"));
            };

            transaction.oncomplete = () => {
                db.close();
            };
            transaction.onerror = () => {
                db.close();
                reject(transaction.error || new Error("Transaction failed"));
            };
        });
    }).catch(err => {
        console.error("[SW] IndexedDB error logging push event:", err);
    });
}

self.addEventListener('push', event => {
    event.waitUntil((async () => {
        const entry = {
            receivedAt: new Date().toISOString(),
            receivedEpochMs: Date.now(),
            hasData: !!event.data,
            rawText: null,
            parsedOk: false,
            title: null,
            shown: false,
            error: null
        };

        if (event.data) {
            try {
                entry.rawText = event.data.text();
            } catch (err) {
                entry.error = "Failed to read raw text: " + err.message;
            }
        }

        let payload = null;
        if (event.data) {
            try {
                payload = event.data.json();
                entry.parsedOk = true;
            } catch (err) {
                entry.parsedOk = false;
                entry.error = "JSON parse error: " + err.message;
            }
        }

        if (entry.parsedOk && payload) {
            entry.title = payload.title || 'BP Tracker';
        }

        if (!event.data) {
            entry.error = "No event data payload";
            await logPushEvent(entry);
            return;
        }

        if (!entry.parsedOk) {
            await logPushEvent(entry);
            return;
        }

        try {
            const title = payload.title || 'BP Tracker';
            const body = payload.body || '';
            const period = payload.period;
            const date = payload.date;
            const templateId = payload.templateId;

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

            await self.registration.showNotification(title, options);
            entry.shown = true;
        } catch (err) {
            entry.shown = false;
            entry.error = (entry.error ? entry.error + "; " : "") + "showNotification error: " + err.message;
        }

        await logPushEvent(entry);
    })());
});

function openMedsApp() {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
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
        });
}

self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;

    // Call notification.close() in ALL paths immediately so it always closes after tap.
    notification.close();

    if (action === 'confirm') {
        const period = notification.data?.period;
        if (period) {
            const apiBase = getApiBaseUrl();
            let timezone;
            try {
                timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (e) {
                console.error('[SW] Failed to get timezone:', e);
            }

            event.waitUntil(
                fetch(`${apiBase}/reminders/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ period: period, timezone: timezone }),
                    credentials: 'include' // session cookie
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('[SW] Non-OK status when confirming intake:', response.status);
                            // On non-OK status (e.g. WAF 403), open the app at /meds so the user can confirm manually
                            return openMedsApp();
                        }
                    })
                    .catch(err => {
                        console.error('[SW] Error confirming intake:', err);
                        // On fetch error (e.g. offline/network failure), open the app at /meds
                        return openMedsApp();
                    })
            );
        }
    } else {
        // Tapping the notification body opens the app
        event.waitUntil(openMedsApp());
    }
});
