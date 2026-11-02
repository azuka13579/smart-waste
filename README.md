# Smart Waste Management System

Sistem pelaporan dan pengelolaan sampah: warga melapor lewat aplikasi mobile (foto, lokasi GPS, deskripsi, deteksi jenis sampah dengan AI), admin mengelola laporan lewat website.

## Arsitektur

```
Mobile (Expo) ──┐
                ├──► Backend (Elysia) ──► PostgreSQL
Web (Next.js) ──┘         │    └──► Cloudflare R2 (foto)
                          └──► ML API (FastAPI) ──► model klasifikasi
```

## Struktur Repository

| Folder | Isi | Stack |
|---|---|---|
| `backend/` | REST API, auth, CRUD laporan, statistik | Bun, Elysia, Drizzle ORM, PostgreSQL |
| `web/` | Dashboard admin dan user | Next.js, Tailwind CSS, shadcn/ui |
| `mobile/` | Aplikasi pelaporan untuk user | React Native (Expo) |
| `ml/` | Dataset, notebook training, model, API prediksi | Python, TensorFlow/Keras, FastAPI |
| `docs/` | ERD, hasil evaluasi model, screenshot | - |

## Link

- Demo website: _TODO_
- APK: _TODO_
- Dokumentasi API backend: _TODO_
- Dokumentasi API ML: _TODO_
- Video demo: _TODO_

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | _TODO_ | _TODO_ |
| User | _TODO_ | _TODO_ |

## Dataset

- Sumber: _TODO (nama dataset, pembuat, link Kaggle)_
- Salinan yang dipakai: _TODO (link Google Drive)_
- Kategori: Organic Waste, Plastic Waste, Paper Waste

## Hasil Evaluasi Model

_TODO: accuracy, confusion matrix, dan classification report (lihat `docs/evaluation/`)_

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
cp .env.example .env.local
pnpm dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### ML
```bash
cd ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```
