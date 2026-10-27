# Website Perusahaan — Template GitHub Pages

Website company profile satu halaman. **Tidak perlu coding**: cukup edit `content.js` dan upload foto ke folder `images/`.

```
├── index.html        ← jangan diubah
├── admin.html        ← 🔒 halaman edit (butuh token GitHub)
├── content.js        ← ✏️ SEMUA TEKS & NAMA FOTO ADA DI SINI
├── images/           ← 📷 upload foto ke sini
└── assets/           ← tampilan (CSS/JS), jangan diubah
```

---

## 1. Online-kan di GitHub (sekali saja)

1. Login ke [github.com](https://github.com) → klik **New repository**.
2. Nama repository:
   - `namaakun.github.io` → website tampil di `https://namaakun.github.io`, **atau**
   - nama bebas (mis. `website`) → tampil di `https://namaakun.github.io/website`.
3. Pilih **Public**, klik **Create repository**.
4. Klik **uploading an existing file**, lalu seret **seluruh isi folder ini** (bukan foldernya) ke halaman tersebut → **Commit changes**.
5. Buka **Settings → Pages** → *Source*: **Deploy from a branch** → Branch: **main** / **(root)** → **Save**.
6. Tunggu 1–2 menit, alamat website muncul di bagian atas halaman Settings → Pages.

## 2. Edit lewat halaman Admin (paling mudah) 🔒

Buka `https://alamat-website-anda/admin.html`. Halaman ini **terkunci**: hanya bisa dipakai dengan token GitHub yang punya izin tulis ke repository ini.

**Membuat token (sekali saja):**
1. Buka [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new).
2. *Token name*: `Admin Website`. *Expiration*: sesuai kebutuhan (mis. 1 tahun).
3. *Repository access* → **Only select repositories** → pilih repo website ini.
4. *Permissions* → *Repository permissions* → **Contents: Read and write**.
5. **Generate token**, salin (diawali `github_pat_…`), simpan di tempat aman.

**Memakai admin:**
- Tempel token → **Buka Kunci**. Centang *Ingat di perangkat ini* hanya di komputer pribadi.
- Pilih bagian di menu kiri, ubah teks, tambah/hapus/urutkan item, matikan bagian dengan saklar *Tampilkan di website*.
- **📷 Upload / ganti foto** langsung mengunggah ke folder `images/` (otomatis diperkecil maks. 1920px).
- Klik **Simpan** (atau Ctrl/⌘+S). Website ter-update dalam ±1 menit.
- Klik **Kunci** setelah selesai, terutama di komputer bersama.

Keamanan:
- Token **tidak pernah** disimpan ke repository/website — hanya di browser Anda. Siapa pun yang membuka `admin.html` tanpa token tidak bisa mengubah apa pun.
- Jika token bocor, hapus di GitHub → Settings → Developer settings → Personal access tokens, lalu buat baru.
- Repository yang memakai custom domain: isi *Pemilik* dan *Nama repo* di bagian **Repository** pada layar kunci (untuk alamat `*.github.io` terisi otomatis).

## 3. Edit manual di GitHub (alternatif)

1. Di repository, klik file **`content.js`** → ikon pensil ✏️ (*Edit this file*).
2. Ganti teks di antara tanda kutip `"..."`.
3. Klik **Commit changes**. Website ter-update otomatis dalam ±1 menit.

Tips:
- Jangan hapus tanda `,` `"` `{ }` `[ ]`. Jika website tiba-tiba kosong, biasanya ada tanda yang terhapus.
- Bagian yang tidak dipakai bisa disembunyikan: ganti dengan `null`, contoh `team: null,`
- Mau menambah layanan/proyek/anggota tim? Salin satu baris `{ ... },` lalu tempel di bawahnya.
- Ikon layanan memakai emoji — ganti sesuka hati (🏭 🚚 💡 ⚙️ 🧪 🏢 …).
- Warna website diatur di bagian `theme` (kode HEX, cari "color picker" di Google).

## 4. Upload foto manual

1. Buka folder **`images`** di repository → **Add file → Upload files**.
2. Nama file harus **sama persis** dengan yang tertulis di `content.js` (huruf kecil/besar berpengaruh, `.jpg` ≠ `.JPG`).
3. Upload foto dengan nama yang sama untuk menggantinya.

Selama foto belum diupload, website menampilkan kotak abu-abu bertuliskan nama file yang dibutuhkan — jadi gampang tahu foto mana yang masih kurang.

| File | Dipakai untuk | Ukuran disarankan |
|---|---|---|
| `logo.png` | Logo di menu & ikon tab browser | tinggi ±160px, latar transparan |
| `hero.jpg` | Foto besar paling atas | 1920×1080 |
| `about.jpg` | Bagian Tentang Kami | 1200×900 |
| `proyek-1.jpg` … | Galeri proyek | 1200×900 |
| `tim-1.jpg` … | Foto tim (dipotong bulat) | 600×600 |
| `klien-1.png` … | Logo klien | PNG transparan, ±300×120 |

> Kompres foto dulu di [squoosh.app](https://squoosh.app) atau [tinypng.com](https://tinypng.com) agar website cepat dibuka (target < 300 KB per foto).

## 5. Pakai domain sendiri (opsional)

Misalnya `www.perusahaan.co.id`:
1. **Settings → Pages → Custom domain** → isi domain → **Save**, lalu centang **Enforce HTTPS**.
2. Di pengelola domain (DNS), tambahkan record **CNAME**: `www` → `namaakun.github.io`.

## 6. Lihat di komputer sebelum upload

Cukup klik dua kali `index.html` — website terbuka di browser.
