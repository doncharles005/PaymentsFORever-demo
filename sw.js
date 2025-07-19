// sw.js
const CACHE_NAME = 'payments-forever-cache-v1'; // Increment this version number when you make changes to cached files!
const urlsToCache = [
    '/', // Caches the root path, usually index.html
    '/index.html',
    '/login.html',
    '/signup.html',
    '/dashboard.html',
    '/contact.html',
    '/styles.css',
    '/script.js', // Assuming you'll have a script.js for menu toggle etc.
    '/images/icons/icon-72x72.png',
    // Add other image assets used directly in your HTML or CSS backgrounds if any
    // For images from external URLs (like PayPal's or Placehold.co), you might need a different caching strategy (runtime caching)
    // For simplicity, we'll only pre-cache your local assets here.
    'https://www.pnc.com/content/dam/pnc-thought-leadership/personal-finance/spend/pnc_insights_p_what-are-digital-payments.jpg', // Hero image from index.html
    'https://www.paypalobjects.com/marketing/web23/us/en/ppe/request-money/split-section-1-size-all-v1.jpg', // Feature image 1 from index.html
    'https://shorturl.at/r8U5C', // Feature image 2 from index.html
    'https://devtechnosys.ae/blog/wp-content/uploads/2024/05/image_processing20200722-15717-oy4mmn.gif', // Feature image 3 from index.html
    'https://shorturl.at/0UAzq', // Login image from login.html
    'https://assets.website-files.com/624b54e3391b15170d100c14/624b54e3391b158019100c5c_Payr.png', // Signup image from signup.html
    // Placeholder images from dashboard.html (These are external, but can be pre-cached for reliability)
    'https://placehold.co/80x80/007bff/ffffff/png?text=JD',
    'https://placehold.co/120x120/1a1a1a/ffffff?text=QR+Code',
    'https://placehold.co/50x30/000000/ffffff?text=VISA',
    'https://placehold.co/50x30/000000/ffffff?text=Bank',
    'https://placehold.co/50x30/000000/ffffff?text=PayPal'
];

// Install event: Caches all listed assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install Event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Caching failed:', error);
            })
    );
    // Force the waiting service worker to become active
    self.skipWaiting();
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate Event');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure the service worker takes control of clients as soon as it's activated
    self.clients.claim();
});

// Fetch event: Serves cached content or fetches from network
self.addEventListener('fetch', (event) => {
    // Only handle HTTP/HTTPS requests
    if (event.request.url.startsWith('http')) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache hit - return response
                    if (response) {
                        console.log('[Service Worker] Serving from cache:', event.request.url);
                        return response;
                    }

                    // No cache hit - fetch from network and cache it
                    console.log('[Service Worker] Fetching from network and caching:', event.request.url);
                    return fetch(event.request)
                        .then((netResponse) => {
                            // Check if we received a valid response
                            if (!netResponse || netResponse.status !== 200 || netResponse.type !== 'basic') {
                                return netResponse;
                            }

                            // Clone the response because it's a stream and can only be consumed once
                            const responseToCache = netResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                            return netResponse;
                        })
                        .catch((error) => {
                            console.error('[Service Worker] Fetch failed:', error);
                            // Optionally, provide a fallback for offline if fetch fails
                            // E.g., return caches.match('/offline.html');
                            // For now, it will just fail.
                        });
                })
        );
    }
});