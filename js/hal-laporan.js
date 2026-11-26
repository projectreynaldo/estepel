/* =====================================================================
 * ESTEPEL — Laporan Saya (F4): Input 27 penyakit × 24 kolom L/P, Nihil,
 * draf otomatis, pratinjau, kirim + Stempel Digital; Riwayat & Arsip; Revisi.
 * Juga modal bersama: detail laporan, Stempel Digital, aksi admin, revisi.
 * ===================================================================== */
(function () {
  'use strict';
  var ic = UI.ic, esc = UI.esc, A = UI.A, $ = UI.$, $$ = UI.$$, UMUR = INTI.UMUR;

  function idInfo(id) { var a = String(id).split('_'); return { p: a[0], u: a[1], y: INTI.urai(a[0]).y }; }
  function hdrDari(id) { var f = idInfo(id); var c = Store.sinkron(f.y); if (!c) return null; var r = c.h.filter(function (x) { return x[0] === id; })[0]; return r ? INTI.hObj(r, f.y) : null; }
  function detailDari(id) {
    var f = idInfo(id), c = Store.sinkron(f.y), m = INTI.urai(f.p).m, o = {};
    if (c) c.d.forEach(function (r) { if (r[0] === m && r[1] === f.u) o[r[2]] = r.slice(3, 27); });
    return o;
  }
  function labelKetepatan(h) { return h.kt === 'T' ? 'Tepat Waktu' : 'Terlambat +' + h.hr + ' hari'; }
  function warnaStatusLap(st) { return st === 'Terkirim' ? 'ok' : st === 'Dibuka untuk Revisi' ? 'warn' : st === 'Dikunci' ? 'vio' : 'bad'; }

  /* ======================== INPUT ======================== */
  function tabInput(el, r) {
    var S = App.S, u = S.user.unit, now = App.now(), W = S.wajib;
    var st = { p: r.q.periode || '', data: {}, kat: '', q: r.q.q || '', hanyaIsi: false };
    var mobile = window.innerWidth < 1024;
    var ys = App.tahunDari(INTI.geser(W, -23), W);
    function hUnit(p) { return INTI.hdr(Store.ix(ys), u, p); }
    function bisaIsi(h) { return !h || h.st === 'Dibuka untuk Revisi' || h.st === 'Dihapus'; }
    function pilihAwal() {
      if (st.p && INTI.bolehInput(st.p, now)) return st.p;
      if (bisaIsi(hUnit(W))) return W;
      var daftar = INTI.daftarPeriode(INTI.geser(W, -23), W).reverse();
      for (var i = 0; i < daftar.length; i++) if (bisaIsi(hUnit(daftar[i]))) return daftar[i];
      return W;
    }
    function drafKey() { return 'draf_' + u + '_' + st.p; }
    function muatDraf() {
      var d = LS.get(drafKey(), null), h = hUnit(st.p);
      st.data = {};
      if (d && d.data) st.data = d.data;
      else if (h && h.st === 'Dibuka untuk Revisi') { var lama = detailDari(h.id); Object.keys(lama).forEach(function (k) { st.data[k] = lama[k].slice(); }); }
      st.drafT = d ? d.t : 0;
    }
    var simpanDraf = UI.debounce(function (tampil) {
      var ada = Object.keys(st.data).some(function (k) { return INTI.jumlahLP(st.data[k]).T > 0; });
      if (ada) LS.set(drafKey(), { data: st.data, t: Date.now() }); else LS.del(drafKey());
      st.drafT = Date.now();
      var s = $('#drafInfo'); if (s) s.innerHTML = ic('save', 13) + ' Draf tersimpan otomatis ' + INTI.fmtTgl(App.now(), true).split(', ')[1];
      if (tampil) UI.toast('Draf disimpan di perangkat ini.', 'info');
    }, 500);
    function total() {
      var L = 0, P = 0, n = 0, kol = INTI.nol24();
      Object.keys(st.data).forEach(function (k) { var s = INTI.jumlahLP(st.data[k]); if (s.T) n++; L += s.L; P += s.P; INTI.tambah24(kol, st.data[k]); });
      return { L: L, P: P, T: L + P, n: n, kol: kol };
    }
    function penyakitTampil() {
      var q = st.q.toLowerCase();
      return S.penyakit.filter(function (p) {
        if (!p.aktif) return false;
        if (st.kat && p.kategori !== st.kat) return false;
        if (q && (p.nama + ' ' + p.kode).toLowerCase().indexOf(q) < 0) return false;
        if (st.hanyaIsi && !(st.data[p.kode] && INTI.jumlahLP(st.data[p.kode]).T)) return false;
        return true;
      });
    }
    function prediksi() {
      var h = hUnit(st.p);
      if (h && h.kp) return { teks: 'Ketepatan tetap ' + labelKetepatan(h) + ' (mengikuti kirim pertama)', k: h.kt === 'T' ? 'ok' : 'warn' };
      var k = INTI.nilaiKetepatan(App.now(), INTI.tenggat(st.p, S.set));
      return k.s === 'T' ? { teks: 'Tepat Waktu (sisa ' + INTI.sisaHari(st.p, App.now(), S.set) + ' hari)', k: 'ok' } : { teks: 'Akan tercatat Terlambat +' + k.hari + ' hari', k: 'warn' };
    }

    function render() {
      st.p = pilihAwal();
      var h = hUnit(st.p), tg = INTI.tenggat(st.p, S.set), sisa = INTI.sisaHari(st.p, App.now(), S.set);
      var opsi = INTI.daftarPeriode(INTI.geser(W, -23), W).reverse().map(function (p) {
        var hh = hUnit(p), lbl = INTI.labelBulan(p) + (p === W ? ' (periode wajib)' : '') + (hh ? (hh.st === 'Dibuka untuk Revisi' ? ' — dibuka untuk revisi' : hh.st === 'Dihapus' ? ' — dihapus admin, kirim ulang' : ' — sudah dikirim') : (p < W ? ' — tertinggal' : ''));
        return '<option value="' + p + '"' + (p === st.p ? ' selected' : '') + '>' + lbl + '</option>';
      }).join('');
      var head = '<div class="ph"><div><div class="flex wrap"><h1>Laporan Saya</h1>' + (bisaIsi(h) ? '<span class="badge b-ok">' + ic('edit', 13) + 'Mode input aktif</span>' : '<span class="badge b-vio">' + ic('lock', 13) + 'Terkunci</span>') + '</div>' +
        '<p>' + ic('hosp', 15, 'p-tx') + ' <b style="color:var(--tx)">' + esc(App.namaUnit(u)) + '</b> • Periode wajib <b style="color:var(--tx)">' + INTI.labelBulan(W) + '</b> • <span class="' + (sisa < 0 ? 'bad-tx' : 'warn-tx') + '">' + ic('clock', 14) + ' Tenggat ' + INTI.fmtTgl(INTI.tenggat(W, S.set), true) + ' WITA</span></p></div>' +
        (bisaIsi(h) ? '<div class="ph-act"><button class="btn btn-s" data-a="draf">' + ic('save', 16) + 'Simpan Draf</button><button class="btn btn-s bad-tx" data-a="nihil">' + ic('ban', 16) + 'Laporkan Nihil</button><button class="btn btn-p" data-a="pratinjau">Pratinjau &amp; Kirim ' + ic('arrow', 16) + '</button></div>' : '') + '</div>';
      var tabs = App.tabBar('laporan', 'input', {});
      var langkah = bisaIsi(h) ? 2 : 4;
      var stepper = '<div class="card"><div class="stepper">' + [['Periode & Unit', 'Periode'], ['Isi 27 Penyakit', 'Isi'], ['Verifikasi & Pratinjau', 'Pratinjau'], ['Stempel Digital', 'Stempel']].map(function (x, i) {
        var n = i + 1, k = n < langkah ? 'done' : n === langkah ? 'on' : '';
        return '<div class="step ' + k + '"><div class="n">' + (n < langkah ? ic('check', 16) : n) + '</div><div class="ell"><div class="k">Tahap ' + n + (n < langkah ? ' • Selesai' : n === langkah ? ' • Aktif' : '') + '</div><div class="t"><span class="lg">' + x[0] + '</span><span class="sh">' + x[1] + '</span></div></div></div>';
      }).join('') + '</div></div>';
      var pilihP = '<div class="card flex wrap g16"><label class="fld" style="min-width:280px;flex:1"><span>Periode laporan</span><select class="sel" id="selP">' + opsi + '</select></label>' +
        '<div class="fld"><span>Tenggat periode ini</span><b>' + INTI.fmtTgl(tg, true) + ' WITA</b></div>' +
        (bisaIsi(h) ? '<div class="fld"><span>Status ketepatan</span>' + (function () { var pr = prediksi(); return '<span class="badge b-' + pr.k + '">' + ic(pr.k === 'ok' ? 'checkc' : 'clock', 13) + esc(pr.teks) + '</span>'; })() + '</div>' : '') +
        '<div class="fs11 mut ml-a" id="drafInfo">' + (st.drafT ? ic('save', 13) + ' Draf tersimpan ' + UI.waktuRelatif(st.drafT, App.now()) : '') + '</div></div>';

      if (!bisaIsi(h)) {
        el.innerHTML = head + tabs + stepper + pilihP + '<div class="card"><div class="flex wrap" style="gap:18px"><svg class="seal stamp-anim" viewBox="0 0 120 120" style="width:110px;height:110px">' + App.segel('#16A34A', '#4ADE80') + '</svg>' +
          '<div style="flex:1;min-width:240px"><span class="badge b-' + warnaStatusLap(h.st) + '">' + esc(h.st) + '</span><h2 style="margin:8px 0 4px">Laporan ' + INTI.labelBulan(st.p) + ' sudah distempel</h2><div class="mut">Dikirim ' + INTI.fmtTglJam(h.kp) + ' • ' + labelKetepatan(h) + ' • Versi ' + h.v + ' • ' + (h.j === 'N' ? 'Nihil' : A(h.tt) + ' kasus (L ' + A(h.tl) + ', P ' + A(h.tp) + ')') + '</div>' +
          '<div class="flex wrap mt12"><button class="btn btn-p" data-a="stempel">' + ic('stamp', 16) + 'Lihat Stempel Digital</button><button class="btn btn-s" data-a="detail">' + ic('eye', 16) + 'Lihat rincian</button>' + (h.st === 'Terkirim' ? '<button class="btn btn-s" data-a="revisi">' + ic('compare', 16) + 'Ajukan Revisi</button>' : '') + '</div>' +
          (h.st === 'Dikunci' ? '<div class="note mt12 fs12">' + ic('lock', 16) + 'Laporan dikunci Admin Dinkes dan tidak dapat direvisi.</div>' : '') + '</div></div></div>';
        pasangAksi(h);
        return;
      }
      var kats = []; S.penyakit.forEach(function (p) { if (p.aktif && p.kategori && kats.indexOf(p.kategori) < 0) kats.push(p.kategori); });
      var alat = '<div class="card flex wrap"><div class="inp-ic sm" style="width:260px;max-width:100%">' + ic('search', 16) + '<input class="inp" id="qP" placeholder="Cari penyakit atau kode (DBD, P18)..." value="' + esc(st.q) + '"></div>' +
        '<div class="chips" style="flex:1;min-width:0"><button class="chip' + (!st.kat ? ' on' : '') + '" data-kat="">Semua (' + S.penyakit.filter(function (p) { return p.aktif; }).length + ')</button>' + kats.map(function (k) { return '<button class="chip' + (st.kat === k ? ' on' : '') + '" data-kat="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
        '<label class="chk"><input type="checkbox" id="hIsi"' + (st.hanyaIsi ? ' checked' : '') + '>Hanya yang terisi</label></div>';
      var catatan = '<div class="note">' + ic('info', 20) + '<div><b>Pedoman pengisian.</b> Isi jumlah kasus baru per 12 kelompok umur (L = laki-laki, P = perempuan). Sel kosong dianggap 0. Total dihitung otomatis dan diverifikasi ulang oleh server. ' + (mobile ? 'Ketuk nama penyakit untuk membuka isian.' : 'Tekan Enter/↓/→ untuk pindah sel; bisa menempel (paste) baris angka dari Excel.') + '</div></div>';
      el.innerHTML = head + tabs + stepper + pilihP + catatan + alat + '<div id="isian"></div>' + '<div class="sumbar" id="sumbar"></div>';
      renderIsian(); renderSum();
      pasangAksi(h);
    }
    function renderIsian() {
      var w = $('#isian'); if (!w) return;
      var daftar = penyakitTampil(), t = total();
      if (!daftar.length) { w.innerHTML = '<div class="card">' + UI.kosong('Tidak ada penyakit yang cocok', 'Ubah pencarian atau filter kategori.', 'search') + '</div>'; return; }
      if (mobile) {
        w.innerHTML = daftar.map(function (p) {
          var v = st.data[p.kode] || INTI.nol24(), s = INTI.jumlahLP(v);
          return '<div class="acc' + (st.buka === p.kode ? ' buka' : '') + '" data-acc="' + p.kode + '"><div class="acc-h"><div class="flex between"><div class="flex g6 wrap"><span class="badge b-vio b-sm">' + p.kode + '</span>' + (p.klb ? '<span class="badge b-bad b-sm">' + ic('alert', 12) + 'Potensi KLB</span>' : '') + (p.kategori ? '<span class="badge b-muted b-sm">' + esc(p.kategori) + '</span>' : '') + '</div>' + ic('down', 18, 'chev') + '</div>' +
            '<div class="flex between"><span class="nm">' + esc(p.nama) + '</span><span class="badge ' + (s.T ? (p.klb ? 'b-bad' : 'b-info') : 'b-muted') + '" id="sb_' + p.kode + '">' + (s.T ? A(s.T) + ' kasus (' + s.L + 'L, ' + s.P + 'P)' : 'Nihil') + '</span></div></div>' +
            '<div class="acc-b">' + UMUR.map(function (g, gi) {
              return '<div class="age-row"><span class="fs12 fw6" style="min-width:86px">' + g.panjang + '</span><div class="flex"><label>L <input class="ci' + (v[gi * 2] ? ' v' : '') + '" inputmode="numeric" pattern="[0-9]*" data-k="' + p.kode + '" data-i="' + (gi * 2) + '" value="' + (v[gi * 2] || '') + '" placeholder="0" aria-label="' + esc(p.nama + ' ' + g.panjang + ' laki-laki') + '"></label><label>P <input class="ci' + (v[gi * 2 + 1] ? ' v' : '') + '" inputmode="numeric" pattern="[0-9]*" data-k="' + p.kode + '" data-i="' + (gi * 2 + 1) + '" value="' + (v[gi * 2 + 1] || '') + '" placeholder="0" aria-label="' + esc(p.nama + ' ' + g.panjang + ' perempuan') + '"></label></div></div>';
            }).join('') + '</div></div>';
        }).join('');
        return;
      }
      var th1 = '<tr><th class="stl" rowspan="2">Kode &amp; Nama Penyakit</th>' + UMUR.map(function (g, i) { return '<th colspan="2" class="' + (i % 2 ? '' : 'gL') + '">' + g.label + '</th>'; }).join('') + '<th class="str r1" rowspan="2">Tot L</th><th class="str r2" rowspan="2">Tot P</th><th class="str r3" rowspan="2">Total</th></tr>';
      var th2 = '<tr>' + UMUR.map(function () { return '<th>L</th><th>P</th>'; }).join('') + '</tr>';
      var body = daftar.map(function (p) {
        var v = st.data[p.kode] || INTI.nol24(), s = INTI.jumlahLP(v);
        return '<tr class="' + (s.T ? 'ada' : '') + (p.klb ? ' klb' : '') + '" data-row="' + p.kode + '"><td class="stl"><div class="flex g6"><b class="ell" title="' + esc(p.nama) + '">' + p.kode + ' • ' + esc(p.nama) + '</b>' + (p.klb ? '<span class="badge b-bad b-sm" title="Potensi KLB">KLB</span>' : '') + '</div><div class="fs11 mut">' + esc(p.kategori || '') + '</div></td>' +
          v.map(function (x, i) { return '<td' + (Math.floor(i / 2) % 2 ? '' : ' class="gL"') + '><input class="ci' + (x ? ' v' : '') + (x && p.klb ? ' klb' : '') + '" inputmode="numeric" data-k="' + p.kode + '" data-i="' + i + '" value="' + (x || '') + '" placeholder="0" aria-label="' + esc(p.nama + ' ' + UMUR[Math.floor(i / 2)].panjang + (i % 2 ? ' P' : ' L')) + '"></td>'; }).join('') +
          '<td class="str r1" id="tL_' + p.kode + '">' + s.L + '</td><td class="str r2" id="tP_' + p.kode + '">' + s.P + '</td><td class="str r3" id="tT_' + p.kode + '">' + s.T + '</td></tr>';
      }).join('');
      var foot = '<tr><td class="stl">TOTAL SELURUH KELOMPOK UMUR</td>' + t.kol.map(function (x, i) { return '<td id="cf_' + i + '">' + x + '</td>'; }).join('') + '<td class="str r1" id="gL">' + t.L + '</td><td class="str r2" id="gP">' + t.P + '</td><td class="str r3" id="gT">' + t.T + '</td></tr>';
      w.innerHTML = '<div class="card p0"><div class="tbl-wrap" style="max-height:66vh;border-radius:14px"><table class="in-tbl"><thead>' + th1 + th2 + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table></div></div>';
    }
    function renderSum() {
      var b = $('#sumbar'); if (!b) return;
      var t = total(), pr = prediksi(), aktif = S.penyakit.filter(function (p) { return p.aktif; }).length;
      b.innerHTML = '<div class="tile t-vio">' + ic('activity', 22) + '</div><div style="flex:1;min-width:160px"><div class="big tnum">' + A(t.T) + ' Total Kasus <span class="mut fs12" style="font:500 13px var(--f)">(' + A(t.L) + ' L, ' + A(t.P) + ' P)</span></div><div class="fs12 mut">' + t.n + ' dari ' + aktif + ' penyakit terisi • ' + (aktif - t.n) + ' nihil</div></div>' +
        '<span class="badge b-' + pr.k + ' hide-m">' + ic(pr.k === 'ok' ? 'checkc' : 'clock', 13) + esc(pr.teks) + '</span>' +
        '<button class="btn btn-grad" data-a="pratinjau">' + (mobile ? 'Pratinjau & Kirim' : 'Pratinjau & Sahkan') + ' ' + ic('arrow', 16) + '</button>';
    }
    function perbaruiSel(k, i, val, inp) {
      var v = st.data[k] || (st.data[k] = INTI.nol24());
      v[i] = val;
      inp.classList.toggle('v', !!val);
      var p = App.S.pMap[k]; if (p && p.klb) inp.classList.toggle('klb', !!val);
      var s = INTI.jumlahLP(v), t = total();
      if (mobile) { var sb = $('#sb_' + k); if (sb) { sb.textContent = s.T ? A(s.T) + ' kasus (' + s.L + 'L, ' + s.P + 'P)' : 'Nihil'; sb.className = 'badge ' + (s.T ? (p && p.klb ? 'b-bad' : 'b-info') : 'b-muted'); } }
      else {
        $('#tL_' + k).textContent = s.L; $('#tP_' + k).textContent = s.P; $('#tT_' + k).textContent = s.T;
        $('#cf_' + i).textContent = t.kol[i]; $('#gL').textContent = t.L; $('#gP').textContent = t.P; $('#gT').textContent = t.T;
        var tr = inp.closest('tr'); if (tr) tr.classList.toggle('ada', s.T > 0);
      }
      renderSum();
      simpanDraf();
    }
    function bersih(x) { x = String(x || '').replace(/[^\d]/g, '').slice(0, 5); return x ? Math.min(99999, parseInt(x, 10)) : 0; }
    function pindah(inp, arah) {
      var semua = $$('#isian .ci'), i = semua.indexOf(inp), t;
      if (arah === 'kanan') t = semua[i + 1];
      if (arah === 'kiri') t = semua[i - 1];
      if (arah === 'atas' || arah === 'bawah') {
        var tr = inp.closest('tr'), sib = tr && (arah === 'atas' ? tr.previousElementSibling : tr.nextElementSibling);
        if (sib) t = sib.querySelector('.ci[data-i="' + inp.dataset.i + '"]');
      }
      if (t) { t.focus(); t.select(); }
    }
    function pasangAksi(h) {
      var selP = $('#selP');
      if (selP) selP.onchange = function () { App.ke('#/laporan/input?periode=' + this.value); };
      el.oninput = function (e) {
        var t = e.target;
        if (t.classList.contains('ci')) {
          var v = bersih(t.value);
          if (String(v || '') !== t.value) t.value = v || '';
          perbaruiSel(t.dataset.k, +t.dataset.i, v, t);
        } else if (t.id === 'qP') { st.q = t.value; dbCari(); }
      };
      var dbCari = UI.debounce(function () { renderIsian(); var q = $('#qP'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 150);
      el.onkeydown = function (e) {
        var t = e.target; if (!t.classList || !t.classList.contains('ci')) return;
        var arah = { Enter: 'kanan', ArrowRight: t.selectionStart >= t.value.length ? 'kanan' : '', ArrowLeft: t.selectionStart === 0 ? 'kiri' : '', ArrowDown: 'bawah', ArrowUp: 'atas' }[e.key];
        if (arah) { e.preventDefault(); pindah(t, arah); }
      };
      el.onfocusin = function (e) { if (e.target.classList && e.target.classList.contains('ci')) setTimeout(function () { try { e.target.select(); } catch (x) { /* abaikan */ } }, 0); };
      el.onchange = function (e) { if (e.target.id === 'hIsi') { st.hanyaIsi = e.target.checked; renderIsian(); } };
      var isian = $('#isian');
      if (isian) isian.addEventListener('paste', function (e) {
        var t = e.target; if (!t.classList.contains('ci')) return;
        var txt = (e.clipboardData || window.clipboardData).getData('text');
        if (!/[\t\n]/.test(txt)) return;
        e.preventDefault();
        var baris = txt.replace(/\r/g, '').split('\n').filter(function (x) { return x.trim() !== ''; });
        var tr = t.closest('tr'), mulaiI = +t.dataset.i, n = 0;
        baris.forEach(function (b, bi) {
          if (!tr) return;
          b.split('\t').forEach(function (c, ci) {
            var inp = tr.querySelector('.ci[data-i="' + (mulaiI + ci) + '"]');
            if (inp) { var v = bersih(c); inp.value = v || ''; perbaruiSel(inp.dataset.k, +inp.dataset.i, v, inp); n++; }
          });
          tr = tr.nextElementSibling;
        });
        UI.toast(n + ' sel ditempel dari clipboard.', 'info');
      });
      el.onclick = function (e) {
        var c = e.target.closest('[data-kat]'); if (c) { st.kat = c.dataset.kat; $$('[data-kat]').forEach(function (x) { x.classList.toggle('on', x === c); }); renderIsian(); return; }
        var ah = e.target.closest('.acc-h'); if (ah) { var acc = ah.parentNode; st.buka = acc.classList.contains('buka') ? '' : acc.dataset.acc; $$('.acc.buka').forEach(function (x) { if (x !== acc) x.classList.remove('buka'); }); acc.classList.toggle('buka'); return; }
        var b = e.target.closest('[data-a]'); if (!b) return;
        var a = b.dataset.a;
        if (a === 'draf') simpanDraf(true);
        if (a === 'nihil') kirimNihil(b);
        if (a === 'pratinjau') pratinjau();
        if (a === 'stempel') Hal.stempel(h.id);
        if (a === 'detail') Hal.detailLaporan(h.id);
        if (a === 'revisi') Hal.ajukanRevisi(h.id);
      };
    }
    function kirim(nihil, btn) {
      var t = total(), data = {};
      if (!nihil) Object.keys(st.data).forEach(function (k) { if (INTI.jumlahLP(st.data[k]).T) data[k] = st.data[k]; });
      return API.wajib('laporan.kirim', { periode: st.p, nihil: !!nihil, data: data, total: nihil ? { L: 0, P: 0, T: 0 } : { L: t.L, P: t.P, T: t.T } }).then(function (j) {
        Store.patch(j.y, j.h, j.d, j.ver);
        LS.del(drafKey());
        Store.lupa('revisi'); Store.lupa('lap_' + j.id);
        App.renderKartuTenggat();
        Hal.stempel(j.id, j.versi, { baru: true, sig: j.sig, waktu: j.waktu });
        render();
      }).catch(function (e) {
        if (e.kode === 'KONFLIK') UI.konfirmasi({ judul: 'Laporan sudah terkirim', pesan: esc(e.message), ya: 'Ajukan Revisi', ikon: 'compare' }).then(function (ok) { if (ok) Hal.ajukanRevisi(st.p + '_' + u); });
        else UI.toast(e.message, 'bad');
        throw null;
      });
    }
    function kirimNihil(btn) {
      var t = total();
      UI.konfirmasi({ judul: 'Laporkan Nihil', ikon: 'ban', pesan: 'Kirim laporan <b>' + INTI.labelBulan(st.p) + '</b> sebagai <b>Nihil</b> (tidak ada kasus untuk seluruh penyakit)?' + (t.T ? '<div class="note warn mt12 fs12">' + ic('alert', 16) + 'Isian saat ini berisi ' + t.T + ' kasus dan akan diabaikan.</div>' : '') + '<div class="fs12 mut mt12">Status ketepatan: <b>' + esc(prediksi().teks) + '</b>.</div>', ya: 'Kirim Nihil' })
        .then(function (ok) { if (ok) { UI.sibuk(btn, true); kirim(true).catch(function () { /* sudah ditangani */ }).then(function () { UI.sibuk(btn, false); }); } });
    }
    function pratinjau() {
      var t = total();
      if (!t.T) { UI.toast('Belum ada kasus yang diisi. Gunakan "Laporkan Nihil" bila bulan ini tidak ada kasus.', 'warn'); return; }
      var rows = S.penyakit.filter(function (p) { return st.data[p.kode] && INTI.jumlahLP(st.data[p.kode]).T; });
      var cek = rows.every(function (p) { var s = INTI.jumlahLP(st.data[p.kode]); return s.T === st.data[p.kode].reduce(function (a, b) { return a + b; }, 0); });
      var pr = prediksi();
      UI.modal({ judul: 'Pratinjau Laporan ' + INTI.labelBulan(st.p), sub: App.namaUnit(u), ikon: 'eye', ukuran: 'lg',
        isi: '<div class="g3" style="gap:10px"><div class="card" style="padding:12px"><div class="kpi-lbl">Total kasus</div><div class="kpi-val" style="font-size:24px">' + A(t.T) + '</div></div><div class="card" style="padding:12px"><div class="kpi-lbl">Laki-laki / Perempuan</div><div class="kpi-val" style="font-size:24px">' + A(t.L) + ' / ' + A(t.P) + '</div></div><div class="card" style="padding:12px"><div class="kpi-lbl">Penyakit terisi</div><div class="kpi-val" style="font-size:24px">' + t.n + '</div></div></div>' +
          '<div class="tbl-wrap" style="max-height:44vh;border:1px solid var(--line);border-radius:12px"><table class="tbl"><thead><tr><th>Penyakit</th><th>Kelompok umur terisi</th><th class="num">L</th><th class="num">P</th><th class="num">Total</th></tr></thead><tbody>' +
          rows.map(function (p) { var v = st.data[p.kode], s = INTI.jumlahLP(v); var g = UMUR.filter(function (x, i) { return v[i * 2] + v[i * 2 + 1]; }).map(function (x) { var i = UMUR.indexOf(x); return x.label + ' (' + v[i * 2] + '/' + v[i * 2 + 1] + ')'; }).join(', ');
            return '<tr><td><b>' + esc(p.nama) + '</b>' + (p.klb ? ' <span class="badge b-bad b-sm">Potensi KLB</span>' : '') + '</td><td class="fs12 mut">' + esc(g) + '</td><td class="num">' + s.L + '</td><td class="num">' + s.P + '</td><td class="num"><b>' + s.T + '</b></td></tr>'; }).join('') +
          '</tbody><tfoot><tr><td colspan="2">TOTAL</td><td class="num">' + A(t.L) + '</td><td class="num">' + A(t.P) + '</td><td class="num">' + A(t.T) + '</td></tr></tfoot></table></div>' +
          '<div class="note ' + (cek ? 'ok' : 'bad') + ' fs12">' + ic(cek ? 'checkc' : 'siren', 16) + '<div>' + (cek ? 'Validasi: Total L + P = jumlah 12 kelompok umur untuk semua penyakit.' : 'Ada selisih total — periksa isian.') + ' Status ketepatan: <b>' + esc(pr.teks) + '</b>.</div></div>',
        tombol: [{ label: 'Kembali ubah' }, { label: 'Kirim & Sahkan', kelas: 'btn-grad', ikon: 'stamp', aksi: function () { return kirim(false); } }] });
    }
    muatDraf0();
    function muatDraf0() { st.p = pilihAwal(); muatDraf(); render(); }
    Store.muatBanyak(ys).then(function () { if (App.rute().tab === 'input') { var lama = st.p; st.p = r.q.periode || lama; muatDraf(); render(); } }, function (e) { UI.toast(e.message, 'bad'); });
    var lebar = window.innerWidth < 1024;
    var onR = UI.debounce(function () { var m = window.innerWidth < 1024; if (m !== lebar) { lebar = m; mobile = m; render(); } }, 200);
    window.addEventListener('resize', onR);
    App.ikat(function () { window.removeEventListener('resize', onR); });
  }

  /* ======================== RIWAYAT & ARSIP ======================== */
  function tabRiwayat(el, r) {
    var S = App.S, u = S.user.unit, W = S.wajib, y = +(r.q.y || INTI.urai(W).y);
    function render() {
      var ix = Store.ix([y]), now = App.now(), sk = INTI.skorUnit(ix, u, y, now, S.set);
      var bulan = []; for (var m = 12; m >= 1; m--) { var p = INTI.periode(y, m); if (p <= W) bulan.push(p); }
      var thnOpsi = ''; for (var t = INTI.urai(W).y; t >= INTI.urai(W).y - 4; t--) thnOpsi += '<option' + (t === y ? ' selected' : '') + '>' + t + '</option>';
      var rows = bulan.map(function (p) {
        var h = INTI.hdr(ix, u, p), st = INTI.statusSel(p, h, now, S.set), id = p + '_' + u;
        return { p: p, h: h, st: st, id: id };
      });
      el.innerHTML = '<div class="ph"><div><h1>Laporan Saya</h1><p>' + esc(App.namaUnit(u)) + ' • Riwayat, arsip, dan Stempel Digital setiap laporan.</p></div><div class="ph-act"><select class="sel" id="selY" style="width:auto">' + thnOpsi + '</select><button class="btn btn-s" data-a="xls">' + ic('sheet', 16) + 'Ekspor Excel</button><button class="btn btn-s" data-a="pdf">' + ic('printer', 16) + 'Ekspor PDF</button></div></div>' +
        App.tabBar('laporan', 'riwayat', { riwayat: rows.filter(function (x) { return x.h; }).length }) +
        '<div class="g4">' + UI.kpi({ tile: 't-grn', ikon: 'trophy', label: 'Skor ketepatan ' + y, nilai: sk.skor === null ? '–' : String(sk.skor).replace('.', ',') + '%', sub: sk.tepat + '/' + sk.jatuh + ' bulan' }) +
        UI.kpi({ tile: 't-amb', ikon: 'clock', label: 'Terlambat', nilai: String(sk.telat), sub: 'rata-rata ' + String(sk.rataHari).replace('.', ',') + ' hari' }) +
        UI.kpi({ tile: 't-red', ikon: 'x', label: 'Belum lapor', nilai: String(sk.belum), sub: 'periode' }) +
        UI.kpi({ tile: 't-vio', ikon: 'clock', label: 'Keterlambatan terlama', nilai: String(sk.maxHari), sub: 'hari' }) + '</div>' +
        '<div class="card p0 tbl-cards"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Periode</th><th>Tenggat</th><th>Kirim pertama</th><th>Ketepatan</th><th class="num">Total kasus</th><th class="center">Versi</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' +
        rows.map(function (x) {
          var h = x.h;
          return '<tr><td><b>' + INTI.labelBulan(x.p) + '</b>' + (h && h.sb === 'Historis' ? '<div class="fs11 mut">data historis</div>' : '') + '</td><td class="mut nowrap">' + INTI.fmtTgl(INTI.tenggat(x.p, S.set), true) + '</td><td class="nowrap">' + (h ? INTI.fmtTgl(h.kp, true) : '–') + '</td><td>' + UI.badgeStatus(x.st.kode, x.st.hari) + '</td><td class="num">' + (h ? (h.j === 'N' ? '<span class="badge b-muted b-sm">Nihil</span>' : '<b>' + A(h.tt) + '</b> <span class="mut fs11">(' + h.tl + 'L/' + h.tp + 'P)</span>') : '–') + '</td><td class="center">' + (h ? 'v' + h.v : '–') + '</td><td>' + (h ? UI.badge(h.st, warnaStatusLap(h.st)) : '') + '</td>' +
            '<td class="right"><div class="aksi">' + (h ? '<button data-l="' + x.id + '" title="Rincian" aria-label="Rincian">' + ic('eye') + '</button><button data-s="' + x.id + '" title="Stempel Digital" aria-label="Stempel Digital">' + ic('stamp') + '</button>' + (h.st === 'Terkirim' ? '<button data-r="' + x.id + '" title="Ajukan revisi" aria-label="Ajukan revisi">' + ic('compare') + '</button>' : '') : '') +
            (!h || h.st === 'Dibuka untuk Revisi' || h.st === 'Dihapus' ? '<a class="btn btn-p btn-xs" href="#/laporan/input?periode=' + x.p + '">' + (h ? 'Isi ulang' : 'Input') + '</a>' : '') + '</div></td></tr>';
        }).join('') + '</tbody></table></div><div class="mcards">' + rows.map(function (x) {
          var h = x.h;
          return '<div class="mc"><div class="flex between"><b>' + INTI.labelBulan(x.p) + '</b>' + UI.badgeStatus(x.st.kode, x.st.hari, true) + '</div>' + (h ? '<div class="mc-r"><span>Dikirim</span><span>' + INTI.fmtTgl(h.kp, true) + '</span></div><div class="mc-r"><span>Total</span><span>' + (h.j === 'N' ? 'Nihil' : A(h.tt) + ' kasus') + ' • v' + h.v + '</span></div><div class="flex g6"><button class="btn btn-s btn-sm" data-l="' + x.id + '">' + ic('eye', 14) + 'Rincian</button><button class="btn btn-p btn-sm" data-s="' + x.id + '">' + ic('stamp', 14) + 'Stempel</button></div>' : '<a class="btn btn-p btn-sm" href="#/laporan/input?periode=' + x.p + '">Input laporan</a>') + '</div>';
        }).join('') + '</div></div>';
      $('#selY').onchange = function () { App.ke('#/laporan/riwayat?y=' + this.value); };
      el.onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.l) Hal.detailLaporan(b.dataset.l);
        if (b.dataset.s) Hal.stempel(b.dataset.s);
        if (b.dataset.r) Hal.ajukanRevisi(b.dataset.r);
        if (b.dataset.a === 'xls' || b.dataset.a === 'pdf') Ekspor.arsip(b.dataset.a, u, y, rows, b);
      };
    }
    render();
    Store.muat(y).then(function () { if (App.rute().tab === 'riwayat') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', function () { if (App.rute().tab === 'riwayat') render(); }));
    if (r.q.id) setTimeout(function () { Hal.detailLaporan(r.q.id); }, 50);
  }

  /* ======================== REVISI (Puskesmas) ======================== */
  function tabRevisi(el) {
    var S = App.S, u = S.user.unit;
    function render(j) {
      var list = (j && j.list) || null;
      el.innerHTML = '<div class="ph"><div><h1>Laporan Saya</h1><p>Ajukan revisi bila ada koreksi data. Ketepatan lapor tetap mengikuti pengiriman pertama.</p></div><div class="ph-act"><button class="btn btn-p" data-a="baru">' + ic('plus', 16) + 'Ajukan Revisi</button></div></div>' +
        App.tabBar('laporan', 'revisi', { revisi: list ? list.filter(function (x) { return x.status === 'Diajukan' || x.status === 'Disetujui'; }).length : '' }) +
        '<div class="card p0">' + (list === null ? '<div style="padding:18px">' + UI.skel(48, 3) + '</div>' : list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Periode</th><th>Alasan</th><th>Diajukan</th><th>Status</th><th>Catatan Admin</th><th class="right">Aksi</th></tr></thead><tbody>' + list.map(function (x) {
          return '<tr><td><b>' + INTI.labelBulan(x.periode) + '</b><div class="fs11 mut mono">' + esc(x.laporan) + '</div></td><td style="max-width:360px">' + esc(x.alasan) + '</td><td class="nowrap">' + INTI.fmtTgl(x.diajukan, true) + '</td><td>' + UI.badge(x.status, x.status === 'Diajukan' ? 'info' : x.status === 'Ditolak' ? 'bad' : x.status === 'Disetujui' ? 'warn' : 'ok') + '</td><td class="fs12 mut">' + esc(x.catatan || '–') + (x.diputuskan ? '<div class="fs11">' + INTI.fmtTgl(x.diputuskan, true) + '</div>' : '') + '</td><td class="right">' + (x.status === 'Disetujui' ? '<a class="btn btn-p btn-xs" href="#/laporan/input?periode=' + x.periode + '">Isi ulang</a>' : '<button class="btn btn-g btn-xs" data-l="' + x.laporan + '">Lihat</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : UI.kosong('Belum ada pengajuan revisi', 'Pengajuan yang Anda buat akan tampil di sini beserta keputusan Admin.', 'compare')) + '</div>';
      el.onclick = function (e) {
        var b = e.target.closest('[data-a],[data-l]'); if (!b) return;
        if (b.dataset.a === 'baru') Hal.ajukanRevisi(null);
        if (b.dataset.l) Hal.detailLaporan(b.dataset.l);
      };
    }
    var s = Store.ambil('revisi', 'revisi.list', {}, { paksa: true });
    render(s.cache);
    s.p.then(render, function (e) { UI.toast(e.message, 'bad'); render({ list: [] }); });
    App.ikat(Bus.on('swr:revisi', render));
  }

  Hal.laporan = function (el, r) {
    if (r.tab === 'riwayat') tabRiwayat(el, r);
    else if (r.tab === 'revisi') tabRevisi(el, r);
    else tabInput(el, r);
  };

  /* ======================== MODAL BERSAMA ======================== */
  Hal.ajukanRevisi = function (id) {
    var S = App.S, u = S.user.unit, W = S.wajib;
    var ys = App.tahunDari(INTI.geser(W, -23), W), ix = Store.ix(ys);
    var opsi = ix.HL.filter(function (h) { return h.u === u && h.st === 'Terkirim'; }).sort(function (a, b) { return a.p < b.p ? 1 : -1; });
    if (!opsi.length) { UI.toast('Belum ada laporan terkirim yang dapat direvisi.', 'info'); return; }
    UI.modal({ judul: 'Ajukan Revisi Laporan', ikon: 'compare', ukuran: 'sm',
      isi: '<label class="fld"><span>Laporan</span><select class="sel" id="rvId">' + opsi.map(function (h) { return '<option value="' + h.id + '"' + (h.id === id ? ' selected' : '') + '>' + INTI.labelBulan(h.p) + ' — v' + h.v + ' (' + (h.j === 'N' ? 'Nihil' : h.tt + ' kasus') + ')</option>'; }).join('') + '</select></label>' +
        '<label class="fld"><span>Alasan revisi</span><textarea class="inp" id="rvAl" maxlength="1000" placeholder="Jelaskan koreksi yang diperlukan, mis. salah input umur kasus DBD 1-4 th L dari 12 menjadi 4."></textarea><small>Minimal 10 karakter. Admin Dinkes akan menyetujui atau menolak.</small></label>' +
        '<div class="note soft fs12">' + ic('info', 16) + '<div>Setelah disetujui, laporan dibuka untuk diisi ulang. Versi lama tetap tersimpan dan <b>status ketepatan tidak berubah</b>.</div></div>',
      tombol: [{ label: 'Batal' }, { label: 'Kirim Pengajuan', kelas: 'btn-p', ikon: 'send', aksi: function (m) {
        var al = $('#rvAl', m.el).value.trim();
        if (al.length < 10) { UI.toast('Alasan minimal 10 karakter.', 'bad'); return false; }
        return API.wajib('revisi.ajukan', { id: $('#rvId', m.el).value, alasan: al }).then(function (j) { UI.toast(j.message); Store.lupa('revisi'); if (App.rute().tab === 'revisi') App.jalankan(); });
      } }] });
  };

  Hal.putuskanRevisi = function (id, keputusan, btn) {
    var setuju = keputusan === 'Disetujui';
    return UI.konfirmasi({ judul: setuju ? 'Setujui Revisi' : 'Tolak Revisi', ikon: setuju ? 'checkc' : 'x', bahaya: !setuju, ya: setuju ? 'Setujui' : 'Tolak',
      pesan: setuju ? 'Laporan akan dibuka agar puskesmas dapat mengisi ulang. Ketepatan lapor tidak berubah.' : 'Pengajuan ditolak dan laporan tetap seperti semula.',
      extra: '<label class="fld mt12"><span>Catatan ' + (setuju ? '(opsional)' : '(wajib)') + '</span><textarea class="inp" id="rvCat" maxlength="500"></textarea></label>',
      ambil: function (m) { var c = $('#rvCat', m.el).value.trim(); if (!setuju && c.length < 5) { UI.toast('Isi catatan alasan penolakan.', 'bad'); return false; } return { catatan: c }; } })
      .then(function (ok) {
        if (!ok) return;
        UI.sibuk(btn, true);
        return API.wajib('revisi.putuskan', { id: id, keputusan: keputusan, catatan: ok.catatan }).then(function (j) {
          if (j.h) Store.patch(j.y, j.h, null, j.ver);
          Store.lupa('revisi'); UI.toast(j.message);
        }, function (e) { UI.toast(e.message, 'bad'); }).then(function () { UI.sibuk(btn, false); });
      });
  };

  Hal.menuAdminLaporan = function (anchor, id) {
    var h = hdrDari(id); if (!h) return;
    var items = [['detail', 'eye', 'Lihat rincian'], ['stempel', 'stamp', 'Stempel Digital']];
    if (h.st !== 'Dibuka untuk Revisi' && h.st !== 'Dihapus') items.push(['bukaKunci', 'unlock', 'Buka untuk revisi']);
    if (h.st !== 'Dikunci' && h.st !== 'Dihapus') items.push(['kunci', 'lock', 'Kunci laporan']);
    if (h.st === 'Dikunci') items.push(['aktifkan', 'checkc', 'Buka kunci (kembali Terkirim)']);
    if (h.st !== 'Dihapus') items.push(['hapus', 'trash', 'Hapus laporan']);
    var p = UI.pop(anchor, '<div class="pop-h"><b class="fs12">' + esc(App.namaUnit(h.u)) + ' • ' + INTI.labelBln(h.p) + '</b>' + UI.badge(h.st, warnaStatusLap(h.st)) + '</div>' + items.map(function (x) { return '<button class="menu-i' + (x[0] === 'hapus' ? ' bad' : '') + '" data-m="' + x[0] + '">' + ic(x[1]) + x[2] + '</button>'; }).join(''), { lebar: 260 });
    p.onclick = function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return; UI.tutupPop();
      var m = b.dataset.m;
      if (m === 'detail') return Hal.detailLaporan(id);
      if (m === 'stempel') return Hal.stempel(id);
      var label = { bukaKunci: 'Buka untuk revisi', kunci: 'Kunci laporan', aktifkan: 'Buka kunci', hapus: 'Hapus laporan' }[m];
      UI.konfirmasi({ judul: label, bahaya: m === 'hapus', ikon: m === 'hapus' ? 'trash' : 'lock', ya: label,
        pesan: (m === 'hapus' ? 'Data kasus laporan ini dihapus dari rekap. <b>Catatan ketepatan lapor tetap tersimpan</b> dan puskesmas dapat mengirim ulang.' : m === 'bukaKunci' ? 'Puskesmas dapat mengisi ulang laporan ini (versi baru). Ketepatan tidak berubah.' : m === 'kunci' ? 'Laporan dikunci final: puskesmas tidak dapat mengajukan revisi.' : 'Status laporan kembali Terkirim.') ,
        extra: '<label class="fld mt12"><span>Catatan (opsional, dikirim ke puskesmas)</span><input class="inp" id="admCat" maxlength="300"></label>', ambil: function (mm) { return { c: $('#admCat', mm.el).value }; } })
        .then(function (ok) {
          if (!ok) return;
          API.wajib('laporan.admin', { id: id, aksi: m, catatan: ok.c }).then(function (j) { Store.patch(j.y, j.h, m === 'hapus' ? [] : null, j.ver); UI.toast(j.message); }, function (e) { UI.toast(e.message, 'bad'); });
        });
    };
  };

  /* Detail laporan: rincian 24 kolom, riwayat versi (dengan perbandingan), revisi */
  Hal.detailLaporan = function (id) {
    var f = idInfo(id);
    Store.muat(f.y).then(function () {
      var h = hdrDari(id);
      if (!h) { UI.toast('Laporan tidak ditemukan.', 'bad'); return; }
      var det = detailDari(id), S = App.S;
      var pen = S.penyakit.filter(function (p) { return det[p.kode]; });
      var tabel = h.st === 'Dihapus' ? '<div class="note bad">' + ic('trash', 18) + '<div>Laporan ini telah dihapus Admin. Catatan ketepatan tetap tersimpan.</div></div>' : !pen.length ? '<div class="note soft">' + ic('ban', 18) + '<div>Laporan <b>Nihil</b> — tidak ada kasus untuk seluruh penyakit.</div></div>' :
        '<div class="tbl-wrap" style="max-height:46vh;border:1px solid var(--line);border-radius:12px"><table class="mx"><thead><tr><th class="stk" rowspan="2" style="min-width:180px">Penyakit</th>' + UMUR.map(function (g) { return '<th colspan="2" class="bl">' + g.label + '</th>'; }).join('') + '<th rowspan="2" class="bl">L</th><th rowspan="2">P</th><th rowspan="2">Total</th></tr><tr>' + UMUR.map(function () { return '<th class="bl">L</th><th>P</th>'; }).join('') + '</tr></thead><tbody>' +
        pen.map(function (p) { var v = det[p.kode], s = INTI.jumlahLP(v); return '<tr><td class="stk"><b>' + esc(p.nama) + '</b></td>' + v.map(function (x, i) { return '<td class="' + (i % 2 ? '' : 'bl ') + (x ? '' : 'z') + '">' + x + '</td>'; }).join('') + '<td class="bl tot">' + s.L + '</td><td class="tot">' + s.P + '</td><td class="tot">' + s.T + '</td></tr>'; }).join('') + '</tbody></table></div>';
      var info = [['Puskesmas', App.namaUnit(h.u)], ['Periode', INTI.labelBulan(h.p)], ['ID Laporan', '<span class="mono">' + h.id + '</span>'], ['Tenggat', INTI.fmtTglJam(h.tg || INTI.tenggat(h.p, S.set))], ['Kirim pertama', INTI.fmtTglJam(h.kp)], ['Kirim terakhir', INTI.fmtTglJam(h.kl)],
        ['Ketepatan', UI.badgeStatus(h.kt === 'T' ? 'TEPAT' : 'TERLAMBAT', h.hr) + (h.sb === 'Historis' ? ' <span class="fs11 mut">historis</span>' : '')], ['Versi', 'v' + h.v], ['Status', UI.badge(h.st, warnaStatusLap(h.st))], ['Jenis', h.j === 'N' ? 'Nihil' : 'Berisi kasus'], ['Total', '<b>' + A(h.tt) + '</b> (L ' + A(h.tl) + ', P ' + A(h.tp) + ')']];
      var m = UI.modal({ judul: 'Laporan ' + INTI.labelBulan(h.p), sub: App.namaUnit(h.u), ikon: 'file', ukuran: 'xl',
        isi: '<div class="stp-grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">' + info.map(function (x) { return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div>' + tabel + '<div id="dVersi">' + UI.skel(40, 2) + '</div>',
        tombol: [{ label: 'Excel', ikon: 'sheet', aksi: function (mm, b) { Ekspor.laporanTunggal('xlsx', h, det, b); return false; } }, { label: 'PDF', ikon: 'printer', aksi: function (mm, b) { Ekspor.laporanTunggal('pdf', h, det, b); return false; } }]
          .concat(App.isPkm() && h.st === 'Terkirim' ? [{ label: 'Ajukan Revisi', ikon: 'compare', aksi: function () { Hal.ajukanRevisi(id); } }] : [])
          .concat([{ label: 'Stempel Digital', kelas: 'btn-p', ikon: 'stamp', aksi: function () { Hal.stempel(id); } }]) });
      var s = Store.ambil('lap_' + id, 'laporan.get', { id: id }, { ttl: 60000 });
      var isiVersi = function (j) {
        var d = $('#dVersi', m.el); if (!d) return;
        var vs = j.versi.slice().reverse();
        d.innerHTML = '<div class="card-t" style="margin-bottom:8px">' + ic('history', 18) + 'Riwayat versi</div><div class="tbl-wrap" style="border:1px solid var(--line);border-radius:12px"><table class="tbl"><thead><tr><th>Versi</th><th>Waktu kirim</th><th>Oleh</th><th class="num">Total</th><th>Keterangan</th><th class="right">Aksi</th></tr></thead><tbody>' +
          vs.map(function (v, i) { return '<tr><td><b>v' + v.v + '</b>' + (i === 0 ? ' <span class="badge b-ok b-sm">terbaru</span>' : '') + '</td><td class="nowrap">' + INTI.fmtTgl(v.waktu, true) + '</td><td>' + esc(v.oleh) + '</td><td class="num">' + (v.jenis === 'Nihil' ? 'Nihil' : A(v.T)) + '</td><td class="fs12 mut">' + esc(v.catatan) + '</td><td class="right"><div class="aksi"><button data-sv="' + v.v + '" title="Stempel versi ini" aria-label="Stempel">' + ic('stamp') + '</button>' + (v.v > 1 ? '<button data-diff="' + v.v + '" title="Bandingkan dengan versi sebelumnya" aria-label="Bandingkan">' + ic('compare') + '</button>' : '') + '</div></td></tr>'; }).join('') + '</tbody></table></div>' +
          (j.revisi && j.revisi.length ? '<div class="card-t mt16" style="margin-bottom:8px">' + ic('compare', 18) + 'Pengajuan revisi</div>' + j.revisi.map(function (r) { return '<div class="note soft fs12 mt8">' + ic('compare', 16) + '<div><b>' + esc(r.status) + '</b> • ' + INTI.fmtTgl(r.diajukan, true) + ' — ' + esc(r.alasan) + (r.catatan ? '<br><i>Catatan admin: ' + esc(r.catatan) + '</i>' : '') + '</div></div>'; }).join('') : '') + '<div id="dDiff"></div>';
        d.onclick = function (e) {
          var b = e.target.closest('button'); if (!b) return;
          if (b.dataset.sv) Hal.stempel(id, +b.dataset.sv);
          if (b.dataset.diff) {
            var v2 = j.versi.filter(function (x) { return x.v === +b.dataset.diff; })[0], v1 = j.versi.filter(function (x) { return x.v === +b.dataset.diff - 1; })[0];
            var kode = {}; Object.keys(v1.data).concat(Object.keys(v2.data)).forEach(function (k) { kode[k] = 1; });
            var baris = [];
            Object.keys(kode).sort().forEach(function (k) {
              var a = v1.data[k] || INTI.nol24(), bb = v2.data[k] || INTI.nol24();
              for (var i = 0; i < 24; i++) if (a[i] !== bb[i]) baris.push('<tr><td>' + esc(App.namaPenyakit(k)) + '</td><td>' + UMUR[Math.floor(i / 2)].panjang + ' ' + (i % 2 ? 'P' : 'L') + '</td><td class="num bad-tx">' + a[i] + '</td><td class="num ok-tx"><b>' + bb[i] + '</b></td><td class="num">' + (bb[i] - a[i] > 0 ? '+' : '') + (bb[i] - a[i]) + '</td></tr>');
            });
            $('#dDiff', d).innerHTML = '<div class="card-t mt16" style="margin-bottom:8px">Perubahan v' + v1.v + ' → v' + v2.v + '</div>' + (baris.length ? '<div class="tbl-wrap" style="border:1px solid var(--line);border-radius:12px"><table class="tbl"><thead><tr><th>Penyakit</th><th>Kelompok</th><th class="num">Sebelum</th><th class="num">Sesudah</th><th class="num">Selisih</th></tr></thead><tbody>' + baris.join('') + '</tbody><tfoot><tr><td colspan="2">Total kasus</td><td class="num">' + v1.T + '</td><td class="num">' + v2.T + '</td><td class="num">' + (v2.T - v1.T > 0 ? '+' : '') + (v2.T - v1.T) + '</td></tr></tfoot></table></div>' : '<div class="note soft fs12">' + ic('info', 16) + 'Tidak ada perubahan isi.</div>');
          }
        };
      };
      if (s.cache) isiVersi(s.cache);
      s.p.then(isiVersi, function (e) { var d = $('#dVersi', m.el); if (d) d.innerHTML = '<div class="note bad fs12">' + esc(e.message) + '</div>'; });
    }, function (e) { UI.toast(e.message, 'bad'); });
  };

  /* Stempel Digital: bukti pengesahan ber-QR (HMAC) — unduh PDF/PNG, bagikan */
  Hal.stempel = function (id, versi, opt) {
    opt = opt || {};
    var f = idInfo(id);
    Store.muat(f.y).then(function () {
      var h = hdrDari(id); if (!h) { UI.toast('Laporan tidak ditemukan.', 'bad'); return; }
      var info = { id: id, unit: App.namaUnit(h.u), periode: INTI.labelBulan(h.p), versi: versi || h.v, ketepatan: h.kt === 'T' ? 'TEPAT WAKTU' : 'TERLAMBAT +' + h.hr + ' HARI', tepat: h.kt === 'T', kirimPertama: h.kp, L: h.tl, P: h.tp, T: h.tt, nihil: h.j === 'N', instansi: App.S.set.NAMA_INSTANSI || 'DINAS KESEHATAN KAB. MINAHASA SELATAN', oleh: '' };
      var m = UI.modal({ judul: opt.baru ? 'Laporan berhasil dikirim & distempel' : 'Stempel Digital', sub: 'Bukti pengesahan elektronik ESTEPEL', ikon: 'stamp', tile: 't-grn', ukuran: 'lg', isi: '<div id="stpIsi">' + UI.skel(260) + '</div>',
        tombol: [{ label: 'Salin tautan', ikon: 'copy', aksi: function () { if (info.url) { (navigator.clipboard ? navigator.clipboard.writeText(info.url) : Promise.reject()).then(function () { UI.toast('Tautan verifikasi disalin.'); }, function () { prompt('Salin tautan verifikasi:', info.url); }); } return false; } },
          { label: 'Bagikan', ikon: 'share', aksi: function (mm, b) { if (info.sig) Ekspor.bagikanStempel(info, b); return false; } },
          { label: 'Gambar', ikon: 'image', aksi: function (mm, b) { if (info.sig) Ekspor.stempelPNG(info, b); return false; } },
          { label: 'Unduh PDF', kelas: 'btn-p', ikon: 'download', aksi: function (mm, b) { if (info.sig) Ekspor.stempelPDF(info, b); return false; } }] });
      function tampil(v) {
        info.versi = v.v; info.waktu = v.waktu; info.sig = v.sig; info.oleh = v.oleh; info.T = v.T; info.L = v.L; info.P = v.P; info.nihil = v.jenis === 'Nihil';
        info.url = new URL('verify.html?id=' + encodeURIComponent(id) + '&v=' + v.v + '&s=' + encodeURIComponent(v.sig), location.href.split('#')[0]).href;
        var w = $('#stpIsi', m.el); if (!w) return;
        w.innerHTML = '<div class="stp"><div class="stp-h"><div class="logo">' + ic('stamp', 22) + '</div><div style="flex:1"><div class="fs11 mut" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">Pemerintah ' + esc(App.S.set.NAMA_KABUPATEN || 'Kabupaten Minahasa Selatan') + '</div><b style="font:700 15px var(--fh)">' + esc(info.instansi) + '</b><div class="fs12 p-tx fw6">Tanda Terima &amp; Pengesahan Laporan STP Elektronik (ESTEPEL)</div></div><span class="badge ' + (info.tepat ? 'b-ok' : 'b-warn') + '">' + info.ketepatan + '</span></div>' +
          '<div class="stp-grid"><div><span>Nomor laporan</span><b class="mono">' + esc(id) + ' • v' + info.versi + '</b></div><div><span>Puskesmas pelapor</span><b>' + esc(info.unit) + '</b></div><div><span>Periode laporan</span><b>' + esc(info.periode) + '</b></div><div><span>Waktu kirim versi ini</span><b>' + INTI.fmtTglJam(info.waktu) + '</b></div><div><span>Kirim pertama (dasar ketepatan)</span><b>' + INTI.fmtTglJam(info.kirimPertama) + '</b></div><div><span>Ringkasan kasus</span><b>' + (info.nihil ? 'NIHIL' : A(info.T) + ' kasus (L ' + A(info.L) + ' • P ' + A(info.P) + ')') + '</b></div></div>' +
          '<div class="stp-seal"><svg class="seal' + (opt.baru ? ' stamp-anim' : '') + '" viewBox="0 0 120 120" style="transform:rotate(-8deg)">' + App.segel('#16A34A', '#4ADE80') + '</svg><div style="flex:1;min-width:200px"><div class="flex g6 ok-tx fw7 fs12" style="letter-spacing:.06em">' + ic('verified', 16) + 'TERVERIFIKASI SISTEM ESTEPEL</div><div class="fs12 mut mt8">Laporan tercatat resmi di basis data ' + esc(info.instansi) + '. Pindai QR untuk memverifikasi keaslian — tanpa cap basah.</div><div class="mono fs11 mt8">HMAC: ' + esc(info.sig.slice(0, 16)) + '…</div></div><div class="qr" id="qrBox"><span class="spin dk"></span></div></div></div>';
        Ekspor.qrSvg(info.url).then(function (svg) { var q = $('#qrBox', m.el); if (q) q.innerHTML = svg; }, function () { var q = $('#qrBox', m.el); if (q) q.innerHTML = '<div class="fs11 mut center">QR gagal dimuat (luring)</div>'; });
      }
      var s = Store.ambil('lap_' + id, 'laporan.get', { id: id }, { ttl: 60000, paksa: !!opt.baru });
      var pilih = function (j) { var v = j.versi.filter(function (x) { return x.v === (versi || h.v); })[0] || j.versi[j.versi.length - 1]; if (v) tampil(v); };
      if (s.cache && !opt.baru) pilih(s.cache);
      s.p.then(pilih, function (e) { var w = $('#stpIsi', m.el); if (w) w.innerHTML = '<div class="note bad">' + esc(e.message) + '</div>'; });
    });
  };
})();
