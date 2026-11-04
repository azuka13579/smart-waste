# Smart Waste – Mobile

Aplikasi Android untuk user (masyarakat) melaporkan tumpukan sampah dari lapangan: foto, lokasi GPS, dan deskripsi, dengan jenis sampah diusulkan otomatis oleh model klasifikasi. Admin tetap memakai website.

APK: _lihat bagian Link di [README utama](../README.md#link)_

## Stack

Expo SDK 58 · React Native 0.88 · Expo Router (native tabs) · NativeWind (Tailwind CSS v3) · TanStack Query dan Form · Zod · expo-image-picker · expo-location · expo-secure-store

## Fitur

| Layar | Isi |
|---|---|
| Masuk dan Daftar | Login dan registrasi akun user. Token disimpan di SecureStore, dan respons 401 mengembalikan user ke layar masuk. |
| Beranda | Ringkasan jumlah laporan per status dan laporan terbaru |
| Buat Laporan | Ambil foto dari kamera atau galeri, hasil prediksi model tampil seketika, pilih atau ganti kategori, lokasi GPS terisi otomatis beserta alamat dari OpenStreetMap, lalu isi deskripsi |
| Cek Sampah | Cek jenis sampah dari foto tanpa membuat laporan, lalu lanjutkan ke "Laporkan sampah ini" bila perlu |
| Laporan Saya | Riwayat laporan dengan filter status, jenis sampah, dan rentang tanggal |
| Detail Laporan | Foto, lokasi, hasil model, dan riwayat status beserta catatan admin. Laporan bisa diubah atau dihapus selama masih Pending. |
| Profil | Ubah nama dan password, keluar |

Sebelum diunggah, foto diperkecil di HP ke sisi terpanjang 1600 px dan dikonversi ke JPEG, karena foto kamera bisa berukuran 5–12 MB dan berformat HEIC.

## Menjalankan Lokal

Butuh Node.js 24, pnpm, dan HP Android dengan aplikasi **Expo Go** (atau emulator Android). Backend harus berjalan dan bisa diakses dari HP (lihat [`../backend/README.md`](../backend/README.md)).

```bash
pnpm install
cp .env.example .env.local
```

Isi `EXPO_PUBLIC_API_URL` di `.env.local`:

- Backend production: `https://smart-waste.karaha.me/api`
- Backend di laptop: `http://<IP-laptop>:8080`, misalnya `http://192.168.1.10:8080`. HP tidak bisa mengakses `localhost` laptop, jadi pakai IP laptop di WiFi yang sama, dan pastikan `SERVER_HOST=0.0.0.0` di `.env` backend.

Lalu jalankan:

```bash
pnpm start
```

Pindai QR code yang muncul dengan Expo Go. Jika Expo Go menolak karena versi SDK atau modul native, pakai development build: `npx eas-cli build -p android --profile development`.

## Build APK

APK dibuat di server Expo dengan EAS Build, memakai profile `preview` di [`eas.json`](eas.json). Profile ini menghasilkan file `.apk` (bukan `.aab`) dan mengarahkan aplikasi ke backend production.

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

Setelah build selesai, link unduhan APK muncul di terminal dan di halaman project di expo.dev.

## Pengecekan

```bash
npx tsc --noEmit
pnpm lint
```

## Struktur

```
src/
├── app/            Route Expo Router (login, register, tab, detail dan edit laporan)
├── screens/        Isi tiap layar
├── components/
│   ├── ui/         Komponen dasar (button, input, bottom sheet, dialog)
│   └── common/     Komponen aplikasi (pemilih foto, lokasi, status, timeline)
└── lib/
    ├── services/   Pemanggilan API
    ├── schemas/    Validasi form (Zod)
    ├── photo.ts    Perkecil dan konversi foto sebelum diunggah
    ├── location.ts GPS
    └── session.ts  Sesi login dan token
```
