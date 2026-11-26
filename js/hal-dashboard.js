/* =====================================================================
 * ESTEPEL — Dashboard Dinkes (F3) & Dashboard Puskesmas (F2), tata letak PRD 8.4.
 * Semua angka dihitung di browser dari cube berversi (instan saat ganti periode).
 * ===================================================================== */
(function () {
  'use strict';
  var ic = UI.ic, esc = UI.esc, A = UI.A, $ = UI.$, $$ = UI.$$;

  function sapaan(nama) {
    var h = INTI.wita(App.now()).hh;
    var w = h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 19 ? 'Selamat Sore' : 'Selamat Malam';
    return w + ', ' + String(nama || '').split(',')[0] + '! 👋';
  }
  function tahunPerlu(gp) {
    var awal = [INTI.geser(gp.dari, -12), INTI.geser(gp.sampai, -11), INTI.periode(INTI.urai(gp.sampai).y, 1)].sort()[0];
    return App.tahunDari(awal, gp.sampai);
  }
  /* Ringkasan bersama dua dashboard */
  function hitung(units) {
    var S = App.S, gp = S.gp, now = App.now(), ys = tahunPerlu(gp), ix = Store.ix(ys);
    var P = gp.sampai, y = INTI.urai(P).y, n = INTI.selisihBulan(gp.dari, gp.sampai) + 1;
    var cur = INTI.matriks(ix, { dari: gp.dari, sampai: gp.sampai, units: units }, null);
    var prevR = { dari: INTI.geser(gp.dari, -n), sampai: INTI.geser(gp.dari, -1) };
    var prev = INTI.matriks(ix, { dari: prevR.dari, sampai: prevR.sampai, units: units }, null);
    var thnLalu = INTI.matriks(ix, { dari: INTI.geser(gp.dari, -12), sampai: INTI.geser(gp.sampai, -12), units: units }, null);
    var adaThnLalu = Store.sinkron(INTI.urai(INTI.geser(gp.dari, -12)).y) && INTI.kelengkapan(ix, units, INTI.geser(gp.dari, -12), INTI.geser(gp.sampai, -12)).masuk > 0;
    var status = units.map(function (u) {
      var h = INTI.hdr(ix, u, P), st = INTI.statusSel(P, h, now, S.set), sk = INTI.skorUnit(ix, u, y, now, S.set);
      return { u: u, h: h, st: st, skor: sk };
    });
    var hitungSt = { TEPAT: 0, TERLAMBAT: 0, BELUM: 0, MENUNGGU: 0, BJT: 0 };
    status.forEach(function (s) { hitungSt[s.st.kode]++; });
    var pd = INTI.peringatanDini(ix, P, units, S.penyakit, S.set);
    var wasp = {};
    pd.lonjakan.forEach(function (x) { wasp[x.u] = wasp[x.u] === 'Tinggi' ? 'Tinggi' : 'Sedang'; });
    pd.klb.forEach(function (x) { wasp[x.u] = 'Tinggi'; });
    var top = Object.keys(cur.penyakit).map(function (k) { return { k: k, v: cur.penyakit[k].T }; }).sort(function (a, b) { return b.v - a.v; });
    var tren12 = INTI.daftarPeriode(INTI.geser(P, -11), P);
    var umurL = INTI.nol24().slice(0, 12), umurP = umurL.slice();
    INTI.saring(ix, { dari: gp.dari, sampai: gp.sampai, units: units }).forEach(function (r) { for (var g = 0; g < 12; g++) { umurL[g] += r.v[g * 2]; umurP[g] += r.v[g * 2 + 1]; } });
    // skor kabupaten YTD & bulan lalu
    var tp = 0, jt = 0, tp0 = 0, jt0 = 0;
    var tgPrev = INTI.tenggat(INTI.geser(S.wajib, -1), S.set);
    status.forEach(function (s) {
      tp += s.skor.tepat; jt += s.skor.jatuh;
      var sk0 = INTI.skorUnit(ix, s.u, y, Math.min(now, tgPrev + 1), S.set); tp0 += sk0.tepat; jt0 += sk0.jatuh;
    });
    return { ix: ix, ys: ys, P: P, y: y, n: n, cur: cur, prev: prev, prevR: prevR, thnLalu: thnLalu, adaThnLalu: adaThnLalu, status: status, hitungSt: hitungSt, pd: pd, wasp: wasp, top: top, tren12: tren12, umurL: umurL, umurP: umurP,
      skorKab: jt ? Math.round(tp / jt * 1000) / 10 : null, skorKab0: jt0 ? Math.round(tp0 / jt0 * 1000) / 10 : null };
  }
  function trenSeri(ix, units, daftar, pk) {
    return INTI.trenBulanan(ix, { units: units, penyakit: pk ? [pk] : null }, daftar).map(function (t) { return { lb: INTI.BLN[INTI.urai(t.p).m - 1], v: t.T, tip: INTI.labelBulan(t.p) + ': ' + A(t.T) + ' kasus (L ' + A(t.L) + ' • P ' + A(t.P) + ')' }; });
  }
  function opsiPenyakit(sel) {
    return '<option value="">Semua penyakit</option>' + App.S.penyakit.map(function (p) { return '<option value="' + p.kode + '"' + (p.kode === sel ? ' selected' : '') + '>' + esc(p.nama) + '</option>'; }).join('');
  }
  function kartuGrafik(judul, sub, isi, alat) {
    return '<div class="card"><div class="card-h"><div><div class="card-t">' + judul + '</div>' + (sub ? '<div class="card-s">' + sub + '</div>' : '') + '</div><div class="flex g6">' + (alat || '') + '<button class="btn btn-g btn-sm btn-ic" data-unduh-btn title="Unduh grafik (PNG)" aria-label="Unduh grafik">' + ic('download', 16) + '</button></div></div>' + isi + '</div>';
  }
  function warnaPeringkat(i) { return [['#DCFCE7', '#15803D'], ['#DBEAFE', '#1D4ED8'], ['#FEF3C7', '#B45309'], ['#EDE9FE', '#5B3DF5'], ['#FEE2E2', '#B91C1C']][i % 5]; }
  function topList(top, n) {
    return UI.hbar(top.slice(0, n).map(function (t, i) { var w = warnaPeringkat(i); return { lb: App.namaPenyakit(t.k), v: t.v, c: w[1], bg: w[0] }; }), { rank: true });
  }
  function daftarPeringatan(pd, tampilUnit) {
    var items = [];
    pd.klb.forEach(function (x) { items.push('<div class="note bad" style="padding:10px 12px">' + ic('siren', 18) + '<div style="flex:1"><div class="flex between"><b>' + esc(App.namaPenyakit(x.k)) + '</b><span class="badge b-solid-bad b-sm">Potensi KLB</span></div><div class="fs12">' + (tampilUnit ? esc(App.namaUnit(x.u)) + ': ' : '') + A(x.n) + ' kasus pada periode ini</div></div></div>'); });
    pd.lonjakan.forEach(function (x) { items.push('<div class="note warn" style="padding:10px 12px">' + ic('trendup', 18) + '<div style="flex:1"><div class="flex between"><b>' + esc(App.namaPenyakit(x.k)) + '</b><span class="badge b-solid-warn b-sm">Lonjakan</span></div><div class="fs12">' + (tampilUnit ? esc(App.namaUnit(x.u)) + ': ' : '') + A(x.n) + ' kasus' + (x.naik !== null ? ' (+' + x.naik + '% vs rata-rata 3 bln: ' + String(x.rata).replace('.', ',') + ')' : ' (sebelumnya nihil)') + '</div></div></div>'); });
    return items.length ? '<div class="flex col g6">' + items.slice(0, 6).join('') + (items.length > 6 ? '<div class="fs12 mut center">+' + (items.length - 6) + ' peringatan lain</div>' : '') + '</div>' : UI.kosong('Kewaspadaan rendah', 'Tidak ada lonjakan kasus atau Potensi KLB pada periode ini.', 'shield');
  }
  function modalPeringatan(pd, tampilUnit, P) {
    UI.modal({ judul: 'Peringatan Dini — ' + INTI.labelBulan(P), ikon: 'siren', tile: 't-red', ukuran: 'lg', isi: '<div class="note soft fs12">' + ic('info', 16) + '<div>Lonjakan: kasus ≥ ' + (App.S.set.MIN_KASUS_LONJAKAN || 5) + ' dan naik ≥ ' + (App.S.set.AMBANG_LONJAKAN || 50) + '% dibanding rata-rata 3 periode sebelumnya. Potensi KLB: penyakit bertanda Potensi_KLB yang ada kasusnya.</div></div>' + daftarPeringatan(pd, tampilUnit), tombol: [{ label: 'Tutup' }] });
  }

  /* ======================== DASHBOARD DINKES ======================== */
  function dinkes(el) {
    var S = App.S, filt = { pk: '', q: '', st: '', hal: 1, per: 10, urut: 'nama' };
    function render() {
      var units = App.unitScope(), R = hitung(units), P = R.P, now = App.now();
      var sisa = INTI.sisaHari(P, now, S.set), tg = INTI.tenggat(P, S.set), hs = R.hitungSt;
      var sudah = hs.TEPAT + hs.TERLAMBAT, belum = R.status.filter(function (s) { return s.st.kode === 'BELUM' || s.st.kode === 'MENUNGGU'; });
      var T = R.cur.total, Tp = R.prev.total;
      var kpi =
        UI.kpi({ tile: 't-vio', ikon: 'checkc', label: 'Kepatuhan Lapor ' + INTI.labelBln(P), nilai: sudah + ' / ' + units.length, sub: 'sudah lapor',
          badge: P === S.wajib ? '<span class="badge ' + (sisa < 0 ? 'b-bad' : sisa <= 3 ? 'b-warn' : 'b-info') + '">' + ic('clock', 13) + (sisa > 0 ? 'Sisa ' + sisa + ' hari' : sisa === 0 ? 'Tenggat hari ini' : 'Lewat tenggat') + '</span>' : '',
          foot: '<span class="dt d-ok">' + hs.TEPAT + ' Tepat</span><span class="dt d-warn">' + hs.TERLAMBAT + ' Terlambat</span><span class="dt d-bad">' + hs.BELUM + ' Belum</span><span class="dt d-info">' + hs.MENUNGGU + ' Menunggu</span>' }) +
        UI.kpi({ tile: 't-blu', ikon: 'activity', label: 'Total Kasus ' + INTI.labelRentangPendek(S.gp.dari, S.gp.sampai), nilai: A(T.T), sub: 'vs ' + A(Tp.T),
          badge: UI.tren(T.T, Tp.T, true) + (R.adaThnLalu ? '<span class="tren b-muted" title="vs periode sama tahun lalu">' + (R.thnLalu.total.T ? (T.T >= R.thnLalu.total.T ? '▲ ' : '▼ ') + Math.abs(Math.round((T.T - R.thnLalu.total.T) / R.thnLalu.total.T * 100)) + '% thn lalu' : 'thn lalu 0') + '</span>' : ''),
          foot: '<span class="dt d-info">L: ' + A(T.L) + '</span><span class="dt d-p">P: ' + A(T.P) + '</span>' }) +
        UI.kpi({ tile: 't-grn', ikon: 'trophy', label: 'Skor Ketepatan Kabupaten ' + R.y, nilai: R.skorKab === null ? '–' : String(R.skorKab).replace('.', ',') + '%', warna: R.skorKab === null ? '' : UI.WARNA_SKOR[INTI.kelasSkor(R.skorKab, S.set)].replace('var(--ok)', 'var(--ok-tx)').replace('var(--warn)', 'var(--warn-tx)').replace('var(--bad)', 'var(--bad-tx)'),
          badge: R.skorKab !== null && R.skorKab0 !== null && R.skorKab !== R.skorKab0 ? '<span class="tren ' + (R.skorKab > R.skorKab0 ? 'b-ok' : 'b-bad') + '">' + (R.skorKab > R.skorKab0 ? '▲ ' : '▼ ') + Math.abs(Math.round((R.skorKab - R.skorKab0) * 10) / 10).toString().replace('.', ',') + ' poin</span>' : '',
          foot: '<span class="dt d-ok">' + R.status.filter(function (s) { return INTI.kelasSkor(s.skor.skor, S.set) === 'ok'; }).length + ' Baik</span><span class="dt d-warn">' + R.status.filter(function (s) { var k = INTI.kelasSkor(s.skor.skor, S.set); return k === 'warn' || k === 'bad'; }).length + ' Perlu perhatian</span><span class="mut">Target ≥ ' + (S.set.AMBANG_HIJAU || 90) + '%</span>' }) +
        UI.kpi({ tile: 't-amb', ikon: 'siren', label: 'Peringatan Dini ' + INTI.labelBln(P), nilai: String(R.pd.lonjakan.length + R.pd.klb.length), sub: 'sinyal', klik: 'peringatan', warna: R.pd.lonjakan.length + R.pd.klb.length ? 'var(--bad-tx)' : '',
          badge: R.pd.klb.length ? '<span class="badge b-bad">Perlu respon</span>' : '<span class="badge b-ok">Aman</span>',
          foot: '<span class="dt d-warn">' + R.pd.lonjakan.length + ' Lonjakan</span><span class="dt d-bad">' + R.pd.klb.length + ' Potensi KLB</span><span class="lnk ml-a">Rincian ' + ic('right', 13) + '</span>' });

      var grafik =
        kartuGrafik('Tren Kasus Kabupaten', '12 bulan s/d ' + INTI.labelBulan(P), '<div id="gTren">' + UI.area(trenSeri(R.ix, units, R.tren12, filt.pk), { nama: 'tren-kasus-kabupaten', label: 'Tren kasus 12 bulan' }) + '</div>', '<select class="sel sm" id="fPk" style="width:auto;max-width:170px">' + opsiPenyakit(filt.pk) + '</select>') +
        kartuGrafik('Status Kepatuhan Lapor', INTI.labelBulan(P), UI.donat([{ v: hs.TEPAT, c: '#22C55E', lb: 'Tepat Waktu' }, { v: hs.TERLAMBAT, c: '#F59E0B', lb: 'Terlambat' }, { v: hs.BELUM, c: '#EF4444', lb: 'Belum Lapor' }, { v: hs.MENUNGGU + hs.BJT, c: '#3B82F6', lb: 'Menunggu' }], units.length, 'Total Puskesmas', { nama: 'status-kepatuhan' })) +
        '<div class="card"><div class="card-h"><div><div class="card-t">5 Penyakit Teratas</div><div class="card-s">' + INTI.labelRentang(S.gp.dari, S.gp.sampai) + '</div></div><a class="lnk" href="#/data/rekap">Semua ' + ic('right', 13) + '</a></div>' + topList(R.top, 5) + '</div>';

      el.innerHTML =
        '<div class="ph"><div><h1>' + esc(sapaan(S.user.nama)) + '</h1><p>Laporan ' + INTI.labelBulan(S.wajib) + ', tenggat ' + INTI.fmtTgl(INTI.tenggat(S.wajib, S.set)) + ' pukul ' + (S.set.JAM_TENGGAT || '23:59') + ' WITA. Mari jaga surveilans tetap tepat waktu.</p></div>' +
        '<div class="ph-act"><a class="btn btn-s" href="#/data/rekap?ekspor=1">' + ic('download', 16) + 'Ekspor Rekap</a><button class="btn btn-p" data-act="pengingat"' + (belum.length ? '' : ' disabled') + '>' + ic('send', 16) + 'Kirim Pengingat' + (belum.length ? ' (' + belum.length + ')' : '') + '</button></div></div>' +
        '<div class="g4">' + kpi + '</div><div class="g-chart">' + grafik + '</div>' +
        '<div class="card p0 tbl-cards" id="tblStatus"></div>' +
        '<div class="g3">' +
        '<div class="card"><div class="card-h"><div class="card-t">' + ic('siren', 20, 'bad-tx') + 'Peringatan Dini</div><span class="badge ' + (R.pd.klb.length ? 'b-bad' : R.pd.lonjakan.length ? 'b-warn' : 'b-ok') + '">' + (R.pd.klb.length + R.pd.lonjakan.length) + ' aktif</span></div>' + daftarPeringatan(R.pd, true) + '</div>' +
        '<div class="card"><div class="card-h"><div class="card-t">' + ic('trophy', 20, 'ok-tx') + 'Peringkat Ketepatan ' + R.y + '</div><a class="lnk" href="#/monitoring/ketepatan">Rapor ' + ic('right', 13) + '</a></div>' + peringkat(R.status) + '</div>' +
        '<div class="card" id="cRevisi"><div class="card-h"><div class="card-t">' + ic('compare', 20, 'p-tx') + (App.isAdmin() ? 'Antrean Revisi' : 'Laporan Masuk') + '</div></div>' + UI.skel(54, 2) + '</div></div>' +
        '<div class="g3">' +
        '<div class="card"><div class="card-h"><div><div class="card-t">' + ic('flame', 20, 'warn-tx') + 'Hotspot 5 Puskesmas</div><div class="card-s">Kasus terbanyak • ' + INTI.labelRentangPendek(S.gp.dari, S.gp.sampai) + '</div></div></div>' +
        UI.hbar(Object.keys(R.cur.unit).map(function (u) { return { lb: App.namaUnit(u), v: R.cur.unit[u].T, c: 'var(--p)', act: 'unit:' + u }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5), { rank: true }) + '</div>' +
        kartuGrafik('Piramida Umur Kabupaten', 'Laki-laki kiri • Perempuan kanan', UI.piramida(R.umurL, R.umurP, { nama: 'piramida-umur-kabupaten' })) +
        '<div class="card"><div class="card-h"><div><div class="card-t">' + ic('heat', 20) + 'Peta Panas Mini</div><div class="card-s">Puskesmas × 5 penyakit utama</div></div><a class="lnk" href="#/data/matriks">Matriks ' + ic('right', 13) + '</a></div>' + petaPanas(R, units) + '</div></div>';
      renderTabel(R);
      renderRevisi();
      el.onclick = function (e) {
        var a = e.target.closest('[data-act]'); if (!a) return;
        var act = a.dataset.act;
        if (act === 'peringatan') modalPeringatan(R.pd, true, P);
        if (act === 'pengingat') App.kirimPengingat(P, belum.map(function (s) { return s.u; }), a);
        if (act.indexOf('unit:') === 0) App.ke('#/data/matriks?u=' + act.slice(5));
        if (act.indexOf('heat:') === 0) App.ke('#/data/matriks?u=' + act.split(':')[1]);
      };
      el.onchange = function (e) {
        if (e.target.id === 'fPk') { filt.pk = e.target.value; $('#gTren').innerHTML = UI.area(trenSeri(R.ix, units, R.tren12, filt.pk), { nama: 'tren-kasus' }); }
      };
    }
    function peringkat(st) {
      var a = st.filter(function (s) { return s.skor.skor !== null; }).slice().sort(function (x, y) { return y.skor.skor - x.skor.skor || x.skor.rataHari - y.skor.rataHari; });
      if (!a.length) return UI.kosong('Belum ada periode jatuh tempo', '', 'trophy');
      var baris = function (s, i, bawah) {
        var k = INTI.kelasSkor(s.skor.skor, App.S.set);
        return '<div class="flex between" style="padding:8px 10px;border-radius:10px;background:' + (bawah ? '#FFF5F5' : 'var(--soft)') + '"><span class="flex g6 ell"><span class="rk" style="background:' + (bawah ? '#FECACA' : 'var(--ok)') + ';color:' + (bawah ? '#991B1B' : '#fff') + '">' + (i + 1) + '</span><span class="ell">' + esc(App.namaUnit(s.u)) + '</span></span><b class="' + k + '-tx nowrap fs12">' + String(s.skor.skor).replace('.', ',') + '% <span class="mut" style="font-weight:400">(' + s.skor.tepat + '/' + s.skor.jatuh + ')</span></b></div>';
      };
      var bawah = a.slice(-2).filter(function (s) { return INTI.kelasSkor(s.skor.skor, App.S.set) !== 'ok'; });
      return '<div class="flex col g6"><div class="kpi-lbl">Teladan</div>' + a.slice(0, 3).map(function (s, i) { return baris(s, i); }).join('') +
        (bawah.length ? '<div class="kpi-lbl mt8">Perlu pembinaan</div>' + bawah.map(function (s) { return baris(s, a.indexOf(s), true); }).join('') : '<div class="note ok fs12 mt8">' + ic('checkc', 16) + 'Semua puskesmas di atas ambang hijau.</div>') + '</div>';
    }
    function petaPanas(R, units) {
      var top = R.top.slice(0, 5).map(function (t) { return t.k; });
      if (!top.length) return UI.kosong('Belum ada kasus', '', 'heat');
      var urutU = units.slice().sort(function (a, b) { return ((R.cur.unit[b] || {}).T || 0) - ((R.cur.unit[a] || {}).T || 0); }).slice(0, 6);
      var mx = 1;
      urutU.forEach(function (u) { top.forEach(function (k) { var c = (R.cur.m[u] || {})[k]; if (c && c.T > mx) mx = c.T; }); });
      var h = '<div class="mini-heat" style="grid-template-columns:minmax(70px,1.3fr) repeat(' + top.length + ',minmax(0,1fr))"><div class="hd lb">Unit</div>' + top.map(function (k) { return '<div class="hd ell" title="' + esc(App.namaPenyakit(k)) + '">' + esc(App.namaPenyakit(k).split(' ')[0]) + '</div>'; }).join('');
      urutU.forEach(function (u) {
        h += '<div class="lb" title="' + esc(App.namaUnit(u)) + '">' + esc(App.namaPendek(u)) + '</div>';
        top.forEach(function (k) { var c = (R.cur.m[u] || {})[k], v = c ? c.T : 0, lv = v ? Math.min(5, Math.ceil(v / mx * 5)) : 0; h += '<div class="' + (lv ? 'hb' + lv : '') + '" style="' + (lv ? 'cursor:pointer' : 'background:#F8FAFC;color:#CBD5E1') + '" data-act="heat:' + u + ':' + k + '" title="' + esc(App.namaUnit(u) + ' • ' + App.namaPenyakit(k) + ': ' + v) + '">' + v + '</div>'; });
      });
      return h + '</div><div class="legend mt12"><span><i style="background:#F8FAFC"></i>Rendah</span><span><i class="hb2"></i>Sedang</span><span><i class="hb5"></i>Tinggi</span></div>';
    }
    function renderTabel(R) {
      var wrap = $('#tblStatus'); if (!wrap) return;
      var S = App.S, P = R.P, tg = INTI.tenggat(P, S.set);
      var rows = R.status.filter(function (s) {
        var nm = App.namaUnit(s.u).toLowerCase();
        return (!filt.q || nm.indexOf(filt.q.toLowerCase()) > -1) && (!filt.st || s.st.kode === filt.st || (filt.st === 'BELUM_SEMUA' && (s.st.kode === 'BELUM' || s.st.kode === 'MENUNGGU')));
      });
      var urut = {
        nama: function (a, b) { return (S.uMap[a.u] ? S.uMap[a.u].urutan : 0) - (S.uMap[b.u] ? S.uMap[b.u].urutan : 0); },
        skor: function (a, b) { return (b.skor.skor === null ? -1 : b.skor.skor) - (a.skor.skor === null ? -1 : a.skor.skor); },
        kirim: function (a, b) { return ((a.h && a.h.kp) || 9e15) - ((b.h && b.h.kp) || 9e15); },
        status: function (a, b) { var o = { BELUM: 0, MENUNGGU: 1, TERLAMBAT: 2, TEPAT: 3, BJT: 4 }; return o[a.st.kode] - o[b.st.kode]; }
      }[filt.urut];
      rows.sort(urut);
      var total = rows.length, hal = Math.min(filt.hal, Math.max(1, Math.ceil(total / filt.per)));
      var tampil = rows.slice((hal - 1) * filt.per, hal * filt.per);
      function wb(u) { var w = R.wasp[u] || (R.status.filter(function (s) { return s.u === u; })[0].h ? 'Rendah' : ''); return w ? UI.badge(w, w === 'Tinggi' ? 'bad' : w === 'Sedang' ? 'warn' : 'ok', w === 'Tinggi' ? 'siren' : w === 'Sedang' ? 'alert' : 'checkc') : '<span class="mut">–</span>'; }
      function sk(s) { if (s.skor.skor === null) return '<span class="mut">–</span>'; var k = INTI.kelasSkor(s.skor.skor, S.set); return '<div class="flex g6">' + UI.bar(s.skor.skor, UI.WARNA_SKOR[k]) + '<b class="fs12 ' + k + '-tx">' + Math.round(s.skor.skor) + '%</b></div>'; }
      function aksi(s) {
        var id = P + '_' + s.u;
        return '<div class="aksi">' + (s.h ? '<button data-lihat="' + id + '" title="Detail & Stempel Digital" aria-label="Detail">' + ic('eye') + '</button>' : '') +
          ((s.st.kode === 'BELUM' || s.st.kode === 'MENUNGGU') ? '<button data-ingat="' + s.u + '" title="Kirim pengingat" aria-label="Kirim pengingat">' + ic('send') + '</button>' : '') +
          (App.isAdmin() && s.h ? '<button data-menu="' + id + '" title="Aksi admin" aria-label="Aksi lainnya">' + ic('more') + '</button>' : '') + '</div>';
      }
      wrap.innerHTML = '<div class="tbl-tools"><div class="card-t">Status Laporan Puskesmas <span class="badge b-vio">' + INTI.labelBulan(P) + '</span></div>' +
        '<div class="inp-ic sm" style="width:200px">' + ic('search', 16) + '<input class="inp" id="tq" placeholder="Cari puskesmas..." value="' + esc(filt.q) + '"></div>' +
        '<select class="sel sm" id="tst" style="width:auto"><option value="">Semua status</option><option value="BELUM_SEMUA"' + (filt.st === 'BELUM_SEMUA' ? ' selected' : '') + '>Belum lapor (semua)</option>' + ['TEPAT', 'TERLAMBAT', 'BELUM', 'MENUNGGU'].map(function (k) { return '<option value="' + k + '"' + (filt.st === k ? ' selected' : '') + '>' + INTI.STATUS[k].label + '</option>'; }).join('') + '</select>' +
        '<select class="sel sm" id="turut" style="width:auto"><option value="nama">Urut: nama</option><option value="skor"' + (filt.urut === 'skor' ? ' selected' : '') + '>Urut: skor</option><option value="kirim"' + (filt.urut === 'kirim' ? ' selected' : '') + '>Urut: tgl kirim</option><option value="status"' + (filt.urut === 'status' ? ' selected' : '') + '>Urut: status</option></select></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Puskesmas</th><th>Periode</th><th>Tenggat</th><th>Tgl Kirim</th><th>Skor Ketepatan</th><th>Status</th><th>Kewaspadaan</th><th class="right">Aksi</th></tr></thead><tbody>' +
        (tampil.length ? tampil.map(function (s) {
          return '<tr><td><div class="cel-u"><span class="ini ' + UI.warnaIni(s.u) + '">' + esc(UI.inisial(App.namaPendek(s.u))) + '</span><div class="ell"><b>' + esc(App.namaUnit(s.u)) + '</b><div class="fs11 mut">' + s.u + (s.h && s.h.j === 'N' ? ' • Nihil' : '') + (s.h && s.h.st !== 'Terkirim' ? ' • ' + esc(s.h.st) : '') + '</div></div></div></td>' +
            '<td class="mut">' + INTI.labelBln(P) + '</td><td class="mut nowrap">' + INTI.fmtTgl(tg, true) + '</td><td class="nowrap' + (s.st.kode === 'TERLAMBAT' ? ' warn-tx' : '') + '">' + (s.h ? INTI.fmtTgl(s.h.kp, true) : '<i class="mut">Belum kirim</i>') + '</td>' +
            '<td>' + sk(s) + '</td><td>' + UI.badgeStatus(s.st.kode, s.st.hari) + '</td><td>' + wb(s.u) + '</td><td class="right">' + aksi(s) + '</td></tr>';
        }).join('') : '<tr><td colspan="8">' + UI.kosong('Tidak ada puskesmas', 'Ubah filter pencarian.', 'search') + '</td></tr>') + '</tbody></table></div>' +
        '<div class="mcards">' + tampil.map(function (s) {
          return '<div class="mc"><div class="flex between"><b>' + esc(App.namaUnit(s.u)) + '</b>' + UI.badgeStatus(s.st.kode, s.st.hari, true) + '</div>' +
            '<div class="mc-r"><span>Tgl kirim</span><span>' + (s.h ? INTI.fmtTgl(s.h.kp, true) : '–') + '</span></div><div class="mc-r"><span>Skor ketepatan</span><span>' + (s.skor.skor === null ? '–' : String(s.skor.skor).replace('.', ',') + '%') + '</span></div>' +
            '<div class="mc-r"><span>Kewaspadaan</span>' + wb(s.u) + '</div><div class="flex between">' + (s.h ? '<button class="lnk" data-lihat="' + P + '_' + s.u + '">' + ic('stamp', 14) + 'Lihat & Stempel</button>' : '<span></span>') + ((s.st.kode === 'BELUM' || s.st.kode === 'MENUNGGU') ? '<button class="btn btn-p btn-sm" data-ingat="' + s.u + '">' + ic('send', 14) + 'Ingatkan</button>' : '') + '</div></div>';
        }).join('') + '</div>' +
        '<div class="tbl-foot"><span>Menampilkan ' + (total ? (hal - 1) * filt.per + 1 : 0) + '–' + Math.min(total, hal * filt.per) + ' dari ' + total + ' puskesmas</span><div class="flex g6"><select class="sel sm" id="tper" style="width:auto">' + [5, 10, 25].map(function (n) { return '<option' + (n === filt.per ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>' + UI.paginasi(total, hal, filt.per) + '</div></div>';
      var deb = UI.debounce(function (v) { filt.q = v; filt.hal = 1; renderTabel(R); var i = $('#tq'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 180);
      $('#tq').oninput = function () { deb(this.value); };
      $('#tst').onchange = function () { filt.st = this.value; filt.hal = 1; renderTabel(R); };
      $('#turut').onchange = function () { filt.urut = this.value; renderTabel(R); };
      $('#tper').onchange = function () { filt.per = +this.value; filt.hal = 1; renderTabel(R); };
      wrap.onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.pg) { filt.hal = +b.dataset.pg; renderTabel(R); }
        if (b.dataset.lihat) Hal.detailLaporan(b.dataset.lihat);
        if (b.dataset.ingat) App.kirimPengingat(P, [b.dataset.ingat], b);
        if (b.dataset.menu) Hal.menuAdminLaporan(b, b.dataset.menu);
      };
    }
    function renderRevisi() {
      var c = $('#cRevisi'); if (!c) return;
      var isi = function (j) {
        if (!$('#cRevisi')) return;
        var head = c.querySelector('.card-h').outerHTML;
        if (!App.isAdmin()) {
          c.innerHTML = head + '<div class="flex col g6">' + Store.ix([INTI.urai(App.S.wajib).y]).HL.slice().sort(function (a, b) { return b.kl - a.kl; }).slice(0, 4).map(function (h) {
            return '<div class="flex between" style="padding:10px;border-radius:10px;background:var(--soft)"><div class="ell"><b class="fs12">' + esc(App.namaUnit(h.u)) + '</b><div class="fs11 mut">' + INTI.labelBulan(h.p) + ' • ' + UI.waktuRelatif(h.kl, App.now()) + '</div></div>' + UI.badgeStatus(h.kt === 'T' ? 'TEPAT' : 'TERLAMBAT', h.hr, true) + '</div>';
          }).join('') + '<a class="btn btn-s btn-sm mt8" href="#/monitoring/masuk">' + ic('inbox', 15) + 'Buka Laporan Masuk</a></div>';
          return;
        }
        var list = (j.list || []).filter(function (r) { return r.status === 'Diajukan'; });
        c.innerHTML = head.replace('</div></div>', '</div><span class="badge b-vio">' + list.length + ' menunggu</span></div>') + (list.length ? '<div class="flex col g6">' + list.slice(0, 3).map(function (r) {
          return '<div style="padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--bg)"><div class="flex between"><b class="fs12">' + esc(App.namaUnit(r.unit)) + '</b><span class="fs11 mut">' + UI.waktuRelatif(r.diajukan, App.now()) + '</span></div><div class="fs12 mut mt8"><b style="color:var(--tx)">' + INTI.labelBln(r.periode) + '</b> • ' + esc(r.alasan) + '</div>' +
            '<div class="flex g6 mt8"><button class="btn btn-ok btn-xs" style="flex:1" data-rv="Disetujui" data-id="' + esc(r.id) + '">' + ic('check', 13) + 'Setujui</button><button class="btn btn-s btn-xs" style="flex:1" data-rv="Ditolak" data-id="' + esc(r.id) + '">' + ic('x', 13) + 'Tolak</button></div></div>';
        }).join('') + (list.length > 3 ? '<a class="lnk center" href="#/monitoring/revisi">Lihat ' + (list.length - 3) + ' lainnya</a>' : '') + '</div>' : UI.kosong('Tidak ada antrean', 'Semua pengajuan revisi sudah diputuskan.', 'checkc'));
        c.onclick = function (e) { var b = e.target.closest('[data-rv]'); if (b) Hal.putuskanRevisi(b.dataset.id, b.dataset.rv, b).then(function () { renderRevisi(); }); };
      };
      if (!App.isAdmin()) { isi({}); return; }
      var r = Store.ambil('revisi', 'revisi.list', {});
      if (r.cache) isi(r.cache);
      r.p.then(isi, function () { /* tetap */ });
    }
    render();
    Store.muatBanyak(tahunPerlu(App.S.gp)).then(function () { if (App.rute().hal === 'dashboard') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', UI.debounce(function () { if (App.rute().hal === 'dashboard') render(); }, 60)));
    App.ikat(Bus.on('periode', function () { Store.muatBanyak(tahunPerlu(App.S.gp)).then(render, function (e) { UI.toast(e.message, 'bad'); }); render(); }));
    App.ikat(Bus.on('boot', render));
  }

  /* ======================== DASHBOARD PUSKESMAS ======================== */
  function puskesmas(el) {
    var S = App.S, filt = { pk: '' };
    function render() {
      var u = S.user.unit, units = [u], R = hitung(units), now = App.now(), W = S.wajib;
      var ixW = Store.ix(tahunPerlu(S.gp)), hW = INTI.hdr(ixW, u, W), stW = INTI.statusSel(W, hW, now, S.set);
      var sisa = INTI.sisaHari(W, now, S.set), sk = INTI.skorUnit(ixW, u, INTI.urai(W).y, now, S.set);
      var T = R.cur.total, Tp = R.prev.total;
      var kpi =
        UI.kpi({ tile: 't-vio', ikon: 'file', label: 'Laporan ' + INTI.labelBulan(W), nilai: '<span style="font-size:20px">' + UI.badgeStatus(stW.kode, stW.hari) + '</span>',
          badge: !hW ? '<span class="badge ' + (sisa < 0 ? 'b-bad' : sisa <= 3 ? 'b-warn' : 'b-info') + '">' + ic('clock', 13) + (sisa > 0 ? 'Sisa ' + sisa + ' hari' : sisa === 0 ? 'Hari ini' : 'Lewat ' + (-sisa) + ' hari') + '</span>' : '<span class="badge b-ok">' + ic('stamp', 13) + 'Distempel</span>',
          foot: 'Tenggat ' + INTI.fmtTgl(INTI.tenggat(W, S.set), true) + ' WITA' + (hW ? '<button class="lnk ml-a" data-lihat="' + W + '_' + u + '">Stempel ' + ic('right', 13) + '</button>' : '<a class="btn btn-p btn-xs ml-a" href="#/laporan/input">' + ic('plus', 13) + 'Input Laporan</a>') }) +
        UI.kpi({ tile: 't-blu', ikon: 'activity', label: 'Total Kasus ' + INTI.labelRentangPendek(S.gp.dari, S.gp.sampai), nilai: A(T.T), sub: 'vs ' + A(Tp.T), badge: UI.tren(T.T, Tp.T, true), foot: '<span class="dt d-info">L: ' + A(T.L) + '</span><span class="dt d-p">P: ' + A(T.P) + '</span>' }) +
        UI.kpi({ tile: 't-grn', ikon: 'trophy', label: 'Skor Ketepatan ' + INTI.urai(W).y, nilai: sk.skor === null ? '–' : String(sk.skor).replace('.', ',') + '%', sub: sk.jatuh ? sk.tepat + ' dari ' + sk.jatuh + ' bulan' : '',
          badge: '<span class="badge b-' + INTI.kelasSkor(sk.skor, S.set) + '">' + (INTI.kelasSkor(sk.skor, S.set) === 'ok' ? 'Baik' : sk.skor === null ? 'Belum ada' : 'Perlu ditingkatkan') + '</span>',
          foot: '<span class="dt d-warn">' + sk.telat + ' terlambat</span><span class="dt d-bad">' + sk.belum + ' belum</span><span>rata-rata ' + String(sk.rataHari).replace('.', ',') + ' hari</span>' }) +
        UI.kpi({ tile: 't-amb', ikon: 'siren', label: 'Peringatan Dini ' + INTI.labelBln(R.P), nilai: String(R.pd.lonjakan.length + R.pd.klb.length), sub: 'sinyal', klik: 'peringatan',
          badge: R.pd.klb.length ? '<span class="badge b-bad">Potensi KLB</span>' : R.pd.lonjakan.length ? '<span class="badge b-warn">Lonjakan</span>' : '<span class="badge b-ok">Aman</span>',
          foot: '<span class="dt d-warn">' + R.pd.lonjakan.length + ' Lonjakan</span><span class="dt d-bad">' + R.pd.klb.length + ' Potensi KLB</span>' });
      var tl = sk.sel.map(function (st, i) {
        var m = INTI.STATUS[st.kode], h = st.h, p = INTI.periode(INTI.urai(W).y, i + 1);
        var tip = INTI.labelBulan(p) + ' — ' + m.label + (h ? ' • dikirim ' + INTI.fmtTgl(h.kp, true) + (st.hari ? ' (+' + st.hari + ' hari)' : '') : '');
        return '<div class="kc ' + m.kelas + '" title="' + esc(tip) + '"' + (h ? ' data-lihat="' + p + '_' + u + '" style="cursor:pointer"' : '') + '>' + INTI.BLN[i] + '<span>' + (st.kode === 'TEPAT' ? '✓' : st.kode === 'TERLAMBAT' ? '+' + st.hari + ' hr' : st.kode === 'BELUM' ? '✕' : st.kode === 'MENUNGGU' ? '…' : '–') + '</span></div>';
      }).join('');
      var riwayat = INTI.daftarPeriode(INTI.geser(W, -5), W).reverse().map(function (p) {
        var h = INTI.hdr(ixW, u, p) || INTI.hdr(Store.ix(App.tahunDari(INTI.geser(W, -5), W)), u, p), st = INTI.statusSel(p, h, now, S.set);
        return '<tr' + (h ? ' class="klik" data-lihat="' + p + '_' + u + '"' : '') + '><td><b>' + INTI.labelBulan(p) + '</b></td><td class="mut nowrap">' + INTI.fmtTgl(INTI.tenggat(p, S.set)) + '</td><td class="nowrap">' + (h ? INTI.fmtTgl(h.kp, true) : '<i class="mut">–</i>') + '</td><td class="num">' + (h ? (h.j === 'N' ? '<span class="badge b-muted b-sm">Nihil</span>' : A(h.tt)) : '–') + '</td><td>' + UI.badgeStatus(st.kode, st.hari) + '</td><td class="center">' + (h ? 'v' + h.v : '–') + '</td><td class="right">' + (h ? '<div class="aksi"><button data-lihat="' + p + '_' + u + '" aria-label="Lihat">' + ic('eye') + '</button><button data-stempel="' + p + '_' + u + '" aria-label="Stempel Digital" title="Unduh Stempel Digital">' + ic('stamp') + '</button></div>' : (INTI.bolehInput(p, now) ? '<a class="btn btn-p btn-xs" href="#/laporan/input?periode=' + p + '">Input</a>' : '')) + '</td></tr>';
      }).join('');
      el.innerHTML =
        '<div class="ph"><div><h1>' + esc(sapaan(S.user.nama)) + '</h1><p>' + esc(App.namaUnit(u)) + ' • Laporan ' + INTI.labelBulan(W) + ', tenggat ' + INTI.fmtTgl(INTI.tenggat(W, S.set)) + '. Mari jaga surveilans tetap tepat waktu.</p></div>' +
        '<div class="ph-act"><a class="btn btn-s" href="#/laporan/riwayat">' + ic('download', 16) + 'Ekspor Laporan</a><a class="btn btn-p" href="#/laporan/input">' + ic('plus', 16) + 'Input Laporan</a></div></div>' +
        '<div class="g4">' + kpi + '</div>' +
        '<div class="card"><div class="card-h"><div><div class="card-t">Garis Waktu Ketepatan ' + INTI.urai(W).y + '</div><div class="card-s">Klik bulan untuk melihat laporan & Stempel Digital</div></div><div class="legend"><span><i style="background:var(--ok-bg)"></i>Tepat</span><span><i style="background:var(--warn-bg)"></i>Terlambat</span><span><i style="background:var(--bad-bg)"></i>Belum</span><span><i style="background:var(--info-bg)"></i>Menunggu</span><span><i style="background:#F1F5F9"></i>Belum jatuh tempo</span></div></div><div class="tl12">' + tl + '</div></div>' +
        '<div class="g-chart">' +
        kartuGrafik('Tren Kasus Unit', '12 bulan s/d ' + INTI.labelBulan(R.P), '<div id="gTren">' + UI.area(trenSeri(R.ix, units, R.tren12, filt.pk), { nama: 'tren-kasus-unit' }) + '</div>', '<select class="sel sm" id="fPk" style="width:auto;max-width:170px">' + opsiPenyakit(filt.pk) + '</select>') +
        kartuGrafik('Komposisi L/P', INTI.labelRentang(S.gp.dari, S.gp.sampai), UI.donat([{ v: T.L, c: '#3B82F6', lb: 'Laki-laki' }, { v: T.P, c: '#A78BFA', lb: 'Perempuan' }], A(T.T), 'Total Kasus', { nama: 'komposisi-lp' })) +
        '<div class="card"><div class="card-h"><div><div class="card-t">5 Penyakit Teratas</div><div class="card-s">' + INTI.labelRentang(S.gp.dari, S.gp.sampai) + '</div></div></div>' + topList(R.top, 5) + '</div></div>' +
        '<div class="card p0"><div class="tbl-tools"><div class="card-t">Riwayat Laporan</div><a class="lnk" href="#/laporan/riwayat">Semua arsip ' + ic('right', 13) + '</a></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Periode</th><th>Tenggat</th><th>Tgl Kirim</th><th class="num">Total Kasus</th><th>Ketepatan</th><th class="center">Versi</th><th class="right">Aksi</th></tr></thead><tbody>' + riwayat + '</tbody></table></div></div>' +
        '<div class="g3"><div class="card"><div class="card-h"><div class="card-t">' + ic('siren', 20, 'bad-tx') + 'Peringatan Dini</div></div>' + daftarPeringatan(R.pd, false) + '</div>' +
        kartuGrafik('Distribusi Umur × L/P', INTI.labelRentang(S.gp.dari, S.gp.sampai), UI.piramida(R.umurL, R.umurP, { nama: 'distribusi-umur' })) +
        '<div class="card" id="cRev"><div class="card-h"><div class="card-t">' + ic('compare', 20, 'p-tx') + 'Status Revisi</div><a class="lnk" href="#/laporan/revisi">Kelola ' + ic('right', 13) + '</a></div>' + UI.skel(48, 2) + '</div></div>';
      var r = Store.ambil('revisi', 'revisi.list', {});
      var isiRev = function (j) {
        var c = $('#cRev'); if (!c) return;
        var list = (j.list || []).slice(0, 4);
        c.innerHTML = c.querySelector('.card-h').outerHTML + (list.length ? '<div class="flex col g6">' + list.map(function (x) {
          return '<div style="padding:10px 12px;border-radius:12px;background:var(--soft)"><div class="flex between"><b class="fs12">' + INTI.labelBulan(x.periode) + '</b>' + UI.badge(x.status, x.status === 'Diajukan' ? 'info' : x.status === 'Ditolak' ? 'bad' : x.status === 'Disetujui' ? 'warn' : 'ok') + '</div><div class="fs11 mut mt8">' + esc(x.alasan) + '</div>' + (x.status === 'Disetujui' ? '<a class="btn btn-p btn-xs mt8" href="#/laporan/input?periode=' + x.periode + '">' + ic('edit', 13) + 'Isi ulang laporan</a>' : '') + '</div>';
        }).join('') + '</div>' : UI.kosong('Tidak ada pengajuan', 'Ajukan revisi dari Riwayat bila ada koreksi.', 'compare'));
      };
      if (r.cache) isiRev(r.cache);
      r.p.then(isiRev, function () { /* abaikan */ });
      el.onclick = function (e) {
        var a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'peringatan') modalPeringatan(R.pd, false, R.P);
        var l = e.target.closest('[data-lihat]'); if (l) Hal.detailLaporan(l.dataset.lihat);
        var s = e.target.closest('[data-stempel]'); if (s) { e.stopPropagation(); Hal.stempel(s.dataset.stempel); }
      };
      el.onchange = function (e) { if (e.target.id === 'fPk') { filt.pk = e.target.value; $('#gTren').innerHTML = UI.area(trenSeri(R.ix, units, R.tren12, filt.pk), { nama: 'tren-kasus-unit' }); } };
    }
    render();
    Store.muatBanyak(tahunPerlu(App.S.gp)).then(function () { if (App.rute().hal === 'dashboard') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', UI.debounce(function () { if (App.rute().hal === 'dashboard') render(); }, 60)));
    App.ikat(Bus.on('periode', function () { render(); Store.muatBanyak(tahunPerlu(App.S.gp)).then(render, function () { /* abaikan */ }); }));
    App.ikat(Bus.on('boot', render));
  }

  Hal.dashboard = function (el) { if (App.isPkm()) puskesmas(el); else dinkes(el); };
})();
