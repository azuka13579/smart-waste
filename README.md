# Smart Waste Management System

Sistem pelaporan dan pengelolaan sampah: warga melapor lewat aplikasi mobile (foto, lokasi GPS, deskripsi, deteksi jenis sampah dengan AI), admin mengelola laporan lewat website.

## Arsitektur

```
Mobile (Expo) ──┐
                ├──► Backend (Elysia) ──► PostgreSQL
Web (React)   ──┘         │    └──► Cloudflare R2 (foto)
                          └──► model klasifikasi (ONNX Runtime)
```

Model klasifikasi ditraining di Python (TensorFlow/Keras), diekspor ke ONNX, lalu dijalankan langsung di backend Elysia dengan `onnxruntime-node`. Tidak ada server Python terpisah.

## Struktur Repository

| Folder | Isi | Stack |
|---|---|---|
| `backend/` | REST API, auth, CRUD laporan, statistik | Bun, Elysia, Drizzle ORM, PostgreSQL |
| `web/` | Dashboard admin dan user | React (Vite), React Router, TanStack Query, Tailwind CSS, shadcn/ui |
| `mobile/` | Aplikasi pelaporan untuk user | React Native (Expo) |
| `ml/` | Dataset, notebook training, export dan uji model ONNX | Python, TensorFlow/Keras, ONNX |
| `docs/` | ERD, hasil evaluasi model, screenshot | - |

## Database

ERD dan penjelasan tabel: [`docs/erd/`](docs/erd/README.md) (tabel `users`, `reports`, `report_status_logs`).

## Link

- Demo website: _TODO_
- APK: _TODO_
- Dokumentasi API (termasuk endpoint prediksi gambar): _TODO_
- Video demo: _TODO_

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | _TODO_ | _TODO_ |
| User | _TODO_ | _TODO_ |

## Dataset

- Sumber: Alistair King, *Recyclable and Household Waste Classification*, Kaggle – https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification
- Salinan yang dipakai: _TODO (link Google Drive `dataset_6class.zip`)_
- Kategori (6): glass, metal, organic, paper, plastic, textile – 1.000 gambar per kelas, dibagi 70/15/15. Detail di [`ml/README.md`](ml/README.md).

## Hasil Evaluasi Model

MobileNetV2 dengan transfer learning, **test accuracy 90,22%** (900 gambar test). F1-score per kelas antara 0,84 (plastic) dan 0,94 (textile). Model ONNX menghasilkan prediksi identik dengan model Keras (900/900).

Confusion matrix, grafik training, dan classification report: [`docs/evaluation/`](docs/evaluation/).

## Instalasi

### Backend
```bash
cd backend
bun install
cp .env.example .env
bun run dev
```

### Web
```bash
cd web
pnpm install
cp .env.example .env
pnpm dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### ML

Training dan export model dijalankan di Google Colab. Langkah lengkapnya ada di [`ml/README.md`](ml/README.md). Untuk menguji model ONNX secara lokal:

```bash
cd ml/onnx-check
bun install
bun run check.ts
```
