# Smart Waste Management System

Sistem pelaporan dan pengelolaan sampah. User (masyarakat) melaporkan tumpukan sampah lewat aplikasi Android atau website: foto, lokasi GPS, dan deskripsi, dengan jenis sampah dikenali otomatis oleh model klasifikasi gambar. Admin meninjau laporan, memperbarui status penanganan, memantau statistik, dan mengelola pengguna lewat website.

## Link

| | |
|---|---|
| Repository | https://github.com/azuka13579/smart-waste |
| Demo website | https://smart-waste.karaha.me |
| API (base URL) | https://smart-waste.karaha.me/api |
| Dokumentasi API | https://smart-waste.karaha.me/api/docs (penjelasan lengkap: [`docs/api/`](docs/api/README.md)) |
| APK Android | https://expo.dev/accounts/azuka13579/projects/smart-waste/builds/417dce8c-d969-4f67-941a-27eac6020ab9 |
| Video demo | _TODO: link video_ |
| Dataset yang dipakai | https://drive.google.com/file/d/13Ak5_KvHSwB_ORA-t-3KMxNCepJk4lCu/view?usp=sharing |

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | `admin@gmail.com` | `admin123` |
| User | `budi@demo.smartwaste.id` | `demo12345` |

Akun user baru juga bisa dibuat sendiri lewat halaman Daftar di website atau aplikasi.

## Fitur

**Website** ([`web/`](web/README.md))
- Login dan autentikasi berbasis role (admin dan user)
- Dashboard statistik: jumlah laporan per status dan kategori, laporan hari ini, tren harian, dan tingkat kecocokan hasil model
- Manajemen laporan (CRUD) dengan pencarian, filter status, kategori, dan tanggal, serta pagination
- Update status laporan: Pending, In Progress, Completed, Rejected (catatan wajib saat menolak), dengan riwayat setiap perubahan
- Manajemen pengguna: tambah, ubah, nonaktifkan
- Halaman user untuk membuat laporan (dengan prediksi model dan peta lokasi) dan memantau laporannya
- Responsive design

**Aplikasi mobile** ([`mobile/`](mobile/README.md))
- Register dan login
- Dashboard user: ringkasan laporan per status
- Membuat laporan dengan foto (kamera atau galeri), lokasi GPS, alamat otomatis, dan deskripsi
- Deteksi jenis sampah dari foto (AI image detection) yang tampil seketika sebelum laporan dikirim
- Riwayat laporan dengan filter, serta detail status dan catatan admin

**Machine learning** ([`ml/`](ml/README.md))
- Model klasifikasi gambar 6 kategori: glass, metal, organic, paper, plastic, textile
- MobileNetV2 dengan transfer learning (TensorFlow/Keras), **test accuracy 90,22%**
- Diekspor ke ONNX dan dijalankan langsung di backend sebagai REST API (`POST /predictions`)

## Arsitektur

```
Mobile (Expo) ──┐
                ├──► Backend (Bun + Elysia) ──► PostgreSQL 18
Web (React)   ──┘         │    ├──► Cloudflare R2 (foto laporan)
                          │    └──► Model klasifikasi (ONNX Runtime)
                          └──► /docs (OpenAPI)
```

- Website dan aplikasi mobile memakai backend yang sama. Website mengakses API lewat `/api` di domain yang sama (proxy nginx), sedangkan aplikasi mobile memakai token Bearer.
- Model ditraining di Python (Google Colab), diekspor ke ONNX, lalu dijalankan di backend dengan `onnxruntime-node`. Tidak ada server Python terpisah, sehingga prediksi cukup satu request ke backend.
- Saat laporan dibuat, model dijalankan lagi di server dan hasilnya disimpan terpisah dari kategori pilihan user. Dengan begitu hasil model tidak bisa dipalsukan, dan akurasi model di dunia nyata bisa diukur di dashboard.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Backend | Bun, Elysia, Zod, Drizzle ORM, PostgreSQL 18, onnxruntime-node, sharp |
| Website | React 19, Vite, React Router, TanStack Query/Form/Table, Tailwind CSS, shadcn/ui, Recharts, Leaflet |
| Mobile | Expo SDK 58, React Native, Expo Router, NativeWind, TanStack Query/Form |
| Machine learning | Python, TensorFlow/Keras, scikit-learn, ONNX, Google Colab |
| Infrastruktur | Docker, GitHub Actions, GitHub Container Registry, K3s + Flux, Cloudflare R2, EAS Build |

## Struktur Repository

| Folder | Isi |
|---|---|
| [`backend/`](backend/README.md) | REST API, autentikasi, laporan, pengguna, statistik, prediksi gambar |
| [`web/`](web/README.md) | Dashboard web untuk admin dan user |
| [`mobile/`](mobile/README.md) | Aplikasi Android untuk user |
| [`ml/`](ml/README.md) | Script penyusun dataset, notebook training dan export ONNX, model, uji model di Bun |
| [`docs/api/`](docs/api/README.md) | Dokumentasi API dan spesifikasi OpenAPI |
| [`docs/erd/`](docs/erd/README.md) | ERD dan penjelasan skema database |
| [`docs/evaluation/`](docs/evaluation/README.md) | Hasil evaluasi model |

## Menjalankan Secara Lokal

### Prasyarat

- [Bun](https://bun.sh) 1.3+
- Node.js 24 dan [pnpm](https://pnpm.io) (untuk web dan mobile)
- PostgreSQL **18** (dibutuhkan untuk `uuidv7()`), atau Docker
- HP Android dengan Expo Go, untuk menjalankan aplikasi mobile

### 1. Database

Cara termudah dengan Docker:

```bash
docker run -d --name smart-waste-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smart_waste postgres:18
```

Nilai ini sudah sama dengan `DATABASE_URL` di `backend/.env.example`.

### 2. Backend

```bash
cd backend
bun install
cp .env.example .env
bun run dev
```

Saat start, backend otomatis menjalankan migrasi database dan membuat akun admin dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `.env` (default `admin@smartwaste.id` / `admin12345`). Foto disimpan di folder `backend/uploads/` (`STORAGE_DRIVER=local`).

- API: http://localhost:8080
- Dokumentasi API: http://localhost:8080/docs

**Data demo (opsional).** Untuk mengisi dashboard dengan 3 user dan 24 laporan, unduh `dataset_6class.zip` (link di atas), ekstrak ke `ml/data/dataset_6class/`, lalu:

```bash
bun run seed:demo
```

### 3. Website

```bash
cd web
pnpm install
cp .env.example .env
pnpm dev
```

Buka http://localhost:5173 dan login dengan akun admin di atas.

### 4. Aplikasi Mobile

```bash
cd mobile
pnpm install
cp .env.example .env.local
```

Isi `EXPO_PUBLIC_API_URL` di `.env.local` dengan IP laptop di WiFi yang sama (misalnya `http://192.168.1.10:8080`), atau dengan `https://smart-waste.karaha.me/api` untuk memakai backend production. Lalu:

```bash
pnpm start
```

Pindai QR code dengan Expo Go. Cara build APK ada di [`mobile/README.md`](mobile/README.md#build-apk).

### 5. Machine Learning (opsional)

Model hasil training sudah ada di repo (`ml/models/` dan `backend/models/`), jadi langkah ini hanya untuk mengulang training. Penyusunan dataset, training di Google Colab, dan export ONNX dijelaskan di [`ml/README.md`](ml/README.md).

## Dataset

- **Sumber**: Alistair King, *Recyclable and Household Waste Classification*, Kaggle. https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification
- **Salinan yang dipakai**: https://drive.google.com/file/d/13Ak5_KvHSwB_ORA-t-3KMxNCepJk4lCu/view?usp=sharing
- Dataset asli berisi 15.000 gambar dalam 30 subkategori. Subkategori digabung menjadi 6 kelas, lalu diambil **1.000 gambar per kelas** (total 6.000), seimbang antara foto studio dan foto dunia nyata, dan dibagi 70/15/15 untuk train, validasi, dan test. Script: [`ml/scripts/prepare_dataset.py`](ml/scripts/prepare_dataset.py).

## Hasil Evaluasi Model

| Metrik | Nilai |
|---|---|
| Test accuracy | **90,22%** (900 gambar test) |
| F1-score per kelas | 0,84 (plastic) sampai 0,94 (textile) |
| Model ONNX vs Keras | prediksi identik, 900/900 |

Classification report, confusion matrix, grafik training, dan analisisnya ada di [`docs/evaluation/`](docs/evaluation/README.md).
