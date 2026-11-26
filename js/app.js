/* =====================================================================
 * ESTEPEL — app.js : status aplikasi, router hash, kerangka (sidebar,
 * topbar, bottom nav), login, pemilih periode global, pencarian Ctrl/⌘+K,
 * notifikasi lonceng, sesi idle, PWA (service worker & tombol pasang).
 * ===================================================================== */
var Hal = {};
var App = (function () {
  'use strict';
  var ic = UI.ic, esc = UI.esc, $ = UI.$, $$ = UI.$$;
  var R_PKM = 'Puskesmas', R_STAF = 'Staf Dinkes', R_ADMIN = 'Admin Dinkes';
  var S = { user: null, set: {}, units: [], penyakit: [], uMap: {}, pMap: {}, offset: 0, wajib: '', gp: null, unread: 0, vers: {} };
  var lepas = [], shellSiap = false, rutAktif = '', pasangPrompt = null, pollT = null, idleT = null, aktivitas = Date.now();

  /* ---------- Helper status ---------- */
  function now() { return Date.now() + S.offset; }
  function isPkm() { return S.user && S.user.role === R_PKM; }
  function isAdmin() { return S.user && S.user.role === R_ADMIN; }
  function isDinkes() { return S.user && (S.user.role === R_ADMIN || S.user.role === R_STAF); }
  function namaUnit(k) { var u = S.uMap[k]; return u ? 'Puskesmas ' + u.nama : k; }
  function namaPendek(k) { var u = S.uMap[k]; return u ? u.nama : k; }
  function namaPenyakit(k) { var p = S.pMap[k]; return p ? p.nama : k; }
  function unitsAktif() { return S.units.filter(function (u) { return u.aktif; }); }
  function unitScope() { return isPkm() ? [S.user.unit] : unitsAktif().map(function (u) { return u.kode; }); }
  function tahunDari(dari, sampai) { var a = INTI.urai(dari).y, b = INTI.urai(sampai).y, o = []; for (var y = a; y <= b; y++) o.push(y); return o; }
  function terapkanBoot(b) {
    S.user = b.user || S.user; S.set = b.set || S.set;
    S.units = b.master.units; S.penyakit = b.master.penyakit; S.uMap = {}; S.pMap = {};
    S.units.forEach(function (u) { S.uMap[u.kode] = u; });
    S.penyakit.forEach(function (p) { S.pMap[p.kode] = p; });
    S.offset = b.now - Date.now(); S.wajib = b.periodeWajib; S.vers = b.vers || {}; S.unread = b.notif || 0;
    var gp = LS.get('gp_' + (S.user ? S.user.username : ''), null);
    S.gp = gp && gp.sampai <= S.wajib ? gp : { dari: S.wajib, sampai: S.wajib };
    LS.set('boot', b);
  }
  function setGP(dari, sampai) {
    if (dari > sampai) { var t = dari; dari = sampai; sampai = t; }
    S.gp = { dari: dari, sampai: sampai };
    LS.set('gp_' + S.user.username, S.gp);
    var b = $('#tbPer span'); if (b) b.textContent = INTI.labelRentangPendek(dari, sampai);
    Bus.emit('periode', S.gp);
  }

  /* ---------- Menu per peran (PRD 3.1) ---------- */
  function menu() {
    if (isPkm()) return [{ grp: 'Utama', items: [{ id: 'dashboard', lb: 'Dashboard', ik: 'grid' }, { id: 'laporan', lb: 'Laporan Saya', ik: 'file' }] }];
    var m = [{ grp: 'Pemantauan', items: [{ id: 'dashboard', lb: 'Dashboard', ik: 'grid' }, { id: 'monitoring', lb: 'Monitoring & Ketepatan', ik: 'gauge' }] },
      { grp: 'Data & Analisis', items: [{ id: 'data', lb: 'Data & Rekap', ik: 'chart' }] }];
    if (isAdmin()) m.push({ grp: 'Pengaturan', items: [{ id: 'admin', lb: 'Administrasi', ik: 'shield' }] });
    return m;
  }
  function bnavItems() {
    if (isPkm()) return [['dashboard', 'Dashboard', 'grid'], ['laporan/input', 'Laporan', 'edit'], ['laporan/riwayat', 'Riwayat', 'history'], ['akun', 'Akun', 'user']];
    return [['dashboard', 'Dashboard', 'grid'], ['monitoring', 'Monitoring', 'gauge'], ['data', 'Data', 'chart'], isAdmin() ? ['admin', 'Admin', 'shield'] : ['akun', 'Akun', 'user']];
  }
  var TABS = {
    laporan: [['input', 'Input Laporan', 'edit'], ['riwayat', 'Riwayat & Arsip', 'history'], ['revisi', 'Revisi', 'compare']],
    monitoring: [['status', 'Status Periode', 'gauge'], ['ketepatan', 'Ketepatan Lapor', 'trophy'], ['masuk', 'Laporan Masuk', 'inbox'], ['revisi', 'Revisi', 'compare']],
    data: [['matriks', 'Matriks Unit × Penyakit', 'heat'], ['umur', 'Rincian Umur', 'users'], ['rekap', 'Rekap per Penyakit', 'table']],
    admin: [['user', 'Pengguna', 'users'], ['unit', 'Unit', 'building'], ['penyakit', 'Penyakit', 'virus'], ['pengaturan', 'Pengaturan', 'sliders'], ['notifikasi', 'Notifikasi WA/Email', 'wa'], ['log', 'Log Aktivitas', 'history'], ['migrasi', 'Migrasi Data', 'db']]
  };
  var IZIN = { dashboard: 'all', laporan: [R_PKM], monitoring: [R_STAF, R_ADMIN], data: [R_STAF, R_ADMIN], admin: [R_ADMIN], akun: 'all' };

  /* ---------- Router ---------- */
  function rute() {
    var h = location.hash.replace(/^#\/?/, ''), q = {}, i = h.indexOf('?');
    if (i > -1) { h.slice(i + 1).split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ''); }); h = h.slice(0, i); }
    var p = h.split('/');
    return { hal: p[0] || 'dashboard', tab: p[1] || '', q: q };
  }
  function ke(hash) { if (location.hash === hash) jalankan(); else location.hash = hash; }
  function ikat(fn) { lepas.push(fn); }
  function jalankan() {
    if (!S.user) { if (!$('#fLogin')) renderLogin(); return; } // jangan render ulang form login yang sedang diisi
    var r = rute();
    if (!IZIN[r.hal] || (IZIN[r.hal] !== 'all' && IZIN[r.hal].indexOf(S.user.role) < 0)) { location.replace('#/dashboard'); return; }
    if (TABS[r.hal] && !TABS[r.hal].some(function (t) { return t[0] === r.tab; })) { location.replace('#/' + r.hal + '/' + TABS[r.hal][0][0]); return; }
    if (!shellSiap) renderShell();
    lepas.forEach(function (f) { try { f(); } catch (e) { /* abaikan */ } }); lepas = [];
    UI.tutupPop();
    var kunci = r.hal + '/' + r.tab;
    $$('.sb .nav, .bnav a').forEach(function (a) {
      var t = a.getAttribute('data-r');
      a.classList.toggle('on', t === r.hal || t === kunci || (t === 'laporan/input' && r.hal === 'laporan' && r.tab !== 'riwayat') || (t === 'laporan/riwayat' && kunci === 'laporan/riwayat'));
    });
    document.body.classList.remove('laci'); $('#ovl').classList.remove('on');
    var el = $('#page');
    if (rutAktif !== kunci) window.scrollTo(0, 0);
    rutAktif = kunci;
    el.onclick = el.oninput = el.onchange = el.onkeydown = el.onfocusin = null;
    var f = Hal[r.hal];
    try { if (f) f(el, r); else el.innerHTML = UI.kosong('Halaman tidak ditemukan', '', 'info'); }
    catch (e) { console.error(e); el.innerHTML = '<div class="note bad">' + ic('siren') + '<div>Terjadi kesalahan saat menampilkan halaman: ' + esc(e.message) + '</div></div>'; }
    document.title = (judulHal(r) ? judulHal(r) + ' — ' : '') + 'ESTEPEL';
  }
  function judulHal(r) {
    var m = { dashboard: 'Dashboard', laporan: 'Laporan Saya', monitoring: 'Monitoring & Ketepatan', data: 'Data & Rekap', admin: 'Administrasi', akun: 'Akun' };
    return m[r.hal] || '';
  }
  /* Bar tab halaman (teks + garis bawah ungu) */
  function tabBar(hal, aktif, hitung) {
    hitung = hitung || {};
    return '<div class="tabbar"><div class="tabs" role="tablist">' + TABS[hal].map(function (t) {
      return '<a class="tab' + (t[0] === aktif ? ' on' : '') + '" href="#/' + hal + '/' + t[0] + '" role="tab">' + ic(t[2], 18) + t[1] + (hitung[t[0]] !== undefined && hitung[t[0]] !== '' ? '<span class="cnt">' + hitung[t[0]] + '</span>' : '') + '</a>';
    }).join('') + '</div></div>';
  }

  /* ---------- Kerangka aplikasi ---------- */
  function renderShell() {
    var root = $('#app');
    var nav = menu().map(function (g) {
      return '<div class="sb-grp hide-ciut">' + g.grp + '</div>' + g.items.map(function (it) {
        return '<a class="nav" href="#/' + it.id + '" data-r="' + it.id + '" title="' + it.lb + '">' + ic(it.ik, 20) + '<span class="hide-ciut">' + it.lb + '</span></a>';
      }).join('');
    }).join('');
    var bn = bnavItems().map(function (b) { return '<a href="#/' + b[0] + '" data-r="' + b[0] + '">' + ic(b[2], 20) + '<span>' + b[1] + '</span></a>'; }).join('');
    root.innerHTML =
      '<div class="progress-top" id="progTop"></div>' +
      '<aside class="sb" aria-label="Navigasi utama"><div class="sb-brand"><div class="logo">' + ic('stamp', 22) + '</div><div class="hide-ciut"><div class="brand-t">ESTEPEL <span class="tag-sah">SAH</span></div><div class="brand-s">Surveilans Terpadu Penyakit</div></div></div>' +
      '<nav class="sb-nav">' + nav + '</nav><div class="sb-card hide-ciut" id="sbCard"></div></aside>' +
      '<div class="ovl" id="ovl"></div>' +
      '<div class="main"><header class="tb">' +
      '<button class="icbtn" id="btnMenu" aria-label="Menu">' + ic('menu', 22) + '</button>' +
      '<div class="tb-brand-m flex g6" style="display:none"><div class="logo" style="width:32px;height:32px;border-radius:9px">' + ic('stamp', 17) + '</div><b style="font:700 16px var(--fh)">ESTEPEL</b></div>' +
      '<div class="tb-search"><button id="btnCari" aria-label="Cari">' + ic('search') + '<span>Cari puskesmas, penyakit, laporan...</span><span class="kbd">' + (/Mac|iP/.test(navigator.platform) ? '⌘K' : 'Ctrl K') + '</span></button></div>' +
      '<div class="tb-r"><button class="tb-per" id="tbPer" aria-label="Pilih periode">' + ic('cal', 16) + '<span>' + INTI.labelRentangPendek(S.gp.dari, S.gp.sampai) + '</span>' + ic('down', 14) + '</button>' +
      '<button class="icbtn" id="btnNotif" aria-label="Notifikasi">' + ic('bell', 21) + '<span class="bdg" id="bdgNotif" style="display:none"></span></button>' +
      '<span class="tb-sep"></span><button class="prof" id="btnProf"><span class="txt"><div class="nm">' + esc(S.user.nama) + '</div><div class="rl">' + esc(isPkm() ? namaPendek(S.user.unit) : S.user.role) + '</div></span><span class="av">' + esc(UI.inisial(S.user.nama)) + '</span></button></div></header>' +
      '<main class="page" id="page"></main></div>' +
      '<nav class="bnav" aria-label="Navigasi bawah">' + bn + '</nav>';
    shellSiap = true;
    $('#btnMenu').onclick = function () {
      if (window.innerWidth >= 1024) { document.body.classList.toggle('ciut'); LS.set('ciut', document.body.classList.contains('ciut')); }
      else { document.body.classList.toggle('laci'); $('#ovl').classList.toggle('on'); }
    };
    $('#ovl').onclick = function () { document.body.classList.remove('laci'); this.classList.remove('on'); };
    $('#btnCari').onclick = bukaCari;
    $('#tbPer').onclick = function () { pemilihPeriode(this); };
    $('#btnNotif').onclick = function () { bukaNotif(this); };
    $('#btnProf').onclick = function () { bukaProfil(this); };
    if (LS.get('ciut', false)) document.body.classList.add('ciut');
    renderKartuTenggat();
    setBadge(S.unread);
    ikatGlobal();
  }
  function renderKartuTenggat() {
    var el = $('#sbCard'); if (!el) return;
    var p = S.wajib, tg = INTI.tenggat(p, S.set), sisa = INTI.sisaHari(p, now(), S.set);
    var sisaTx = sisa > 0 ? 'Sisa ' + sisa + ' hari' : sisa === 0 ? 'Hari ini' : 'Lewat ' + (-sisa) + ' hari';
    var sudah = false;
    if (isPkm()) { var c = Store.sinkron(INTI.urai(p).y); if (c) sudah = c.h.some(function (h) { return h[0] === p + '_' + S.user.unit && h[8] !== 'Dihapus'; }); }
    if (sudah) {
      el.innerHTML = '<div class="flex"><div class="stamp-mini">' + ic('check', 18) + '</div><div><div class="lb">Tenggat Laporan</div><div class="tt">Laporan sudah distempel ✔</div><div class="ds">' + INTI.labelBulan(p) + '</div></div></div><a class="btn btn-s btn-sm" href="#/laporan/riwayat" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.15)">' + ic('stamp', 15) + 'Lihat Stempel</a>';
      return;
    }
    el.innerHTML = '<div class="flex" style="align-items:flex-start"><div style="color:#FBBF24">' + ic('clock', 20) + '</div><div><div class="lb">Tenggat Laporan</div><div class="tt">' + INTI.labelBulan(p) + '</div><div class="ds">Tenggat ' + INTI.fmtTgl(tg) + ' • <b style="color:' + (sisa < 0 ? '#FCA5A5' : '#FCD34D') + '">' + sisaTx + '</b></div></div></div>' +
      (isPkm() ? '<a class="btn btn-p" href="#/laporan/input">' + ic('edit', 15) + 'Input Laporan</a>' : '<button class="btn btn-p" data-act="pengingat-semua">' + ic('send', 15) + 'Kirim Pengingat</button>');
  }
  function ikatGlobal() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act="pengingat-semua"]');
      if (a) { e.preventDefault(); kirimPengingat(S.wajib, null, a); }
      var u = e.target.closest('[data-unduh-btn]');
      if (u) { var card = u.closest('.card'), ch = card && card.querySelector('.chart'); if (ch) UI.unduhGrafik(ch, ch.getAttribute('data-unduh')); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); bukaCari(); }
    });
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) { window.addEventListener(ev, function () { aktivitas = Date.now(); }, { passive: true }); });
    clearInterval(idleT);
    idleT = setInterval(cekIdle, 15000);
    mulaiPoll();
    Bus.on('cube', function () { renderKartuTenggat(); });
  }
  /* ---------- Sesi idle (PRD F1: logout otomatis 15 menit) ---------- */
  var peringatIdle = false;
  function cekIdle() {
    if (!S.user) return;
    var batas = (+S.set.DURASI_SESI_MENIT || 15) * 60000, diam = Date.now() - aktivitas;
    if (diam >= batas) { keluar('Sesi berakhir karena tidak aktif ' + (+S.set.DURASI_SESI_MENIT || 15) + ' menit.'); return; }
    if (diam >= batas - 60000 && !peringatIdle) { peringatIdle = true; UI.toast('Sesi akan berakhir dalam 1 menit karena tidak aktif. Gerakkan mouse/ketuk layar untuk melanjutkan.', 'warn', 8000); }
    if (diam < batas - 60000) peringatIdle = false;
  }
  /* ---------- Polling notifikasi adaptif (hemat kuota GAS) ---------- */
  function mulaiPoll() {
    clearTimeout(pollT);
    var t = function () {
      var jeda = document.visibilityState !== 'visible' ? 0 : (Date.now() - aktivitas < 120000 ? 45000 : 120000);
      if (jeda && S.user) API.call('notif.list', {}, { bg: true }).then(function (j) { if (j && j.success) setBadge(j.unread); }, function () { /* abaikan */ });
      pollT = setTimeout(t, jeda || 30000);
    };
    pollT = setTimeout(t, 45000);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && S.user) { Store.muat(INTI.wita(now()).y, { bg: true }).catch(function () { /* abaikan */ }); }
  });
  function setBadge(n) {
    S.unread = n || 0;
    var b = $('#bdgNotif'); if (!b) return;
    b.style.display = S.unread ? '' : 'none';
    b.textContent = S.unread > 9 ? '9+' : S.unread;
  }

  /* ---------- Pemilih periode global (F11) ---------- */
  function pemilihPeriode(anchor, opsi) {
    opsi = opsi || {};
    var cur = opsi.nilai || S.gp, mode = cur.dari === cur.sampai ? 'bulan' : 'rentang';
    var thn = INTI.urai(cur.sampai).y, pilih = { dari: cur.dari, sampai: cur.sampai }, klik = 0;
    var maxP = S.wajib;
    function isi(p) {
      var bln = '';
      for (var m = 1; m <= 12; m++) {
        var pp = INTI.periode(thn, m), on = pp === pilih.dari || pp === pilih.sampai, rg = pp > pilih.dari && pp < pilih.sampai;
        bln += '<button data-p="' + pp + '" class="' + (on ? 'on' : rg ? 'rg' : '') + '"' + (pp > maxP ? ' disabled' : '') + '>' + INTI.BLN[m - 1] + '</button>';
      }
      p.innerHTML = '<div class="pop-h"><div class="seg"><button data-m="bulan" class="' + (mode === 'bulan' ? 'on' : '') + '">Bulan</button><button data-m="rentang" class="' + (mode === 'rentang' ? 'on' : '') + '">Rentang</button></div>' +
        '<div class="flex g6"><button class="btn btn-g btn-sm btn-ic" data-y="-1" aria-label="Tahun sebelumnya">' + ic('left', 16) + '</button><b>' + thn + '</b><button class="btn btn-g btn-sm btn-ic" data-y="1" aria-label="Tahun berikutnya"' + (thn >= INTI.urai(maxP).y ? ' disabled' : '') + '>' + ic('right', 16) + '</button></div></div>' +
        '<div style="padding:14px"><div class="mp-grid">' + bln + '</div>' +
        '<div class="fs11 mut mt12">' + (mode === 'rentang' ? 'Klik bulan awal lalu bulan akhir (boleh lintas tahun).' : 'Pilih satu bulan.') + ' Terpilih: <b class="p-tx">' + INTI.labelRentang(pilih.dari, pilih.sampai) + '</b></div>' +
        '<div class="chips mt12"><button class="chip" data-q="wajib">Periode wajib</button><button class="chip" data-q="ytd">Jan – ' + INTI.BLN[INTI.urai(maxP).m - 1] + ' ' + INTI.urai(maxP).y + '</button><button class="chip" data-q="12">12 bulan terakhir</button><button class="chip" data-q="thn">Tahun ' + thn + '</button></div></div>' +
        '<div class="modal-f" style="padding:12px 14px"><button class="btn btn-s btn-sm" data-batal>Batal</button><button class="btn btn-p btn-sm" data-ok>Terapkan</button></div>';
    }
    var p = UI.pop(anchor, '', { lebar: 330, kiri: opsi.kiri });
    isi(p);
    p.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.m) { mode = t.dataset.m; if (mode === 'bulan') pilih.dari = pilih.sampai; klik = 0; isi(p); }
      else if (t.dataset.y) { thn += +t.dataset.y; isi(p); }
      else if (t.dataset.p) {
        var pp = t.dataset.p;
        if (mode === 'bulan') pilih = { dari: pp, sampai: pp };
        else if (klik === 0) { pilih = { dari: pp, sampai: pp }; klik = 1; }
        else { pilih = pp < pilih.dari ? { dari: pp, sampai: pilih.dari } : { dari: pilih.dari, sampai: pp }; klik = 0; }
        isi(p);
      } else if (t.dataset.q) {
        var q = t.dataset.q, y = INTI.urai(maxP).y;
        if (q === 'wajib') pilih = { dari: maxP, sampai: maxP };
        if (q === 'ytd') pilih = { dari: INTI.periode(y, 1), sampai: maxP };
        if (q === '12') pilih = { dari: INTI.geser(maxP, -11), sampai: maxP };
        if (q === 'thn') pilih = { dari: INTI.periode(thn, 1), sampai: INTI.periode(thn, 12) < maxP ? INTI.periode(thn, 12) : maxP };
        mode = pilih.dari === pilih.sampai ? 'bulan' : 'rentang'; isi(p);
      } else if (t.hasAttribute('data-batal')) UI.tutupPop();
      else if (t.hasAttribute('data-ok')) { UI.tutupPop(); if (opsi.onPilih) opsi.onPilih(pilih); else setGP(pilih.dari, pilih.sampai); }
    });
  }

  /* ---------- Pencarian global (F11) ---------- */
  function bukaCari() {
    var m = UI.modal({ judul: '', ukuran: 'lg', isi: '<div style="position:relative;margin:-20px -22px;border-bottom:1px solid var(--line)"><span style="position:absolute;left:16px;top:16px;color:var(--mut)">' + ic('search', 20) + '</span><input class="srch-in" id="qCari" placeholder="Cari menu, puskesmas, penyakit, laporan (mis. Oktober 2026 / 2026-10_U05)..." autocomplete="off"></div><div class="srch-r" id="hCari" style="margin:0 -16px -14px"></div>' });
    $('.modal-h', m.el).style.display = 'none';
    var inp = $('#qCari', m.el), hasil = $('#hCari', m.el), daftar = [], pos = 0;
    function sumber() {
      var o = [];
      menu().forEach(function (g) { g.items.forEach(function (it) { o.push({ g: 'Menu', lb: it.lb, ik: it.ik, h: '#/' + it.id }); if (TABS[it.id]) TABS[it.id].forEach(function (t) { o.push({ g: 'Menu', lb: it.lb + ' › ' + t[1], ik: t[2], h: '#/' + it.id + '/' + t[0] }); }); }); });
      o.push({ g: 'Menu', lb: 'Ubah Password', ik: 'key', fn: function () { ubahSandi(false); } });
      if (isDinkes()) S.units.forEach(function (u) { o.push({ g: 'Puskesmas', lb: 'Puskesmas ' + u.nama, ik: 'hosp', sub: u.kode, h: '#/data/matriks?u=' + u.kode }); });
      S.penyakit.forEach(function (p) { o.push({ g: 'Penyakit', lb: p.nama, ik: 'virus', sub: p.kode + (p.kategori ? ' • ' + p.kategori : ''), h: isDinkes() ? '#/data/rekap?q=' + encodeURIComponent(p.nama) : '#/laporan/input?q=' + encodeURIComponent(p.nama) }); });
      var y = INTI.urai(S.wajib).y;
      [y, y - 1].forEach(function (yy) {
        var c = Store.sinkron(yy); if (!c) return;
        c.h.forEach(function (h) {
          var hh = INTI.hObj(h, yy);
          o.push({ g: 'Laporan', lb: (isPkm() ? '' : namaPendek(hh.u) + ' — ') + INTI.labelBulan(hh.p), ik: 'file', sub: hh.id + ' • v' + hh.v, id: hh.id });
        });
      });
      return o;
    }
    var semua = sumber();
    function tampil() {
      var q = inp.value.trim().toLowerCase();
      daftar = (q ? semua.filter(function (x) { return (x.lb + ' ' + (x.sub || '')).toLowerCase().indexOf(q) > -1; }) : semua.filter(function (x) { return x.g === 'Menu'; })).slice(0, 40);
      pos = Math.min(pos, Math.max(0, daftar.length - 1));
      var g = '', html = '';
      daftar.forEach(function (x, i) {
        if (x.g !== g) { g = x.g; html += '<div class="srch-g">' + g + '</div>'; }
        html += '<div class="srch-i' + (i === pos ? ' on' : '') + '" data-i="' + i + '">' + ic(x.ik, 18) + '<span>' + esc(x.lb) + '</span><span class="mut">' + esc(x.sub || '') + '</span></div>';
      });
      hasil.innerHTML = html || '<div class="empty">Tidak ada hasil untuk "' + esc(inp.value) + '"</div>';
    }
    function pilih(i) {
      var x = daftar[i]; if (!x) return;
      m.tutup();
      if (x.fn) x.fn(); else if (x.id) Hal.detailLaporan(x.id); else ke(x.h);
    }
    inp.addEventListener('input', function () { pos = 0; tampil(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { pos = Math.min(daftar.length - 1, pos + 1); tampil(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { pos = Math.max(0, pos - 1); tampil(); e.preventDefault(); }
      if (e.key === 'Enter') pilih(pos);
    });
    hasil.addEventListener('click', function (e) { var it = e.target.closest('.srch-i'); if (it) pilih(+it.dataset.i); });
    tampil();
  }

  /* ---------- Notifikasi (F10) ---------- */
  function bukaNotif(anchor) {
    var p = UI.pop(anchor, '<div class="pop-h"><b>Notifikasi</b><button class="lnk" data-baca-semua>Tandai semua dibaca</button></div><div id="nList">' + UI.skel(42, 4).replace(/margin-bottom:10px/g, 'margin:10px 14px') + '</div>', { lebar: 380 });
    function isi(list) {
      $('#nList', p).innerHTML = list.length ? list.slice(0, 10).map(function (n) {
        var ik = { LAPORAN: 'inbox', PERINGATAN: 'siren', REVISI: 'compare', PENGINGAT: 'clock' }[n.jenis] || 'bell';
        var tl = { LAPORAN: 't-blu', PERINGATAN: 't-red', REVISI: 't-vio', PENGINGAT: 't-amb' }[n.jenis] || 't-vio';
        return '<div class="nt' + (n.dibaca ? '' : ' baru') + '" data-id="' + esc(n.id) + '" data-h="' + esc(n.tautan) + '"><div class="tile ' + tl + '" style="width:34px;height:34px">' + ic(ik, 17) + '</div><div><div class="tx">' + esc(n.pesan) + '</div><div class="wk">' + UI.waktuRelatif(n.waktu, now()) + '</div></div></div>';
      }).join('') : UI.kosong('Belum ada notifikasi', '', 'bell');
    }
    API.wajib('notif.list').then(function (j) { setBadge(j.unread); isi(j.list); }, function (e) { $('#nList', p).innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-baca-semua]')) { API.call('notif.baca', { semua: true }); setBadge(0); $$('.nt.baru', p).forEach(function (x) { x.classList.remove('baru'); }); return; }
      var n = e.target.closest('.nt'); if (!n) return;
      if (n.classList.contains('baru')) { API.call('notif.baca', { ids: [n.dataset.id] }); setBadge(S.unread - 1); }
      UI.tutupPop();
      if (n.dataset.h) ke(n.dataset.h);
    });
  }
  /* ---------- Profil ---------- */
  function bukaProfil(anchor) {
    var p = UI.pop(anchor, '<div class="pop-h" style="justify-content:flex-start"><span class="av">' + esc(UI.inisial(S.user.nama)) + '</span><div><b>' + esc(S.user.nama) + '</b><div class="fs11 mut">' + esc(S.user.role) + ' • ' + esc(S.user.unitNama || '') + '</div></div></div>' +
      '<button class="menu-i" data-a="sandi">' + ic('key') + 'Ubah Password</button>' + (pasangPrompt ? '<button class="menu-i" data-a="pasang">' + ic('phone') + 'Pasang Aplikasi di Perangkat</button>' : '') +
      '<button class="menu-i" data-a="segarkan">' + ic('refresh') + 'Muat Ulang Data</button><button class="menu-i bad" data-a="keluar">' + ic('logout') + 'Keluar</button>', { lebar: 280 });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; UI.tutupPop();
      if (b.dataset.a === 'sandi') ubahSandi(false);
      if (b.dataset.a === 'pasang') pasang();
      if (b.dataset.a === 'segarkan') { Store.reset(); jalankan(); UI.toast('Data dimuat ulang dari server.', 'info'); }
      if (b.dataset.a === 'keluar') keluar();
    });
  }
  function ubahSandi(paksa) {
    var isi = (paksa ? '<div class="note warn">' + ic('alert') + '<div>Demi keamanan, Anda <b>wajib mengganti kata sandi sementara</b> sebelum memakai ESTEPEL.</div></div>' : '') +
      '<label class="fld"><span>Kata sandi lama' + (paksa ? ' (sementara)' : '') + '</span><input class="inp" type="password" id="pwLama" autocomplete="current-password"></label>' +
      '<label class="fld"><span>Kata sandi baru</span><input class="inp" type="password" id="pwBaru" autocomplete="new-password"><small>Minimal 8 karakter, memuat huruf dan angka.</small></label>' +
      '<label class="fld"><span>Ulangi kata sandi baru</span><input class="inp" type="password" id="pwUlang" autocomplete="new-password"></label>';
    UI.modal({ judul: 'Ubah Password', ikon: 'key', ukuran: 'sm', kunci: paksa, isi: isi,
      tombol: (paksa ? [{ label: 'Keluar', kelas: 'btn-g', aksi: function () { keluar(); } }] : [{ label: 'Batal' }]).concat([{ label: 'Simpan', kelas: 'btn-p', aksi: function (m) {
        var lama = $('#pwLama', m.el).value, baru = $('#pwBaru', m.el).value, ul = $('#pwUlang', m.el).value;
        if (baru !== ul) { UI.toast('Ulangan kata sandi baru tidak sama.', 'bad'); return false; }
        if (baru.length < 8 || !/\d/.test(baru) || !/[A-Za-z]/.test(baru)) { UI.toast('Kata sandi baru minimal 8 karakter dengan huruf dan angka.', 'bad'); return false; }
        return API.wajib('auth.ubahSandi', { lama: lama, baru: baru }).then(function (j) { API.setToken(j.token); S.user = j.user; UI.toast(j.message); if (paksa) jalankan(); });
      } }]) });
  }
  function keluar(pesan) {
    if (S.user) API.call('auth.logout').catch(function () { /* abaikan */ });
    API.setToken('');
    LS.hapusAwalan('cube_'); LS.del('boot');
    Store.reset(); clearTimeout(pollT); clearInterval(idleT);
    S.user = null; shellSiap = false; document.body.classList.remove('laci');
    renderLogin(pesan);
  }
  Bus.on('auth', function (m) { if (S.user) keluar(m || 'Sesi berakhir. Silakan login kembali.'); });

  /* ---------- Pengingat (dipakai beberapa halaman) ---------- */
  function kirimPengingat(periode, units, btn) {
    var target = units && units.length ? units.length + ' puskesmas terpilih' : 'semua puskesmas yang belum melapor';
    return UI.konfirmasi({ judul: 'Kirim Pengingat', ikon: 'send', pesan: 'Kirim pengingat laporan <b>' + INTI.labelBulan(periode) + '</b> ke ' + target + '? Notifikasi masuk ke aplikasi' + ' dan, bila diaktifkan Admin, WhatsApp/Email.', ya: 'Kirim Pengingat',
      extra: '<label class="fld mt12"><span>Catatan tambahan (opsional)</span><input class="inp" id="catPg" maxlength="200" placeholder="mis. Mohon segera, data dibutuhkan rapat"></label>',
      ambil: function (m) { return { catatan: $('#catPg', m.el).value }; } })
      .then(function (ok) {
        if (!ok) return;
        UI.sibuk(btn, true);
        return API.wajib('pengingat.kirim', { periode: periode, units: units || [], catatan: ok.catatan }).then(function (j) { UI.toast(j.message, j.terkirim ? 'ok' : 'info'); }, function (e) { UI.toast(e.message, 'bad'); }).then(function () { UI.sibuk(btn, false); });
      });
  }

  /* ---------- Login (PRD 8.6) ---------- */
  function renderLogin(pesan) {
    shellSiap = false;
    document.title = 'Masuk — ESTEPEL';
    var tamu = LS.get('peranLogin', 'pkm');
    $('#app').innerHTML = '<div class="login"><div class="login-box">' +
      '<section class="login-l"><div class="flex between"><div class="flex"><div class="logo" style="width:48px;height:48px;border-radius:14px">' + ic('stamp', 24) + '</div><div><div style="font:700 24px/1 var(--fh);letter-spacing:-.02em">ESTEPEL</div><div class="fs11 mut" style="text-transform:uppercase;letter-spacing:.06em;margin-top:5px">Dinas Kesehatan Kab. Minahasa Selatan</div></div></div></div>' +
      '<div><span class="badge b-info">' + ic('file', 14) + 'Surveilans Terpadu Penyakit (STP)</span><h1 style="font-size:32px;line-height:40px;margin-top:12px">Masuk ke ESTEPEL</h1><p class="mut" style="margin:6px 0 0">Gunakan akun petugas surveilans Puskesmas atau Dinas Kesehatan yang terdaftar.</p></div>' +
      '<div><div class="lbl" style="margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Profil akses</div><div class="seg w100" id="segPeran"><button type="button" data-p="pkm" class="' + (tamu === 'pkm' ? 'on' : '') + '" style="flex:1">' + ic('hosp', 16) + ' Petugas Puskesmas</button><button type="button" data-p="dinkes" class="' + (tamu === 'dinkes' ? 'on' : '') + '" style="flex:1">' + ic('building', 16) + ' Dinkes Kabupaten</button></div></div>' +
      '<form id="fLogin" class="flex col g16" autocomplete="on"><div class="err-box' + (pesan ? ' on' : '') + '" id="lgErr" role="alert">' + esc(pesan || '') + '</div>' +
      '<label class="fld"><span>Username</span><div class="inp-ic">' + ic('user') + '<input class="inp" id="lgU" name="username" autocomplete="username" required placeholder="' + (tamu === 'pkm' ? 'mis. pkm_motoling' : 'mis. admin') + '" autocapitalize="none" spellcheck="false" style="height:46px"></div></label>' +
      '<label class="fld"><span>Kata sandi</span><div class="inp-ic">' + ic('lock') + '<input class="inp" id="lgP" type="password" name="password" autocomplete="current-password" required style="height:46px;padding-right:44px"><button type="button" class="icbtn" id="lgLihat" style="position:absolute;right:3px;top:3px" aria-label="Tampilkan sandi">' + ic('eye') + '</button></div></label>' +
      '<button class="btn btn-p w100" id="lgBtn" style="height:48px;font:600 15px var(--fh)">Masuk ke ESTEPEL ' + ic('arrow') + '</button>' +
      '<div class="note soft fs12">' + ic('shield', 18) + '<div><b>Keamanan sesi:</b> kata sandi tersimpan sebagai hash, sesi berakhir otomatis setelah ' + 15 + ' menit tidak aktif, dan akun terkunci sementara setelah 5 kali gagal.</div></div></form>' +
      '<div class="fs12 mut" style="margin-top:auto;padding-top:16px;border-top:1px solid var(--line)">Lupa kata sandi atau butuh akun? Hubungi <b style="color:var(--tx)">Admin Dinkes</b> untuk reset sandi sementara.</div></section>' +
      '<section class="login-r"><div class="glass hide-m"><svg class="seal stamp-anim" viewBox="0 0 120 120" aria-hidden="true">' + segel('#4ADE80', '#86EFAC') + '</svg><div><span class="badge" style="background:rgba(34,197,94,.18);color:#86EFAC">' + ic('verified', 14) + 'Stempel Digital</span><h3 style="color:#fff;margin:8px 0 4px;font-size:17px">Laporan sah tanpa cap basah</h3><div class="fs12">Setiap laporan terkirim mendapat bukti pengesahan ber-QR yang dapat diverifikasi siapa saja.</div></div></div>' +
      '<div><h2>“Tanpa Cap Basah, Laporan STP Langsung Sah.”</h2><p style="margin:8px 0 0">Elektronik Surveilans Terpadu Penyakit — Efektif &amp; Langsung</p><p class="fs12 hide-m" style="margin:12px 0 0;opacity:.85">ESTEPEL merupakan inovasi pelaporan STP digital dari Puskesmas ke Dinas Kesehatan Kabupaten. Lahir dari pelafalan STP dan terinspirasi makna “Stempel” sebagai simbol pengesahan resmi, ESTEPEL menggantikan birokrasi cetak dan cap basah menjadi satu sistem terpadu yang sah, cepat, dan real-time demi kewaspadaan dini penyakit.</p></div>' +
      '<div class="flex col g6 hide-m">' + [['zap', 't-blu', 'Validasi instan & QR sah', 'Pengesahan otomatis tanpa mengantar berkas antar-kecamatan.'], ['activity', 't-amb', 'Kewaspadaan dini 27 penyakit', 'Lonjakan kasus & Potensi KLB langsung terlihat Dinkes.'], ['hub', 't-grn', 'Satu data 17 puskesmas', 'Rekapitulasi STP kabupaten terpadu dan akuntabel.']].map(function (f) {
        return '<div class="feat"><div class="tile ' + f[1] + '" style="width:36px;height:36px;background:rgba(255,255,255,.08)">' + ic(f[0], 18) + '</div><div><b>' + f[2] + '</b><span>' + f[3] + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="flex fs11" style="border-top:1px solid rgba(255,255,255,.1);padding-top:14px">' + ic('building', 18) + '<div><b style="color:#fff;letter-spacing:.04em">DINAS KESEHATAN KABUPATEN MINAHASA SELATAN</b><div>Pemerintah Kabupaten Minahasa Selatan • Sulawesi Utara</div></div></div></section></div></div>';
    $('#segPeran').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; $$('#segPeran button').forEach(function (x) { x.classList.toggle('on', x === b); }); LS.set('peranLogin', b.dataset.p); $('#lgU').placeholder = b.dataset.p === 'pkm' ? 'mis. pkm_motoling' : 'mis. admin'; };
    $('#lgLihat').onclick = function () { var i = $('#lgP'); i.type = i.type === 'password' ? 'text' : 'password'; };
    $('#fLogin').onsubmit = function (e) {
      e.preventDefault();
      var btn = $('#lgBtn'), err = $('#lgErr');
      err.classList.remove('on');
      if (!API.url()) { err.textContent = 'Alamat backend (GAS_URL) belum diisi di js/config.js.'; err.classList.add('on'); return; }
      UI.sibuk(btn, true, 'Memverifikasi...');
      API.kirim({ action: 'auth.login', data: { username: $('#lgU').value.trim(), password: $('#lgP').value } }).then(function (j) {
        if (!j.success) throw new Error(j.message);
        API.setToken(j.token);
        terapkanBoot(j.boot); S.user = j.user;
        aktivitas = Date.now();
        if (location.hash.indexOf('#/') !== 0) location.replace('#/dashboard');
        jalankan();
        if (j.user.wajibGanti) ubahSandi(true);
      }).catch(function (x) { err.textContent = x.message; err.classList.add('on'); UI.sibuk(btn, false); });
    };
    setTimeout(function () { var u = $('#lgU'), a = document.activeElement; if (u && (!a || a === document.body)) u.focus(); }, 50);
  }
  /* SVG segel stempel (dipakai login, stempel digital, verifikasi) */
  function segel(c1, c2) {
    return '<defs><path id="sgA" d="M 19 60 A 41 41 0 0 1 101 60"/><path id="sgB" d="M 14 60 A 46 46 0 0 0 106 60"/></defs>' +
      '<circle cx="60" cy="60" r="56" fill="none" stroke="' + c1 + '" stroke-width="3"/><circle cx="60" cy="60" r="51" fill="none" stroke="' + c2 + '" stroke-width="1.2" stroke-dasharray="3 2.5"/><circle cx="60" cy="60" r="33" fill="none" stroke="' + c1 + '" stroke-width="1.6"/>' +
      '<text font-family="Plus Jakarta Sans,Inter,Arial" font-size="7.4" font-weight="800" letter-spacing=".9" fill="' + c1 + '"><textPath href="#sgA" startOffset="50%" text-anchor="middle">DINAS KESEHATAN MINSEL</textPath></text>' +
      '<text font-family="Plus Jakarta Sans,Inter,Arial" font-size="7.6" font-weight="700" letter-spacing="1.2" fill="' + c1 + '"><textPath href="#sgB" startOffset="50%" text-anchor="middle">★ ESTEPEL • SAH ★</textPath></text>' +
      '<path d="M45 61 l10 10 l20 -22" fill="none" stroke="' + c1 + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  /* ---------- PWA ---------- */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pasangPrompt = e; });
  function pasang() {
    if (!pasangPrompt) { UI.toast('Gunakan menu browser → "Tambahkan ke Layar Utama" untuk memasang ESTEPEL.', 'info', 6000); return; }
    pasangPrompt.prompt();
    pasangPrompt.userChoice.then(function () { pasangPrompt = null; });
  }
  function daftarSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('./sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        nw && nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            var t = document.createElement('div');
            t.className = 'toast info'; t.style.cursor = 'pointer';
            t.innerHTML = ic('refresh', 18) + '<div>Versi baru ESTEPEL tersedia. <b>Ketuk untuk memuat ulang.</b></div>';
            t.onclick = function () { mintaMuatUlang = true; nw.postMessage('skipWaiting'); };
            (document.getElementById('toasts') || document.body).appendChild(t);
          }
        });
      });
    }).catch(function () { /* abaikan */ });
    // Muat ulang HANYA bila pengguna mengetuk "versi baru" — instalasi pertama (clients.claim)
    // tidak boleh me-reload halaman saat pengguna sedang mengetik.
    var muatUlang = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (mintaMuatUlang && !muatUlang) { muatUlang = true; location.reload(); } });
  }
  var mintaMuatUlang = false;

  /* ---------- Mulai ---------- */
  function mulai() {
    UI.sprite();
    daftarSW();
    window.addEventListener('hashchange', jalankan);
    var tok = API.token(), cache = LS.get('boot', null);
    if (!tok) { renderLogin(); return; }
    if (cache && cache.user) { terapkanBoot(cache); jalankan(); } // tampil instan dari cache, lalu segarkan
    else $('#app').innerHTML = '<div class="login"><span class="spin dk" style="width:34px;height:34px"></span></div>';
    API.call('boot').then(function (j) {
      if (!j.success) { if (j.code !== 'AUTH') { if (!cache) renderLogin(j.message); } return; }
      var ganti = !S.user || S.user.role !== j.user.role;
      terapkanBoot(j); S.user = j.user;
      if (ganti || !shellSiap) { shellSiap = false; jalankan(); } else { renderKartuTenggat(); setBadge(S.unread); Bus.emit('boot'); }
      if (j.user && j.user.wajibGanti) ubahSandi(true);
    }, function (e) { if (!cache) renderLogin(e.message); else UI.toast('Mode luring: menampilkan data tersimpan. ' + e.message, 'warn'); });
  }

  return {
    S: S, now: now, isPkm: isPkm, isAdmin: isAdmin, isDinkes: isDinkes, namaUnit: namaUnit, namaPendek: namaPendek, namaPenyakit: namaPenyakit,
    unitsAktif: unitsAktif, unitScope: unitScope, tahunDari: tahunDari, setGP: setGP, ke: ke, ikat: ikat, tabBar: tabBar, rute: rute, jalankan: jalankan,
    pemilihPeriode: pemilihPeriode, kirimPengingat: kirimPengingat, ubahSandi: ubahSandi, keluar: keluar, segel: segel, setBadge: setBadge,
    renderKartuTenggat: renderKartuTenggat, terapkanBoot: terapkanBoot, pasang: pasang, mulai: mulai, R_PKM: R_PKM, R_STAF: R_STAF, R_ADMIN: R_ADMIN
  };
})();

/* Halaman Akun (HP): profil, ubah sandi, pasang aplikasi, keluar */
Hal.akun = function (el) {
  var S = App.S, ic = UI.ic, esc = UI.esc;
  el.innerHTML = '<div class="ph"><div><h1>Akun Saya</h1><p>' + esc(S.user.role) + ' • ' + esc(S.user.unitNama || '') + '</p></div></div>' +
    '<div class="card flex" style="gap:14px"><span class="av" style="width:52px;height:52px;font-size:18px">' + esc(UI.inisial(S.user.nama)) + '</span><div><b style="font-size:16px">' + esc(S.user.nama) + '</b><div class="mut fs12">@' + esc(S.user.username) + '</div></div></div>' +
    '<div class="card p0">' + [['sandi', 'key', 'Ubah Password'], ['pasang', 'phone', 'Pasang Aplikasi di HP'], ['keluar', 'logout', 'Keluar']].map(function (x) {
      return '<button class="menu-i' + (x[0] === 'keluar' ? ' bad' : '') + '" data-a="' + x[0] + '" style="padding:16px 18px">' + ic(x[1]) + x[2] + '</button>';
    }).join('') + '</div><div class="center fs11 mut">ESTEPEL v3.0 • Dinas Kesehatan Kab. Minahasa Selatan</div>';
  el.onclick = function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'sandi') App.ubahSandi(false);
    if (b.dataset.a === 'pasang') App.pasang();
    if (b.dataset.a === 'keluar') App.keluar();
  };
};
document.addEventListener('DOMContentLoaded', App.mulai);
