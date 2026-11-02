# Smart Waste – Backend

REST API untuk Smart Waste Management System: autentikasi berbasis role, laporan sampah dengan foto dan lokasi GPS, klasifikasi gambar dengan model ONNX, dan statistik dashboard.

Struktur dan gaya kode mengikuti [`BLUEPRINT_BACKEND.md`](BLUEPRINT_BACKEND.md).

## Stack

Bun · Elysia · Zod v4 · Drizzle ORM · PostgreSQL 18 · onnxruntime-node · sharp · pino · Biome

## Menjalankan

Butuh **PostgreSQL 18+** (default ID memakai `uuidv7()`).

```bash
bun install
cp .env.example .env      # isi DATABASE_URL, APP_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
bun run dev
```

Saat start, aplikasi otomatis menjalankan migrasi di `drizzle/` dan membuat akun admin dari `ADMIN_EMAIL`/`ADMIN_PASSWORD` jika belum ada.

- API: `http://localhost:8080`
- Dokumentasi API (OpenAPI/Scalar): `http://localhost:8080/docs`, spesifikasi JSON di `/docs/json`
- Health check: `/healthz`, `/readyz`

Data demo (3 user dan 24 laporan tersebar di 14 hari terakhir, memakai foto dari `ml/data/dataset_6class/test`):

```bash
bun run seed:demo                       # default folder dan jumlah
bun run seed:demo path/ke/folder-foto 40
```

Akun demo: `budi@demo.smartwaste.id`, `siti@demo.smartwaste.id`, `andi@demo.smartwaste.id`, password `demo12345`.

## Autentikasi

`POST /auth/login` (atau `/auth/register`) mengembalikan `token` dan juga memasangnya sebagai cookie httpOnly `smart-waste.session`.

- **Web**: cukup kirim request dengan `credentials: "include"`, cookie dikirim otomatis.
- **Mobile**: simpan `token`, lalu kirim `Authorization: Bearer <token>` di setiap request.

Permission diturunkan dari role:

| Role | Permission |
|---|---|
| `admin` | `ADMINISTRATOR` (semua akses) |
| `user` | `SEND_REPORTS` |

## Endpoint

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | publik | Daftar akun warga, langsung login |
| POST | `/auth/login` | publik | Login |
| DELETE | `/auth/session` | login | Logout |
| GET / PATCH | `/users/@me` | login | Profil sendiri, ganti nama/password |
| POST | `/predictions` | login | Klasifikasi foto (multipart `photo`), tidak menyimpan apa pun |
| GET | `/users/@me/reports` | user | Laporan milik sendiri (filter status, kategori, tanggal, search) |
| GET | `/users/@me/reports/summary` | user | Jumlah laporan sendiri per status |
| POST | `/users/@me/reports` | user | Buat laporan (multipart: `photo`, `description`, `latitude`, `longitude`, `address?`, `category?`) |
| GET / PATCH / DELETE | `/users/@me/reports/:id` | user | Detail; ubah dan hapus hanya saat masih `pending` |
| GET | `/reports` | admin | Semua laporan; search (deskripsi, alamat, nama pelapor), filter status, kategori, user, tanggal |
| GET / PATCH / DELETE | `/reports/:id` | admin | Detail, koreksi deskripsi/alamat/kategori, hapus |
| PATCH | `/reports/:id/status` | admin | Ubah status; `note` wajib saat `rejected` |
| GET / POST | `/users` | admin | Daftar user (search, role, aktif) dan buat user/admin |
| GET / PATCH / DELETE | `/users/:id` | admin | Detail, ubah, nonaktifkan (tidak dihapus permanen) |
| GET | `/statistics?days=30` | admin | Total, per status, per kategori, tren harian, kecocokan model |

Semua response memakai envelope `{ message, data, meta }`, dan error memakai `{ message, error? }`. Lihat bagian 8 blueprint.

## Klasifikasi Gambar

Model (`models/waste_classifier.onnx` + `models/labels.json`) adalah hasil training di `ml/` yang diekspor ke ONNX, lalu dijalankan langsung di Bun dengan `onnxruntime-node`, tanpa server Python.

1. Foto diputar sesuai EXIF, dipotong persegi di tengah, di-resize ke 224×224 (lihat `src/modules/classifier.ts`).
2. Jika probabilitas tertinggi di bawah `MODEL_CONFIDENCE_THRESHOLD` (default 0,6), hasilnya `recognized: false` dan `category: null`, sehingga pengguna diminta memilih kategori sendiri.
3. Saat laporan dibuat, model dijalankan lagi di server. Hasilnya disimpan di `model_category`/`model_confidence` dan tidak bisa dipalsukan klien. `category` memakai pilihan pengguna jika dikirim, dan hasil model jika tidak.

Jika file model tidak ada, `POST /predictions` mengembalikan 503, sedangkan pembuatan laporan tetap berjalan tanpa prediksi.

## Penyimpanan Foto

| `STORAGE_DRIVER` | Lokasi | URL foto |
|---|---|---|
| `local` (default) | folder `uploads/` | `APP_BASE_URL/uploads/<key>` |
| `s3` | Cloudflare R2 / S3 (`S3_*`) | `S3_PUBLIC_URL/<key>` |

Foto disimpan ulang sebagai JPEG (sisi terpanjang maksimal 1600 px). Database hanya menyimpan key-nya (`reports/<id>.jpg`).

## Skema & Migrasi

ERD ada di [`../docs/erd`](../docs/erd/README.md). Untuk mengubah skema:

```bash
# ubah src/database/schema/*.ts, lalu
bun run db:generate
```

Migrasi baru berjalan otomatis saat aplikasi start.

## Deploy

Image Docker dibuat oleh GitHub Actions setiap ada push ke `main` (`ghcr.io/<owner>/backend:main-<tanggal>`), lalu di-deploy ke K3s oleh Flux. Tutorial lengkap: [`docs/DEPLOY.md`](docs/DEPLOY.md).

Untuk build lokal:

```bash
docker build -t smart-waste-backend .
docker run --rm -p 8080:8080 --env-file .env smart-waste-backend
```

## Pengecekan

```bash
bun run check       # Biome
bun run typecheck   # TypeScript
```
