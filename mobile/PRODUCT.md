# Product

<!-- impeccable:product-schema 1 -->

Cakupan: aplikasi mobile Expo Smart Waste Management System (`mobile/`). Fakta produk bersama (tujuan, alur status, aturan model klasifikasi, batas foto, brand, bukti, dan prinsip) **sama dengan [`web/PRODUCT.md`](../web/PRODUCT.md)** dan berlaku penuh di sini. File ini hanya mencatat yang khusus mobile; bila ada perubahan fakta bersama, ubah `web/PRODUCT.md` lalu sesuaikan file ini.

## Platform

android

## Users

- **User**: anggota masyarakat yang melaporkan tumpukan sampah. Satu-satunya pengguna aplikasi mobile. Membuka aplikasi di lokasi, biasanya satu tangan dan sambil berdiri di luar ruangan, untuk memotret sampah, menandai lokasi, dan mengirim laporan. Kembali ke aplikasi untuk mengecek apakah laporannya sudah diproses.
- **Admin tidak memakai aplikasi mobile.** Peninjauan laporan, perubahan status, statistik, dan manajemen akun tetap di website. Akun admin yang masuk lewat mobile tidak mendapat fitur admin.

## Product Purpose

Membuat pelaporan sampah dari lapangan secepat mungkin: foto, lokasi GPS, dan deskripsi cukup untuk mengirim, dengan jenis sampah diusulkan otomatis oleh model klasifikasi. Berhasil berarti user bisa melapor dalam kurang dari satu menit di lokasi dan selalu tahu status laporannya tanpa harus membuka website.

## Positioning

Sama dengan web: setiap foto diklasifikasikan oleh model MobileNetV2 ke 6 kategori (akurasi test 90,22%), dan di mobile hasilnya tampil seketika setelah foto diambil, sebelum laporan dikirim. Hasil model adalah usulan yang bisa diganti user.

## Operating Context

- Dipakai di luar ruangan: cahaya terang, sinyal tidak stabil, satu tangan memegang HP.
- Kamera dan GPS HP adalah sumber utama foto dan lokasi; galeri dan pengisian alamat manual adalah cadangan.
- Alamat otomatis dari Nominatim (OpenStreetMap), sama seperti web.
- Bahasa antarmuka Bahasa Indonesia; tanggal memakai zona Asia/Jakarta.

## Capabilities and Constraints

- **Fitur user**: daftar, masuk, keluar; beranda dengan ringkasan laporan; buat laporan (foto, prediksi model, kategori, lokasi GPS, alamat, deskripsi); riwayat laporan dengan filter status; detail laporan dengan riwayat status dan catatan admin; edit atau hapus laporan selama masih Pending.
- **Sesi**: token dari backend disimpan di SecureStore dan dikirim sebagai `Authorization: Bearer`. Respons 401 mengeluarkan user ke layar masuk.
- **Foto**: diperkecil di HP ke sisi terpanjang 1600 px dan dikonversi ke JPEG sebelum diunggah (backend tidak menerima HEIC).
- **Stack**: Expo SDK 58, React Native 0.88, Expo Router, NativeWind (Tailwind CSS v3), TanStack Query dan TanStack Form, Zod. Paket dikelola dengan pnpm (`nodeLinker: hoisted`).
- **Distribusi**: APK Android lewat EAS Build untuk pengumpulan technical test. Rilis Play Store dan dukungan iOS belum direncanakan.
- **Belum diputuskan**: tema gelap, dukungan tablet, dan notifikasi push saat status laporan berubah.

## Brand Commitments

Mengikuti `web/PRODUCT.md`: nama **Smart Waste Management System** ("Smart Waste"), hijau sebagai warna brand, font Plus Jakarta Sans di design system Figma, istilah **user**, **admin**, dan **model klasifikasi** (bukan "AI"), nada lugas dan profesional, tanpa emoji di teks antarmuka.

## Evidence on Hand

Sama dengan `web/PRODUCT.md`. Tidak ada testimoni, mitra instansi, data penggunaan, atau angka dampak; jangan dibuat-buat.

## Product Principles

1. **Melapor harus cepat di lapangan.** Kamera dan GPS langsung bekerja; tidak ada isian wajib selain foto, lokasi, dan deskripsi.
2. **User selalu tahu nasib laporannya.** Status dan catatan admin terlihat dari HP tanpa membuka website.
3. **Model mengusulkan, user memutuskan.** Hasil model tampil sebagai usulan yang bisa diganti sebelum dikirim.
4. **Tahan kondisi lapangan.** Izin ditolak, GPS mati, atau sinyal hilang selalu punya pesan dan jalan keluar yang jelas.
5. **Jujur pada data.** Tidak ada angka atau klaim yang tidak berasal dari sistem.
