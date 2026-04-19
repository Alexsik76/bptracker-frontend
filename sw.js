const SHARE_CACHE = 'share-target-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Web Share Target: browser POSTs a shared image to /index.html
    if (event.request.method === 'POST' && url.pathname === '/index.html') {
        event.respondWith((async () => {
            const formData = await event.request.formData();
            const file = formData.get('image');
            if (file instanceof File) {
                const cache = await caches.open(SHARE_CACHE);
                await cache.put('/shared-image', new Response(file, {
                    headers: { 'Content-Type': file.type || 'image/jpeg' }
                }));
            }
            return Response.redirect('/index.html?shared=1', 303);
        })());
        return;
    }

    event.respondWith(fetch(event.request));
});
