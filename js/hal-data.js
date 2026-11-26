/* =====================================================================
 * ESTEPEL — Data & Rekap (F6, F7): Matriks Unit × Penyakit, Rincian Umur,
 * Rekap per Penyakit (format resmi Rekapitulasi STP Kabupaten) + dialog ekspor.
 * Filter dihitung di browser dari cube (instan); ekspor resmi dihitung server.
 * ===================================================================== */
(function () {
  'use strict';
  var ic = UI.ic, esc = UI.esc, A = UI.A, $ = UI.$, $$ = UI.$$, UMUR = INTI.UMUR;
  var F = null;
  function filter() {
    if (!F) F = { dari: App.S.gp.dari, sampai: App.S.gp.sampai, umur: -1, kat: '', units: [], view: 'LP', tukar: false, q: '', pk: '', rinci: false, grafik: 'batang', perUnit: window.innerWidth < 768 };
    return F;
  }
  function ys() { return App.tahunDari(F.dari, F.sampai); }
  function unitsF() { return F.units.length ? F.units : App.unitsAktif().map(function (u) { return u.kode; }); }
  function kepala(aksi) {
    return '<div class="ph"><div><div class="crumb">Data &amp; Analisis ' + ic('right', 12) + ' <b>Data &amp; Rekap</b></div><h1>Data &amp; Rekap Surveilans</h1><p>Rekapitulasi ' + App.unitsAktif().length + ' puskesmas × ' + App.S.penyakit.filter(function (p) { return p.aktif; }).length + ' penyakit dengan rincian 12 kelompok umur dan jenis kelamin.</p></div><div class="ph-act">' + (aksi || '') + '</div></div>';
  }
  function barFilter(opsi) {
    opsi = opsi || {};
    var kats = []; App.S.penyakit.forEach(function (p) { if (p.kategori && kats.indexOf(p.kategori) < 0) kats.push(p.kategori); });
    return '<div class="card flex col g6"><div class="flex wrap">' +
      '<button class="tb-per" id="fPer">' + ic('cal', 16) + '<span>' + INTI.labelRentang(F.dari, F.sampai) + '</span>' + ic('down', 14) + '</button>' +
      '<button class="tb-per" id="fUnit">' + ic('building', 16) + '<span>' + (F.units.length ? F.units.length + ' puskesmas' : 'Seluruh kabupaten') + '</span>' + ic('down', 14) + '</button>' +
      (opsi.umur ? '<select class="sel sm" id="fUmur" style="width:auto"><option value="-1">Semua kelompok umur</option>' + UMUR.map(function (u, i) { return '<option value="' + i + '"' + (F.umur === i ? ' selected' : '') + '>' + u.panjang + '</option>'; }).join('') + '</select>' : '') +
      (opsi.pk ? '<select class="sel sm" id="fPk" style="width:auto;max-width:220px"><option value="">Semua penyakit</option>' + App.S.penyakit.map(function (p) { return '<option value="' + p.kode + '"' + (F.pk === p.kode ? ' selected' : '') + '>' + esc(p.nama) + '</option>'; }).join('') + '</select>' : '') +
      (opsi.cari ? '<div class="inp-ic sm" style="width:230px">' + ic('search', 16) + '<input class="inp" id="fQ" placeholder="' + opsi.cari + '" value="' + esc(F.q) + '"></div>' : '') +
      (opsi.alat || '') + '</div>' +
      (opsi.kat && kats.length ? '<div class="flex g6" style="min-width:0"><span class="lbl">Kategori:</span><div class="chips" style="min-width:0;flex:1"><button class="chip' + (!F.kat ? ' on' : '') + '" data-kat="">Semua</button>' + kats.map(function (k) { return '<button class="chip' + (F.kat === k ? ' on' : '') + '" data-kat="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div></div>' : '') + '</div>';
  }
  function pilihUnit(onOk) {
    var sel = {}; F.units.forEach(function (u) { sel[u] = 1; });
    UI.modal({ judul: 'Pilih Puskesmas', ikon: 'building', ukuran: 'sm', isi: '<div class="flex between"><button class="lnk" data-sm="1">Pilih semua</button><button class="lnk" data-sm="0">Kosongkan (= seluruh kabupaten)</button></div><div class="flex col g6" style="max-height:50vh;overflow:auto">' + App.S.units.map(function (u) {
      return '<label class="chk" style="padding:8px;border-radius:8px;background:var(--soft)"><input type="checkbox" value="' + u.kode + '"' + (sel[u.kode] ? ' checked' : '') + '>' + esc('Puskesmas ' + u.nama) + (u.aktif ? '' : ' <span class="badge b-muted b-sm">nonaktif</span>') + '</label>';
    }).join('') + '</div>', onBuka: function (m) { m.el.addEventListener('click', function (e) { var b = e.target.closest('[data-sm]'); if (b) $$('input[type=checkbox]', m.el).forEach(function (c) { c.checked = b.dataset.sm === '1'; }); }); },
      tombol: [{ label: 'Batal' }, { label: 'Terapkan', kelas: 'btn-p', aksi: function (m) { var a = $$('input:checked', m.el).map(function (c) { return c.value; }); F.units = a.length === App.S.units.length ? [] : a; onOk(); } }] });
  }
  function pasangFilter(render) {
    var p = $('#fPer'); if (p) p.onclick = function () { App.pemilihPeriode(this, { nilai: { dari: F.dari, sampai: F.sampai }, kiri: true, onPilih: function (v) { F.dari = v.dari; F.sampai = v.sampai; Store.muatBanyak(ys()).then(render, function (e) { UI.toast(e.message, 'bad'); }); render(); } }); };
    var u = $('#fUnit'); if (u) u.onclick = function () { pilihUnit(render); };
    var um = $('#fUmur'); if (um) um.onchange = function () { F.umur = +this.value; render(); };
    var pk = $('#fPk'); if (pk) pk.onchange = function () { F.pk = this.value; render(); };
    var q = $('#fQ'); if (q) { var deb = UI.debounce(function (v) { F.q = v; render(); var i = $('#fQ'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 160); q.oninput = function () { deb(this.value); }; }
    $$('[data-kat]').forEach(function (c) { c.onclick = function () { F.kat = c.dataset.kat; render(); }; });
  }
  function penyakitKolom(m) {
    var urutKat = [];
    App.S.penyakit.forEach(function (p) { var k = p.kategori || 'Lainnya'; if (urutKat.indexOf(k) < 0) urutKat.push(k); });
    return App.S.penyakit.filter(function (p) { return (p.aktif || (m.penyakit[p.kode] && m.penyakit[p.kode].T)) && (!F.kat || p.kategori === F.kat); })
      .sort(function (a, b) { return urutKat.indexOf(a.kategori || 'Lainnya') - urutKat.indexOf(b.kategori || 'Lainnya') || a.urutan - b.urutan; });
  }
  function kelasHeat(v, mx) { if (!v) return 'z'; return 'h' + Math.max(1, Math.min(5, Math.ceil(v / mx * 5))); }

  /* ======================== MATRIKS ======================== */
  function tabMatriks(el, r) {
    if (r.q.u) F.units = [r.q.u];
    var sel = null;
    function render() {
      var ix = Store.ix(ys()), units = unitsF(), m = INTI.matriks(ix, { dari: F.dari, sampai: F.sampai, units: units }, F.umur < 0 ? null : F.umur);
      var pen = penyakitKolom(m), q = F.q.toLowerCase();
      if (q) {
        var cocokU = units.filter(function (u) { return App.namaUnit(u).toLowerCase().indexOf(q) > -1; });
        if (cocokU.length) units = cocokU; else pen = pen.filter(function (p) { return (p.nama + ' ' + p.kode).toLowerCase().indexOf(q) > -1; });
      }
      var mx = 1;
      units.forEach(function (u) { pen.forEach(function (p) { var c = (m.m[u] || {})[p.kode]; if (c) mx = Math.max(mx, F.view === 'T' ? c.T : Math.max(c.L, c.P)); }); });
      var sub = F.view === 'LP' ? ['L', 'P'] : F.view === 'T' ? ['T'] : ['L', 'P', 'T'];
      var kel = INTI.kelengkapan(ix, units, F.dari, F.sampai);
      var tabel;
      if (F.perUnit) {
        tabel = '<div class="flex col g6" style="padding:12px">' + units.map(function (u) {
          var t = m.unit[u] || { L: 0, P: 0, T: 0 }, isi = pen.filter(function (p) { return (m.m[u] || {})[p.kode]; });
          return '<details class="acc"><summary class="acc-h" style="list-style:none"><div class="flex between"><b>' + esc(App.namaUnit(u)) + '</b><span class="badge b-vio">' + A(t.T) + ' kasus</span></div><div class="fs11 mut">L ' + A(t.L) + ' • P ' + A(t.P) + ' • ' + isi.length + ' penyakit</div></summary><div style="padding:0 14px 14px">' +
            (isi.length ? isi.map(function (p) { var c = m.m[u][p.kode]; return '<div class="age-row c" data-c="' + u + '|' + p.kode + '"><span class="fs12 fw6">' + esc(p.nama) + '</span><span class="fs12 tnum">L <b>' + c.L + '</b> • P <b>' + c.P + '</b> • <b class="p-tx">' + c.T + '</b></span></div>'; }).join('') : '<div class="fs12 mut">Tidak ada kasus.</div>') + '</div></details>';
        }).join('') + '</div>';
      } else if (!F.tukar) {
        var kats = [], kc = {};
        pen.forEach(function (p) { var k = p.kategori || 'Lainnya'; if (!kc[k]) { kc[k] = 0; kats.push(k); } kc[k]++; });
        var h0 = '<tr><th class="stk" rowspan="3" style="min-width:210px;top:0">Puskesmas</th>' + kats.map(function (k) { return '<th class="bl" colspan="' + kc[k] * sub.length + '" style="top:0;height:30px;color:var(--p);background:var(--vio-bg)">' + esc(k) + '</th>'; }).join('') + '<th class="bl" colspan="3" rowspan="2" style="top:0;background:var(--p);color:#fff">Total Puskesmas</th></tr>';
        var h1 = '<tr>' + pen.map(function (p) { return '<th class="bl" colspan="' + sub.length + '" style="top:30px;height:38px;white-space:normal;min-width:' + (sub.length * 40) + 'px;max-width:150px;line-height:1.2" title="' + esc(p.nama) + '">' + (p.klb ? '<span style="color:var(--bad)">●</span> ' : '') + esc(p.nama) + '</th>'; }).join('') + '</tr>';
        var h2 = '<tr>' + pen.map(function () { return sub.map(function (s, i) { return '<th class="' + (i ? '' : 'bl') + '" style="top:68px">' + s + '</th>'; }).join(''); }).join('') + '<th class="bl" style="top:68px">L</th><th style="top:68px">P</th><th style="top:68px">Total</th></tr>';
        var blm = {}, nBln = INTI.daftarPeriode(F.dari, F.sampai).length;
        kel.belum.forEach(function (b) { blm[b.u] = (blm[b.u] || 0) + 1; });
        var body = units.map(function (u) {
          var t = m.unit[u] || { L: 0, P: 0, T: 0 };
          return '<tr><td class="stk"><div class="flex g6"><b class="ell">' + esc(App.namaUnit(u)) + '</b>' + (blm[u] ? '<span class="badge b-bad b-sm" title="Angka 0 karena laporan belum masuk">' + (nBln > 1 ? blm[u] + ' bln belum' : 'Belum lapor') + '</span>' : '') + '</div></td>' + pen.map(function (p) {
            var c = (m.m[u] || {})[p.kode] || { L: 0, P: 0, T: 0 };
            return sub.map(function (s, i) { var v = c[s]; return '<td class="c ' + (i ? '' : 'bl ') + kelasHeat(v, mx) + (sel === u + '|' + p.kode ? ' sel' : '') + '" data-c="' + u + '|' + p.kode + '" title="' + esc(App.namaPendek(u) + ' • ' + p.nama + ' ' + s + ': ' + v) + '">' + v + '</td>'; }).join('');
          }).join('') + '<td class="bl tot">' + A(t.L) + '</td><td class="tot">' + A(t.P) + '</td><td class="tot p-tx">' + A(t.T) + '</td></tr>';
        }).join('');
        var tt = { L: 0, P: 0, T: 0 }; units.forEach(function (u) { var t = m.unit[u]; if (t) { tt.L += t.L; tt.P += t.P; tt.T += t.T; } });
        var foot = '<tr><td class="stk">TOTAL KABUPATEN</td>' + pen.map(function (p) { var c = { L: 0, P: 0, T: 0 }; units.forEach(function (u) { var x = (m.m[u] || {})[p.kode]; if (x) { c.L += x.L; c.P += x.P; c.T += x.T; } }); return sub.map(function (s, i) { return '<td class="' + (i ? '' : 'bl') + '">' + A(c[s]) + '</td>'; }).join(''); }).join('') + '<td class="bl">' + A(tt.L) + '</td><td>' + A(tt.P) + '</td><td style="background:var(--p);color:#fff">' + A(tt.T) + '</td></tr>';
        tabel = '<div class="mx-wrap"><table class="mx"><thead>' + h0 + h1 + h2 + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table></div>';
      } else {
        var hU = '<tr><th class="stk" rowspan="2" style="min-width:200px;top:0">Penyakit</th>' + units.map(function (u) { return '<th class="bl" colspan="' + sub.length + '" style="top:0;height:34px;white-space:normal;max-width:120px" title="' + esc(App.namaUnit(u)) + '">' + esc(App.namaPendek(u)) + '</th>'; }).join('') + '<th class="bl" colspan="3" style="top:0;background:var(--p);color:#fff">Total</th></tr>';
        var hS = '<tr>' + units.map(function () { return sub.map(function (s, i) { return '<th class="' + (i ? '' : 'bl') + '" style="top:34px">' + s + '</th>'; }).join(''); }).join('') + '<th class="bl" style="top:34px">L</th><th style="top:34px">P</th><th style="top:34px">T</th></tr>';
        var bd = pen.map(function (p) {
          var t = m.penyakit[p.kode] || { L: 0, P: 0, T: 0 };
          return '<tr><td class="stk"><b>' + esc(p.nama) + '</b></td>' + units.map(function (u) { var c = (m.m[u] || {})[p.kode] || { L: 0, P: 0, T: 0 }; return sub.map(function (s, i) { return '<td class="c ' + (i ? '' : 'bl ') + kelasHeat(c[s], mx) + '" data-c="' + u + '|' + p.kode + '">' + c[s] + '</td>'; }).join(''); }).join('') + '<td class="bl tot">' + t.L + '</td><td class="tot">' + t.P + '</td><td class="tot p-tx">' + t.T + '</td></tr>';
        }).join('');
        tabel = '<div class="mx-wrap"><table class="mx"><thead>' + hU + hS + '</thead><tbody>' + bd + '</tbody><tfoot><tr><td class="stk">TOTAL</td>' + units.map(function (u) { var t = m.unit[u] || { L: 0, P: 0, T: 0 }; return sub.map(function (s, i) { return '<td class="' + (i ? '' : 'bl') + '">' + t[s] + '</td>'; }).join(''); }).join('') + '<td class="bl">' + m.total.L + '</td><td>' + m.total.P + '</td><td style="background:var(--p);color:#fff">' + m.total.T + '</td></tr></tfoot></table></div>';
      }
      el.innerHTML = kepala('<button class="btn btn-s" data-x="pdf">' + ic('printer', 16) + 'Cetak PDF</button><button class="btn btn-p" data-x="xlsx">' + ic('sheet', 16) + 'Ekspor Excel</button>') + App.tabBar('data', 'matriks') +
        barFilter({ umur: true, kat: true, cari: 'Cari puskesmas atau penyakit...', alat: '<div class="seg ml-a">' + [['LP', 'L | P'], ['T', 'Total'], ['LPT', 'L|P|Tot']].map(function (v) { return '<button data-view="' + v[0] + '" class="' + (F.view === v[0] ? 'on' : '') + '">' + v[1] + '</button>'; }).join('') + '</div><button class="btn btn-s btn-sm" data-tukar title="Tukar sumbu">' + ic('swap', 15) + 'Tukar sumbu</button><button class="btn btn-s btn-sm" data-pu>' + ic('layers', 15) + (F.perUnit ? 'Tampilan matriks' : 'Per Puskesmas') + '</button>' }) +
        '<div class="card p0"><div class="tbl-tools"><div><div class="card-t">' + (F.tukar ? 'Penyakit × Puskesmas' : 'Puskesmas × Penyakit') + ' <span class="badge b-vio">' + INTI.labelRentang(F.dari, F.sampai) + '</span>' + (F.umur >= 0 ? ' <span class="badge b-info">Umur ' + UMUR[F.umur].panjang + '</span>' : '') + '</div><div class="card-s">Klik sel untuk rincian 24 kolom umur L/P • Kelengkapan: ' + kel.masuk + ' dari ' + kel.harus + ' laporan</div></div><div class="legend"><span><i class="h1"></i>Rendah</span><span><i class="h3"></i>Sedang</span><span><i class="h5"></i>Tinggi</span><span style="color:var(--bad)">● Potensi KLB</span></div></div>' + tabel +
        '<div class="tbl-foot"><span>' + units.length + ' puskesmas × ' + pen.length + ' penyakit</span><span class="flex g6 p-tx fw6">' + ic('verified', 15) + 'Σ L (' + A(m.total.L) + ') + Σ P (' + A(m.total.P) + ') = Total (' + A(m.total.T) + ')</span></div></div><div id="drill"></div>';
      pasangFilter(render);
      el.onclick = function (e) {
        var v = e.target.closest('[data-view]'); if (v) { F.view = v.dataset.view; render(); return; }
        if (e.target.closest('[data-tukar]')) { F.tukar = !F.tukar; F.perUnit = false; render(); return; }
        if (e.target.closest('[data-pu]')) { F.perUnit = !F.perUnit; render(); return; }
        var x = e.target.closest('[data-x]'); if (x) { Ekspor.matriks(x.dataset.x, { F: F, m: m, units: units, pen: pen, sub: sub }, x); return; }
        var c = e.target.closest('[data-c]'); if (c) { sel = c.dataset.c; drill(ix, sel); }
      };
      if (sel) drill(ix, sel);
    }
    function drill(ix, key) {
      var a = key.split('|'), u = a[0], k = a[1], v = INTI.nol24();
      INTI.saring(ix, { dari: F.dari, sampai: F.sampai, units: [u], penyakit: [k] }).forEach(function (r) { INTI.tambah24(v, r.v); });
      var s = INTI.jumlahLP(v), mx = Math.max.apply(null, v.concat([1])), p = App.S.pMap[k] || {};
      $('#drill').innerHTML = '<div class="card"><div class="card-h"><div class="flex"><div class="tile ' + (p.klb ? 't-red' : 't-vio') + '">' + ic('virus', 20) + '</div><div><div class="card-t">' + esc(App.namaPenyakit(k)) + (p.klb ? ' <span class="badge b-bad">Potensi KLB</span>' : '') + '</div><div class="card-s">' + esc(App.namaUnit(u)) + ' • ' + INTI.labelRentang(F.dari, F.sampai) + ' • Total ' + s.T + ' (L ' + s.L + ', P ' + s.P + ')</div></div></div><button class="icbtn" data-tutup-drill aria-label="Tutup">' + ic('x') + '</button></div>' +
        '<div class="g4" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">' + UMUR.map(function (g, i) { var l = v[i * 2], pp = v[i * 2 + 1], t = l + pp; return '<div style="padding:10px;border-radius:12px;background:' + (t ? (t >= mx * 0.6 ? 'var(--bad-bg)' : 'var(--vio-bg)') : 'var(--bg)') + '"><div class="fs11 fw6 ' + (t ? '' : 'mut') + '">' + g.panjang + '</div><div class="flex between mt8 fs12"><span>L <b>' + l + '</b></span><span>P <b>' + pp + '</b></span></div></div>'; }).join('') + '</div></div>';
      $('#drill [data-tutup-drill]').onclick = function () { sel = null; $('#drill').innerHTML = ''; };
      $('#drill').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    filter(); render();
    Store.muatBanyak(ys()).then(function () { if (App.rute().tab === 'matriks') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', UI.debounce(function () { if (App.rute().tab === 'matriks') render(); }, 60)));
  }

  /* ======================== RINCIAN UMUR ======================== */
  function tabUmur(el) {
    function render() {
      var ix = Store.ix(ys()), rows = INTI.saring(ix, { dari: F.dari, sampai: F.sampai, units: unitsF(), penyakit: F.pk ? [F.pk] : null }), v = INTI.nol24();
      rows.forEach(function (r) { INTI.tambah24(v, r.v); });
      var L = [], P = []; for (var i = 0; i < 12; i++) { L.push(v[i * 2]); P.push(v[i * 2 + 1]); }
      var s = INTI.jumlahLP(v), dom = UMUR.map(function (g, i) { return { g: g, t: L[i] + P[i] }; }).sort(function (a, b) { return b.t - a.t; })[0];
      var grafik = F.grafik === 'piramida' ? UI.piramida(L, P, { nama: 'rincian-umur' }) : UI.batang(UMUR.map(function (g) { return g.label; }), [{ nama: 'Laki-laki', c: '#3B82F6', v: L }, { nama: 'Perempuan', c: '#A78BFA', v: P }], { nama: 'rincian-umur', h: 260 });
      el.innerHTML = kepala('<button class="btn btn-s" data-x="pdf">' + ic('printer', 16) + 'PDF</button><button class="btn btn-p" data-x="xlsx">' + ic('sheet', 16) + 'Ekspor Excel</button>') + App.tabBar('data', 'umur') + barFilter({ pk: true }) +
        '<div class="g4">' + UI.kpi({ tile: 't-vio', ikon: 'activity', label: 'Total kasus', nilai: A(s.T) }) + UI.kpi({ tile: 't-blu', ikon: 'user', label: 'Laki-laki', nilai: A(s.L), sub: s.T ? Math.round(s.L / s.T * 100) + '%' : '' }) + UI.kpi({ tile: 't-vio', ikon: 'user', label: 'Perempuan', nilai: A(s.P), sub: s.T ? Math.round(s.P / s.T * 100) + '%' : '' }) + UI.kpi({ tile: 't-amb', ikon: 'users', label: 'Kelompok dominan', nilai: dom && dom.t ? dom.g.panjang : '–', sub: dom && dom.t && s.T ? Math.round(dom.t / s.T * 100) + '%' : '' }) + '</div>' +
        '<div class="g2" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)"><div class="card"><div class="card-h"><div><div class="card-t">Distribusi ' + (F.pk ? esc(App.namaPenyakit(F.pk)) : 'semua penyakit') + '</div><div class="card-s">' + INTI.labelRentang(F.dari, F.sampai) + ' • ' + (F.units.length ? F.units.length + ' puskesmas' : 'kabupaten') + '</div></div><div class="flex g6"><div class="seg"><button data-g="batang" class="' + (F.grafik !== 'piramida' ? 'on' : '') + '">Batang</button><button data-g="piramida" class="' + (F.grafik === 'piramida' ? 'on' : '') + '">Piramida</button></div><button class="btn btn-g btn-sm btn-ic" data-unduh-btn aria-label="Unduh grafik">' + ic('download', 16) + '</button></div></div>' + grafik + '</div>' +
        '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kelompok umur</th><th class="num">L</th><th class="num">P</th><th class="num">Total</th><th class="num">%</th></tr></thead><tbody>' + UMUR.map(function (g, i) { var t = L[i] + P[i]; return '<tr><td>' + g.panjang + '</td><td class="num">' + A(L[i]) + '</td><td class="num">' + A(P[i]) + '</td><td class="num"><b>' + A(t) + '</b></td><td class="num mut">' + (s.T ? (t / s.T * 100).toFixed(1).replace('.', ',') : '0') + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + A(s.L) + '</td><td class="num">' + A(s.P) + '</td><td class="num">' + A(s.T) + '</td><td class="num">100</td></tr></tfoot></table></div></div></div>';
      pasangFilter(render);
      el.onclick = function (e) {
        var g = e.target.closest('[data-g]'); if (g) { F.grafik = g.dataset.g; render(); return; }
        var x = e.target.closest('[data-x]'); if (x) Ekspor.umur(x.dataset.x, { F: F, L: L, P: P }, x);
      };
    }
    filter(); render();
    Store.muatBanyak(ys()).then(function () { if (App.rute().tab === 'umur') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', UI.debounce(function () { if (App.rute().tab === 'umur') render(); }, 60)));
  }

  /* ======================== REKAP PER PENYAKIT (format resmi) ======================== */
  function tabRekap(el, r) {
    if (r.q.q) F.q = r.q.q;
    function render() {
      var ix = Store.ix(ys()), units = unitsF(), rk = INTI.rekapPenyakit(ix, { dari: F.dari, sampai: F.sampai, units: units });
      var kel = INTI.kelengkapan(ix, units, F.dari, F.sampai), q = F.q.toLowerCase();
      var pen = App.S.penyakit.filter(function (p) { return p.aktif || (rk.per[p.kode] && INTI.jumlahLP(rk.per[p.kode]).T); });
      var tampil = pen.filter(function (p) { return !q || (p.nama + ' ' + p.kode).toLowerCase().indexOf(q) > -1; });
      var tot = INTI.jumlahLP(rk.total), cek = rk.total.reduce(function (a, b) { return a + b; }, 0) === tot.T;
      var top = pen.map(function (p) { return { p: p, t: rk.per[p.kode] ? INTI.jumlahLP(rk.per[p.kode]).T : 0 }; }).sort(function (a, b) { return b.t - a.t; });
      var klb = pen.filter(function (p) { return p.klb && rk.per[p.kode] && INTI.jumlahLP(rk.per[p.kode]).T; });
      var namaBelum = {}; kel.belum.forEach(function (b) { namaBelum[b.u] = 1; });
      var judulCak = F.units.length === 1 ? 'PUSKESMAS ' + App.namaPendek(F.units[0]).toUpperCase() : 'KABUPATEN';
      var head = '<tr><th rowspan="2" style="width:44px">No</th><th rowspan="2" class="stk" style="min-width:210px;left:0">Jenis Penyakit</th><th colspan="' + (F.rinci ? 24 : 12) + '" class="bl" style="background:var(--soft2);color:var(--tx)">Golongan Umur (Tahun)</th><th colspan="2" class="bl" style="background:var(--soft2);color:var(--tx)">Total</th><th rowspan="2" class="bl" style="background:var(--vio-bg);color:var(--p)">Total</th></tr><tr>' +
        (F.rinci ? UMUR.map(function (g) { return '<th class="bl">' + g.label + ' L</th><th>' + g.label + ' P</th>'; }).join('') : UMUR.map(function (g, i) { return '<th class="' + (i ? '' : 'bl') + '">' + g.label + '</th>'; }).join('')) + '<th class="bl">Laki-laki</th><th>Perempuan</th></tr>';
      var body = tampil.map(function (p, i) {
        var v = rk.per[p.kode] || INTI.nol24(), s = INTI.jumlahLP(v), sel = F.rinci ? v : UMUR.map(function (g, k) { return v[k * 2] + v[k * 2 + 1]; });
        return '<tr class="' + (p.klb && s.T ? 'klb-row' : '') + '" style="' + (p.klb && s.T ? 'background:#FFF7F7' : '') + '"><td class="center mut">' + (pen.indexOf(p) + 1) + '</td><td class="stk" style="left:0;text-align:left"><b>' + esc(p.nama) + '</b>' + (p.klb && s.T ? ' <span class="badge b-bad b-sm">KLB</span>' : '') + (!p.aktif ? ' <span class="badge b-muted b-sm">nonaktif</span>' : '') + '</td>' +
          sel.map(function (x, k) { return '<td class="' + (k === 0 ? 'bl ' : '') + (x ? '' : 'z') + '">' + A(x) + '</td>'; }).join('') + '<td class="bl">' + A(s.L) + '</td><td>' + A(s.P) + '</td><td class="bl tot p-tx">' + A(s.T) + '</td></tr>';
      }).join('');
      var tsel = F.rinci ? rk.total : UMUR.map(function (g, k) { return rk.total[k * 2] + rk.total[k * 2 + 1]; });
      var foot = '<tr><td></td><td class="stk" style="left:0;text-align:left">TOTAL KESELURUHAN</td>' + tsel.map(function (x, k) { return '<td class="' + (k ? '' : 'bl') + '">' + A(x) + '</td>'; }).join('') + '<td class="bl">' + A(tot.L) + '</td><td>' + A(tot.P) + '</td><td class="bl" style="background:var(--grad);color:#fff">' + A(tot.T) + '</td></tr>';
      var bulan = INTI.selisihBulan(F.dari, F.sampai) >= 1 ? INTI.daftarPeriode(F.dari, F.sampai) : INTI.daftarPeriode(INTI.geser(F.sampai, -11), F.sampai);
      el.innerHTML = kepala('<button class="btn btn-s" data-x="pdf">' + ic('printer', 16) + 'Ekspor PDF</button><button class="btn btn-p" data-x="xlsx">' + ic('sheet', 16) + 'Ekspor Excel Resmi</button>') + App.tabBar('data', 'rekap') +
        barFilter({ cari: 'Cari penyakit / kode...', alat: '<div class="seg ml-a"><button data-rinci="0" class="' + (!F.rinci ? 'on' : '') + '">Ringkas per umur</button><button data-rinci="1" class="' + (F.rinci ? 'on' : '') + '">Rinci L/P per umur</button></div>' }) +
        '<div class="note ' + (kel.masuk >= kel.harus ? 'ok' : 'warn') + ' fs12">' + ic(kel.masuk >= kel.harus ? 'checkc' : 'info', 16) + '<div><b>Kelengkapan laporan:</b> ' + kel.masuk + ' dari ' + kel.harus + ' laporan masuk (' + units.length + ' puskesmas × ' + INTI.daftarPeriode(F.dari, F.sampai).length + ' bulan).' + (kel.belum.length && kel.belum.length <= 8 ? ' Belum: ' + kel.belum.map(function (b) { return App.namaPendek(b.u) + (F.dari !== F.sampai ? ' (' + INTI.labelBln(b.p) + ')' : ''); }).join(', ') + '.' : '') + ' Angka 0 berarti tidak ada kasus dilaporkan.</div></div>' +
        '<div class="g4">' + UI.kpi({ tile: 't-vio', ikon: 'activity', label: 'Total kasus', nilai: A(tot.T), foot: '<span class="dt d-info">L ' + A(tot.L) + '</span><span class="dt d-p">P ' + A(tot.P) + '</span>' }) +
        UI.kpi({ tile: 't-blu', ikon: 'trophy', label: 'Peringkat 1', nilai: top[0] && top[0].t ? A(top[0].t) : '–', sub: top[0] && top[0].t ? esc(top[0].p.nama) : '' }) +
        UI.kpi({ tile: 't-red', ikon: 'siren', label: 'Potensi KLB ada kasus', nilai: String(klb.length), sub: 'penyakit', foot: klb.length ? esc(klb.map(function (p) { return p.nama; }).join(', ')) : 'Tidak ada' }) +
        UI.kpi({ tile: 't-grn', ikon: 'verified', label: 'Integritas rumus', nilai: cek ? 'Valid' : 'Selisih', warna: cek ? 'var(--ok-tx)' : 'var(--bad-tx)', foot: 'Σ umur = L + P = Total' }) + '</div>' +
        '<div class="card p0"><div class="tbl-tools" style="background:linear-gradient(90deg,#fff,var(--soft),#fff)"><div class="flex"><div class="tile" style="background:var(--navy);color:#fff">' + ic('shield', 22) + '</div><div><div class="fs11 p-tx fw7" style="letter-spacing:.06em">FORMAT RESMI</div><div style="font:700 17px var(--fh)">REKAPITULASI STP ' + esc(judulCak) + ' (' + (F.rinci ? 'RINCI PER UMUR × L/P' : 'RINGKAS PER UMUR') + ')</div><div class="fs12 mut">Instansi: ' + esc(App.S.set.NAMA_INSTANSI || '') + ' • Periode: <b style="color:var(--tx)">' + INTI.labelRentang(F.dari, F.sampai) + '</b></div></div></div></div>' +
        '<div class="mx-wrap"><table class="mx" style="--w1:0px"><thead>' + head + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table></div>' +
        '<div class="tbl-foot"><span>Menampilkan ' + tampil.length + ' dari ' + pen.length + ' penyakit</span><span>Tampilan layar = isi file Excel/PDF</span></div></div>' +
        '<div class="g2"><div class="card"><div class="card-h"><div><div class="card-t">Tren Bulanan</div><div class="card-s">' + INTI.labelRentang(bulan[0], bulan[bulan.length - 1]) + '</div></div><button class="btn btn-g btn-sm btn-ic" data-unduh-btn aria-label="Unduh grafik">' + ic('download', 16) + '</button></div>' +
        UI.area(INTI.trenBulanan(ix, { units: units }, bulan).map(function (t) { return { lb: INTI.BLN[INTI.urai(t.p).m - 1], v: t.T, tip: INTI.labelBulan(t.p) + ': ' + A(t.T) + ' kasus' }; }), { nama: 'tren-rekap' }) + '</div>' +
        '<div class="card"><div class="card-h"><div><div class="card-t">Hotspot Puskesmas</div><div class="card-s">Kasus terbanyak pada periode terpilih</div></div></div>' + (function () { var mm = INTI.matriks(ix, { dari: F.dari, sampai: F.sampai, units: units }, null); return UI.hbar(Object.keys(mm.unit).map(function (u) { return { lb: App.namaUnit(u), v: mm.unit[u].T, c: 'var(--p)' }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 7), { rank: true }); })() + '</div></div>';
      pasangFilter(render);
      el.onclick = function (e) {
        var rr = e.target.closest('[data-rinci]'); if (rr) { F.rinci = rr.dataset.rinci === '1'; render(); return; }
        var x = e.target.closest('[data-x]'); if (x) dialogEkspor(x.dataset.x);
      };
    }
    filter(); render();
    Store.muatBanyak(ys()).then(function () { if (App.rute().tab === 'rekap') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', UI.debounce(function () { if (App.rute().tab === 'rekap') render(); }, 60)));
    if (r.q.ekspor) setTimeout(function () { dialogEkspor('xlsx'); }, 80);
  }

  /* Dialog ekspor Rekapitulasi STP (PRD F7) */
  function dialogEkspor(fmt) {
    filter();
    var o = { dari: F.dari, sampai: F.sampai, units: F.units.slice(), rinci: F.rinci, perBulan: false, fmt: fmt };
    var W = App.S.wajib, y = INTI.urai(W).y;
    function namaFile() { return 'Rekap_STP_Minsel_' + (o.dari === o.sampai ? o.dari : o.dari + '_sd_' + o.sampai) + '.' + (o.fmt === 'pdf' ? 'pdf' : 'xlsx'); }
    var m = UI.modal({ judul: 'Ekspor Rekapitulasi STP', sub: 'Format resmi "REKAPITULASI STP KABUPATEN (RINGKAS PER UMUR)"', ikon: 'sheet', tile: 't-grn', ukuran: 'lg', isi: '<div id="eksIsi"></div>',
      tombol: [{ label: 'Batal' }, { label: 'Unduh', kelas: 'btn-p', ikon: 'download', aksi: function (mm, b) {
        if (o.dari > o.sampai) { UI.toast('Bulan "dari" tidak boleh lebih akhir dari bulan "sampai".', 'bad'); return false; }
        return API.wajib('rekap.ekspor', { dari: o.dari, sampai: o.sampai, units: o.units, rinci: o.rinci, perBulan: o.perBulan && o.dari !== o.sampai }).then(function (j) {
          return (o.fmt === 'pdf' ? Ekspor.rekapPDF(j, o, namaFile()) : Ekspor.rekapExcel(j, o, namaFile())).then(function () { UI.toast('File ' + namaFile() + ' diunduh.'); });
        });
      } }] });
    function opsiBln(sel, maks) { var s = ''; INTI.daftarPeriode(INTI.geser(W, -59), W).reverse().forEach(function (p) { s += '<option value="' + p + '"' + (p === sel ? ' selected' : '') + '>' + INTI.labelBulan(p) + '</option>'; }); return s; }
    function isi() {
      $('#eksIsi', m.el).innerHTML = '<div class="fld"><span>Pintasan periode</span><div class="chips"><button class="chip" data-q="wajib">' + INTI.labelBulan(W) + '</button><button class="chip" data-q="ytd">Januari – ' + INTI.BULAN[INTI.urai(W).m - 1] + ' ' + y + '</button><button class="chip" data-q="thn">Tahun ' + (INTI.urai(W).m === 12 ? y : y - 1) + '</button><button class="chip" data-q="q">Triwulan terakhir</button></div></div>' +
        '<div class="g2" style="gap:12px"><label class="fld"><span>Dari bulan</span><select class="sel" id="eDari">' + opsiBln(o.dari) + '</select></label><label class="fld"><span>Sampai bulan</span><select class="sel" id="eSampai">' + opsiBln(o.sampai) + '</select></label></div>' +
        (o.dari > o.sampai ? '<div class="note bad fs12">' + ic('siren', 16) + 'Bulan "dari" lebih akhir dari "sampai".</div>' : '<div class="note soft fs12">' + ic('info', 16) + '<div>Baris "Periode" di file: <b>' + INTI.labelRentang(o.dari, o.sampai) + '</b> • Nama file: <span class="mono">' + namaFile() + '</span></div></div>') +
        '<div class="g2" style="gap:12px"><div class="fld"><span>Cakupan</span><div class="seg"><button data-c="kab" class="' + (!o.units.length ? 'on' : '') + '">Seluruh kabupaten</button><button data-c="pilih" class="' + (o.units.length ? 'on' : '') + '">' + (o.units.length ? o.units.length + ' puskesmas' : 'Pilih puskesmas') + '</button></div></div>' +
        '<div class="fld"><span>Jenis tampilan</span><div class="seg"><button data-r="0" class="' + (!o.rinci ? 'on' : '') + '">Ringkas per umur</button><button data-r="1" class="' + (o.rinci ? 'on' : '') + '">Rinci umur × L/P</button></div></div></div>' +
        (o.fmt !== 'pdf' && o.dari !== o.sampai ? '<div class="fld"><span>Untuk rentang lebih dari satu bulan</span><div class="seg"><button data-pb="0" class="' + (!o.perBulan ? 'on' : '') + '">Satu tabel gabungan</button><button data-pb="1" class="' + (o.perBulan ? 'on' : '') + '">Gabungan + sheet per bulan</button></div></div>' : '') +
        '<div class="fld"><span>Format</span><div class="seg"><button data-f="xlsx" class="' + (o.fmt !== 'pdf' ? 'on' : '') + '">' + ic('sheet', 15) + ' Excel (.xlsx)</button><button data-f="pdf" class="' + (o.fmt === 'pdf' ? 'on' : '') + '">' + ic('printer', 15) + ' PDF</button></div></div>';
    }
    isi();
    m.el.addEventListener('change', function (e) { if (e.target.id === 'eDari') o.dari = e.target.value; if (e.target.id === 'eSampai') o.sampai = e.target.value; isi(); });
    m.el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !$('#eksIsi', m.el).contains(b)) return;
      if (b.dataset.q) { var q = b.dataset.q, yy = INTI.urai(W).m === 12 ? y : y - 1; if (q === 'wajib') { o.dari = o.sampai = W; } if (q === 'ytd') { o.dari = INTI.periode(y, 1); o.sampai = W; } if (q === 'thn') { o.dari = INTI.periode(yy, 1); o.sampai = INTI.periode(yy, 12); } if (q === 'q') { o.sampai = W; o.dari = INTI.geser(W, -2); } }
      if (b.dataset.c === 'kab') o.units = [];
      if (b.dataset.c === 'pilih') { var simpan = F.units; F.units = o.units; pilihUnit(function () { o.units = F.units; F.units = simpan; isi(); }); return; }
      if (b.dataset.r) o.rinci = b.dataset.r === '1';
      if (b.dataset.pb) o.perBulan = b.dataset.pb === '1';
      if (b.dataset.f) o.fmt = b.dataset.f;
      isi();
    });
  }
  Hal.dialogEkspor = dialogEkspor;

  Hal.data = function (el, r) { filter(); ({ matriks: tabMatriks, umur: tabUmur, rekap: tabRekap })[r.tab](el, r); };
})();
