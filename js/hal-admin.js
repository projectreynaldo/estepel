/* =====================================================================
 * ESTEPEL — Administrasi (F9, Admin Dinkes): Pengguna, Unit, Penyakit,
 * Pengaturan, Notifikasi WA/Email (Fonnte), Log Aktivitas, Migrasi data.
 * ===================================================================== */
(function () {
  'use strict';
  var ic = UI.ic, esc = UI.esc, A = UI.A, $ = UI.$, $$ = UI.$$;
  function kepala(sub, aksi) { return '<div class="ph"><div><div class="crumb">Pengaturan ' + ic('right', 12) + ' <b>Administrasi</b></div><h1>Administrasi Sistem</h1><p>' + sub + '</p></div><div class="ph-act">' + (aksi || '') + '</div></div>'; }
  function tampilSandi(j) {
    UI.modal({ judul: 'Kata sandi sementara', ikon: 'key', tile: 't-amb', ukuran: 'sm', kunci: true,
      isi: '<div class="note warn fs12">' + ic('alert', 16) + '<div>Catat dan sampaikan ke pengguna sekarang. Kata sandi <b>hanya tampil sekali</b> dan wajib diganti saat login berikutnya.</div></div><div class="fld"><span>Username</span><b class="mono" style="font-size:15px">' + esc(j.username) + '</b></div><div class="fld"><span>Kata sandi sementara</span><div class="flex"><input class="inp mono" readonly value="' + esc(j.sandi) + '" id="pwTmp" style="font-size:16px;letter-spacing:.06em"><button class="btn btn-s btn-ic" id="cpPw" aria-label="Salin">' + ic('copy', 16) + '</button></div></div>',
      onBuka: function (m) { $('#cpPw', m.el).onclick = function () { var i = $('#pwTmp', m.el); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.resolve(document.execCommand('copy'))).then(function () { UI.toast('Disalin.'); }); }; },
      tombol: [{ label: 'Sudah saya catat', kelas: 'btn-p' }] });
  }

  /* ---------- Pengguna ---------- */
  function tabUser(el) {
    var S = App.S, f = { q: '', role: '', st: '' }, data = null;
    function warnaRole(r) { return r === 'Admin Dinkes' ? 'vio' : r === 'Staf Dinkes' ? 'info' : 'ok'; }
    function render() {
      var list = data ? data.list : null;
      var tampil = list ? list.filter(function (u) {
        var q = f.q.toLowerCase();
        return (!q || (u.nama + ' ' + u.username + ' ' + (u.unit ? App.namaUnit(u.unit) : '')).toLowerCase().indexOf(q) > -1) && (!f.role || u.role === f.role) && (!f.st || (f.st === 'aktif') === u.aktif);
      }) : [];
      var n = function (fn) { return list ? list.filter(fn).length : 0; };
      el.innerHTML = kepala('Kelola akun petugas 17 puskesmas dan staf Dinas Kesehatan, peran (RBAC), dan reset kata sandi.', '<button class="btn btn-p" data-a="baru">' + ic('plus', 16) + 'Tambah Pengguna</button>') + App.tabBar('admin', 'user') +
        '<div class="g4">' + UI.kpi({ tile: 't-vio', ikon: 'users', label: 'Total akun', nilai: list ? String(list.length) : '…', foot: '<span>' + n(function (u) { return u.role === 'Puskesmas'; }) + ' Puskesmas</span><span>' + n(function (u) { return u.role !== 'Puskesmas'; }) + ' Dinkes</span>' }) +
        UI.kpi({ tile: 't-grn', ikon: 'checkc', label: 'Aktif', nilai: String(n(function (u) { return u.aktif; })), foot: '<span class="dt d-bad">' + n(function (u) { return !u.aktif; }) + ' nonaktif</span>' }) +
        UI.kpi({ tile: 't-amb', ikon: 'key', label: 'Wajib ganti sandi', nilai: String(n(function (u) { return u.wajibGanti; })), foot: '<span>Akun baru / direset</span>' }) +
        UI.kpi({ tile: 't-blu', ikon: 'clock', label: 'Sesi tidak aktif', nilai: (S.set.DURASI_SESI_MENIT || 15) + ' mnt', foot: '<span>Hash sandi + salt • HMAC</span>' }) + '</div>' +
        '<div class="card p0 tbl-cards"><div class="tbl-tools"><div class="card-t">Daftar Pengguna</div><div class="inp-ic sm" style="width:240px">' + ic('search', 16) + '<input class="inp" id="uq" placeholder="Cari nama, username, puskesmas..." value="' + esc(f.q) + '"></div>' +
        '<select class="sel sm" id="ur" style="width:auto"><option value="">Semua peran</option>' + ['Admin Dinkes', 'Staf Dinkes', 'Puskesmas'].map(function (r) { return '<option' + (f.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select><select class="sel sm" id="us" style="width:auto"><option value="">Semua status</option><option value="aktif"' + (f.st === 'aktif' ? ' selected' : '') + '>Aktif</option><option value="non"' + (f.st === 'non' ? ' selected' : '') + '>Nonaktif</option></select></div>' +
        (list === null ? '<div style="padding:18px">' + UI.skel(52, 5) + '</div>' : '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Petugas &amp; akun</th><th>Unit kerja</th><th>Peran</th><th>WhatsApp</th><th>Login terakhir</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' +
          tampil.map(function (u) {
            return '<tr><td><div class="cel-u"><span class="av" style="width:34px;height:34px;font-size:12px;background:var(--' + (u.role === 'Puskesmas' ? 'blu' : 'p') + ')">' + esc(UI.inisial(u.nama)) + '</span><div class="ell"><b>' + esc(u.nama) + '</b><div class="fs11 mut">@' + esc(u.username) + (u.email ? ' • ' + esc(u.email) : '') + '</div></div></div></td><td>' + (u.unit ? esc(App.namaUnit(u.unit)) : '<span class="mut">Dinas Kesehatan</span>') + '</td><td>' + UI.badge(u.role, warnaRole(u.role)) + '</td>' +
              '<td class="fs12">' + (u.noWA ? esc(u.noWA) + (u.statusWA ? '<div class="fs11 ' + (u.statusWA === 'Terdaftar' ? 'ok-tx' : 'bad-tx') + '">' + esc(u.statusWA) + '</div>' : '') : '<span class="mut">–</span>') + '</td><td class="fs12 nowrap">' + (u.terakhirLogin ? UI.waktuRelatif(u.terakhirLogin, App.now()) : '<span class="mut">Belum pernah</span>') + '</td>' +
              '<td>' + (u.aktif ? UI.badge('Aktif', 'ok') : UI.badge('Nonaktif', 'bad')) + (u.wajibGanti ? '<div class="fs11 warn-tx mt8">wajib ganti sandi</div>' : '') + '</td><td class="right nowrap"><button class="btn btn-s btn-xs" data-ed="' + esc(u.username) + '">' + ic('edit', 13) + 'Edit</button> <button class="btn btn-g btn-xs" data-rs="' + esc(u.username) + '" title="Reset kata sandi">' + ic('key', 13) + 'Reset</button></td></tr>';
          }).join('') + '</tbody></table></div><div class="mcards">' + tampil.map(function (u) { return '<div class="mc"><div class="flex between"><b>' + esc(u.nama) + '</b>' + UI.badge(u.role, warnaRole(u.role)) + '</div><div class="mc-r"><span>@' + esc(u.username) + '</span><span>' + (u.unit ? esc(App.namaPendek(u.unit)) : 'Dinkes') + '</span></div><div class="flex g6"><button class="btn btn-s btn-sm" data-ed="' + esc(u.username) + '">Edit</button><button class="btn btn-g btn-sm" data-rs="' + esc(u.username) + '">Reset sandi</button>' + (u.aktif ? '' : UI.badge('Nonaktif', 'bad')) + '</div></div>'; }).join('') + '</div>' +
          '<div class="tbl-foot"><span>Menampilkan ' + tampil.length + ' dari ' + list.length + ' pengguna</span></div>') + '</div>';
      var deb = UI.debounce(function (v) { f.q = v; render(); var i = $('#uq'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 150);
      var uq = $('#uq'); if (uq) uq.oninput = function () { deb(this.value); };
      el.onchange = function (e) { if (e.target.id === 'ur') { f.role = e.target.value; render(); } if (e.target.id === 'us') { f.st = e.target.value; render(); } };
      el.onclick = function (e) {
        var b = e.target.closest('[data-a],[data-ed],[data-rs]'); if (!b) return;
        if (b.dataset.a === 'baru') form(null);
        if (b.dataset.ed) form(list.filter(function (u) { return u.username === b.dataset.ed; })[0]);
        if (b.dataset.rs) UI.konfirmasi({ judul: 'Reset kata sandi', ikon: 'key', pesan: 'Buat kata sandi acak sementara untuk <b>@' + esc(b.dataset.rs) + '</b>? Semua sesi aktif pengguna ini akan berakhir dan wajib ganti sandi saat login.', ya: 'Reset' })
          .then(function (ok) { if (ok) API.wajib('admin.userReset', { username: b.dataset.rs }).then(function (j) { tampilSandi(j); muat(); }, function (er) { UI.toast(er.message, 'bad'); }); });
      };
    }
    function form(u) {
      var baru = !u; u = u || { role: 'Puskesmas', aktif: true, notifWA: true };
      UI.modal({ judul: baru ? 'Tambah Pengguna' : 'Edit Pengguna', ikon: baru ? 'plus' : 'edit', isi:
        '<div class="g2" style="gap:12px"><label class="fld"><span>Username</span><input class="inp" id="fu" value="' + esc(u.username || '') + '"' + (baru ? '' : ' readonly') + ' placeholder="mis. pkm_tenga" autocapitalize="none"></label><label class="fld"><span>Nama lengkap</span><input class="inp" id="fn" value="' + esc(u.nama || '') + '"></label></div>' +
        '<div class="g2" style="gap:12px"><label class="fld"><span>Peran</span><select class="sel" id="fr">' + ['Puskesmas', 'Staf Dinkes', 'Admin Dinkes'].map(function (r) { return '<option' + (u.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></label><label class="fld" id="fuWrap"><span>Unit puskesmas</span><select class="sel" id="fk"><option value="">— pilih —</option>' + App.S.units.map(function (x) { return '<option value="' + x.kode + '"' + (u.unit === x.kode ? ' selected' : '') + '>' + esc(x.nama) + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="g2" style="gap:12px"><label class="fld"><span>No. WhatsApp</span><input class="inp" id="fw" inputmode="tel" value="' + esc(u.noWA || '') + '" placeholder="08xxxxxxxxxx"></label><label class="fld"><span>Email</span><input class="inp" id="fe" type="email" value="' + esc(u.email || '') + '"></label></div>' +
        '<div class="flex wrap g16"><label class="chk"><input type="checkbox" id="fa"' + (u.aktif !== false ? ' checked' : '') + '>Akun aktif</label><label class="chk"><input type="checkbox" id="fnw"' + (u.notifWA !== false ? ' checked' : '') + '>Terima notifikasi WhatsApp</label></div>' +
        (baru ? '<div class="note soft fs12">' + ic('info', 16) + 'Kata sandi sementara dibuat otomatis dan ditampilkan sekali setelah disimpan.</div>' : ''),
        onBuka: function (m) { var sy = function () { $('#fuWrap', m.el).style.display = $('#fr', m.el).value === 'Puskesmas' ? '' : 'none'; }; $('#fr', m.el).onchange = sy; sy(); },
        tombol: [{ label: 'Batal' }, { label: 'Simpan', kelas: 'btn-p', aksi: function (m) {
          var d = { baru: baru, username: $('#fu', m.el).value.trim().toLowerCase(), nama: $('#fn', m.el).value.trim(), role: $('#fr', m.el).value, unit: $('#fk', m.el).value, noWA: $('#fw', m.el).value.trim(), email: $('#fe', m.el).value.trim(), aktif: $('#fa', m.el).checked, notifWA: $('#fnw', m.el).checked };
          return API.wajib('admin.userSimpan', d).then(function (j) { UI.toast(j.message); if (j.sandi) tampilSandi(j); muat(); });
        } }] });
    }
    function muat() { API.wajib('admin.users').then(function (j) { data = j; if (App.rute().tab === 'user') render(); }, function (e) { UI.toast(e.message, 'bad'); }); }
    render(); muat();
  }

  /* ---------- Master unit & penyakit ---------- */
  function tabMaster(el, jenis) {
    var unit = jenis === 'unit', rows = (unit ? App.S.units : App.S.penyakit).map(function (x) { return JSON.parse(JSON.stringify(x)); }), ubah = false;
    function render() {
      var kats = []; App.S.penyakit.forEach(function (p) { if (p.kategori && kats.indexOf(p.kategori) < 0) kats.push(p.kategori); });
      el.innerHTML = kepala(unit ? 'Master puskesmas. Kode tetap (U01…), sehingga mengganti nama atau menonaktifkan tidak merusak data lama.' : 'Master 27 penyakit STP beserta Kategori (pengelompokan kolom matriks) dan Potensi KLB (peringatan dini).',
        '<button class="btn btn-s" data-a="tambah">' + ic('plus', 16) + 'Tambah ' + (unit ? 'Unit' : 'Penyakit') + '</button><button class="btn btn-p" data-a="simpan"' + (ubah ? '' : ' disabled') + '>' + ic('save', 16) + 'Simpan Perubahan</button>') + App.tabBar('admin', jenis) +
        '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:80px">Kode</th><th>Nama ' + (unit ? 'Puskesmas' : 'Penyakit') + '</th>' + (unit ? '' : '<th>Kategori</th><th class="center">Potensi KLB</th>') + '<th class="center">Aktif</th><th style="width:100px">Urutan</th></tr></thead><tbody>' +
        rows.map(function (x, i) {
          return '<tr><td class="mono">' + (x.kode || '<span class="badge b-info b-sm">baru</span>') + '</td><td><input class="inp sm" data-i="' + i + '" data-k="nama" value="' + esc(x.nama) + '"></td>' +
            (unit ? '' : '<td><input class="inp sm" list="dlKat" data-i="' + i + '" data-k="kategori" value="' + esc(x.kategori || '') + '"></td><td class="center"><label class="switch"><input type="checkbox" data-i="' + i + '" data-k="klb"' + (x.klb ? ' checked' : '') + '><i></i></label></td>') +
            '<td class="center"><label class="switch"><input type="checkbox" data-i="' + i + '" data-k="aktif"' + (x.aktif ? ' checked' : '') + '><i></i></label></td><td><input class="inp sm" type="number" min="1" data-i="' + i + '" data-k="urutan" value="' + (x.urutan || '') + '"></td></tr>';
        }).join('') + '</tbody></table></div><datalist id="dlKat">' + kats.map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist></div>';
      el.oninput = el.onchange = function (e) {
        var t = e.target, i = t.dataset.i; if (i === undefined) return;
        rows[+i][t.dataset.k] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? +t.value : t.value;
        if (!ubah) { ubah = true; var b = $('[data-a="simpan"]'); if (b) b.disabled = false; }
      };
      el.onclick = function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return;
        if (b.dataset.a === 'tambah') { rows.push({ kode: '', nama: '', kategori: '', klb: false, aktif: true, urutan: rows.length + 1 }); ubah = true; render(); var ins = $$('input[data-k="nama"]'); ins[ins.length - 1].focus(); }
        if (b.dataset.a === 'simpan') {
          UI.sibuk(b, true);
          API.wajib('admin.masterSimpan', { jenis: jenis, rows: rows.filter(function (x) { return x.nama.trim(); }) }).then(function (j) {
            App.S.units = j.master.units; App.S.penyakit = j.master.penyakit; App.S.uMap = {}; App.S.pMap = {};
            App.S.units.forEach(function (u) { App.S.uMap[u.kode] = u; }); App.S.penyakit.forEach(function (p) { App.S.pMap[p.kode] = p; });
            var bt = LS.get('boot', null); if (bt) { bt.master = j.master; LS.set('boot', bt); }
            rows = (unit ? App.S.units : App.S.penyakit).map(function (x) { return JSON.parse(JSON.stringify(x)); }); ubah = false;
            UI.toast(j.message); render();
          }, function (er) { UI.toast(er.message, 'bad'); UI.sibuk(b, false); });
        }
      };
    }
    render();
  }

  /* ---------- Pengaturan ---------- */
  function tabPengaturan(el) {
    var s = App.S.set;
    var F = [['NAMA_INSTANSI', 'Nama instansi (judul ekspor & kop)', 'text'], ['NAMA_KABUPATEN', 'Nama wilayah', 'text'], ['TGL_TENGGAT', 'Tanggal tenggat (bulan berikutnya)', 'number', '1–28. Laporan bulan lalu wajib dikirim paling lambat tanggal ini.'], ['JAM_TENGGAT', 'Jam tenggat (WITA)', 'time'],
      ['AMBANG_HIJAU', 'Ambang skor hijau (%)', 'number'], ['AMBANG_KUNING', 'Ambang skor kuning (%)', 'number', 'Di bawah ini berwarna merah.'], ['AMBANG_LONJAKAN', 'Ambang lonjakan kasus (%)', 'number', 'Kenaikan vs rata-rata 3 periode sebelumnya.'], ['MIN_KASUS_LONJAKAN', 'Minimal kasus untuk dinilai lonjakan', 'number'],
      ['DURASI_SESI_MENIT', 'Logout otomatis setelah tidak aktif (menit)', 'number'], ['APP_URL', 'Alamat aplikasi (GitHub Pages)', 'url', 'Dipakai sebagai tautan di pesan WhatsApp/Email, mis. https://dinkes.github.io/estepel/']];
    el.innerHTML = kepala('Parameter tenggat, ambang skor ketepatan, peringatan dini, dan sesi. Tersimpan di sheet Pengaturan.') + App.tabBar('admin', 'pengaturan') +
      '<div class="card"><form id="fSet" class="g2" style="gap:16px">' + F.map(function (f) { return '<label class="fld"><span>' + f[1] + '</span><input class="inp" name="' + f[0] + '" type="' + f[2] + '" value="' + esc(s[f[0]] || '') + '">' + (f[3] ? '<small>' + f[3] + '</small>' : '') + '</label>'; }).join('') + '</form>' +
      '<div class="flex mt16"><div class="note soft fs12" style="flex:1">' + ic('info', 16) + '<div>Contoh: tenggat 5 pukul 23:59 → laporan Oktober wajib terkirim paling lambat 5 November 23:59 WITA. Perubahan tidak mengubah ketepatan laporan yang sudah tercatat.</div></div><button class="btn btn-p" id="btnSet">' + ic('save', 16) + 'Simpan Pengaturan</button></div></div>';
    $('#btnSet').onclick = function () {
      var d = {}; $$('#fSet input').forEach(function (i) { if (String(s[i.name] || '') !== i.value) d[i.name] = i.value; });
      if (!Object.keys(d).length) { UI.toast('Tidak ada perubahan.', 'info'); return; }
      var b = this; UI.sibuk(b, true);
      API.wajib('admin.pengaturanSimpan', d).then(function (j) { App.S.set = j.set; var bt = LS.get('boot', null); if (bt) { bt.set = j.set; LS.set('boot', bt); } UI.toast(j.message); App.renderKartuTenggat(); tabPengaturan(el); }, function (e) { UI.toast(e.message, 'bad'); UI.sibuk(b, false); });
    };
  }

  /* ---------- Notifikasi WA / Email ---------- */
  function tabNotif(el) {
    el.innerHTML = kepala('WhatsApp (Fonnte) dan Email dikirim lewat antrean non-blocking (trigger 1 menit) agar aplikasi tetap cepat.') + App.tabBar('admin', 'notifikasi') + '<div class="card">' + UI.skel(40, 6) + '</div>';
    function render(c, q) {
      el.innerHTML = kepala('WhatsApp (Fonnte) dan Email dikirim lewat antrean non-blocking (trigger 1 menit) agar aplikasi tetap cepat.') + App.tabBar('admin', 'notifikasi') +
        '<div class="g2"><div class="card"><div class="card-h"><div class="card-t">' + ic('sliders', 20) + 'Saklar utama</div></div><div class="flex col g16">' +
        [['waAktif', 'wa', 'Kanal WhatsApp (Fonnte)', 'Pengingat & pemberitahuan ke nomor WA pengguna'], ['emailAktif', 'mail', 'Kanal Email (Gmail/MailApp)', 'Sisa kuota email hari ini: ' + c.kuotaEmail], ['otomatis', 'clock', 'Pengingat otomatis', 'H-3, H-0, dan setelah lewat tenggat (07.00 WITA)']].map(function (x) {
          return '<div class="flex between"><div class="flex"><div class="tile t-vio" style="width:38px;height:38px">' + ic(x[1], 18) + '</div><div><b>' + x[2] + '</b><div class="fs12 mut">' + x[3] + '</div></div></div><label class="switch"><input type="checkbox" data-s="' + x[0] + '"' + (c[x[0]] ? ' checked' : '') + '><i></i></label></div>';
        }).join('') +
        '<label class="fld"><span>Token API Fonnte</span><input class="inp mono" id="tok" placeholder="' + (c.token.ada ? 'Tersimpan: ' + esc(c.token.samar) + ' — isi untuk mengganti' : 'Tempel token dari dashboard Fonnte') + '" autocomplete="off"><small>Disimpan di Script Properties (tidak di spreadsheet/kode). ' + (c.token.ada ? '<button class="lnk" type="button" id="hapusTok">Hapus token</button>' : '') + '</small></label>' +
        '<label class="fld"><span>Jeda acak antar pesan WA (detik)</span><input class="inp" id="jeda" value="' + esc(c.jeda) + '" style="max-width:140px"><small>Mencegah nomor diblokir WhatsApp. Contoh: 3-8.</small></label>' +
        (c.appUrl ? '' : '<div class="note warn fs12">' + ic('alert', 16) + '<div>Isi <b>Alamat aplikasi (APP_URL)</b> di tab Pengaturan agar pesan berisi tautan ke ESTEPEL.</div></div>') + '</div></div>' +
        '<div class="card"><div class="card-h"><div class="card-t">' + ic('bell', 20) + 'Matriks kejadian</div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kejadian</th><th class="center">WA</th><th class="center">Email</th></tr></thead><tbody>' +
        Object.keys(c.events).map(function (k) { return '<tr><td class="fs12">' + esc(c.events[k].label) + '</td><td class="center"><input type="checkbox" class="chk" data-ev="' + k + '" data-kn="wa"' + (c.matriks[k].wa ? ' checked' : '') + '></td><td class="center"><input type="checkbox" data-ev="' + k + '" data-kn="email"' + (c.matriks[k].email ? ' checked' : '') + '></td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="flex mt16 wrap"><button class="btn btn-p" id="simpanN">' + ic('save', 16) + 'Simpan</button><button class="btn btn-s" id="cekWA">' + ic('wa', 16) + 'Cek nomor WA pengguna</button></div></div></div>' +
        '<div class="card"><div class="card-h"><div class="card-t">' + ic('send', 20) + 'Kirim pesan tes</div></div><div class="flex wrap"><select class="sel" id="tsK" style="width:auto"><option value="WA">WhatsApp</option><option value="EMAIL">Email</option></select><input class="inp" id="tsT" placeholder="0812xxxxxxx atau email" style="max-width:280px"><button class="btn btn-s" id="tsB">' + ic('send', 16) + 'Kirim tes</button></div></div>' +
        '<div class="card p0"><div class="tbl-tools"><div class="card-t">Antrean terakhir ' + (c.antreanAda ? '<span class="badge b-info">sedang diproses</span>' : '') + '</div><button class="btn btn-s btn-sm" id="segarQ">' + ic('refresh', 15) + 'Segarkan</button></div>' +
        (q && q.list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Kanal</th><th>Penerima</th><th>Kejadian</th><th>Status</th><th>Respon</th></tr></thead><tbody>' + q.list.map(function (x) { return '<tr><td class="nowrap fs12">' + INTI.fmtTgl(x.dibuat, true) + '</td><td>' + UI.badge(x.kanal, x.kanal === 'WA' ? 'ok' : 'info') + '</td><td class="fs12">' + esc(x.nama) + '<div class="mut">' + esc(x.tujuan) + '</div></td><td class="fs12">' + esc(x.event) + '</td><td>' + UI.badge(x.status + (x.coba > 1 ? ' (' + x.coba + 'x)' : ''), x.status === 'Terkirim' ? 'ok' : x.status === 'Gagal' ? 'bad' : 'info') + '</td><td class="fs11 mut">' + esc(x.respon) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div style="padding:16px">' + UI.kosong('Antrean kosong', 'Pesan WA/Email yang dikirim sistem akan tampil di sini.', 'inbox') + '</div>') + '</div>';
      $('#simpanN').onclick = function () {
        var d = { matriks: {} };
        $$('[data-s]').forEach(function (i) { d[i.dataset.s] = i.checked; });
        $$('[data-ev]').forEach(function (i) { var m = d.matriks[i.dataset.ev] || (d.matriks[i.dataset.ev] = {}); m[i.dataset.kn] = i.checked; });
        var t = $('#tok').value.trim(); if (t) d.token = t;
        d.jeda = $('#jeda').value.trim();
        var b = this; UI.sibuk(b, true);
        API.wajib('admin.notifCfgSimpan', d).then(function (j) { UI.toast(j.message); muat(); }, function (e) { UI.toast(e.message, 'bad'); UI.sibuk(b, false); });
      };
      var h = $('#hapusTok'); if (h) h.onclick = function () { UI.konfirmasi({ judul: 'Hapus token Fonnte', bahaya: true, pesan: 'Pengiriman WhatsApp akan berhenti sampai token baru diisi.', ya: 'Hapus' }).then(function (ok) { if (ok) API.wajib('admin.notifCfgSimpan', { token: '__HAPUS__' }).then(function () { UI.toast('Token dihapus.'); muat(); }); }); };
      $('#cekWA').onclick = function () { var b = this; UI.sibuk(b, true); API.wajib('admin.cekWA').then(function (j) { UI.toast(j.terdaftar + ' dari ' + j.diperiksa + ' nomor terdaftar di WhatsApp.'); }, function (e) { UI.toast(e.message, 'bad'); }).then(function () { UI.sibuk(b, false); }); };
      $('#tsB').onclick = function () { var b = this; UI.sibuk(b, true); API.wajib('admin.notifTes', { kanal: $('#tsK').value, tujuan: $('#tsT').value.trim() }).then(function (j) { UI.toast(j.message); }, function (e) { UI.toast(e.message, 'bad'); }).then(function () { UI.sibuk(b, false); }); };
      $('#segarQ').onclick = muat;
    }
    function muat() { Promise.all([API.wajib('admin.notifCfg'), API.wajib('admin.antrean')]).then(function (r) { if (App.rute().tab === 'notifikasi') render(r[0], r[1]); }, function (e) { UI.toast(e.message, 'bad'); }); }
    muat();
  }

  /* ---------- Log ---------- */
  function tabLog(el) {
    var f = { q: '', aksi: '' };
    function render(j) {
      el.innerHTML = kepala('Jejak audit: login, kirim laporan, revisi, ekspor, perubahan pengaturan. Rahasia otomatis disamarkan.') + App.tabBar('admin', 'log') +
        '<div class="card p0"><div class="tbl-tools"><div class="inp-ic sm" style="width:280px">' + ic('search', 16) + '<input class="inp" id="lq" placeholder="Cari user, aksi, keterangan..." value="' + esc(f.q) + '"></div><select class="sel sm" id="la" style="width:auto"><option value="">Semua aksi</option>' + ['LOGIN', 'KIRIM', 'REVISI', 'LAPORAN_', 'EKSPOR', 'USER', 'UBAH', 'PENGINGAT', 'MIGRASI', 'KIRIM_PENGINGAT'].map(function (a) { return '<option' + (f.aksi === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select><button class="btn btn-s btn-sm" id="lc">' + ic('search', 15) + 'Terapkan</button></div>' +
        (j ? (j.list.length ? '<div class="tbl-wrap" style="max-height:70vh"><table class="tbl"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Keterangan</th></tr></thead><tbody>' + j.list.map(function (x) { return '<tr><td class="nowrap fs12">' + INTI.fmtTgl(x.waktu, true) + '</td><td class="fs12"><b>' + esc(x.user) + '</b>' + (x.unit ? '<div class="mut">' + esc(App.namaPendek(x.unit)) + '</div>' : '') + '</td><td>' + UI.badge(x.aksi, /GAGAL|HAPUS/.test(x.aksi) ? 'bad' : /LOGIN/.test(x.aksi) ? 'muted' : 'vio') + '</td><td class="fs12" style="max-width:520px;word-break:break-word">' + esc(x.ket) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div style="padding:16px">' + UI.kosong('Tidak ada log', '', 'history') + '</div>') : '<div style="padding:16px">' + UI.skel(36, 6) + '</div>') + '</div>';
      $('#lc').onclick = function () { f.q = $('#lq').value; f.aksi = $('#la').value; render(null); muat(); };
      $('#lq').onkeydown = function (e) { if (e.key === 'Enter') $('#lc').click(); };
    }
    function muat() { API.wajib('admin.log', f).then(function (j) { if (App.rute().tab === 'log') render(j); }, function (e) { UI.toast(e.message, 'bad'); }); }
    render(null); muat();
  }

  /* ---------- Migrasi ---------- */
  function tabMigrasi(el) {
    el.innerHTML = kepala('Pindahkan data dari spreadsheet aplikasi lama (STP Minsel): sheet Laporan → Laporan_Detail + Laporan_Header, sheet Users → Users (sandi di-hash).') + App.tabBar('admin', 'migrasi') +
      '<div class="card flex col g16"><div class="note soft fs12">' + ic('shield', 16) + '<div>Spreadsheet lama <b>hanya dibaca</b>. Kolom dicocokkan berdasarkan <b>nama header</b>. Proses idempoten: laporan/pengguna yang sudah ada dilewati, sehingga aman dijalankan ulang (delta-sync) sebelum peralihan. Jalankan <b>Pindai</b> dulu.</div></div>' +
      '<label class="fld"><span>ID atau URL spreadsheet lama</span><input class="inp" id="mgId" placeholder="https://docs.google.com/spreadsheets/d/…/edit"><small>Harus berada di akun Google yang sama dengan pemilik skrip ESTEPEL.</small></label>' +
      '<div class="flex wrap"><button class="btn btn-s" id="mgPindai">' + ic('search', 16) + 'Pindai (tanpa menulis)</button><button class="btn btn-p" id="mgJalan" disabled>' + ic('db', 16) + 'Jalankan Migrasi</button></div><div id="mgHasil"></div></div>';
    function tampil(h) {
      var L = h.laporan, U = h.users;
      $('#mgHasil').innerHTML = '<div class="note ' + (h.dijalankan ? 'ok' : 'soft') + '">' + ic(h.dijalankan ? 'checkc' : 'info', 18) + '<div><b>' + (h.dijalankan ? 'Migrasi selesai' : 'Hasil pindai') + ' — "' + esc(h.sumber) + '"</b></div></div>' +
        '<div class="g4 mt12">' + UI.kpi({ tile: 't-vio', ikon: 'file', label: 'Baris sheet ' + (L.sheet || '-'), nilai: A(L.baris) }) + UI.kpi({ tile: 't-grn', ikon: 'plus', label: 'Laporan baru', nilai: A(L.laporanBaru), sub: A(L.detailBaru) + ' baris detail' }) + UI.kpi({ tile: 't-amb', ikon: 'minus', label: 'Dilewati (sudah ada)', nilai: A(L.dilewati) }) + UI.kpi({ tile: 't-blu', ikon: 'users', label: 'Pengguna baru', nilai: A(U.baru), sub: U.dilewati + ' dilewati' }) + '</div>' +
        (L.unitTakDikenal.length || L.penyakitTakDikenal.length || L.periodeTakValid ? '<div class="note warn fs12 mt12">' + ic('alert', 16) + '<div>' + (L.unitTakDikenal.length ? '<b>Unit tidak dikenal:</b> ' + esc(L.unitTakDikenal.join(', ')) + '. ' : '') + (L.penyakitTakDikenal.length ? '<b>Penyakit tidak dikenal:</b> ' + esc(L.penyakitTakDikenal.join(', ')) + '. ' : '') + (L.periodeTakValid ? L.periodeTakValid + ' baris tanpa periode valid. ' : '') + 'Baris tersebut dilewati — samakan nama di Master Unit/Penyakit lalu pindai ulang.</div></div>' : '') +
        '<div class="note soft fs12 mt12">' + ic('info', 16) + '<div>Ketepatan laporan lama dihitung dari timestamp lama dan ditandai <b>Historis</b>. Semua akun hasil migrasi wajib mengganti kata sandi saat login pertama.</div></div>';
    }
    $('#mgPindai').onclick = function () {
      var b = this; UI.sibuk(b, true, 'Memindai...');
      API.wajib('admin.migrasi', { sumber: $('#mgId').value.trim(), jalankan: false }).then(function (j) { tampil(j.hasil); $('#mgJalan').disabled = !(j.hasil.laporan.laporanBaru || j.hasil.users.baru); }, function (e) { UI.toast(e.message, 'bad'); }).then(function () { UI.sibuk(b, false); });
    };
    $('#mgJalan').onclick = function () {
      var b = this;
      UI.konfirmasi({ judul: 'Jalankan migrasi', ikon: 'db', pesan: 'Tulis data hasil pindai ke database ESTEPEL? Data yang sudah ada tidak ditimpa.', ya: 'Jalankan' }).then(function (ok) {
        if (!ok) return; UI.sibuk(b, true, 'Memindahkan...');
        API.wajib('admin.migrasi', { sumber: $('#mgId').value.trim(), jalankan: true }).then(function (j) { tampil(j.hasil); UI.toast(j.message); Store.reset(); b.disabled = true; }, function (e) { UI.toast(e.message, 'bad'); }).then(function () { UI.sibuk(b, false); });
      });
    };
  }

  Hal.admin = function (el, r) {
    ({ user: tabUser, unit: function (e) { tabMaster(e, 'unit'); }, penyakit: function (e) { tabMaster(e, 'penyakit'); }, pengaturan: tabPengaturan, notifikasi: tabNotif, log: tabLog, migrasi: tabMigrasi })[r.tab](el, r);
  };
})();
