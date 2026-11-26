/* =====================================================================
 * ESTEPEL — Service Worker (PWA)
 *  - Cangkang aplikasi (HTML/CSS/JS/ikon) di-cache → buka instan & tahan sinyal lemah.
 *  - Permintaan ke Google Apps Script TIDAK PERNAH di-cache (data selalu dari server;
 *    cache data ditangani aplikasi lewat localStorage berversi).
 *  - Font & pustaka CDN (ExcelJS/jsPDF/QR) di-cache saat runtime agar ekspor berikutnya cepat.
 *  Naikkan VERSI setiap rilis frontend agar pengguna menerima pembaruan.
 * ===================================================================== */
var VERSI = 'estepel-v3.0.0';
var STATIS = VERSI + '-statis', RUNTIME = 'estepel-runtime-v1';
var ASET = [
  './', './index.html', './verify.html', './manifest.json',
  './css/style.css',
  './js/config.js', './js/core.js', './js/api.js', './js/ui.js', './js/app.js',
  './js/hal-dashboard.js', './js/hal-laporan.js', './js/hal-monitoring.js', './js/hal-data.js', './js/hal-admin.js', './js/ekspor.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(STATIS).then(function (c) {
    return c.addAll(ASET.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { if (k !== STATIS && k !== RUNTIME) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('message', function (e) { if (e.data === 'skipWaiting') self.skipWaiting(); });

function dariJaringan(req, simpanKe) {
  return fetch(req).then(function (r) {
    if (r && (r.ok || r.type === 'opaque') && simpanKe) { var salin = r.clone(); caches.open(simpanKe).then(function (c) { c.put(req, salin); }); }
    return r;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                         // POST ke GAS → langsung ke jaringan
  var url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname) || url.pathname.slice(-5) === '/exec') return; // API: jangan sentuh

  // Font Google & pustaka CDN: cache-first (berversi di URL, aman disimpan lama)
  if (/fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$|unpkg\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (c) { return c || dariJaringan(req, RUNTIME); }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Navigasi (index/verify): network-first dengan batas 3 detik, cadangan dari cache → tetap terbuka saat luring
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(function (res) {
      var selesai = false;
      var t = setTimeout(function () { caches.match(req, { ignoreSearch: true }).then(function (c) { if (c && !selesai) { selesai = true; res(c); } }); }, 3000);
      dariJaringan(req, STATIS).then(function (r) { clearTimeout(t); if (!selesai) { selesai = true; res(r); } }, function () {
        clearTimeout(t);
        caches.match(req, { ignoreSearch: true }).then(function (c) { if (!selesai) { selesai = true; res(c || caches.match('./index.html')); } });
      });
    }));
    return;
  }

  // Aset statis: stale-while-revalidate → klik antar menu instan, pembaruan diambil di latar belakang
  e.respondWith(caches.open(STATIS).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var segar = dariJaringan(req, STATIS).catch(function () { return hit; });
      return hit || segar;
    });
  }));
});
