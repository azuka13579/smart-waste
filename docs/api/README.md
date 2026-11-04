# Dokumentasi API

REST API Smart Waste Management System, dibangun dengan Bun + Elysia. Satu backend dipakai bersama oleh website dan aplikasi mobile, termasuk endpoint prediksi gambar (model klasifikasi dijalankan langsung di backend dengan ONNX Runtime).

| | Production | Lokal |
|---|---|---|
| Base URL | `https://smart-waste.karaha.me/api` | `http://localhost:8080` |
| Dokumentasi interaktif (Scalar) | https://smart-waste.karaha.me/api/docs | http://localhost:8080/docs |
| Spesifikasi OpenAPI (JSON) | https://smart-waste.karaha.me/api/docs/json | http://localhost:8080/docs/json |

Salinan spesifikasi OpenAPI disimpan di [`openapi.json`](openapi.json) dan bisa diimpor ke Postman, Insomnia, atau Bruno. Spesifikasi dibuat otomatis dari skema Zod di `backend/src/http/*/model.ts`, sehingga selalu sama dengan validasi yang dijalankan server.

## Autentikasi

1. `POST /auth/login` atau `POST /auth/register` mengembalikan `token`.
2. Kirim token di setiap request:
   - **Mobile**: header `Authorization: Bearer <token>`.
   - **Web**: token juga dipasang sebagai cookie httpOnly `smart-waste.session`, jadi cukup kirim request dengan `credentials: "include"`.
3. `DELETE /auth/session` untuk logout.

Hak akses ditentukan oleh role:

| Role | Permission | Akses |
|---|---|---|
| `admin` | `ADMINISTRATOR` | Semua endpoint |
| `user` | `SEND_REPORTS` | Profil sendiri, prediksi, dan laporan miliknya sendiri (`/users/@me/reports`) |

Akun admin pertama dibuat otomatis saat backend start dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. User mendaftar sendiri lewat `/auth/register`, dan admin bisa membuat akun lain lewat `POST /users`.

## Format Response

Semua response sukses memakai envelope yang sama:

```json
{
  "message": "OK",
  "data": { },
  "meta": { "pagination": { "page": 1, "perPage": 20, "total": 24, "totalPages": 2 } }
}
```

`meta` bernilai `null` untuk response yang bukan daftar. Error memakai format `{ "message": string, "error"?: unknown }`, misalnya:

```json
{ "message": "Account is deactivated" }
```

Untuk error validasi (`400`), `error` berisi daftar field yang tidak valid beserta pesannya.

| Kode | Arti |
|---|---|
| `400` | Validasi gagal atau body tidak valid |
| `401` | Belum login atau token tidak valid |
| `403` | Role tidak punya akses, atau akun nonaktif |
| `404` | Data tidak ditemukan |
| `409` | Konflik, misalnya email sudah terdaftar atau laporan sudah bukan `pending` |
| `503` | File model klasifikasi tidak tersedia |

## Endpoint

### Auth

| Method | Path | Akses | Body |
|---|---|---|---|
| POST | `/auth/register` | publik | `name`, `email`, `password` (8–72 karakter). Langsung login. |
| POST | `/auth/login` | publik | `email`, `password` |
| DELETE | `/auth/session` | login | – |

### Profil

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/users/@me` | login | Profil dan daftar permission |
| PATCH | `/users/@me` | login | `name?`; ganti password dengan `currentPassword` + `newPassword` |

### Prediksi Gambar

| Method | Path | Akses | Body |
|---|---|---|---|
| POST | `/predictions` | login | `multipart/form-data`: `photo` (JPG, PNG, atau WebP, maks. 10 MB) |

Endpoint ini **tidak menyimpan apa pun**. Dipakai untuk menampilkan hasil model seketika sebelum laporan dikirim. Proses di server:

1. Foto diputar sesuai EXIF, dipotong persegi di tengah, lalu di-resize ke 224×224.
2. Model MobileNetV2 (format ONNX) menghasilkan probabilitas untuk 6 kategori.
3. Jika probabilitas tertinggi di bawah ambang (`MODEL_CONFIDENCE_THRESHOLD`, default 0,6), hasilnya dianggap tidak dikenali.

```json
{
  "message": "OK",
  "data": {
    "recognized": true,
    "category": "plastic",
    "confidence": 0.93,
    "threshold": 0.6,
    "probabilities": { "glass": 0.04, "metal": 0.01, "organic": 0.0, "paper": 0.01, "plastic": 0.93, "textile": 0.01 }
  },
  "meta": null
}
```

Jika `recognized` bernilai `false`, `category` bernilai `null` dan aplikasi meminta user memilih kategori sendiri.

### Laporan Milik Sendiri (role user)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/users/@me/reports` | Daftar laporan. Query: `search?`, `status?`, `category?`, `from?`, `to?` (YYYY-MM-DD), `page` (default 1), `limit` (default 20, maks. 100) |
| GET | `/users/@me/reports/summary` | Jumlah laporan per status, untuk beranda |
| POST | `/users/@me/reports` | Buat laporan. `multipart/form-data`: `photo`, `description`, `latitude`, `longitude`, `address?`, `category?` |
| GET | `/users/@me/reports/:id` | Detail beserta riwayat status |
| PATCH | `/users/@me/reports/:id` | Ubah `description`, `address`, `category`. Hanya saat status masih `pending` (selain itu `409`). |
| DELETE | `/users/@me/reports/:id` | Hapus laporan. Hanya saat status masih `pending`. |

Saat laporan dibuat, model dijalankan lagi di server. Hasilnya disimpan di `modelCategory` dan `modelConfidence`, sehingga tidak bisa dipalsukan dari aplikasi. Jika `category` dikirim, nilai itu dipakai sebagai kategori final; jika tidak, kategori final memakai hasil model.

### Manajemen Laporan (admin)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/reports` | Semua laporan. Query: `search?` (deskripsi, alamat, nama pelapor), `status?`, `category?`, `userId?`, `from?`, `to?`, `page`, `limit` |
| GET | `/reports/:id` | Detail laporan, data pelapor, dan riwayat status |
| PATCH | `/reports/:id` | Koreksi `description`, `address`, atau `category` |
| PATCH | `/reports/:id/status` | Ubah `status` (`pending`, `in_progress`, `completed`, `rejected`). `note` wajib saat `rejected`. Setiap perubahan dicatat di riwayat status. |
| DELETE | `/reports/:id` | Hapus laporan |

### Manajemen Pengguna (admin)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/users` | Daftar pengguna. Query: `search?`, `role?`, `isActive?`, `page`, `limit` |
| POST | `/users` | Buat akun. Body: `name`, `email`, `password`, `role` (default `user`) |
| GET | `/users/:id` | Detail pengguna |
| PATCH | `/users/:id` | Ubah `name`, `email`, `password`, `role`, atau `isActive` |
| DELETE | `/users/:id` | Menonaktifkan akun (tidak dihapus permanen, agar laporannya tetap punya pemilik) |

Admin tidak bisa menonaktifkan atau mengubah role akunnya sendiri.

### Statistik (admin)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/statistics` | Query: `days` (1–365, default 30), `status?` (filter tren harian) |

Isi response:

| Field | Isi |
|---|---|
| `totals` | Jumlah laporan, laporan hari ini, dan jumlah pengguna |
| `byStatus` | Jumlah laporan per status |
| `byCategory` | Jumlah laporan per kategori, ditambah `uncategorized` |
| `daily` | Tren jumlah laporan per hari (zona Asia/Jakarta) |
| `model` | Jumlah laporan yang diprediksi model, yang tidak dikenali, dan `agreementRate`: seberapa sering kategori final sama dengan hasil model |

### Lainnya

| Method | Path | Keterangan |
|---|---|---|
| GET | `/` | Cek API berjalan |
| GET | `/healthz` | Liveness check |
| GET | `/readyz` | Readiness check (termasuk koneksi database) |

## Contoh dengan curl

```bash
API=https://smart-waste.karaha.me/api

# Login, ambil token
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<password>"}' | jq -r .data.token)

# Prediksi jenis sampah dari foto
curl -X POST "$API/predictions" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@botol.jpg"

# Buat laporan
curl -X POST "$API/users/@me/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@botol.jpg" \
  -F "description=Tumpukan botol plastik di pinggir jalan" \
  -F "latitude=-6.5952" \
  -F "longitude=106.7907" \
  -F "address=Stasiun Bogor"

# Daftar laporan milik sendiri yang masih pending
curl "$API/users/@me/reports?status=pending" -H "Authorization: Bearer $TOKEN"
```
