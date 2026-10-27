/* =====================================================================
   KONTEN WEBSITE — CUKUP EDIT FILE INI SAJA
   ---------------------------------------------------------------------
   • Ganti teks di antara tanda kutip "...".
   • Foto: upload ke folder  images/  lalu tulis namanya di sini,
     contoh: "images/hero.jpg". Foto yang belum diupload akan tampil
     sebagai kotak abu-abu bertuliskan nama file yang dibutuhkan.
   • Lebih mudah: buka  admin.html  di website Anda, masuk dengan token
     GitHub, lalu edit lewat form (file ini akan ditulis ulang otomatis).
   • Tidak butuh suatu bagian? Tambahkan  hidden: true,  di dalamnya,
     contoh:  team: { hidden: true, title: ... }  → Tim tidak ditampilkan.
   • Jangan hapus tanda koma , di akhir baris dan kurung { } [ ].
   ===================================================================== */

window.SITE = {
  /* ---------- Identitas & SEO ---------- */
  company: {
    name: "Nama Perusahaan",
    shortName: "NP",                       // tampil jika logo belum ada
    logo: "images/logo.png",               // disarankan PNG transparan, tinggi ±80px
    tagline: "Solusi terpercaya untuk bisnis Anda",
    description: "Deskripsi singkat perusahaan untuk Google & media sosial (maks. 160 karakter).",
  },

  /* ---------- Warna utama (kode HEX) ---------- */
  theme: {
    primary: "#FF7A00",   // warna utama: orange (tombol, garis, ikon)
    accent: "#FF9A3C",    // warna aksen: orange muda (efek hover)
  },

  /* ---------- Bagian paling atas ---------- */
  hero: {
    title: "Membangun Masa Depan Bersama Anda",
    subtitle: "Kami menyediakan layanan profesional dengan standar kualitas tinggi sejak tahun 2005.",
    image: "images/hero.jpg",              // foto lebar, min. 1920×1080
    buttons: [
      { label: "Hubungi Kami", href: "#kontak" },
      { label: "Lihat Layanan", href: "#layanan" },
    ],
  },

  /* ---------- Angka pencapaian ---------- */
  stats: [
    { value: "20+", label: "Tahun Pengalaman" },
    { value: "350+", label: "Proyek Selesai" },
    { value: "120+", label: "Klien Puas" },
    { value: "15", label: "Kota Terlayani" },
  ],

  /* ---------- Tentang Kami ---------- */
  about: {
    title: "Tentang Kami",
    paragraphs: [
      "Tuliskan sejarah singkat perusahaan, kapan berdiri, dan apa yang membuat perusahaan Anda berbeda.",
      "Paragraf kedua bisa berisi komitmen, nilai perusahaan, atau sertifikasi yang dimiliki.",
    ],
    image: "images/about.jpg",             // foto kantor / tim, rasio 4:3
    vision: "Tuliskan visi perusahaan di sini.",
    mission: [
      "Misi pertama perusahaan.",
      "Misi kedua perusahaan.",
      "Misi ketiga perusahaan.",
    ],
  },

  /* ---------- Layanan / Produk ---------- */
  services: {
    title: "Layanan Kami",
    subtitle: "Apa yang bisa kami bantu untuk Anda",
    items: [
      { icon: "🏗️", title: "Layanan Satu", text: "Penjelasan singkat tentang layanan ini, 1–2 kalimat." },
      { icon: "🛠️", title: "Layanan Dua", text: "Penjelasan singkat tentang layanan ini, 1–2 kalimat." },
      { icon: "📦", title: "Layanan Tiga", text: "Penjelasan singkat tentang layanan ini, 1–2 kalimat." },
      { icon: "🤝", title: "Layanan Empat", text: "Penjelasan singkat tentang layanan ini, 1–2 kalimat." },
      { icon: "📊", title: "Layanan Lima", text: "Penjelasan singkat tentang layanan ini, 1–2 kalimat." },
      { icon: "🛡️", title: "Layanan Enam", text: "Penjelasan singkat tentang layanan ini, 1–2 kalimat." },
    ],
  },

  /* ---------- Galeri / Portofolio Proyek ---------- */
  projects: {
    title: "Proyek & Galeri",
    subtitle: "Beberapa hasil kerja kami",
    items: [
      { image: "images/proyek-1.jpg", title: "Nama Proyek 1", category: "Kategori" },
      { image: "images/proyek-2.jpg", title: "Nama Proyek 2", category: "Kategori" },
      { image: "images/proyek-3.jpg", title: "Nama Proyek 3", category: "Kategori" },
      { image: "images/proyek-4.jpg", title: "Nama Proyek 4", category: "Kategori" },
      { image: "images/proyek-5.jpg", title: "Nama Proyek 5", category: "Kategori" },
      { image: "images/proyek-6.jpg", title: "Nama Proyek 6", category: "Kategori" },
    ],
  },

  /* ---------- Tim / Manajemen ---------- */
  team: {
    title: "Tim Manajemen",
    subtitle: "Orang-orang di balik perusahaan kami",
    items: [
      { photo: "images/tim-1.jpg", name: "Nama Lengkap", role: "Direktur Utama" },
      { photo: "images/tim-2.jpg", name: "Nama Lengkap", role: "Direktur Operasional" },
      { photo: "images/tim-3.jpg", name: "Nama Lengkap", role: "Direktur Keuangan" },
      { photo: "images/tim-4.jpg", name: "Nama Lengkap", role: "Manajer Pemasaran" },
    ],
  },

  /* ---------- Logo Klien / Mitra ---------- */
  clients: {
    title: "Dipercaya Oleh",
    logos: [
      { image: "images/klien-1.png", name: "Klien 1" },
      { image: "images/klien-2.png", name: "Klien 2" },
      { image: "images/klien-3.png", name: "Klien 3" },
      { image: "images/klien-4.png", name: "Klien 4" },
      { image: "images/klien-5.png", name: "Klien 5" },
    ],
  },

  /* ---------- Testimoni ---------- */
  testimonials: {
    title: "Apa Kata Klien",
    items: [
      { quote: "Tuliskan testimoni klien di sini. Pelayanan cepat dan hasil memuaskan.", name: "Nama Klien", company: "PT Contoh Satu" },
      { quote: "Testimoni kedua. Tim yang profesional dan komunikatif.", name: "Nama Klien", company: "PT Contoh Dua" },
      { quote: "Testimoni ketiga. Sangat direkomendasikan.", name: "Nama Klien", company: "CV Contoh Tiga" },
    ],
  },

  /* ---------- Kontak ---------- */
  contact: {
    title: "Hubungi Kami",
    subtitle: "Konsultasikan kebutuhan Anda, gratis.",
    address: "Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta 12345",
    phone: "+62 21 1234 5678",
    email: "info@perusahaan.co.id",
    whatsapp: "6281234567890",             // format 62…, tanpa + / spasi / 0 di depan
    hours: "Senin – Jumat, 08.00 – 17.00 WIB",
    // Google Maps → cari alamat → Bagikan → Sematkan peta → salin link di dalam src="..."
    mapEmbed: "https://www.google.com/maps?q=Monas+Jakarta&output=embed",
  },

  /* ---------- Media sosial (hapus baris yang tidak dipakai) ---------- */
  social: [
    { name: "Instagram", url: "https://instagram.com/" },
    { name: "LinkedIn", url: "https://linkedin.com/company/" },
    { name: "Facebook", url: "https://facebook.com/" },
    { name: "YouTube", url: "https://youtube.com/" },
  ],
};
