/* =====================================================================
 * ESTEPEL — ui.js : ikon (gaya garis Lucide, inline SVG sprite), komponen,
 * modal/popover/toast, dan grafik SVG ringan (tanpa pustaka grafik ganda).
 * ===================================================================== */
var UI = (function () {
  'use strict';
  var IK = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>', right: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
    checkc: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    siren: '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    sheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2M14 13h2M8 17h2M14 17h2"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    hosp: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8M8 12h8"/>',
    virus: '<path d="m8 2 1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3 3 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
    trendup: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', trenddown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
    stamp: '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.69 0-3 1-3 3s1 2 1 3.5V13"/>',
    verified: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    table: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18"/>',
    heat: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    wa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    swap: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    hub: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    compare: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    sidebar: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>'
  };
  function sprite() {
    if (document.getElementById('ik-sprite')) return;
    var s = '<svg id="ik-sprite" xmlns="http://www.w3.org/2000/svg" style="display:none">';
    Object.keys(IK).forEach(function (k) { s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + IK[k] + '</symbol>'; });
    document.body.insertAdjacentHTML('afterbegin', s + '</svg>');
  }
  function ic(n, sz, cls) { return '<svg class="ic' + (sz ? ' s' + sz : '') + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var A = INTI.angka;
  function inisial(s) { var w = String(s || '').replace(/^puskesmas\s+/i, '').split(/\s+/).filter(Boolean); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '')[1] || '')).toUpperCase(); }
  var WARNA_INI = ['t-vio', 't-blu', 't-amb', 't-grn', 't-red'];
  function warnaIni(k) { var n = 0; String(k).split('').forEach(function (c) { n += c.charCodeAt(0); }); return WARNA_INI[n % WARNA_INI.length]; }

  /* ---------- Komponen ---------- */
  function badgeStatus(kode, hari, kecil) {
    var m = INTI.STATUS[kode] || INTI.STATUS.BJT;
    var t = kode === 'TERLAMBAT' && hari ? 'Terlambat +' + hari + ' hr' : m.label;
    return '<span class="badge b-' + m.kelas + (kecil ? ' b-sm' : '') + '">' + ic(m.ikon, 14) + t + '</span>';
  }
  function badge(t, k, ikon) { return '<span class="badge b-' + k + '">' + (ikon ? ic(ikon, 14) : '') + esc(t) + '</span>'; }
  function kosong(judul, teks, ikon, aksi) {
    return '<div class="empty"><div class="em-ic">' + ic(ikon || 'inbox', 28) + '</div><b>' + esc(judul) + '</b><div>' + esc(teks || '') + '</div>' + (aksi || '') + '</div>';
  }
  function skel(h, n) { var s = ''; for (var i = 0; i < (n || 1); i++) s += '<div class="sk" style="height:' + (h || 16) + 'px;margin-bottom:10px"></div>'; return s; }
  function kpi(o) {
    return '<div class="card kpi' + (o.klik ? ' klik' : '') + '"' + (o.klik ? ' data-act="' + o.klik + '"' : '') + '>' +
      '<div class="kpi-top"><div class="tile ' + o.tile + '">' + ic(o.ikon, 22) + '</div><div class="flex g6 wrap" style="justify-content:flex-end">' + (o.badge || '') + '</div></div>' +
      '<div><div class="kpi-lbl">' + esc(o.label) + '</div><div class="kpi-val mt8"' + (o.warna ? ' style="color:' + o.warna + '"' : '') + '>' + o.nilai + (o.sub ? ' <small>' + o.sub + '</small>' : '') + '</div></div>' +
      (o.foot ? '<div class="kpi-foot">' + o.foot + '</div>' : '') + '</div>';
  }
  function tren(cur, prev, netral) {
    if (!prev) return cur ? '<span class="tren b-info">baru</span>' : '';
    var d = Math.round((cur - prev) / prev * 1000) / 10;
    var naik = d > 0, kls = netral ? 'b-info' : (naik ? 'b-ok' : 'b-bad');
    return '<span class="tren ' + kls + '" title="vs periode sebelumnya">' + (naik ? '▲ ' : d < 0 ? '▼ ' : '') + Math.abs(d).toLocaleString('id-ID') + '%</span>';
  }
  function bar(pct, c) { return '<div class="bar thin" style="min-width:70px"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%;--c:' + (c || 'var(--p)') + '"></i></div>'; }
  var WARNA_SKOR = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', muted: '#CBD5E1' };

  /* ---------- Toast ---------- */
  function toast(pesan, jenis, ms) {
    var w = $('#toasts');
    if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.className = 'toasts'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
    var t = document.createElement('div');
    t.className = 'toast ' + (jenis || 'ok');
    t.innerHTML = ic(jenis === 'bad' ? 'siren' : jenis === 'warn' ? 'alert' : jenis === 'info' ? 'info' : 'checkc', 18) + '<div>' + esc(pesan) + '</div>';
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 320); }, ms || (jenis === 'bad' ? 6000 : 3500));
  }

  /* ---------- Modal ---------- */
  var tumpuk = [];
  function modal(o) {
    var bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (o.ukuran || '') + '" role="dialog" aria-modal="true"><div class="modal-h">' + (o.ikon ? '<div class="tile ' + (o.tile || 't-vio') + '" style="width:38px;height:38px">' + ic(o.ikon, 20) + '</div>' : '') +
      '<h3>' + esc(o.judul || '') + (o.sub ? '<div class="card-s" style="font-family:var(--f);font-weight:400">' + esc(o.sub) + '</div>' : '') + '</h3><button class="icbtn" data-tutup aria-label="Tutup">' + ic('x') + '</button></div>' +
      '<div class="modal-b">' + (o.isi || '') + '</div>' + (o.tombol && o.tombol.length ? '<div class="modal-f">' + o.tombol.map(function (t, i) {
        return '<button class="btn ' + (t.kelas || 'btn-s') + '" data-tb="' + i + '">' + (t.ikon ? ic(t.ikon, 16) : '') + esc(t.label) + '</button>';
      }).join('') + '</div>' : '') + '</div>';
    document.body.appendChild(bg);
    var m = { el: bg, isi: $('.modal-b', bg), tutup: tutup };
    function tutup() { if (!bg.parentNode) return; bg.remove(); tumpuk = tumpuk.filter(function (x) { return x !== m; }); if (o.onTutup) o.onTutup(); }
    bg.addEventListener('mousedown', function (e) { if (e.target === bg && !o.kunci) tutup(); });
    bg.addEventListener('click', function (e) {
      if (e.target.closest('[data-tutup]')) { tutup(); return; }
      var b = e.target.closest('[data-tb]');
      if (b) {
        var t = o.tombol[+b.dataset.tb];
        if (!t.aksi) { tutup(); return; }
        var r = t.aksi(m, b);
        if (r && r.then) { sibuk(b, true); r.then(function (x) { sibuk(b, false); if (x !== false) tutup(); }, function (err) { sibuk(b, false); if (err) toast(err.message || err, 'bad'); }); }
        else if (r !== false) tutup();
      }
    });
    tumpuk.push(m);
    if (o.onBuka) o.onBuka(m);
    var f = $('input:not([type=hidden]),select,textarea', bg);
    if (f && !o.tanpaFokus) setTimeout(function () { f.focus(); }, 60);
    return m;
  }
  function konfirmasi(o) {
    return new Promise(function (res) {
      var ok = false;
      modal({ judul: o.judul, ikon: o.ikon || (o.bahaya ? 'alert' : 'info'), tile: o.bahaya ? 't-red' : 't-vio', ukuran: 'sm', isi: '<div>' + o.pesan + '</div>' + (o.extra || ''), tanpaFokus: !o.extra,
        tombol: [{ label: o.batal || 'Batal' }, { label: o.ya || 'Ya, lanjutkan', kelas: o.bahaya ? 'btn-d' : 'btn-p', aksi: function (m) { ok = o.ambil ? o.ambil(m) : true; return ok === false ? false : true; } }],
        onTutup: function () { res(ok); } });
    });
  }
  function sibuk(btn, on, teks) {
    if (!btn) return;
    if (on) { btn.dataset.asli = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin' + (btn.classList.contains('btn-s') || btn.classList.contains('btn-g') ? ' dk' : '') + '"></span>' + (teks ? esc(teks) : ''); }
    else if (btn.dataset.asli !== undefined) { btn.disabled = false; btn.innerHTML = btn.dataset.asli; delete btn.dataset.asli; }
  }

  /* ---------- Popover ---------- */
  var popAktif = null;
  function pop(anchor, html, o) {
    o = o || {};
    tutupPop();
    var p = document.createElement('div');
    p.className = 'pop';
    p.style.width = (o.lebar || 320) + 'px';
    p.innerHTML = html;
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect(), w = o.lebar || 320;
    var left = o.kiri ? r.left : r.right - w;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    p.style.left = left + 'px';
    p.style.top = (r.bottom + 8) + 'px';
    var maxH = window.innerHeight - r.bottom - 20;
    p.style.maxHeight = Math.max(240, maxH) + 'px';
    p.style.overflowY = 'auto';
    popAktif = { el: p, anchor: anchor, tutup: o.onTutup };
    if (o.onBuka) o.onBuka(p);
    return p;
  }
  function tutupPop() { if (popAktif) { var t = popAktif.tutup; popAktif.el.remove(); popAktif = null; if (t) t(); } }
  document.addEventListener('mousedown', function (e) {
    if (popAktif && !popAktif.el.contains(e.target) && !popAktif.anchor.contains(e.target)) tutupPop();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (popAktif) { tutupPop(); return; }
    var m = tumpuk[tumpuk.length - 1]; if (m) m.tutup();
  });
  window.addEventListener('resize', function () { tutupPop(); });

  /* =================== Grafik =================== */
  function jalur(pts) {
    if (pts.length < 2) return pts.length ? 'M' + pts[0][0] + ',' + pts[0][1] : '';
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + Math.max(0, c1y).toFixed(1) + ' ' + c2x.toFixed(1) + ',' + Math.max(0, c2y).toFixed(1) + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }
  function skalaAtas(v) { if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  /* data: [{lb, v, tip}] */
  function area(data, o) {
    o = o || {};
    var W = 560, H = o.h || 220, pl = 34, pr = 12, pt = 14, pb = 26, id = 'g' + Math.random().toString(36).slice(2, 7);
    var mx = skalaAtas(Math.max.apply(null, data.map(function (d) { return d.v; }).concat([1])));
    var n = data.length, sx = (W - pl - pr) / Math.max(1, n - 1);
    var pts = data.map(function (d, i) { return [+(pl + i * sx).toFixed(1), +(pt + (H - pt - pb) * (1 - d.v / mx)).toFixed(1)]; });
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik tren') + '"><defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5B3DF5" stop-opacity=".28"/><stop offset="1" stop-color="#5B3DF5" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 4; g++) {
      var y = pt + (H - pt - pb) * g / 4;
      s += '<line class="ch-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text class="ch-ax" x="' + (pl - 6) + '" y="' + (y + 3.5) + '" text-anchor="end">' + A(mx * (1 - g / 4)) + '</text>';
    }
    var d = jalur(pts);
    if (pts.length) s += '<path d="' + d + ' L' + pts[n - 1][0] + ',' + (H - pb) + ' L' + pts[0][0] + ',' + (H - pb) + ' Z" fill="url(#' + id + ')"/><path d="' + d + '" fill="none" stroke="#5B3DF5" stroke-width="2.6" stroke-linecap="round"/>';
    data.forEach(function (dd, i) {
      var lbShow = n <= 12 || i % Math.ceil(n / 12) === 0 || i === n - 1;
      if (lbShow) s += '<text class="ch-ax" x="' + pts[i][0] + '" y="' + (H - 7) + '" text-anchor="middle"' + (i === n - 1 ? ' style="fill:#5B3DF5;font-weight:700"' : '') + '>' + esc(dd.lb) + '</text>';
      s += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + (i === n - 1 ? 5 : 3.2) + '" fill="#5B3DF5" stroke="#fff" stroke-width="2" class="dot-' + i + '"' + (i === n - 1 ? '' : ' opacity=".0"') + '/>';
      s += '<rect class="hz" data-i="' + i + '" data-tip="' + esc(dd.tip || dd.lb + ': ' + A(dd.v)) + '" data-x="' + (pts[i][0] / W * 100) + '" data-y="' + (pts[i][1] / H * 100) + '" x="' + (pts[i][0] - sx / 2) + '" y="0" width="' + Math.max(sx, 8) + '" height="' + H + '" fill="transparent"/>';
    });
    return '<div class="chart" data-unduh="' + esc(o.nama || 'grafik') + '">' + s + '</svg><div class="ch-tip"></div></div>';
  }
  /* Grafik batang berkelompok (mis. L & P per kelompok umur) */
  function batang(lbs, seri, o) {
    o = o || {};
    var W = 560, H = o.h || 230, pl = 34, pr = 8, pt = 12, pb = 28, n = lbs.length;
    var mx = skalaAtas(Math.max.apply(null, seri.reduce(function (a, s) { return a.concat(s.v); }, [1])));
    var gw = (W - pl - pr) / n, bw = Math.min(16, (gw - 6) / seri.length);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik batang') + '">';
    for (var g = 0; g <= 4; g++) { var y = pt + (H - pt - pb) * g / 4; s += '<line class="ch-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text class="ch-ax" x="' + (pl - 6) + '" y="' + (y + 3.5) + '" text-anchor="end">' + A(mx * (1 - g / 4)) + '</text>'; }
    lbs.forEach(function (lb, i) {
      var x0 = pl + i * gw + (gw - bw * seri.length) / 2;
      seri.forEach(function (sr, j) {
        var v = sr.v[i] || 0, h = (H - pt - pb) * v / mx, x = x0 + j * bw, y = H - pb - h;
        s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 2) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="3" fill="' + sr.c + '"/>';
        s += '<rect class="hz" data-tip="' + esc(lb + ' • ' + sr.nama + ': ' + A(v)) + '" data-x="' + ((x + bw / 2) / W * 100) + '" data-y="' + (y / H * 100) + '" x="' + x.toFixed(1) + '" y="' + pt + '" width="' + bw + '" height="' + (H - pt - pb) + '" fill="transparent"/>';
      });
      s += '<text class="ch-ax" x="' + (pl + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(lb) + '</text>';
    });
    return '<div class="chart" data-unduh="' + esc(o.nama || 'grafik') + '">' + s + '</svg><div class="ch-tip"></div></div>';
  }
  /* segs: [{v, c, lb}] */
  function donat(segs, tengah, sub, o) {
    o = o || {};
    var tot = segs.reduce(function (a, s) { return a + s.v; }, 0), R = 15.9155, off = 0, s = '';
    s += '<svg viewBox="0 0 36 36" style="transform:rotate(-90deg)" role="img" aria-label="' + esc(o.label || 'Diagram donat') + '"><circle cx="18" cy="18" r="' + R + '" fill="none" stroke="#EEF2F7" stroke-width="4.2"/>';
    segs.forEach(function (sg) {
      if (!tot || !sg.v) return;
      var pct = sg.v / tot * 100;
      s += '<circle cx="18" cy="18" r="' + R + '" fill="none" stroke="' + sg.c + '" stroke-width="4.2" stroke-dasharray="' + Math.max(0, pct - (segs.length > 1 ? .6 : 0)).toFixed(2) + ' ' + (100 - pct + (segs.length > 1 ? .6 : 0)).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"><title>' + esc(sg.lb + ': ' + sg.v) + '</title></circle>';
      off += pct;
    });
    s += '</svg>';
    var lg = segs.map(function (sg) {
      return '<div><span class="dt" style="--c:' + sg.c + '">' + esc(sg.lb) + '</span><b class="tnum">' + A(sg.v) + ' <span class="mut fs11" style="font-weight:400">(' + (tot ? (sg.v / tot * 100).toFixed(1).replace('.', ',') : 0) + '%)</span></b></div>';
    }).join('');
    return '<div class="donut-wrap" data-unduh-wrap><div class="donut chart" data-unduh="' + esc(o.nama || 'donat') + '">' + s + '<div class="ctr"><div><b>' + esc(tengah) + '</b><span>' + esc(sub || '') + '</span></div></div></div><div class="lg-list">' + lg + '</div></div>';
  }
  /* items: [{lb, v, c, ikon, sub}] */
  function hbar(items, o) {
    o = o || {};
    var mx = Math.max.apply(null, items.map(function (x) { return x.v; }).concat([1]));
    if (!items.length) return kosong('Belum ada data', 'Tidak ada kasus pada periode ini.', 'chart');
    return '<div class="hb-list">' + items.map(function (x, i) {
      return '<div class="hb-row"' + (x.act ? ' data-act="' + x.act + '" style="cursor:pointer"' : '') + '><div class="lb"><span class="flex g6 ell">' + (o.rank ? '<span class="rk" style="background:' + (x.bg || 'var(--soft)') + ';color:' + (x.c || 'var(--p)') + '">' + (i + 1) + '</span>' : '') + '<span class="ell">' + esc(x.lb) + '</span></span><b class="tnum nowrap">' + A(x.v) + ' <span class="mut fs11" style="font-weight:400">' + esc(x.sub || 'kasus') + '</span></b></div>' + bar(x.v / mx * 100, x.c) + '</div>';
    }).join('') + '</div>';
  }
  /* Piramida umur: L kiri, P kanan (SVG agar bisa diunduh sebagai gambar) */
  function piramida(L, P, o) {
    o = o || {};
    var W = 560, rh = 17, gap = 5, H = INTI.UMUR.length * (rh + gap) + 24, mid = W / 2, lw = 44;
    var mx = Math.max.apply(null, L.concat(P).concat([1])), sc = (mid - lw - 34) / mx;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Piramida umur">';
    INTI.UMUR.slice().reverse().forEach(function (u, k) {
      var i = INTI.UMUR.length - 1 - k, y = 4 + k * (rh + gap), l = L[i] || 0, p = P[i] || 0;
      s += '<rect x="' + (mid - lw - l * sc).toFixed(1) + '" y="' + y + '" width="' + (l * sc).toFixed(1) + '" height="' + rh + '" rx="4" fill="#3B82F6"/>';
      s += '<rect x="' + (mid + lw) + '" y="' + y + '" width="' + (p * sc).toFixed(1) + '" height="' + rh + '" rx="4" fill="#A78BFA"/>';
      s += '<text class="ch-ax" x="' + mid + '" y="' + (y + 12.5) + '" text-anchor="middle" style="font-weight:600">' + esc(u.label) + '</text>';
      s += '<text class="ch-ax" x="' + (mid - lw - l * sc - 4).toFixed(1) + '" y="' + (y + 12.5) + '" text-anchor="end">' + A(l) + '</text>';
      s += '<text class="ch-ax" x="' + (mid + lw + p * sc + 4).toFixed(1) + '" y="' + (y + 12.5) + '">' + A(p) + '</text>';
      s += '<rect class="hz" data-tip="' + esc(u.panjang + ' — L: ' + A(l) + ' • P: ' + A(p)) + '" data-x="50" data-y="' + ((y) / H * 100) + '" x="0" y="' + y + '" width="' + W + '" height="' + rh + '" fill="transparent"/>';
    });
    s += '<text class="ch-ax" x="' + (mid - lw - 4) + '" y="' + (H - 4) + '" text-anchor="end" style="fill:#3B82F6;font-weight:700">Laki-laki ' + A(L.reduce(function (a, b) { return a + b; }, 0)) + '</text>';
    s += '<text class="ch-ax" x="' + (mid + lw + 4) + '" y="' + (H - 4) + '" style="fill:#7C5CF6;font-weight:700">Perempuan ' + A(P.reduce(function (a, b) { return a + b; }, 0)) + '</text>';
    return '<div class="chart" data-unduh="' + esc(o.nama || 'piramida-umur') + '">' + s + '</svg><div class="ch-tip"></div></div>';
  }
  /* Tooltip grafik via delegasi (sekali untuk seluruh aplikasi) */
  document.addEventListener('mouseover', function (e) {
    var hz = e.target.closest && e.target.closest('.hz');
    if (!hz) return;
    var ch = hz.closest('.chart'), tip = ch && ch.querySelector('.ch-tip');
    if (!tip) return;
    tip.textContent = hz.getAttribute('data-tip');
    tip.style.left = hz.getAttribute('data-x') + '%';
    tip.style.top = hz.getAttribute('data-y') + '%';
    tip.classList.add('on');
    var i = hz.getAttribute('data-i');
    $$('circle[class^="dot-"]', ch).forEach(function (c) { if (!/opacity/.test(c.getAttribute('style') || '') && c.getAttribute('opacity') !== null) c.setAttribute('opacity', '0'); });
    if (i !== null) { var dot = ch.querySelector('.dot-' + i); if (dot) dot.setAttribute('opacity', '1'); }
  });
  document.addEventListener('mouseout', function (e) {
    var hz = e.target.closest && e.target.closest('.hz');
    if (!hz) return;
    var ch = hz.closest('.chart'), tip = ch && ch.querySelector('.ch-tip');
    if (tip) tip.classList.remove('on');
  });
  /* Unduh grafik SVG sebagai PNG */
  function unduhGrafik(wrap, nama) {
    var svg = wrap.querySelector('svg');
    if (!svg) return toast('Grafik tidak ditemukan', 'bad');
    var kl = svg.cloneNode(true), vb = svg.viewBox.baseVal, w = vb.width * 2, h = vb.height * 2;
    kl.setAttribute('width', w); kl.setAttribute('height', h); kl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $$('.ch-ax', kl).forEach(function (t) { t.setAttribute('fill', t.style.fill || '#64748B'); t.setAttribute('font-family', 'Inter, Arial, sans-serif'); t.setAttribute('font-size', '10.5'); });
    $$('.ch-grid', kl).forEach(function (l) { l.setAttribute('stroke', '#EEF2F7'); l.setAttribute('stroke-dasharray', '3 3'); });
    $$('.hz', kl).forEach(function (r) { r.remove(); });
    var data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(kl));
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      c.toBlob(function (b) { unduhBlob(b, (nama || 'grafik') + '.png'); }, 'image/png');
    };
    img.src = data;
  }
  function unduhBlob(blob, nama) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = nama; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500);
  }
  function waktuRelatif(ms, now) {
    var d = Math.max(0, (now || Date.now()) - ms) / 1000;
    if (d < 60) return 'baru saja';
    if (d < 3600) return Math.floor(d / 60) + ' mnt lalu';
    if (d < 86400) return Math.floor(d / 3600) + ' jam lalu';
    if (d < 86400 * 7) return Math.floor(d / 86400) + ' hari lalu';
    return INTI.fmtTgl(ms);
  }
  function paginasi(total, hal, per) {
    var n = Math.max(1, Math.ceil(total / per)), b = '';
    b += '<button data-pg="' + (hal - 1) + '"' + (hal <= 1 ? ' disabled' : '') + ' aria-label="Sebelumnya">' + ic('left', 14) + '</button>';
    var mulai = Math.max(1, Math.min(hal - 2, n - 4)), akhir = Math.min(n, mulai + 4);
    for (var i = mulai; i <= akhir; i++) b += '<button data-pg="' + i + '"' + (i === hal ? ' class="on"' : '') + '>' + i + '</button>';
    b += '<button data-pg="' + (hal + 1) + '"' + (hal >= n ? ' disabled' : '') + ' aria-label="Berikutnya">' + ic('right', 14) + '</button>';
    return '<div class="pg">' + b + '</div>';
  }
  function debounce(f, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { f.apply(s, a); }, ms); }; }

  return {
    IK: IK, sprite: sprite, ic: ic, esc: esc, $: $, $$: $$, A: A, inisial: inisial, warnaIni: warnaIni,
    badgeStatus: badgeStatus, badge: badge, kosong: kosong, skel: skel, kpi: kpi, tren: tren, bar: bar, WARNA_SKOR: WARNA_SKOR,
    toast: toast, modal: modal, konfirmasi: konfirmasi, sibuk: sibuk, pop: pop, tutupPop: tutupPop,
    area: area, batang: batang, donat: donat, hbar: hbar, piramida: piramida, unduhGrafik: unduhGrafik, unduhBlob: unduhBlob,
    waktuRelatif: waktuRelatif, paginasi: paginasi, debounce: debounce
  };
})();
