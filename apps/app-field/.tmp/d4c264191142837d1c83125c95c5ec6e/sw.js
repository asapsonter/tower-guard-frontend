import {registerRoute as workbox_routing_registerRoute} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-routing@7.4.0/node_modules/workbox-routing/registerRoute.mjs';
import {ExpirationPlugin as workbox_expiration_ExpirationPlugin} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-expiration@7.4.0/node_modules/workbox-expiration/ExpirationPlugin.mjs';
import {CacheableResponsePlugin as workbox_cacheable_response_CacheableResponsePlugin} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-cacheable-response@7.4.0/node_modules/workbox-cacheable-response/CacheableResponsePlugin.mjs';
import {NetworkFirst as workbox_strategies_NetworkFirst} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-strategies@7.4.0/node_modules/workbox-strategies/NetworkFirst.mjs';
import {CacheFirst as workbox_strategies_CacheFirst} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-strategies@7.4.0/node_modules/workbox-strategies/CacheFirst.mjs';
import {clientsClaim as workbox_core_clientsClaim} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-core@7.4.0/node_modules/workbox-core/clientsClaim.mjs';
import {precacheAndRoute as workbox_precaching_precacheAndRoute} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-precaching@7.4.0/node_modules/workbox-precaching/precacheAndRoute.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-precaching@7.4.0/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs';
import {NavigationRoute as workbox_routing_NavigationRoute} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-routing@7.4.0/node_modules/workbox-routing/NavigationRoute.mjs';
import {createHandlerBoundToURL as workbox_precaching_createHandlerBoundToURL} from '/Users/seismicconsultinggroup/Documents/Projects/telecom_mast/node_modules/.bun/workbox-precaching@7.4.0/node_modules/workbox-precaching/createHandlerBoundToURL.mjs';/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */








self.skipWaiting();

workbox_core_clientsClaim();


/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox_precaching_precacheAndRoute([
  {
    "url": "icons/icon-192.png",
    "revision": "820e5183961c96732fd3179619964b6a"
  },
  {
    "url": "icons/icon-512.png",
    "revision": "55925b60635e737a260abf322a40ac5c"
  },
  {
    "url": "icons/icon-maskable-512.png",
    "revision": "2173de73a2db1d5b22d30483c6afadbe"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();
workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("index.html")));


workbox_routing_registerRoute(/^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i, new workbox_strategies_NetworkFirst({ "cacheName":"supabase-rest","networkTimeoutSeconds":5, plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 21600 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox_routing_registerRoute(/^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/i, new workbox_strategies_NetworkFirst({ "cacheName":"supabase-auth","networkTimeoutSeconds":5, plugins: [new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox_routing_registerRoute(/^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i, new workbox_strategies_CacheFirst({ "cacheName":"osm-tiles", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 2592000 })] }), 'GET');




