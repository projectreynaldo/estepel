/* =====================================================================
 * ESTEPEL — Monitoring & Ketepatan (F5): Status Periode, Ketepatan Lapor
 * 17 × 12, Laporan Masuk, Revisi.
 * ===================================================================== */
(function () {
  'use strict';
  var ic = UI.ic, esc = UI.esc, A = UI.A, $ = UI.$;

  function kepala(sub, aksi) { return '<div class="ph"><div><h1>Monitoring &amp; Ketepatan</h1><p>' + sub + '</p></div><div class="ph-act">' + (aksi || '') + '</div></div>'; }
  function opsiTahun(y) { var s = '', t0 = INTI.urai(App.S.wajib).y; for (var t = t0; t >= t0 - 4; t--) s += '<option' + (t === y ? ' selected' : '') + '>' + t + '</option>'; return s; }
  function opsiBulan(p) { var s = '', W = App.S.wajib; INTI.daftarPeriode(INTI.geser(W, -23), W).reverse().forEach(function (x) { s += '<option value="' + x + '"' + (x === p ? ' selected' : '') + '>' + INTI.labelBulan(x) + (x === W ? ' (wajib)' : '') + '</option>'; }); return s; }

  /* ---------- Status Periode ---------- */
  function tabStatus(el, r) {
    var S = App.S, p = r.q.p || S.gp.sampai, fs = r.q.st || '';
    function render() {
      var units = App.unitScope(), y = INTI.urai(p).y, ix = Store.ix([y]), now = App.now(), tg = INTI.tenggat(p, S.set);
      var rows = units.map(function (u) { var h = INTI.hdr(ix, u, p); return { u: u, h: h, st: INTI.statusSel(p, h, now, S.set) }; });
      var c = { TEPAT: 0, TERLAMBAT: 0, BELUM: 0, MENUNGGU: 0, BJT: 0 }; rows.forEach(function (x) { c[x.st.kode]++; });
      var belum = rows.filter(function (x) { return x.st.kode === 'BELUM' || x.st.kode === 'MENUNGGU'; });
      var tampil = rows.filter(function (x) { return !fs || x.st.kode === fs; });
      el.innerHTML = kepala('Status laporan 17 puskesmas per periode • tenggat ' + INTI.fmtTglJam(tg), '<select class="sel" id="selP" style="width:auto">' + opsiBulan(p) + '</select><button class="btn btn-p" id="btnIng"' + (belum.length ? '' : ' disabled') + '>' + ic('send', 16) + 'Ingatkan semua yang belum (' + belum.length + ')</button>') +
        App.tabBar('monitoring', 'status') +
        '<div class="card"><div class="chips"><button class="chip' + (!fs ? ' on' : '') + '" data-f="">Semua (' + rows.length + ')</button>' + ['TEPAT', 'TERLAMBAT', 'BELUM', 'MENUNGGU'].map(function (k) { return '<button class="chip' + (fs === k ? ' on' : '') + '" data-f="' + k + '"><span class="dt d-' + INTI.STATUS[k].kelas + '"></span>' + INTI.STATUS[k].label + ' (' + c[k] + ')</button>'; }).join('') + '</div></div>' +
        '<div class="card p0 tbl-cards"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Puskesmas</th><th>Status</th><th>Tanggal kirim</th><th class="num">Hari terlambat</th><th class="num">Total kasus</th><th class="center">Versi</th><th class="right">Aksi</th></tr></thead><tbody>' +
        tampil.map(function (x) {
          var h = x.h, id = p + '_' + x.u;
          return '<tr><td><div class="cel-u"><span class="ini ' + UI.warnaIni(x.u) + '">' + esc(UI.inisial(App.namaPendek(x.u))) + '</span><b>' + esc(App.namaUnit(x.u)) + '</b></div></td><td>' + UI.badgeStatus(x.st.kode, x.st.hari) + '</td><td class="nowrap">' + (h ? INTI.fmtTgl(h.kp, true) : '–') + '</td><td class="num">' + (x.st.kode === 'TERLAMBAT' ? '<b class="warn-tx">' + x.st.hari + '</b>' : '–') + '</td><td class="num">' + (h ? (h.j === 'N' ? '<span class="badge b-muted b-sm">Nihil</span>' : A(h.tt)) : '–') + '</td><td class="center">' + (h ? 'v' + h.v : '–') + '</td>' +
            '<td class="right"><div class="aksi">' + (h ? '<button data-l="' + id + '" aria-label="Detail" title="Detail">' + ic('eye') + '</button><button data-s="' + id + '" aria-label="Stempel" title="Stempel Digital">' + ic('stamp') + '</button>' : '<button data-i="' + x.u + '" aria-label="Pengingat" title="Kirim pengingat">' + ic('send') + '</button>') + (App.isAdmin() && h ? '<button data-m="' + id + '" aria-label="Aksi admin">' + ic('more') + '</button>' : '') + '</div></td></tr>';
        }).join('') + '</tbody></table></div><div class="mcards">' + tampil.map(function (x) {
          var h = x.h, id = p + '_' + x.u;
          return '<div class="mc"><div class="flex between"><b>' + esc(App.namaUnit(x.u)) + '</b>' + UI.badgeStatus(x.st.kode, x.st.hari, true) + '</div>' + (h ? '<div class="mc-r"><span>Dikirim</span><span>' + INTI.fmtTgl(h.kp, true) + '</span></div><div class="mc-r"><span>Total</span><span>' + (h.j === 'N' ? 'Nihil' : A(h.tt)) + ' • v' + h.v + '</span></div><button class="lnk" data-l="' + id + '">' + ic('eye', 14) + 'Detail & Stempel</button>' : '<button class="btn btn-p btn-sm" data-i="' + x.u + '">' + ic('send', 14) + 'Kirim pengingat</button>') + '</div>';
        }).join('') + '</div></div>';
      $('#selP').onchange = function () { p = this.value; Store.muat(INTI.urai(p).y).then(render); render(); };
      $('#btnIng').onclick = function () { App.kirimPengingat(p, belum.map(function (x) { return x.u; }), this); };
      el.onclick = function (e) {
        var b = e.target.closest('[data-f],[data-l],[data-s],[data-i],[data-m]'); if (!b) return;
        if (b.dataset.f !== undefined) { fs = b.dataset.f; render(); }
        else if (b.dataset.l) Hal.detailLaporan(b.dataset.l);
        else if (b.dataset.s) Hal.stempel(b.dataset.s);
        else if (b.dataset.i) App.kirimPengingat(p, [b.dataset.i], b);
        else if (b.dataset.m) Hal.menuAdminLaporan(b, b.dataset.m);
      };
    }
    render();
    Store.muat(INTI.urai(p).y).then(function () { if (App.rute().tab === 'status') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', function () { if (App.rute().tab === 'status') render(); }));
  }

  /* ---------- Ketepatan Lapor 17 × 12 ---------- */
  function hitungKetepatan(y) {
    var S = App.S, units = App.unitScope(), ix = Store.ix([y]), now = App.now();
    var rows = units.map(function (u) { return { u: u, sk: INTI.skorUnit(ix, u, y, now, S.set) }; });
    var bln = []; for (var m = 0; m < 12; m++) { var lapor = 0, tepat = 0, jatuh = false; rows.forEach(function (r) { var k = r.sk.sel[m].kode; if (k === 'TEPAT' || k === 'TERLAMBAT') lapor++; if (k === 'TEPAT') tepat++; if (k !== 'BJT') jatuh = true; }); bln.push({ lapor: lapor, tepat: tepat, aktif: jatuh }); }
    return { rows: rows, bln: bln, units: units };
  }
  function tabKetepatan(el, r) {
    var S = App.S, y = +(r.q.y || INTI.urai(S.wajib).y), urut = 'nama', q = '', kartu = window.innerWidth < 768;
    function render() {
      var K = hitungKetepatan(y), rows = K.rows.filter(function (x) { return !q || App.namaUnit(x.u).toLowerCase().indexOf(q) > -1; });
      if (urut === 'skor') rows.sort(function (a, b) { return (b.sk.skor === null ? -1 : b.sk.skor) - (a.sk.skor === null ? -1 : a.sk.skor) || a.sk.rataHari - b.sk.rataHari; });
      if (urut === 'buruk') rows.sort(function (a, b) { return (a.sk.skor === null ? 999 : a.sk.skor) - (b.sk.skor === null ? 999 : b.sk.skor); });
      var tot = { tp: 0, tl: 0, bl: 0, jt: 0 }; K.rows.forEach(function (x) { tot.tp += x.sk.tepat; tot.tl += x.sk.telat; tot.bl += x.sk.belum; tot.jt += x.sk.jatuh; });
      var skorKab = tot.jt ? Math.round(tot.tp / tot.jt * 1000) / 10 : null;
      function sel(st) { var m = INTI.STATUS[st.kode]; return '<div class="kc ' + m.kelas + '" title="' + esc(m.label + (st.h ? ' • ' + INTI.fmtTgl(st.h.kp, true) : '')) + '">' + (st.kode === 'TEPAT' ? ic('check', 15) : st.kode === 'TERLAMBAT' ? '+' + st.hari : st.kode === 'BELUM' ? ic('x', 15) : st.kode === 'MENUNGGU' ? ic('hourglass', 14) : '–') + '</div>'; }
      var isi = kartu ? '<div class="flex col g6" style="padding:12px">' + rows.map(function (x) {
        var k = INTI.kelasSkor(x.sk.skor, S.set);
        return '<div class="mc"><div class="flex between"><b>' + esc(App.namaUnit(x.u)) + '</b><b class="' + k + '-tx">' + (x.sk.skor === null ? '–' : String(x.sk.skor).replace('.', ',') + '%') + '</b></div><div class="tl12" style="grid-template-columns:repeat(6,1fr)">' + x.sk.sel.map(function (s, i) { var m = INTI.STATUS[s.kode]; return '<div class="kc ' + m.kelas + '" style="height:38px">' + INTI.BLN[i] + '<span>' + (s.kode === 'TEPAT' ? '✓' : s.kode === 'TERLAMBAT' ? '+' + s.hari : s.kode === 'BELUM' ? '✕' : s.kode === 'MENUNGGU' ? '…' : '–') + '</span></div>'; }).join('') + '</div><div class="fs11 mut">Tepat ' + x.sk.tepat + ' • Terlambat ' + x.sk.telat + ' • Belum ' + x.sk.belum + ' • rata-rata ' + String(x.sk.rataHari).replace('.', ',') + ' hr</div></div>';
      }).join('') + '</div>' :
        '<div class="mx-wrap" style="max-height:none"><table class="mx mx-kt" style="--w1:190px"><thead><tr><th class="stk" style="min-width:190px">Puskesmas</th>' + INTI.BLN.map(function (b) { return '<th>' + b + '</th>'; }).join('') + '<th class="bl" title="Tepat waktu">Tepat</th><th title="Terlambat">Telat</th><th title="Belum lapor">Belum</th><th>Skor</th><th title="Rata-rata hari terlambat">Rata hr</th></tr></thead><tbody>' +
        rows.map(function (x) {
          var k = INTI.kelasSkor(x.sk.skor, S.set);
          return '<tr><td class="stk"><b>' + esc(App.namaUnit(x.u)) + '</b>' + (x.sk.historis ? '<div class="fs11 mut">memuat data historis</div>' : '') + '</td>' + x.sk.sel.map(function (s) { return '<td>' + sel(s) + '</td>'; }).join('') +
            '<td class="bl ok-tx fw7">' + x.sk.tepat + '</td><td class="warn-tx fw7">' + x.sk.telat + '</td><td class="bad-tx fw7">' + x.sk.belum + '</td><td><span class="badge b-' + k + '">' + (x.sk.skor === null ? '–' : String(x.sk.skor).replace('.', ',') + '%') + '</span></td><td>' + String(x.sk.rataHari).replace('.', ',') + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td class="stk">KABUPATEN (lapor / unit)</td>' + K.bln.map(function (b) { return '<td>' + (b.aktif ? b.lapor + '/' + K.units.length : '–') + '</td>'; }).join('') + '<td class="bl">' + tot.tp + '</td><td>' + tot.tl + '</td><td>' + tot.bl + '</td><td>' + (skorKab === null ? '–' : String(skorKab).replace('.', ',') + '%') + '</td><td></td></tr></tfoot></table></div>';
      el.innerHTML = kepala('Ketepatan lapor ' + K.units.length + ' puskesmas × 12 bulan tahun ' + y + '. Skor = Tepat Waktu ÷ periode yang tenggatnya sudah lewat.', '<select class="sel" id="selY" style="width:auto">' + opsiTahun(y) + '</select><button class="btn btn-s" data-x="xlsx">' + ic('sheet', 16) + 'Excel</button><button class="btn btn-s" data-x="pdf">' + ic('printer', 16) + 'PDF</button>') +
        App.tabBar('monitoring', 'ketepatan') +
        '<div class="card p0"><div class="tbl-tools"><div class="card-t">Matriks Ketepatan ' + y + ' <span class="badge b-' + INTI.kelasSkor(skorKab, S.set) + '">Kabupaten ' + (skorKab === null ? '–' : String(skorKab).replace('.', ',') + '%') + '</span></div>' +
        '<div class="inp-ic sm" style="width:200px">' + ic('search', 16) + '<input class="inp" id="kq" placeholder="Cari puskesmas..." value="' + esc(q) + '"></div><select class="sel sm" id="kUrut" style="width:auto"><option value="nama">Urut: nama</option><option value="skor"' + (urut === 'skor' ? ' selected' : '') + '>Skor tertinggi</option><option value="buruk"' + (urut === 'buruk' ? ' selected' : '') + '>Perlu perhatian</option></select>' +
        '<div class="seg"><button data-v="0" class="' + (!kartu ? 'on' : '') + '">' + ic('heat', 15) + ' Matriks</button><button data-v="1" class="' + (kartu ? 'on' : '') + '">' + ic('layers', 15) + ' Kartu</button></div></div>' + isi +
        '<div class="tbl-foot"><div class="legend"><span><i style="background:var(--ok-bg)"></i>Tepat Waktu</span><span><i style="background:var(--warn-bg)"></i>Terlambat (+hari)</span><span><i style="background:var(--bad-bg)"></i>Belum Lapor</span><span><i style="background:var(--info-bg)"></i>Menunggu</span><span><i style="background:#F8FAFC;border:1px solid var(--line)"></i>Belum jatuh tempo</span></div><span>Ambang: hijau ≥ ' + (S.set.AMBANG_HIJAU || 90) + '%, kuning ≥ ' + (S.set.AMBANG_KUNING || 70) + '%</span></div></div>';
      $('#selY').onchange = function () { y = +this.value; Store.muat(y).then(render); render(); };
      var deb = UI.debounce(function (v) { q = v.toLowerCase(); render(); var i = $('#kq'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 160);
      $('#kq').oninput = function () { deb(this.value); };
      $('#kUrut').onchange = function () { urut = this.value; render(); };
      el.onclick = function (e) {
        var v = e.target.closest('[data-v]'); if (v) { kartu = v.dataset.v === '1'; render(); return; }
        var x = e.target.closest('[data-x]'); if (x) Ekspor.ketepatan(x.dataset.x, y, hitungKetepatan(y), x);
      };
    }
    render();
    Store.muat(y).then(function () { if (App.rute().tab === 'ketepatan') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', function () { if (App.rute().tab === 'ketepatan') render(); }));
  }

  /* ---------- Laporan Masuk ---------- */
  function tabMasuk(el, r) {
    var S = App.S, f = { y: INTI.urai(S.wajib).y, m: '', u: '', st: '', kt: '', hal: 1, per: 20 };
    function render() {
      var ix = Store.ix([f.y]);
      var list = ix.HL.filter(function (h) {
        return (!f.m || h.m === +f.m) && (!f.u || h.u === f.u) && (!f.st || h.st === f.st) && (!f.kt || h.kt === f.kt) && App.unitScope().concat(S.units.map(function (u) { return u.kode; })).indexOf(h.u) > -1;
      }).sort(function (a, b) { return b.kl - a.kl; });
      var total = list.length, hal = Math.min(f.hal, Math.max(1, Math.ceil(total / f.per))), tampil = list.slice((hal - 1) * f.per, hal * f.per);
      el.innerHTML = kepala('Semua laporan yang masuk, terbaru di atas. Admin dapat membuka kunci, mengunci, atau menghapus laporan (ketepatan tetap tersimpan).') + App.tabBar('monitoring', 'masuk', { masuk: total }) +
        '<div class="card flex wrap"><select class="sel sm" data-f="y" style="width:auto">' + opsiTahun(f.y) + '</select><select class="sel sm" data-f="m" style="width:auto"><option value="">Semua bulan</option>' + INTI.BULAN.map(function (b, i) { return '<option value="' + (i + 1) + '"' + (+f.m === i + 1 ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select>' +
        '<select class="sel sm" data-f="u" style="width:auto;max-width:220px"><option value="">Semua puskesmas</option>' + S.units.map(function (u) { return '<option value="' + u.kode + '"' + (f.u === u.kode ? ' selected' : '') + '>' + esc(u.nama) + '</option>'; }).join('') + '</select>' +
        '<select class="sel sm" data-f="st" style="width:auto"><option value="">Semua status</option>' + ['Terkirim', 'Dibuka untuk Revisi', 'Dikunci', 'Dihapus'].map(function (s) { return '<option' + (f.st === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        '<select class="sel sm" data-f="kt" style="width:auto"><option value="">Semua ketepatan</option><option value="T"' + (f.kt === 'T' ? ' selected' : '') + '>Tepat Waktu</option><option value="L"' + (f.kt === 'L' ? ' selected' : '') + '>Terlambat</option></select></div>' +
        '<div class="card p0 tbl-cards"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Puskesmas</th><th>Periode</th><th>Kirim pertama</th><th>Kirim terakhir</th><th>Ketepatan</th><th class="center">Versi</th><th class="num">Total</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' +
        (tampil.length ? tampil.map(function (h) {
          return '<tr class="klik" data-l="' + h.id + '"><td><b>' + esc(App.namaUnit(h.u)) + '</b><div class="fs11 mut mono">' + h.id + '</div></td><td>' + INTI.labelBulan(h.p) + '</td><td class="nowrap">' + INTI.fmtTgl(h.kp, true) + '</td><td class="nowrap">' + INTI.fmtTgl(h.kl, true) + '</td><td>' + UI.badgeStatus(h.kt === 'T' ? 'TEPAT' : 'TERLAMBAT', h.hr) + (h.sb === 'Historis' ? '<div class="fs11 mut">historis</div>' : '') + '</td><td class="center">v' + h.v + '</td><td class="num">' + (h.j === 'N' ? '<span class="badge b-muted b-sm">Nihil</span>' : A(h.tt)) + '</td><td>' + UI.badge(h.st, h.st === 'Terkirim' ? 'ok' : h.st === 'Dibuka untuk Revisi' ? 'warn' : h.st === 'Dikunci' ? 'vio' : 'bad') + '</td>' +
            '<td class="right"><div class="aksi"><button data-s="' + h.id + '" aria-label="Stempel" title="Stempel Digital">' + ic('stamp') + '</button>' + (App.isAdmin() ? '<button data-m="' + h.id + '" aria-label="Aksi admin">' + ic('more') + '</button>' : '') + '</div></td></tr>';
        }).join('') : '<tr><td colspan="9">' + UI.kosong('Tidak ada laporan', 'Ubah filter.', 'inbox') + '</td></tr>') + '</tbody></table></div>' +
        '<div class="mcards">' + tampil.map(function (h) { return '<div class="mc" data-l="' + h.id + '"><div class="flex between"><b>' + esc(App.namaPendek(h.u)) + ' • ' + INTI.labelBln(h.p) + '</b>' + UI.badgeStatus(h.kt === 'T' ? 'TEPAT' : 'TERLAMBAT', h.hr, true) + '</div><div class="mc-r"><span>Dikirim</span><span>' + INTI.fmtTgl(h.kp, true) + ' • v' + h.v + '</span></div><div class="mc-r"><span>Total</span><span>' + (h.j === 'N' ? 'Nihil' : A(h.tt)) + ' • ' + esc(h.st) + '</span></div></div>'; }).join('') + '</div>' +
        '<div class="tbl-foot"><span>' + total + ' laporan</span>' + UI.paginasi(total, hal, f.per) + '</div></div>';
      el.onchange = function (e) { var k = e.target.dataset.f; if (!k) return; f[k] = k === 'y' ? +e.target.value : e.target.value; f.hal = 1; if (k === 'y') Store.muat(f.y).then(render); render(); };
      el.onclick = function (e) {
        var b = e.target.closest('[data-pg]'); if (b) { f.hal = +b.dataset.pg; render(); return; }
        var s = e.target.closest('[data-s]'); if (s) { e.stopPropagation(); Hal.stempel(s.dataset.s); return; }
        var m = e.target.closest('[data-m]'); if (m) { e.stopPropagation(); Hal.menuAdminLaporan(m, m.dataset.m); return; }
        var l = e.target.closest('[data-l]'); if (l) Hal.detailLaporan(l.dataset.l);
      };
    }
    render();
    Store.muat(f.y).then(function () { if (App.rute().tab === 'masuk') render(); }, function (e) { UI.toast(e.message, 'bad'); });
    App.ikat(Bus.on('cube', function () { if (App.rute().tab === 'masuk') render(); }));
    if (r.q.id) setTimeout(function () { Hal.detailLaporan(r.q.id); }, 50);
  }

  /* ---------- Revisi (Dinkes) ---------- */
  function tabRevisi(el) {
    var fs = 'Diajukan';
    function render(j) {
      var semua = (j && j.list) || null, list = semua ? semua.filter(function (x) { return !fs || x.status === fs; }) : null;
      var n = function (s) { return semua ? semua.filter(function (x) { return x.status === s; }).length : 0; };
      el.innerHTML = kepala(App.isAdmin() ? 'Setujui atau tolak pengajuan revisi. Persetujuan membuka laporan untuk diisi ulang; ketepatan tidak berubah.' : 'Daftar pengajuan revisi (keputusan oleh Admin Dinkes).') + App.tabBar('monitoring', 'revisi', { revisi: n('Diajukan') || '' }) +
        '<div class="card"><div class="chips">' + [['Diajukan', 'Menunggu'], ['Disetujui', 'Disetujui'], ['Selesai', 'Selesai'], ['Ditolak', 'Ditolak'], ['', 'Semua']].map(function (x) { return '<button class="chip' + (fs === x[0] ? ' on' : '') + '" data-f="' + x[0] + '">' + x[1] + (x[0] ? ' (' + n(x[0]) + ')' : '') + '</button>'; }).join('') + '</div></div>' +
        '<div class="card p0">' + (list === null ? '<div style="padding:18px">' + UI.skel(50, 3) + '</div>' : list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Puskesmas</th><th>Periode</th><th>Alasan</th><th>Diajukan</th><th>Status</th><th>Keputusan</th><th class="right">Aksi</th></tr></thead><tbody>' + list.map(function (x) {
          return '<tr><td><b>' + esc(App.namaUnit(x.unit)) + '</b><div class="fs11 mut">' + esc(x.oleh) + '</div></td><td class="nowrap">' + INTI.labelBulan(x.periode) + '</td><td style="max-width:340px">' + esc(x.alasan) + '</td><td class="nowrap">' + UI.waktuRelatif(x.diajukan, App.now()) + '</td><td>' + UI.badge(x.status, x.status === 'Diajukan' ? 'info' : x.status === 'Ditolak' ? 'bad' : x.status === 'Disetujui' ? 'warn' : 'ok') + '</td><td class="fs12 mut">' + (x.pemutus ? esc(x.pemutus) + ' • ' + INTI.fmtTgl(x.diputuskan) + (x.catatan ? '<div>' + esc(x.catatan) + '</div>' : '') : '–') + '</td>' +
            '<td class="right nowrap"><button class="btn btn-g btn-xs" data-l="' + x.laporan + '">' + ic('eye', 13) + 'Lihat</button>' + (App.isAdmin() && x.status === 'Diajukan' ? ' <button class="btn btn-ok btn-xs" data-rv="Disetujui" data-id="' + esc(x.id) + '">' + ic('check', 13) + 'Setujui</button> <button class="btn btn-s btn-xs" data-rv="Ditolak" data-id="' + esc(x.id) + '">' + ic('x', 13) + 'Tolak</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : UI.kosong('Tidak ada pengajuan', fs ? 'Tidak ada pengajuan berstatus ' + fs + '.' : '', 'compare')) + '</div>';
      el.onclick = function (e) {
        var c = e.target.closest('[data-f]'); if (c) { fs = c.dataset.f; render(j); return; }
        var l = e.target.closest('[data-l]'); if (l) { Hal.detailLaporan(l.dataset.l); return; }
        var b = e.target.closest('[data-rv]'); if (b) Hal.putuskanRevisi(b.dataset.id, b.dataset.rv, b).then(muat);
      };
    }
    function muat() { var s = Store.ambil('revisi', 'revisi.list', {}, { paksa: true }); s.p.then(render, function (e) { UI.toast(e.message, 'bad'); }); }
    var s = Store.ambil('revisi', 'revisi.list', {});
    render(s.cache);
    s.p.then(render, function (e) { UI.toast(e.message, 'bad'); render({ list: [] }); });
    App.ikat(Bus.on('swr:revisi', render));
  }

  Hal.monitoring = function (el, r) {
    ({ status: tabStatus, ketepatan: tabKetepatan, masuk: tabMasuk, revisi: tabRevisi })[r.tab](el, r);
  };
})();
