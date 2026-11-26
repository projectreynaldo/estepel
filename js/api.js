/* =====================================================================
 * ESTEPEL — api.js
 * Klien REST ke Google Apps Script:
 *  - POST 'text/plain;charset=utf-8' (tanpa CORS preflight),
 *  - batcher otomatis: panggilan baca dalam satu tick digabung jadi 1 request,
 *  - deduplikasi request kembar yang sedang berjalan,
 *  - Store: cube data tahunan berversi + stale-while-revalidate (localStorage)
 *    sehingga perpindahan menu & filter tampil instan tanpa menunggu server.
 * ===================================================================== */
var Bus = (function () {
  var h = {};
  return {
    on: function (e, f) { (h[e] = h[e] || []).push(f); return function () { h[e] = (h[e] || []).filter(function (x) { return x !== f; }); }; },
    emit: function (e, d) { (h[e] || []).slice().forEach(function (f) { try { f(d); } catch (x) { console.error(x); } }); }
  };
})();

var LS = {
  get: function (k, def) { try { var v = localStorage.getItem('estepel_' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set: function (k, v) { try { localStorage.setItem('estepel_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem('estepel_' + k); } catch (e) { /* abaikan */ } },
  hapusAwalan: function (pre) {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('estepel_' + pre) === 0) localStorage.removeItem(k); }); } catch (e) { /* abaikan */ }
  }
};

var API = (function () {
  var URL_GAS = (window.ESTEPEL_CONFIG && window.ESTEPEL_CONFIG.GAS_URL) || '';
  var token = LS.get('token', '');
  var antre = [], tmr = null, jalan = {}, aktif = 0;
  var BACA = /^(boot|data\.|laporan\.get|revisi\.list|notif\.list|admin\.(users|log|notifCfg|antrean))$/;

  function progres(d) {
    aktif = Math.max(0, aktif + d);
    var el = document.getElementById('progTop');
    if (!el) return;
    if (aktif > 0) { el.classList.add('on'); el.style.width = '70%'; }
    else { el.style.width = '100%'; setTimeout(function () { if (!aktif) { el.classList.remove('on'); el.style.width = '0'; } }, 250); }
  }
  function kirim(body, coba) {
    if (!URL_GAS) return Promise.reject(new Error('GAS_URL belum diisi di js/config.js'));
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 45000);
    progres(1);
    return fetch(URL_GAS, {
      method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('Server merespons ' + r.status);
      return r.json();
    }).then(function (j) {
      if (j && j.code === 'AUTH') Bus.emit('auth', j.message);
      return j;
    }).catch(function (e) {
      var baca = body.action === 'batch' || BACA.test(body.action);
      if ((coba || 0) < 1 && baca && e.name !== 'AbortError') return new Promise(function (res) { setTimeout(res, 800); }).then(function () { return kirim(body, 1); });
      throw new Error(e.name === 'AbortError' ? 'Koneksi lambat — permintaan dibatalkan setelah 45 detik.' : (navigator.onLine === false ? 'Tidak ada koneksi internet.' : e.message || 'Gagal menghubungi server.'));
    }).finally(function () { clearTimeout(to); progres(-1); });
  }
  function flush() {
    tmr = null;
    var q = antre; antre = [];
    if (!q.length) return;
    if (q.length === 1) {
      var c = q[0];
      kirim({ action: c.action, token: token, data: c.data, bg: c.bg }).then(c.res, c.rej);
      return;
    }
    kirim({ action: 'batch', token: token, data: { calls: q.map(function (c) { return { action: c.action, data: c.data }; }) }, bg: q.every(function (c) { return c.bg; }) })
      .then(function (j) {
        if (!j.success) { q.forEach(function (c) { c.res(j); }); return; }
        q.forEach(function (c, i) { c.res(j.results[i] || { success: false, message: 'Respons batch tidak lengkap' }); });
      }, function (e) { q.forEach(function (c) { c.rej(e); }); });
  }
  /* call(action, data, {bg}) → Promise<respons JSON>. Galat jaringan → reject. */
  function call(action, data, opt) {
    opt = opt || {};
    data = data || {};
    if (!BACA.test(action)) return kirim({ action: action, token: token, data: data });
    var key = action + '|' + JSON.stringify(data);
    if (jalan[key]) return jalan[key];
    var p = new Promise(function (res, rej) {
      antre.push({ action: action, data: data, res: res, rej: rej, bg: !!opt.bg });
      if (antre.length >= 10) { clearTimeout(tmr); flush(); }
      else if (!tmr) tmr = setTimeout(flush, 0);
    });
    jalan[key] = p;
    var bersih = function () { delete jalan[key]; };
    p.then(bersih, bersih);
    return p;
  }
  /* Panggilan yang wajib sukses: reject dengan pesan server bila success:false */
  function wajib(action, data, opt) {
    return call(action, data, opt).then(function (j) {
      if (!j || !j.success) { var e = new Error((j && j.message) || 'Permintaan gagal'); e.kode = j && j.code; throw e; }
      return j;
    });
  }
  function publik(params) {
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(URL_GAS + (URL_GAS.indexOf('?') > -1 ? '&' : '?') + q, { redirect: 'follow' }).then(function (r) { return r.json(); });
  }
  return {
    call: call, wajib: wajib, publik: publik, kirim: kirim,
    setToken: function (t) { token = t || ''; if (t) LS.set('token', t); else LS.del('token'); },
    token: function () { return token; },
    url: function () { return URL_GAS; }
  };
})();

/* =====================================================================
 * Store: data tahunan (cube) — memori → localStorage → server (berversi)
 * ===================================================================== */
var Store = (function () {
  var mem = {}, cek = {}, ixMemo = { key: '', ix: null }, swr = {};
  function kunci(y) { return 'cube_' + (App.S.user ? App.S.user.username : 'x') + '_' + y; }
  function cubeSinkron(y) {
    if (!mem[y]) { var l = LS.get(kunci(y), null); if (l) mem[y] = l; }
    return mem[y] || null;
  }
  /* Ambil cube tahun y; resolve cepat dari cache, lalu revalidasi ke server (maks 1x/20 dtk) */
  function muat(y, opt) {
    opt = opt || {};
    var c = cubeSinkron(y);
    var segar = cek[y] && Date.now() - cek[y] < 20000;
    if (c && segar && !opt.paksa) return Promise.resolve(c);
    var p = API.wajib('data.cube', { y: y, ver: c ? c.ver : '' }, { bg: !!opt.bg }).then(function (j) {
      cek[y] = Date.now();
      if (j.same && c) return c;
      mem[y] = j.cube;
      LS.set(kunci(y), j.cube);
      Bus.emit('cube', y);
      return j.cube;
    });
    if (c && !opt.paksa) { p.catch(function () { /* tetap pakai cache */ }); return Promise.resolve(c); }
    return p;
  }
  function muatBanyak(ys, opt) { return Promise.all(ys.map(function (y) { return muat(y, opt); })); }
  function ix(ys) {
    var key = ys.map(function (y) { var c = mem[y]; return y + ':' + (c ? c.ver : '-'); }).join(',');
    if (ixMemo.key === key && ixMemo.ix) return ixMemo.ix;
    var i = INTI.indeks(ys.map(function (y) { return cubeSinkron(y); }).filter(Boolean));
    ixMemo = { key: key, ix: i };
    return i;
  }
  /* Patch lokal setelah tulis (tanpa menunggu muat ulang) */
  function patch(y, hRow, dRows, ver) {
    var c = cubeSinkron(y) || { y: y, ver: '', h: [], d: [] };
    var id = hRow[0], m = hRow[1], u = hRow[2];
    c.h = c.h.filter(function (r) { return r[0] !== id; }).concat([hRow]);
    if (dRows) c.d = c.d.filter(function (r) { return !(r[0] === m && r[1] === u); }).concat(dRows);
    c.ver = ver || c.ver;
    mem[y] = c; cek[y] = Date.now();
    LS.set(kunci(y), c);
    ixMemo.key = '';
    Bus.emit('cube', y);
  }
  /* SWR umum untuk daftar kecil (revisi, pengguna, log) */
  function ambil(key, action, data, opt) {
    opt = opt || {};
    var e = swr[key];
    var umur = e ? Date.now() - e.t : Infinity;
    var p = (e && umur < (opt.ttl || 15000) && !opt.paksa) ? Promise.resolve(e.v) :
      API.wajib(action, data || {}).then(function (j) { swr[key] = { v: j, t: Date.now() }; if (e) Bus.emit('swr:' + key, j); return j; });
    return { cache: e ? e.v : null, p: p };
  }
  function lupa(key) { if (key) delete swr[key]; else swr = {}; }
  function reset() { mem = {}; cek = {}; swr = {}; ixMemo = { key: '', ix: null }; }
  return { muat: muat, muatBanyak: muatBanyak, sinkron: cubeSinkron, ix: ix, patch: patch, ambil: ambil, lupa: lupa, reset: reset };
})();
