/* =====================================================================
 * ESTEPEL — ekspor.js
 * Excel (ExcelJS: sel gabung, garis tepi, rumus SUM, panel beku, cetak lanskap),
 * PDF (jsPDF + AutoTable: kop Dinkes, periode, tanggal cetak, nomor halaman),
 * QR (qrcode-generator) & Stempel Digital (PNG/PDF/bagikan).
 * Pustaka dimuat MALAS (hanya saat ekspor) agar aplikasi tetap ringan.
 * ===================================================================== */
var Ekspor = (function () {
  'use strict';
  var esc = UI.esc, A = UI.A, UMUR = INTI.UMUR;
  var CDN = {
    exceljs: 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
    jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    autotable: 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js',
    qrcode: 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'
  };
  var LOKAL = { exceljs: 'exceljs.min.js', jspdf: 'jspdf.umd.min.js', autotable: 'jspdf.plugin.autotable.min.js', qrcode: 'qrcode.min.js' };
  var dimuat = {};
  function muatSkrip(nama) {
    if (dimuat[nama]) return dimuat[nama];
    var urls = (window.ESTEPEL_CONFIG && window.ESTEPEL_CONFIG.PUSTAKA_LOKAL ? ['./vendor/' + LOKAL[nama]] : []).concat([CDN[nama]]);
    dimuat[nama] = new Promise(function (res, rej) {
      (function coba(i) {
        if (i >= urls.length) { delete dimuat[nama]; rej(new Error('Gagal memuat pustaka ' + nama + '. Periksa koneksi internet.')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { res(); }; s.onerror = function () { s.remove(); coba(i + 1); };
        document.head.appendChild(s);
      })(0);
    });
    return dimuat[nama];
  }
  function muatPDF() { return muatSkrip('jspdf').then(function () { return muatSkrip('autotable'); }).then(function () { return window.jspdf.jsPDF; }); }
  function sibuk(btn, p) { UI.sibuk(btn, true); return p.then(function (x) { UI.sibuk(btn, false); return x; }, function (e) { UI.sibuk(btn, false); if (e) UI.toast(e.message || String(e), 'bad'); }); }
  function catat(jenis, periode, format) { API.call('ekspor.catat', { jenis: jenis, periode: periode, format: format }).catch(function () { /* abaikan */ }); }
  function instansi() { return (App.S.set.NAMA_INSTANSI || 'DINAS KESEHATAN KAB. MINAHASA SELATAN').toUpperCase(); }
  function waktuEkspor() { return INTI.fmtTglJam(App.now()) + ' oleh ' + (App.S.user ? App.S.user.nama : '-'); }

  /* ===================== Helper ExcelJS ===================== */
  var TIPIS = { style: 'thin', color: { argb: 'FF94A3B8' } };
  var BORDER = { top: TIPIS, left: TIPIS, bottom: TIPIS, right: TIPIS };
  function kol(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function sel(ws, r, c, v, gaya) {
    var x = ws.getCell(r, c);
    x.value = v;
    gaya = gaya || {};
    x.border = BORDER;
    x.alignment = { horizontal: gaya.kiri ? 'left' : 'center', vertical: 'middle', wrapText: !!gaya.wrap };
    if (gaya.tebal) x.font = { bold: true, size: gaya.ukuran || 10, color: gaya.warna ? { argb: gaya.warna } : undefined };
    else x.font = { size: gaya.ukuran || 10 };
    if (gaya.isi) x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: gaya.isi } };
    if (typeof v === 'number' || (v && v.formula)) x.numFmt = '#,##0';
    return x;
  }
  function judulExcel(ws, baris, teks, nKol, ukuran, tebal) {
    ws.mergeCells(baris, 1, baris, nKol);
    var c = ws.getCell(baris, 1); c.value = teks; c.font = { bold: tebal !== false, size: ukuran || 11 }; c.alignment = { horizontal: 'left', vertical: 'middle' };
  }
  function unduhWB(wb, nama) {
    return wb.xlsx.writeBuffer().then(function (buf) { UI.unduhBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nama); });
  }
  function bukuBaru() { var wb = new ExcelJS.Workbook(); wb.creator = 'ESTEPEL — ' + instansi(); wb.created = new Date(); return wb; }
  function lembar(wb, nama, ySplit, xSplit) {
    return wb.addWorksheet(nama.slice(0, 31).replace(/[\\/*?:\[\]]/g, '-'), {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } },
      views: [{ state: 'frozen', xSplit: xSplit || 0, ySplit: ySplit || 0 }]
    });
  }

  /* ===================== Rekapitulasi STP (format resmi, PRD F7) ===================== */
  function tulisRekap(ws, data, o, judulCakupan, per, total, catatanKaki) {
    var rinci = !!o.rinci, nUmur = rinci ? 24 : 12, hRows = rinci ? 3 : 2;
    var cL = 3 + nUmur, cP = cL + 1, cT = cP + 1, nKol = cT;
    judulExcel(ws, 1, 'REKAPITULASI STP ' + judulCakupan + ' (' + (rinci ? 'RINCI PER UMUR × L/P' : 'RINGKAS PER UMUR') + ')', nKol, 14);
    judulExcel(ws, 2, 'Instansi: ' + (data.instansi || instansi()), nKol, 11, false);
    judulExcel(ws, 3, 'Periode: ' + data.labelPer, nKol, 11, false);
    var h = 5, HD = 'FFE5EEFF';
    ws.mergeCells(h, 1, h + hRows - 1, 1); sel(ws, h, 1, 'No', { tebal: true, isi: HD });
    ws.mergeCells(h, 2, h + hRows - 1, 2); sel(ws, h, 2, 'Jenis Penyakit', { tebal: true, isi: HD });
    ws.mergeCells(h, 3, h, 2 + nUmur); sel(ws, h, 3, 'Golongan Umur (Tahun)', { tebal: true, isi: HD });
    ws.mergeCells(h, cL, h + hRows - 2, cP); sel(ws, h, cL, 'Total', { tebal: true, isi: HD });
    ws.mergeCells(h, cT, h + hRows - 1, cT); sel(ws, h, cT, 'Total', { tebal: true, isi: HD });
    if (rinci) {
      UMUR.forEach(function (g, i) { ws.mergeCells(h + 1, 3 + i * 2, h + 1, 4 + i * 2); sel(ws, h + 1, 3 + i * 2, g.label, { tebal: true, isi: HD }); sel(ws, h + 2, 3 + i * 2, 'L', { tebal: true, isi: HD }); sel(ws, h + 2, 4 + i * 2, 'P', { tebal: true, isi: HD }); });
    } else UMUR.forEach(function (g, i) { sel(ws, h + 1, 3 + i, g.label, { tebal: true, isi: HD }); });
    sel(ws, h + hRows - 1, cL, 'Laki-laki', { tebal: true, isi: HD }); sel(ws, h + hRows - 1, cP, 'Perempuan', { tebal: true, isi: HD });
    for (var r0 = h; r0 < h + hRows; r0++) for (var c0 = 1; c0 <= nKol; c0++) { var x = ws.getCell(r0, c0); x.border = BORDER; if (!x.fill) x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HD } }; x.font = { bold: true, size: 10 }; x.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; }
    var mulai = h + hRows, pen = App.S.penyakit.filter(function (p) { return p.aktif || (per[p.kode] && INTI.jumlahLP(per[p.kode]).T); });
    pen.forEach(function (p, i) {
      var r = mulai + i, v = per[p.kode] || INTI.nol24(), s = INTI.jumlahLP(v);
      sel(ws, r, 1, i + 1); sel(ws, r, 2, p.nama, { kiri: true });
      if (rinci) {
        v.forEach(function (x, k) { sel(ws, r, 3 + k, x); });
        var fL = [], fP = []; for (var k = 0; k < 12; k++) { fL.push(kol(3 + k * 2) + r); fP.push(kol(4 + k * 2) + r); }
        sel(ws, r, cL, { formula: fL.join('+'), result: s.L }); sel(ws, r, cP, { formula: fP.join('+'), result: s.P });
      } else {
        UMUR.forEach(function (g, k) { sel(ws, r, 3 + k, v[k * 2] + v[k * 2 + 1]); });
        sel(ws, r, cL, s.L); sel(ws, r, cP, s.P);
      }
      sel(ws, r, cT, { formula: kol(cL) + r + '+' + kol(cP) + r, result: s.T }, { tebal: true });
    });
    var akhir = mulai + pen.length - 1, rt = akhir + 1, ts = INTI.jumlahLP(total);
    ws.mergeCells(rt, 1, rt, 2); sel(ws, rt, 1, 'TOTAL KESELURUHAN', { tebal: true, isi: 'FFDCE9FF' });
    for (var c = 3; c <= nKol; c++) {
      var hasil = c === cL ? ts.L : c === cP ? ts.P : c === cT ? ts.T : rinci ? total[c - 3] : total[(c - 3) * 2] + total[(c - 3) * 2 + 1];
      sel(ws, rt, c, { formula: 'SUM(' + kol(c) + mulai + ':' + kol(c) + akhir + ')', result: hasil }, { tebal: true, isi: 'FFDCE9FF' });
    }
    var f = rt + 2;
    catatanKaki.forEach(function (t, i) { ws.mergeCells(f + i, 1, f + i, nKol); var x = ws.getCell(f + i, 1); x.value = t; x.font = { size: 9, italic: i > 0, color: { argb: 'FF475569' } }; });
    ws.getColumn(1).width = 5; ws.getColumn(2).width = 28;
    for (var cc = 3; cc <= 2 + nUmur; cc++) ws.getColumn(cc).width = rinci ? 6.5 : 8.5;
    ws.getColumn(cL).width = 11; ws.getColumn(cP).width = 11; ws.getColumn(cT).width = 11;
    ws.views = [{ state: 'frozen', xSplit: 2, ySplit: h + hRows - 1 }];
    ws.pageSetup.printTitlesRow = h + ':' + (h + hRows - 1);
  }
  function judulCakupan(units) {
    if (units.length === 1 && App.S.uMap[units[0]]) return 'PUSKESMAS ' + App.S.uMap[units[0]].nama.toUpperCase();
    return units.length < App.unitsAktif().length ? units.length + ' PUSKESMAS' : 'KABUPATEN';
  }
  function rekapExcel(j, o, nama) {
    return muatSkrip('exceljs').then(function () {
      var wb = bukuBaru(), jc = judulCakupan(j.units), bulan = INTI.daftarPeriode(j.dari, j.sampai).length;
      var kel = 'Kelengkapan laporan: ' + j.kelengkapan.masuk + ' dari ' + j.kelengkapan.harus + (bulan > 1 ? ' laporan (' + j.units.length + ' puskesmas × ' + bulan + ' bulan)' : ' puskesmas');
      var kaki = [kel, 'Diekspor: ' + INTI.fmtTglJam(j.waktu) + ' oleh ' + j.oleh + ' • Sumber: ESTEPEL — angka 0 berarti tidak ada kasus dilaporkan.'];
      tulisRekap(lembar(wb, bulan > 1 && j.perBulan.length ? 'Gabungan' : 'Rekap STP'), { instansi: j.instansi, labelPer: j.label }, o, jc, j.per, j.total, kaki);
      (j.perBulan || []).forEach(function (b) {
        tulisRekap(lembar(wb, INTI.labelBln(b.p)), { instansi: j.instansi, labelPer: INTI.labelBulan(b.p) }, o, jc, b.per, b.total,
          ['Laporan masuk: ' + b.masuk + ' dari ' + b.harus + ' puskesmas' + (b.belum.length ? ' • Belum lapor: ' + b.belum.join(', ') : ''), 'Diekspor: ' + INTI.fmtTglJam(j.waktu) + ' oleh ' + j.oleh]);
      });
      return unduhWB(wb, nama);
    });
  }
  function kop(doc, judul, sub) {
    var W = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
    doc.text('PEMERINTAH ' + String(App.S.set.NAMA_KABUPATEN || 'KABUPATEN MINAHASA SELATAN').toUpperCase(), W / 2, 12, { align: 'center' });
    doc.setFontSize(13); doc.text(instansi(), W / 2, 18, { align: 'center' });
    doc.setLineWidth(0.8); doc.line(10, 21.5, W - 10, 21.5); doc.setLineWidth(0.2); doc.line(10, 22.6, W - 10, 22.6);
    doc.setFontSize(11); doc.text(judul, W / 2, 29, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    if (sub) doc.text(sub, W / 2, 34, { align: 'center' });
    return 38;
  }
  function nomorHalaman(doc, kaki) {
    var n = doc.getNumberOfPages(), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    for (var i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
      doc.text((kaki || 'ESTEPEL') + ' • Dicetak ' + waktuEkspor(), 10, H - 6);
      doc.text('Halaman ' + i + ' dari ' + n, W - 10, H - 6, { align: 'right' });
    }
  }
  var GAYA_PDF = { theme: 'grid', styles: { fontSize: 7, cellPadding: 1.1, halign: 'center', valign: 'middle', lineColor: [203, 213, 225], lineWidth: 0.15, textColor: [15, 23, 42] }, headStyles: { fillColor: [229, 238, 255], textColor: [15, 23, 42], fontStyle: 'bold' }, footStyles: { fillColor: [220, 233, 255], textColor: [15, 23, 42], fontStyle: 'bold' }, margin: { left: 8, right: 8, bottom: 12 } };
  function tabelPDF(doc, o) { doc.autoTable(Object.assign({}, GAYA_PDF, o, { styles: Object.assign({}, GAYA_PDF.styles, o.styles || {}) })); return doc.lastAutoTable.finalY; }
  function rekapPDF(j, o, nama) {
    return muatPDF().then(function (jsPDF) {
      var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }), rinci = !!o.rinci;
      var y = kop(doc, 'REKAPITULASI STP ' + judulCakupan(j.units) + ' (' + (rinci ? 'RINCI PER UMUR × L/P' : 'RINGKAS PER UMUR') + ')', 'Periode: ' + j.label);
      var head1 = [{ content: 'No', rowSpan: rinci ? 3 : 2 }, { content: 'Jenis Penyakit', rowSpan: rinci ? 3 : 2 }, { content: 'Golongan Umur (Tahun)', colSpan: rinci ? 24 : 12 }, { content: 'Total', colSpan: 2, rowSpan: rinci ? 2 : 1 }, { content: 'Total', rowSpan: rinci ? 3 : 2 }];
      var head = rinci ? [head1, UMUR.map(function (g) { return { content: g.label, colSpan: 2 }; }), [].concat.apply([], UMUR.map(function () { return ['L', 'P']; })).concat(['Laki-laki', 'Perempuan'])] : [head1, UMUR.map(function (g) { return g.label; }).concat(['Laki-laki', 'Perempuan'])];
      var pen = App.S.penyakit.filter(function (p) { return p.aktif || (j.per[p.kode] && INTI.jumlahLP(j.per[p.kode]).T); });
      var body = pen.map(function (p, i) { var v = j.per[p.kode] || INTI.nol24(), s = INTI.jumlahLP(v); return [i + 1, p.nama].concat(rinci ? v : UMUR.map(function (g, k) { return v[k * 2] + v[k * 2 + 1]; })).concat([s.L, s.P, s.T]).map(function (x) { return typeof x === 'number' ? A(x) : x; }); });
      var t = j.total, ts = INTI.jumlahLP(t);
      var foot = [[{ content: 'TOTAL KESELURUHAN', colSpan: 2 }].concat((rinci ? t : UMUR.map(function (g, k) { return t[k * 2] + t[k * 2 + 1]; })).concat([ts.L, ts.P, ts.T]).map(A))];
      y = tabelPDF(doc, { startY: y, head: head, body: body, foot: foot, styles: { fontSize: rinci ? 5.6 : 7.4 }, columnStyles: { 1: { halign: 'left', cellWidth: rinci ? 30 : 42 } } });
      doc.setFontSize(8); doc.setTextColor(71, 85, 105);
      doc.text('Kelengkapan laporan: ' + j.kelengkapan.masuk + ' dari ' + j.kelengkapan.harus + '. Angka 0 = tidak ada kasus dilaporkan.', 10, Math.min(y + 6, doc.internal.pageSize.getHeight() - 14));
      nomorHalaman(doc, 'Rekapitulasi STP — ' + j.label);
      doc.save(nama);
    });
  }

  /* ===================== Matriks Unit × Penyakit ===================== */
  function matriks(fmt, d, btn) {
    var F = d.F, label = INTI.labelRentang(F.dari, F.sampai), sub = d.sub, nama = 'Matriks_Unit_Penyakit_' + (F.dari === F.sampai ? F.dari : F.dari + '_sd_' + F.sampai);
    var umurLb = F.umur >= 0 ? ' • Kelompok umur ' + UMUR[F.umur].panjang : '';
    catat('Matriks unit × penyakit', label, fmt);
    if (fmt === 'pdf') return sibuk(btn, muatPDF().then(function (jsPDF) {
      var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }), per = sub.length === 1 ? 14 : sub.length === 2 ? 8 : 5;
      for (var i = 0; i < d.pen.length; i += per) {
        if (i) doc.addPage();
        var grp = d.pen.slice(i, i + per), y = kop(doc, 'MATRIKS UNIT × PENYAKIT (' + (i / per + 1) + '/' + Math.ceil(d.pen.length / per) + ')', 'Periode: ' + label + umurLb);
        var head = [[{ content: 'Puskesmas', rowSpan: 2 }].concat(grp.map(function (p) { return { content: p.nama, colSpan: sub.length }; })), [].concat.apply([], grp.map(function () { return sub; }))];
        var body = d.units.map(function (u) { return [App.namaPendek(u)].concat([].concat.apply([], grp.map(function (p) { var c = (d.m.m[u] || {})[p.kode] || { L: 0, P: 0, T: 0 }; return sub.map(function (s) { return c[s]; }); }))); });
        var foot = [['TOTAL KABUPATEN'].concat([].concat.apply([], grp.map(function (p) { var c = { L: 0, P: 0, T: 0 }; d.units.forEach(function (u) { var x = (d.m.m[u] || {})[p.kode]; if (x) { c.L += x.L; c.P += x.P; c.T += x.T; } }); return sub.map(function (s) { return c[s]; }); })))];
        tabelPDF(doc, { startY: y, head: head, body: body, foot: foot, columnStyles: { 0: { halign: 'left', cellWidth: 34 } } });
      }
      doc.addPage();
      var y2 = kop(doc, 'TOTAL PER PUSKESMAS', 'Periode: ' + label + umurLb);
      tabelPDF(doc, { startY: y2, head: [['Puskesmas', 'Laki-laki', 'Perempuan', 'Total']], body: d.units.map(function (u) { var t = d.m.unit[u] || { L: 0, P: 0, T: 0 }; return [App.namaUnit(u), A(t.L), A(t.P), A(t.T)]; }), foot: [['TOTAL', A(d.m.total.L), A(d.m.total.P), A(d.m.total.T)]], columnStyles: { 0: { halign: 'left' } }, styles: { fontSize: 9 } });
      nomorHalaman(doc, 'Matriks Unit × Penyakit — ' + label);
      doc.save(nama + '.pdf');
    }));
    return sibuk(btn, muatSkrip('exceljs').then(function () {
      var wb = bukuBaru(), ws = lembar(wb, 'Matriks'), nK = 1 + d.pen.length * sub.length + 3, HD = 'FFE5EEFF';
      judulExcel(ws, 1, 'MATRIKS UNIT × PENYAKIT', nK, 14); judulExcel(ws, 2, 'Instansi: ' + instansi(), nK, 11, false); judulExcel(ws, 3, 'Periode: ' + label + umurLb, nK, 11, false);
      ws.mergeCells(5, 1, 6, 1); sel(ws, 5, 1, 'Puskesmas', { tebal: true, isi: HD });
      d.pen.forEach(function (p, i) { var c = 2 + i * sub.length; if (sub.length > 1) ws.mergeCells(5, c, 5, c + sub.length - 1); sel(ws, 5, c, p.nama, { tebal: true, isi: HD, wrap: true }); sub.forEach(function (s, k) { sel(ws, 6, c + k, s, { tebal: true, isi: HD }); }); });
      var cT = 2 + d.pen.length * sub.length;
      ws.mergeCells(5, cT, 5, cT + 2); sel(ws, 5, cT, 'Total Puskesmas', { tebal: true, isi: HD }); ['L', 'P', 'Total'].forEach(function (s, k) { sel(ws, 6, cT + k, s, { tebal: true, isi: HD }); });
      d.units.forEach(function (u, i) {
        var r = 7 + i; sel(ws, r, 1, App.namaUnit(u), { kiri: true });
        var cl = [], cp = [];
        d.pen.forEach(function (p, j) { var c = (d.m.m[u] || {})[p.kode] || { L: 0, P: 0, T: 0 }, b = 2 + j * sub.length; sub.forEach(function (s, k) { sel(ws, r, b + k, c[s]); if (s === 'L') cl.push(kol(b + k) + r); if (s === 'P') cp.push(kol(b + k) + r); }); });
        var t = d.m.unit[u] || { L: 0, P: 0, T: 0 };
        sel(ws, r, cT, cl.length ? { formula: cl.join('+'), result: t.L } : t.L); sel(ws, r, cT + 1, cp.length ? { formula: cp.join('+'), result: t.P } : t.P);
        sel(ws, r, cT + 2, { formula: kol(cT) + r + '+' + kol(cT + 1) + r, result: t.T }, { tebal: true });
      });
      var rt = 7 + d.units.length, a = 7, z = rt - 1;
      sel(ws, rt, 1, 'TOTAL KABUPATEN', { tebal: true, isi: 'FFDCE9FF' });
      for (var c = 2; c <= cT + 2; c++) sel(ws, rt, c, { formula: 'SUM(' + kol(c) + a + ':' + kol(c) + z + ')' }, { tebal: true, isi: 'FFDCE9FF' });
      ws.getColumn(1).width = 28; for (var cc = 2; cc <= cT + 2; cc++) ws.getColumn(cc).width = sub.length === 1 ? 10 : 6.5;
      ws.getRow(5).height = 42;
      ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 6 }];
      var f = rt + 2; judulExcel(ws, f, 'Diekspor ' + waktuEkspor() + ' • Sumber: ESTEPEL', nK, 9, false);
      return unduhWB(wb, nama + '.xlsx');
    }));
  }

  /* ===================== Ketepatan Lapor ===================== */
  function ketepatan(fmt, y, K, btn) {
    var nama = 'Ketepatan_Lapor_' + y;
    var tx = function (st) { return st.kode === 'TEPAT' ? '✓' : st.kode === 'TERLAMBAT' ? '+' + st.hari : st.kode === 'BELUM' ? '✕' : st.kode === 'MENUNGGU' ? '…' : '–'; };
    var warna = { TEPAT: 'FFDCFCE7', TERLAMBAT: 'FFFEF3C7', BELUM: 'FFFEE2E2', MENUNGGU: 'FFDBEAFE', BJT: 'FFF8FAFC' };
    catat('Ketepatan lapor', String(y), fmt);
    if (fmt === 'pdf') return sibuk(btn, muatPDF().then(function (jsPDF) {
      var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }), yy = kop(doc, 'KETEPATAN LAPORAN STP PUSKESMAS TAHUN ' + y, 'Tepat Waktu = dikirim ≤ tenggat • +N = terlambat N hari • ✕ = belum lapor • … = menunggu • – = belum jatuh tempo');
      var rgb = { TEPAT: [220, 252, 231], TERLAMBAT: [254, 243, 199], BELUM: [254, 226, 226], MENUNGGU: [219, 234, 254], BJT: [248, 250, 252] };
      tabelPDF(doc, { startY: yy, head: [['Puskesmas'].concat(INTI.BLN).concat(['Tepat', 'Terlambat', 'Belum', 'Skor %', 'Rata hari'])],
        body: K.rows.map(function (r) { return [App.namaUnit(r.u)].concat(r.sk.sel.map(function (s) { return tx(s).replace('✓', 'V').replace('✕', 'X'); })).concat([r.sk.tepat, r.sk.telat, r.sk.belum, r.sk.skor === null ? '-' : String(r.sk.skor).replace('.', ','), String(r.sk.rataHari).replace('.', ',')]); }),
        didParseCell: function (dd) { if (dd.section === 'body' && dd.column.index >= 1 && dd.column.index <= 12) { var st = K.rows[dd.row.index].sk.sel[dd.column.index - 1]; dd.cell.styles.fillColor = rgb[st.kode]; } },
        columnStyles: { 0: { halign: 'left', cellWidth: 44 } }, styles: { fontSize: 8 } });
      nomorHalaman(doc, 'Ketepatan Lapor ' + y);
      doc.save(nama + '.pdf');
    }));
    return sibuk(btn, muatSkrip('exceljs').then(function () {
      var wb = bukuBaru(), ws = lembar(wb, 'Ketepatan ' + y), HD = 'FFE5EEFF', nK = 18;
      judulExcel(ws, 1, 'KETEPATAN LAPORAN STP PUSKESMAS TAHUN ' + y, nK, 14); judulExcel(ws, 2, 'Instansi: ' + instansi(), nK, 11, false);
      judulExcel(ws, 3, 'Keterangan: ✓ tepat waktu • +N terlambat N hari • ✕ belum lapor • … menunggu • – belum jatuh tempo', nK, 9, false);
      ['Puskesmas'].concat(INTI.BULAN).concat(['Tepat', 'Terlambat', 'Belum', 'Skor (%)', 'Rata hari']).forEach(function (t, i) { sel(ws, 5, i + 1, t, { tebal: true, isi: HD, wrap: true }); });
      K.rows.forEach(function (r, i) {
        var b = 6 + i; sel(ws, b, 1, App.namaUnit(r.u), { kiri: true });
        r.sk.sel.forEach(function (s, m) { sel(ws, b, 2 + m, tx(s), { isi: warna[s.kode] }); });
        [r.sk.tepat, r.sk.telat, r.sk.belum, r.sk.skor === null ? '-' : r.sk.skor, r.sk.rataHari].forEach(function (v, k) { sel(ws, b, 14 + k, v); });
      });
      ws.getColumn(1).width = 30; for (var c = 2; c <= 13; c++) ws.getColumn(c).width = 10; for (c = 14; c <= 18; c++) ws.getColumn(c).width = 10;
      ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 5 }];
      judulExcel(ws, 7 + K.rows.length, 'Skor = Tepat Waktu ÷ jumlah periode yang tenggatnya sudah lewat × 100%. Diekspor ' + waktuEkspor(), nK, 9, false);
      return unduhWB(wb, nama + '.xlsx');
    }));
  }

  /* ===================== Rincian umur ===================== */
  function umur(fmt, d, btn) {
    var F = d.F, label = INTI.labelRentang(F.dari, F.sampai), judul = 'RINCIAN KASUS PER KELOMPOK UMUR' + (F.pk ? ' — ' + App.namaPenyakit(F.pk).toUpperCase() : ''), nama = 'Rincian_Umur_' + F.dari + (F.dari !== F.sampai ? '_sd_' + F.sampai : '');
    var rows = UMUR.map(function (g, i) { return [g.panjang, d.L[i], d.P[i], d.L[i] + d.P[i]]; });
    var tl = d.L.reduce(function (a, b) { return a + b; }, 0), tp = d.P.reduce(function (a, b) { return a + b; }, 0);
    catat('Rincian umur', label, fmt);
    if (fmt === 'pdf') return sibuk(btn, muatPDF().then(function (jsPDF) {
      var doc = new jsPDF({ unit: 'mm', format: 'a4' }), y = kop(doc, judul, 'Periode: ' + label + ' • ' + (F.units.length ? F.units.length + ' puskesmas' : 'Seluruh kabupaten'));
      tabelPDF(doc, { startY: y, head: [['Kelompok umur', 'Laki-laki', 'Perempuan', 'Total']], body: rows.map(function (r) { return [r[0], A(r[1]), A(r[2]), A(r[3])]; }), foot: [['TOTAL', A(tl), A(tp), A(tl + tp)]], styles: { fontSize: 10 }, columnStyles: { 0: { halign: 'left' } } });
      nomorHalaman(doc, judul); doc.save(nama + '.pdf');
    }));
    return sibuk(btn, muatSkrip('exceljs').then(function () {
      var wb = bukuBaru(), ws = lembar(wb, 'Rincian Umur'), HD = 'FFE5EEFF';
      judulExcel(ws, 1, judul, 4, 13); judulExcel(ws, 2, 'Instansi: ' + instansi(), 4, 11, false); judulExcel(ws, 3, 'Periode: ' + label, 4, 11, false);
      ['Kelompok umur', 'Laki-laki', 'Perempuan', 'Total'].forEach(function (t, i) { sel(ws, 5, i + 1, t, { tebal: true, isi: HD }); });
      rows.forEach(function (r, i) { sel(ws, 6 + i, 1, r[0], { kiri: true }); sel(ws, 6 + i, 2, r[1]); sel(ws, 6 + i, 3, r[2]); sel(ws, 6 + i, 4, { formula: 'B' + (6 + i) + '+C' + (6 + i), result: r[3] }); });
      sel(ws, 18, 1, 'TOTAL', { tebal: true, isi: 'FFDCE9FF' }); ['B', 'C', 'D'].forEach(function (c, i) { sel(ws, 18, i + 2, { formula: 'SUM(' + c + '6:' + c + '17)' }, { tebal: true, isi: 'FFDCE9FF' }); });
      ws.getColumn(1).width = 22; [2, 3, 4].forEach(function (c) { ws.getColumn(c).width = 13; });
      return unduhWB(wb, nama + '.xlsx');
    }));
  }

  /* ===================== Arsip puskesmas (Riwayat) ===================== */
  function arsip(fmt, u, y, rows, btn) {
    var nama = 'Arsip_' + App.namaPendek(u).replace(/\s+/g, '_') + '_' + y;
    var data = rows.slice().reverse().map(function (x) { var h = x.h; return [INTI.labelBulan(x.p), INTI.fmtTgl(INTI.tenggat(x.p, App.S.set), true), h ? INTI.fmtTgl(h.kp, true) : '-', INTI.STATUS[x.st.kode].label + (x.st.kode === 'TERLAMBAT' ? ' +' + x.st.hari + ' hari' : ''), h ? (h.j === 'N' ? 'Nihil' : h.tt) : '-', h ? h.tl : '-', h ? h.tp : '-', h ? 'v' + h.v : '-', h ? h.st : '-']; });
    var head = ['Periode', 'Tenggat', 'Kirim pertama', 'Ketepatan', 'Total', 'L', 'P', 'Versi', 'Status'];
    catat('Arsip laporan ' + u, String(y), fmt);
    if (fmt === 'pdf') return sibuk(btn, muatPDF().then(function (jsPDF) {
      var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }), yy = kop(doc, 'ARSIP LAPORAN STP ' + App.namaUnit(u).toUpperCase() + ' TAHUN ' + y, '');
      tabelPDF(doc, { startY: yy, head: [head], body: data, styles: { fontSize: 9 } }); nomorHalaman(doc, 'Arsip ' + App.namaUnit(u)); doc.save(nama + '.pdf');
    }));
    return sibuk(btn, muatSkrip('exceljs').then(function () {
      var wb = bukuBaru(), ws = lembar(wb, 'Arsip ' + y);
      judulExcel(ws, 1, 'ARSIP LAPORAN STP ' + App.namaUnit(u).toUpperCase() + ' TAHUN ' + y, head.length, 13); judulExcel(ws, 2, 'Instansi: ' + instansi(), head.length, 11, false);
      head.forEach(function (t, i) { sel(ws, 4, i + 1, t, { tebal: true, isi: 'FFE5EEFF' }); });
      data.forEach(function (r, i) { r.forEach(function (v, k) { sel(ws, 5 + i, k + 1, v, { kiri: k === 0 }); }); });
      [16, 18, 18, 22, 9, 8, 8, 8, 20].forEach(function (w, i) { ws.getColumn(i + 1).width = w; });
      return unduhWB(wb, nama + '.xlsx');
    }));
  }

  /* ===================== Satu laporan (rincian 24 kolom) ===================== */
  function laporanTunggal(fmt, h, det, btn) {
    var nama = 'Laporan_STP_' + h.id, pen = App.S.penyakit.filter(function (p) { return det[p.kode]; });
    var judul = 'LAPORAN STP ' + App.namaUnit(h.u).toUpperCase() + ' — ' + INTI.labelBulan(h.p).toUpperCase();
    var sub = 'ID ' + h.id + ' • v' + h.v + ' • Kirim pertama ' + INTI.fmtTglJam(h.kp) + ' • ' + (h.kt === 'T' ? 'Tepat Waktu' : 'Terlambat +' + h.hr + ' hari');
    catat('Laporan ' + h.id, h.p, fmt);
    if (fmt === 'pdf') return sibuk(btn, muatPDF().then(function (jsPDF) {
      var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }), y = kop(doc, judul, sub);
      var head = [[{ content: 'Penyakit', rowSpan: 2 }].concat(UMUR.map(function (g) { return { content: g.label, colSpan: 2 }; })).concat([{ content: 'Total', colSpan: 3 }]), [].concat.apply([], UMUR.map(function () { return ['L', 'P']; })).concat(['L', 'P', 'T'])];
      var body = pen.length ? pen.map(function (p) { var v = det[p.kode], s = INTI.jumlahLP(v); return [p.nama].concat(v).concat([s.L, s.P, s.T]); }) : [[{ content: 'NIHIL — tidak ada kasus untuk seluruh penyakit', colSpan: 28 }]];
      tabelPDF(doc, { startY: y, head: head, body: body, foot: [['TOTAL'].concat((function () { var t = INTI.nol24(); pen.forEach(function (p) { INTI.tambah24(t, det[p.kode]); }); var s = INTI.jumlahLP(t); return t.concat([s.L, s.P, s.T]); })())], styles: { fontSize: 6.6 }, columnStyles: { 0: { halign: 'left', cellWidth: 36 } } });
      nomorHalaman(doc, h.id); doc.save(nama + '.pdf');
    }));
    return sibuk(btn, muatSkrip('exceljs').then(function () {
      var wb = bukuBaru(), ws = lembar(wb, h.id), HD = 'FFE5EEFF', nK = 28;
      judulExcel(ws, 1, judul, nK, 13); judulExcel(ws, 2, sub, nK, 10, false);
      ws.mergeCells(4, 1, 5, 1); sel(ws, 4, 1, 'Jenis Penyakit', { tebal: true, isi: HD });
      UMUR.forEach(function (g, i) { ws.mergeCells(4, 2 + i * 2, 4, 3 + i * 2); sel(ws, 4, 2 + i * 2, g.label, { tebal: true, isi: HD }); sel(ws, 5, 2 + i * 2, 'L', { tebal: true, isi: HD }); sel(ws, 5, 3 + i * 2, 'P', { tebal: true, isi: HD }); });
      ws.mergeCells(4, 26, 4, 28); sel(ws, 4, 26, 'Total', { tebal: true, isi: HD }); ['L', 'P', 'Total'].forEach(function (t, k) { sel(ws, 5, 26 + k, t, { tebal: true, isi: HD }); });
      pen.forEach(function (p, i) {
        var r = 6 + i, v = det[p.kode], s = INTI.jumlahLP(v), fl = [], fp = [];
        sel(ws, r, 1, p.nama, { kiri: true }); v.forEach(function (x, k) { sel(ws, r, 2 + k, x); (k % 2 ? fp : fl).push(kol(2 + k) + r); });
        sel(ws, r, 26, { formula: fl.join('+'), result: s.L }); sel(ws, r, 27, { formula: fp.join('+'), result: s.P }); sel(ws, r, 28, { formula: 'Z' + r + '+AA' + r, result: s.T }, { tebal: true });
      });
      var rt = 6 + pen.length;
      sel(ws, rt, 1, pen.length ? 'TOTAL' : 'NIHIL', { tebal: true, isi: 'FFDCE9FF' });
      for (var c = 2; c <= nK; c++) sel(ws, rt, c, pen.length ? { formula: 'SUM(' + kol(c) + '6:' + kol(c) + (rt - 1) + ')' } : 0, { tebal: true, isi: 'FFDCE9FF' });
      ws.getColumn(1).width = 26; for (var cc = 2; cc <= nK; cc++) ws.getColumn(cc).width = 6;
      ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 5 }];
      return unduhWB(wb, nama + '.xlsx');
    }));
  }

  /* ===================== QR & Stempel Digital ===================== */
  function qrModul(teks) { return muatSkrip('qrcode').then(function () { var q = qrcode(0, 'M'); q.addData(teks); q.make(); return q; }); }
  function qrSvg(teks) {
    return qrModul(teks).then(function (q) {
      var n = q.getModuleCount(), d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
      return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="QR verifikasi"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + d + '" fill="#0F172A"/></svg>';
    });
  }
  function teksMelingkar(x, teks, cx, cy, r, mulai, sapuan, atas) {
    var n = teks.length, step = sapuan / Math.max(1, n - 1);
    for (var i = 0; i < n; i++) {
      var a = mulai + (atas ? i : -i) * step;
      x.save(); x.translate(cx + r * Math.cos(a), cy + r * Math.sin(a)); x.rotate(a + (atas ? Math.PI / 2 : -Math.PI / 2)); x.fillText(teks[i], 0, 0); x.restore();
    }
  }
  function gambarSegel(x, cx, cy, R, warna) {
    x.save(); x.translate(cx, cy); x.rotate(-8 * Math.PI / 180); x.translate(-cx, -cy);
    x.strokeStyle = warna; x.fillStyle = warna; x.lineWidth = R * 0.05;
    x.beginPath(); x.arc(cx, cy, R, 0, 2 * Math.PI); x.stroke();
    x.lineWidth = R * 0.02; x.setLineDash([R * 0.05, R * 0.04]); x.beginPath(); x.arc(cx, cy, R * 0.9, 0, 2 * Math.PI); x.stroke(); x.setLineDash([]);
    x.lineWidth = R * 0.03; x.beginPath(); x.arc(cx, cy, R * 0.58, 0, 2 * Math.PI); x.stroke();
    x.font = '800 ' + Math.round(R * 0.112) + 'px "Plus Jakarta Sans", Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    teksMelingkar(x, 'DINAS KESEHATAN MINSEL', cx, cy, R * 0.745, Math.PI * 1.07, Math.PI * 0.86, true);
    x.font = '700 ' + Math.round(R * 0.11) + 'px "Plus Jakarta Sans", Inter, Arial, sans-serif';
    teksMelingkar(x, '★ ESTEPEL • SAH ★', cx, cy, R * 0.745, Math.PI * 0.8, Math.PI * 0.6, false);
    x.lineWidth = R * 0.1; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(cx - R * 0.26, cy + R * 0.02); x.lineTo(cx - R * 0.08, cy + R * 0.2); x.lineTo(cx + R * 0.27, cy - R * 0.18); x.stroke();
    x.restore();
  }
  function bungkus(x, teks, maks) {
    var kata = teks.split(' '), out = [], cur = '';
    kata.forEach(function (k) { var c = cur ? cur + ' ' + k : k; if (x.measureText(c).width > maks && cur) { out.push(cur); cur = k; } else cur = c; });
    if (cur) out.push(cur);
    return out;
  }
  function bulat(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
  function stempelCanvas(info) {
    return Promise.all([qrModul(info.url), document.fonts ? document.fonts.ready : Promise.resolve()]).then(function (r) {
      var q = r[0], W = 1600, H = 1000, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'), F = function (w, s) { return w + ' ' + s + 'px "Plus Jakarta Sans", Inter, Arial, sans-serif'; }, Fi = function (w, s) { return w + ' ' + s + 'px Inter, Arial, sans-serif'; };
      x.fillStyle = '#F4F6FB'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#fff'; bulat(x, 40, 40, W - 80, H - 80, 36); x.fill(); x.strokeStyle = '#E8ECF4'; x.lineWidth = 3; x.stroke();
      var g = x.createLinearGradient(90, 90, 190, 190); g.addColorStop(0, '#FF7A3D'); g.addColorStop(1, '#F5487F');
      x.fillStyle = g; bulat(x, 90, 90, 100, 100, 26); x.fill();
      x.strokeStyle = '#fff'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(115, 142); x.lineTo(134, 162); x.lineTo(168, 120); x.stroke();
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      x.fillStyle = '#64748B'; x.font = Fi('700', 22); x.fillText(('PEMERINTAH ' + (App.S.set.NAMA_KABUPATEN || 'Kabupaten Minahasa Selatan')).toUpperCase(), 220, 118);
      x.fillStyle = '#0F172A'; x.font = F('800', 36); x.fillText(info.instansi, 220, 160);
      x.fillStyle = '#5B3DF5'; x.font = Fi('600', 24); x.fillText('Tanda Terima & Pengesahan Laporan STP Elektronik (ESTEPEL)', 220, 196);
      var bw = 300; x.fillStyle = info.tepat ? '#DCFCE7' : '#FEF3C7'; bulat(x, W - 90 - bw, 104, bw, 56, 28); x.fill();
      x.fillStyle = info.tepat ? '#15803D' : '#B45309'; x.font = Fi('800', 23); x.textAlign = 'center'; x.fillText(info.ketepatan, W - 90 - bw / 2, 141); x.textAlign = 'left';
      x.strokeStyle = '#E8ECF4'; x.lineWidth = 2; x.beginPath(); x.moveTo(90, 236); x.lineTo(W - 90, 236); x.stroke();
      var kolX = [90, 590, 1090], baris = [[['Nomor laporan', info.id + ' • v' + info.versi], ['Puskesmas pelapor', info.unit], ['Periode laporan', info.periode]], [['Waktu kirim versi ini', INTI.fmtTglJam(info.waktu)], ['Kirim pertama (dasar ketepatan)', INTI.fmtTglJam(info.kirimPertama)], ['Ringkasan kasus', info.nihil ? 'NIHIL' : A(info.T) + ' kasus (L ' + A(info.L) + ' • P ' + A(info.P) + ')']]];
      baris.forEach(function (b, i) { b.forEach(function (it, k) { x.fillStyle = '#64748B'; x.font = Fi('500', 21); x.fillText(it[0], kolX[k], 290 + i * 100); x.fillStyle = '#0F172A'; x.font = F('700', 27); var t = it[1]; while (x.measureText(t).width > 470 && t.length > 4) t = t.slice(0, -2); x.fillText(t === it[1] ? t : t + '…', kolX[k], 328 + i * 100); }); });
      x.fillStyle = '#F2FBF5'; bulat(x, 90, 500, W - 180, 380, 30); x.fill();
      gambarSegel(x, 280, 690, 145, '#16A34A');
      x.fillStyle = '#15803D'; x.font = Fi('800', 26); x.fillText('✔  TERVERIFIKASI SISTEM ESTEPEL', 470, 600);
      x.fillStyle = '#334155'; x.font = Fi('500', 22);
      var baris = bungkus(x, 'Laporan ini tercatat resmi di basis data ' + info.instansi + '. Sah tanpa cap basah — keaslian dapat diverifikasi siapa saja dengan memindai kode QR di samping.', 600).slice(0, 4);
      baris.forEach(function (t, i) { x.fillText(t, 470, 646 + i * 32); });
      var yy = 646 + baris.length * 32 + 22;
      x.fillStyle = '#64748B'; x.font = '500 19px ui-monospace, Menlo, Consolas, monospace'; x.fillText('HMAC: ' + info.sig, 470, yy);
      x.fillText('Diunduh: ' + INTI.fmtTglJam(App.now()), 470, yy + 30);
      var n = q.getModuleCount(), sz = 270, cs = sz / (n + 4), qx = W - 150 - sz, qy = 530;
      x.fillStyle = '#fff'; bulat(x, qx - 14, qy - 14, sz + 28, sz + 28, 18); x.fill();
      x.fillStyle = '#0F172A';
      for (var rr = 0; rr < n; rr++) for (var cc = 0; cc < n; cc++) if (q.isDark(rr, cc)) x.fillRect(qx + (cc + 2) * cs, qy + (rr + 2) * cs, Math.ceil(cs), Math.ceil(cs));
      x.fillStyle = '#64748B'; x.font = Fi('600', 18); x.textAlign = 'center'; x.fillText('Pindai untuk verifikasi', qx + sz / 2, qy + sz + 36); x.textAlign = 'left';
      x.fillStyle = '#94A3B8'; x.font = Fi('500', 17); var u = info.url; while (x.measureText(u).width > W - 200 && u.length > 10) u = u.slice(0, -4); x.fillText(u === info.url ? u : u + '…', 90, 930);
      return c;
    });
  }
  function namaStempel(info) { return 'Stempel_Digital_' + info.id + '_v' + info.versi; }
  function stempelPNG(info, btn) { return sibuk(btn, stempelCanvas(info).then(function (c) { return new Promise(function (res) { c.toBlob(function (b) { UI.unduhBlob(b, namaStempel(info) + '.png'); res(); }, 'image/png'); }); })); }
  function stempelPDF(info, btn) {
    return sibuk(btn, Promise.all([stempelCanvas(info), muatPDF()]).then(function (r) {
      var c = r[0], jsPDF = r[1], doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [160, 100] });
      doc.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, 160, 100);
      doc.link(115, 50, 40, 40, { url: info.url });
      doc.setProperties({ title: 'Stempel Digital ' + info.id + ' v' + info.versi, subject: 'Bukti pengesahan laporan STP — ESTEPEL', creator: 'ESTEPEL' });
      doc.save(namaStempel(info) + '.pdf');
    }));
  }
  function bagikanStempel(info, btn) {
    var teks = 'Stempel Digital ESTEPEL — ' + info.unit + ', laporan ' + info.periode + ' (v' + info.versi + ', ' + info.ketepatan.toLowerCase() + '). Verifikasi: ' + info.url;
    return sibuk(btn, stempelCanvas(info).then(function (c) {
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    }).then(function (blob) {
      var file = typeof File !== 'undefined' ? new File([blob], namaStempel(info) + '.png', { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: 'Stempel Digital ESTEPEL', text: teks }).catch(function () { /* dibatalkan */ });
      if (navigator.share) return navigator.share({ title: 'Stempel Digital ESTEPEL', text: teks, url: info.url }).catch(function () { /* dibatalkan */ });
      return (navigator.clipboard ? navigator.clipboard.writeText(teks) : Promise.reject()).then(function () { UI.toast('Teks & tautan verifikasi disalin — tempel ke WhatsApp/email.'); }, function () { prompt('Salin teks berikut:', teks); });
    }));
  }

  return { muatSkrip: muatSkrip, rekapExcel: rekapExcel, rekapPDF: rekapPDF, matriks: matriks, ketepatan: ketepatan, umur: umur, arsip: arsip, laporanTunggal: laporanTunggal, qrSvg: qrSvg, stempelPNG: stempelPNG, stempelPDF: stempelPDF, bagikanStempel: bagikanStempel, stempelCanvas: stempelCanvas };
})();
