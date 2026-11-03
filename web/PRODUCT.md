# Product

<!-- impeccable:product-schema 1 -->

Cakupan: dashboard web Smart Waste Management System (`web/`). Aplikasi mobile Expo (`mobile/`) adalah permukaan terpisah dan belum dicakup di sini.

## Platform

web

## Users

Dua role, ditentukan oleh backend (`backend/src/constants/user.ts`):

- **Admin**: pengelola laporan sampah. Instansinya belum ditentukan (bisa dinas kebersihan kota, pengelola kawasan, atau lainnya), jadi produk tidak boleh mengasumsikan satu instansi tertentu. Tugasnya meninjau laporan yang masuk, memperbarui status penanganan, mengoreksi kategori sampah, memantau statistik, dan mengelola akun pengguna. Umumnya bekerja di depan komputer dan memproses banyak laporan sekaligus.
- **User**: anggota masyarakat yang melaporkan tumpukan sampah. Mengirim laporan berisi foto, lokasi, dan deskripsi, lalu memantau statusnya sampai selesai. Bisa memakai web ini atau aplikasi mobile; di lapangan biasanya dari HP.

Keputusan desain diprioritaskan untuk kebutuhan kedua pengguna nyata ini, bukan untuk kesan demo.

## Product Purpose

Menghubungkan laporan sampah dari masyarakat dengan pihak yang menanganinya. User melaporkan dengan cepat dari lokasi; admin melihat apa yang perlu ditangani, menindaklanjuti, dan mencatat setiap perubahan status. Berhasil berarti laporan tidak menumpuk di status Pending, user tahu laporannya diproses, dan admin bisa melihat pola sampah per waktu dan jenis.

## Positioning

Setiap foto laporan diklasifikasikan otomatis oleh model MobileNetV2 ke 6 kategori (kaca, logam, organik, kertas, plastik, tekstil), dengan akurasi test 90,22%. Kategori dari model adalah usulan: user bisa menggantinya saat melapor, admin bisa mengoreksinya, dan dashboard melacak seberapa sering usulan model dipertahankan. Riwayat status beserta catatan admin terlihat oleh pelapor.

## Operating Context

- **Admin**: membuka daftar laporan, menyaring berdasarkan status, kategori, tanggal, atau kata kunci, membuka detail (foto, peta lokasi, hasil model), lalu mengubah status. Dashboard dipakai untuk melihat beban kerja (laporan pending, laporan hari ini) dan tren harian.
- **User**: memotret sampah di lokasi, menentukan titik lewat GPS, peta, atau pencarian alamat, lalu mengirim. Kembali ke aplikasi untuk mengecek status.
- Bahasa antarmuka Bahasa Indonesia. Tanggal dan statistik harian memakai zona Asia/Jakarta.
- Foto disimpan di Cloudflare R2 (atau penyimpanan lokal saat development). Peta memakai OpenStreetMap, pencarian dan alamat otomatis memakai Nominatim.

## Capabilities and Constraints

- **Alur status**: Pending → Diproses → Selesai, atau Ditolak. Menolak laporan wajib disertai catatan. Setiap perubahan tercatat di riwayat beserta pelaku dan waktunya.
- **Hak user atas laporannya**: hanya bisa mengedit (deskripsi, alamat, kategori) atau menghapus selama status masih Pending. Foto dan lokasi tidak bisa diganti setelah dikirim.
- **Model klasifikasi**: hasil di bawah ambang keyakinan 0,6 dianggap "tidak dikenali" dan laporan boleh tersimpan tanpa kategori. Model juga dijalankan ulang di server saat laporan dibuat, sehingga hasilnya tidak bisa dipalsukan dari klien.
- **Pengguna tidak pernah dihapus permanen**: admin hanya menonaktifkan akun, agar laporan tetap punya pemilik. Admin tidak bisa menonaktifkan atau mengubah role akunnya sendiri.
- **Batas foto**: JPG, PNG, atau WebP, maksimal 10 MB.
- **Nominatim** dibatasi sekitar 1 request per detik; pencarian alamat harus di-debounce.
- **Konteks pengerjaan**: dibangun sebagai technical test untuk posisi Full Stack Developer di Bilcode, dengan tenggat 5 hari (2–6 November 2026).
- **Belum diputuskan**: instansi pengelola (admin), domain produksi, dan apakah web dan API di-deploy di domain yang sama.

## Brand Commitments

- Nama produk: **Smart Waste Management System** (disingkat "Smart Waste").
- Design system di Figma: https://www.figma.com/design/BkXMmcKiNJ103l8kgacy1k/Smart-Waste-Management-System, dengan hijau sebagai warna brand dan font Plus Jakarta Sans.
- Istilah yang wajib dipakai: **user** (bukan "warga"), **admin** (role petugas sudah dihapus), **model** atau **model klasifikasi** (bukan "AI").
- Nada bahasa: lugas, profesional, dan tenang. **Tanpa emoji** di teks antarmuka, tanpa kalimat bergaya iklan.

## Evidence on Hand

- Dataset: Alistair King, *Recyclable and Household Waste Classification* (Kaggle), 6 kelas, 1.000 gambar per kelas. Detail di `ml/README.md`.
- Hasil evaluasi model: akurasi test 90,22% pada 900 gambar, F1-score per kelas 0,84 (plastik) sampai 0,94 (tekstil); ringkasan di `README.md` root.
- Akun dan laporan demo dari `backend/src/database/seed-demo.ts`.
- **Tidak ada**: testimoni, mitra instansi nyata, data penggunaan, atau angka dampak. Jangan dibuat-buat.

## Product Principles

1. **Yang perlu ditangani tampil lebih dulu.** Admin harus langsung melihat laporan pending dan beban kerja hari ini.
2. **Pelapor selalu tahu nasib laporannya.** Setiap perubahan status terlihat beserta catatannya.
3. **Model mengusulkan, manusia memutuskan.** Hasil model selalu bisa dikoreksi, dan koreksinya terlihat.
4. **Melapor harus cepat di lapangan.** Foto, lokasi, dan deskripsi cukup untuk mengirim; hal lain opsional.
5. **Jujur pada data.** Tidak ada angka, mitra, atau klaim yang tidak berasal dari sistem.
