/* =====================================================================
 * ESTEPEL — INTI BERSAMA (Shared Core)
 * File ini IDENTIK dipakai di browser (js/core.js) dan di server (Inti.gs)
 * agar aturan periode, tenggat, ketepatan, dan agregasi rekap SELALU sama
 * antara tampilan layar, ekspor, dan validasi server.
 * Zona waktu: WITA (UTC+8, tanpa daylight saving).
 * ===================================================================== */
var INTI = (function () {
  'use strict';
  var OFF = 8 * 3600e3;
  var HARI = 86400e3;

  /* 12 kelompok umur — URUTAN DIKUNCI (PRD 5.1). L lalu P per kelompok. */
  var UMUR = [
    { k: '0_7hr', label: '0-7 Hr', panjang: '0-7 Hari' },
    { k: '8_28hr', label: '8-28 Hr', panjang: '8-28 Hari' },
    { k: '1th', label: '< 1', panjang: '< 1 Tahun' },
    { k: '1_4th', label: '1-4', panjang: '1-4 Tahun' },
    { k: '5_9th', label: '5-9', panjang: '5-9 Tahun' },
    { k: '10_14th', label: '10-14', panjang: '10-14 Tahun' },
    { k: '15_19th', label: '15-19', panjang: '15-19 Tahun' },
    { k: '20_44th', label: '20-44', panjang: '20-44 Tahun' },
    { k: '45_54th', label: '45-54', panjang: '45-54 Tahun' },
    { k: '55_59th', label: '55-59', panjang: '55-59 Tahun' },
    { k: '60_69th', label: '60-69', panjang: '60-69 Tahun' },
    { k: '70plus', label: '70+', panjang: '≥ 70 Tahun' }
  ];
  var KOLOM = [];
  UMUR.forEach(function (u) { KOLOM.push('L_' + u.k, 'P_' + u.k); });

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  var STATUS = {
    TEPAT: { label: 'Tepat Waktu', kelas: 'ok', ikon: 'check' },
    TERLAMBAT: { label: 'Terlambat', kelas: 'warn', ikon: 'clock' },
    BELUM: { label: 'Belum Lapor', kelas: 'bad', ikon: 'x' },
    MENUNGGU: { label: 'Menunggu', kelas: 'info', ikon: 'hourglass' },
    BJT: { label: 'Belum Jatuh Tempo', kelas: 'muted', ikon: 'minus' }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function wita(ms) {
    var d = new Date(Number(ms) + OFF);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), dow: d.getUTCDay() };
  }
  function dariWita(y, m, d, hh, mi, s, ms) { return Date.UTC(y, m - 1, d, hh || 0, mi || 0, s || 0, ms || 0) - OFF; }
  function periode(y, m) { return y + '-' + pad(m); }
  function urai(p) { var a = String(p).split('-'); return { y: +a[0], m: +a[1] }; }
  function validPeriode(p) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(p)); }
  function geser(p, n) {
    var o = urai(p), t = o.y * 12 + (o.m - 1) + n;
    return periode(Math.floor(t / 12), (t % 12 + 12) % 12 + 1);
  }
  function selisihBulan(a, b) { var x = urai(a), y = urai(b); return (y.y * 12 + y.m) - (x.y * 12 + x.m); }
  function daftarPeriode(dari, sampai) {
    var out = [], p = dari, i = 0;
    if (dari > sampai) return out;
    while (p <= sampai && i < 600) { out.push(p); p = geser(p, 1); i++; }
    return out;
  }
  function periodeBerjalan(now) { var w = wita(now); return periode(w.y, w.m); }
  /* Laporan yang diinput bulan ini = laporan BULAN SEBELUMNYA */
  function periodeWajib(now) { return geser(periodeBerjalan(now), -1); }
  function bolehInput(p, now) { return validPeriode(p) && p <= periodeWajib(now); }

  function jamTenggat(set) {
    var j = String((set && set.JAM_TENGGAT) || '23:59').split(':');
    return { hh: Math.min(23, Math.max(0, +j[0] || 0)), mi: Math.min(59, Math.max(0, +j[1] || 0)) };
  }
  /* Tenggat periode p = tanggal TGL_TENGGAT bulan berikutnya, pukul JAM_TENGGAT:59.999 WITA */
  function tenggat(p, set) {
    var n = urai(geser(p, 1));
    var tgl = Math.max(1, +((set && set.TGL_TENGGAT) || 5) || 5);
    var maxD = new Date(Date.UTC(n.y, n.m, 0)).getUTCDate();
    var j = jamTenggat(set);
    return dariWita(n.y, n.m, Math.min(tgl, maxD), j.hh, j.mi, 59, 999);
  }
  function hariKal(ms) { return Math.floor((Number(ms) + OFF) / HARI); }
  /* Ketepatan dari waktu kirim PERTAMA. Hari terlambat dihitung per tanggal kalender WITA. */
  function nilaiKetepatan(kirimMs, tenggatMs) {
    if (kirimMs <= tenggatMs) return { s: 'T', hari: 0 };
    return { s: 'L', hari: Math.max(1, hariKal(kirimMs) - hariKal(tenggatMs)) };
  }
  /* Status sel unit×periode. h = objek header (atau null). */
  function statusSel(p, h, now, set) {
    if (h && h.kp) return h.kt === 'T' ? { kode: 'TEPAT', hari: 0, h: h } : { kode: 'TERLAMBAT', hari: h.hr || 0, h: h };
    if (p > periodeWajib(now)) return { kode: 'BJT' };
    if (now > tenggat(p, set)) return { kode: 'BELUM' };
    return { kode: 'MENUNGGU' };
  }
  function sisaHari(p, now, set) { return hariKal(tenggat(p, set)) - hariKal(now); }

  /* ---------- Label periode (PRD F7) ---------- */
  function labelBulan(p) { var o = urai(p); return BULAN[o.m - 1] + ' ' + o.y; }
  function labelBln(p) { var o = urai(p); return BLN[o.m - 1] + ' ' + o.y; }
  function labelRentang(a, b) {
    if (!b || a === b) return labelBulan(a);
    var x = urai(a), y = urai(b);
    if (x.y === y.y && x.m === 1 && y.m === 12) return 'Tahun ' + x.y;
    if (x.y === y.y) return BULAN[x.m - 1] + ' – ' + BULAN[y.m - 1] + ' ' + x.y;
    return labelBulan(a) + ' – ' + labelBulan(b);
  }
  function labelRentangPendek(a, b) {
    if (!b || a === b) return labelBulan(a);
    var x = urai(a), y = urai(b);
    if (x.y === y.y && x.m === 1 && y.m === 12) return 'Tahun ' + x.y;
    if (x.y === y.y) return BLN[x.m - 1] + ' – ' + BLN[y.m - 1] + ' ' + x.y;
    return labelBln(a) + ' – ' + labelBln(b);
  }
  function fmtTgl(ms, jam) {
    if (!ms) return '–';
    var w = wita(ms);
    var s = pad(w.d) + ' ' + BLN[w.m - 1] + ' ' + w.y;
    return jam ? s + ', ' + pad(w.hh) + ':' + pad(w.mi) : s;
  }
  function fmtTglJam(ms) { return fmtTgl(ms, true) + (ms ? ' WITA' : ''); }
  function angka(n) {
    n = Math.round(Number(n) || 0);
    var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-' : '') + s;
  }

  /* ---------- Cube data tahunan ----------
   * cube.h: [id, m, unit, kirimPertama, kirimTerakhir, ketepatan(T/L), hariTerlambat,
   *          jenis(K/N), status, versi, totL, totP, tot, sumber, tenggat]
   * cube.d: [m, unit, penyakit, v0..v23]  (hanya laporan aktif, penyakit dgn kasus)
   */
  function hObj(r, y) {
    return { id: r[0], p: periode(y, r[1]), m: r[1], u: r[2], kp: r[3], kl: r[4], kt: r[5], hr: r[6], j: r[7], st: r[8], v: r[9], tl: r[10], tp: r[11], tt: r[12], sb: r[13], tg: r[14] };
  }
  function indeks(cubes) {
    var H = {}, HL = [], D = [];
    (cubes || []).forEach(function (c) {
      if (!c) return;
      (c.h || []).forEach(function (r) { var o = hObj(r, c.y); H[o.u + '|' + o.p] = o; HL.push(o); });
      (c.d || []).forEach(function (r) { D.push({ p: periode(c.y, r[0]), u: r[1], k: r[2], v: r.slice(3, 27) }); });
    });
    return { H: H, HL: HL, D: D };
  }
  function hdr(ix, unit, p) { return ix.H[unit + '|' + p] || null; }
  function nol24() { var a = []; for (var i = 0; i < 24; i++) a.push(0); return a; }
  function tambah24(a, v) { for (var i = 0; i < 24; i++) a[i] += Number(v[i]) || 0; return a; }
  function jumlahLP(v) {
    var L = 0, P = 0;
    for (var i = 0; i < 24; i += 2) { L += Number(v[i]) || 0; P += Number(v[i + 1]) || 0; }
    return { L: L, P: P, T: L + P };
  }
  /* f: {dari, sampai, units:[kode]|null, penyakit:[kode]|null} */
  function saring(ix, f) {
    var us = f.units && f.units.length ? toSet(f.units) : null;
    var ps = f.penyakit && f.penyakit.length ? toSet(f.penyakit) : null;
    return ix.D.filter(function (r) {
      return r.p >= f.dari && r.p <= f.sampai && (!us || us[r.u]) && (!ps || ps[r.k]);
    });
  }
  function toSet(a) { var o = {}; a.forEach(function (x) { o[x] = 1; }); return o; }
  /* Nilai L/P suatu baris untuk filter umur (null = semua kelompok) */
  function nilaiUmur(v, umur) {
    if (umur === null || umur === undefined || umur === '' || umur < 0) return jumlahLP(v);
    var L = Number(v[umur * 2]) || 0, P = Number(v[umur * 2 + 1]) || 0;
    return { L: L, P: P, T: L + P };
  }
  /* Rekap per penyakit: {kode: arr24} + total */
  function rekapPenyakit(ix, f) {
    var out = {}, tot = nol24();
    saring(ix, f).forEach(function (r) {
      if (!out[r.k]) out[r.k] = nol24();
      tambah24(out[r.k], r.v); tambah24(tot, r.v);
    });
    return { per: out, total: tot };
  }
  /* Matriks unit × penyakit: m[unit][penyakit] = {L,P,T} */
  function matriks(ix, f, umur) {
    var m = {}, totU = {}, totK = {}, grand = { L: 0, P: 0, T: 0 };
    saring(ix, f).forEach(function (r) {
      var n = nilaiUmur(r.v, umur);
      if (!n.T) return;
      if (!m[r.u]) m[r.u] = {};
      var c = m[r.u][r.k] || (m[r.u][r.k] = { L: 0, P: 0, T: 0 });
      c.L += n.L; c.P += n.P; c.T += n.T;
      var a = totU[r.u] || (totU[r.u] = { L: 0, P: 0, T: 0 }); a.L += n.L; a.P += n.P; a.T += n.T;
      var b = totK[r.k] || (totK[r.k] = { L: 0, P: 0, T: 0 }); b.L += n.L; b.P += n.P; b.T += n.T;
      grand.L += n.L; grand.P += n.P; grand.T += n.T;
    });
    return { m: m, unit: totU, penyakit: totK, total: grand };
  }
  /* Total per periode (untuk tren) */
  function trenBulanan(ix, f, daftar) {
    var map = {};
    daftar.forEach(function (p) { map[p] = { L: 0, P: 0, T: 0 }; });
    saring(ix, { dari: daftar[0], sampai: daftar[daftar.length - 1], units: f.units, penyakit: f.penyakit }).forEach(function (r) {
      var s = jumlahLP(r.v), o = map[r.p];
      if (o) { o.L += s.L; o.P += s.P; o.T += s.T; }
    });
    return daftar.map(function (p) { return { p: p, L: map[p].L, P: map[p].P, T: map[p].T }; });
  }
  /* Kelengkapan: jumlah laporan masuk (aktif) dibanding unit × bulan */
  function kelengkapan(ix, units, dari, sampai) {
    var daftar = daftarPeriode(dari, sampai), masuk = 0, belum = [];
    units.forEach(function (u) {
      daftar.forEach(function (p) {
        var h = hdr(ix, u, p);
        if (h && h.st !== 'Dihapus') masuk++; else belum.push({ u: u, p: p });
      });
    });
    return { masuk: masuk, harus: units.length * daftar.length, belum: belum };
  }

  /* Skor ketepatan per unit per tahun: Tepat ÷ periode yang tenggatnya sudah lewat */
  function skorUnit(ix, unit, y, now, set) {
    var r = { tepat: 0, telat: 0, belum: 0, jatuh: 0, sumHari: 0, maxHari: 0, skor: null, historis: false, sel: [] };
    for (var m = 1; m <= 12; m++) {
      var p = periode(y, m), h = hdr(ix, unit, p), st = statusSel(p, h, now, set);
      r.sel.push(st);
      var lewat = now > tenggat(p, set);
      if (h && h.kp && h.sb === 'Historis') r.historis = true;
      if (st.kode === 'TEPAT') { r.tepat++; r.jatuh++; }
      else if (st.kode === 'TERLAMBAT') { r.telat++; r.jatuh++; r.sumHari += st.hari; if (st.hari > r.maxHari) r.maxHari = st.hari; }
      else if (st.kode === 'BELUM') { r.belum++; r.jatuh++; }
      else if (lewat) r.jatuh++;
    }
    r.skor = r.jatuh ? Math.round(r.tepat / r.jatuh * 1000) / 10 : null;
    r.rataHari = r.telat ? Math.round(r.sumHari / r.telat * 10) / 10 : 0;
    return r;
  }
  function kelasSkor(skor, set) {
    if (skor === null || skor === undefined) return 'muted';
    var hijau = +((set && set.AMBANG_HIJAU) || 90), kuning = +((set && set.AMBANG_KUNING) || 70);
    return skor >= hijau ? 'ok' : skor >= kuning ? 'warn' : 'bad';
  }

  /* Peringatan dini: lonjakan vs rata-rata 3 periode sebelumnya + Potensi KLB ada kasus */
  function peringatanDini(ix, p, units, penyakitList, set) {
    var ambang = +((set && set.AMBANG_LONJAKAN) || 50), minK = +((set && set.MIN_KASUS_LONJAKAN) || 5);
    var klbSet = {};
    penyakitList.forEach(function (x) { if (x.klb) klbSet[x.kode] = 1; });
    var prev = [geser(p, -1), geser(p, -2), geser(p, -3)];
    var cur = {}, lalu = {};
    var us = toSet(units);
    ix.D.forEach(function (r) {
      if (!us[r.u]) return;
      var t = jumlahLP(r.v).T, key = r.u + '|' + r.k;
      if (r.p === p) cur[key] = (cur[key] || 0) + t;
      else if (r.p === prev[0] || r.p === prev[1] || r.p === prev[2]) lalu[key] = (lalu[key] || 0) + t;
    });
    var lonjakan = [], klb = [];
    Object.keys(cur).forEach(function (key) {
      var a = key.split('|'), c = cur[key], avg = (lalu[key] || 0) / 3;
      if (klbSet[a[1]] && c > 0) klb.push({ u: a[0], k: a[1], n: c });
      if (c >= minK && (avg === 0 ? true : (c - avg) / avg * 100 >= ambang)) {
        lonjakan.push({ u: a[0], k: a[1], n: c, rata: Math.round(avg * 10) / 10, naik: avg ? Math.round((c - avg) / avg * 100) : null });
      }
    });
    lonjakan.sort(function (x, y) { return (y.naik === null ? 1e9 : y.naik) - (x.naik === null ? 1e9 : x.naik) || y.n - x.n; });
    klb.sort(function (x, y) { return y.n - x.n; });
    return { lonjakan: lonjakan, klb: klb };
  }

  /* Validasi isian 24 kolom: bilangan bulat ≥ 0 */
  function bersihkan24(v) {
    if (!v || v.length !== 24) return null;
    var out = [];
    for (var i = 0; i < 24; i++) {
      var x = v[i] === '' || v[i] === null || v[i] === undefined ? 0 : Number(v[i]);
      if (!isFinite(x) || x < 0 || Math.floor(x) !== x || x > 99999) return null;
      out.push(x);
    }
    return out;
  }
  function stempelData(id, versi, kirimMs, total) { return [id, versi, kirimMs, total].join('|'); }

  return {
    OFF: OFF, UMUR: UMUR, KOLOM: KOLOM, BULAN: BULAN, BLN: BLN, STATUS: STATUS,
    pad: pad, wita: wita, dariWita: dariWita, periode: periode, urai: urai, validPeriode: validPeriode,
    geser: geser, selisihBulan: selisihBulan, daftarPeriode: daftarPeriode, periodeBerjalan: periodeBerjalan,
    periodeWajib: periodeWajib, bolehInput: bolehInput, tenggat: tenggat, hariKal: hariKal,
    nilaiKetepatan: nilaiKetepatan, statusSel: statusSel, sisaHari: sisaHari,
    labelBulan: labelBulan, labelBln: labelBln, labelRentang: labelRentang, labelRentangPendek: labelRentangPendek,
    fmtTgl: fmtTgl, fmtTglJam: fmtTglJam, angka: angka,
    hObj: hObj, indeks: indeks, hdr: hdr, nol24: nol24, tambah24: tambah24, jumlahLP: jumlahLP,
    saring: saring, nilaiUmur: nilaiUmur, rekapPenyakit: rekapPenyakit, matriks: matriks,
    trenBulanan: trenBulanan, kelengkapan: kelengkapan, skorUnit: skorUnit, kelasSkor: kelasSkor,
    peringatanDini: peringatanDini, bersihkan24: bersihkan24, stempelData: stempelData, toSet: toSet
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = INTI;
