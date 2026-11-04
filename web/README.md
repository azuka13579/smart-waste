# Smart Waste – Web

Dashboard web Smart Waste Management System untuk admin dan user. Demo: https://smart-waste.karaha.me

## Stack

React 19 · Vite · TypeScript · React Router · TanStack Query, Form, dan Table · Tailwind CSS v4 · shadcn/ui · Recharts · Leaflet (OpenStreetMap) · Zod

## Fitur

Menu yang tampil mengikuti role akun yang login.

**Admin**

| Halaman | Isi |
|---|---|
| Dashboard | Jumlah laporan total, hari ini, dan per status; laporan per kategori; tren harian (7, 30, atau 90 hari); tingkat kecocokan hasil model dengan kategori final |
| Laporan Sampah | Tabel semua laporan dengan pencarian (deskripsi, alamat, nama pelapor), filter status, kategori, dan rentang tanggal, serta pagination |
| Detail laporan | Foto, peta lokasi, data pelapor, hasil model, riwayat status. Admin bisa mengubah status (catatan wajib saat menolak), mengoreksi kategori, deskripsi, dan alamat, atau menghapus laporan. |
| Pengguna | Daftar pengguna dengan pencarian dan filter role/status; tambah, ubah, dan nonaktifkan akun |
| Profil | Ubah nama dan password |

**User**

| Halaman | Isi |
|---|---|
| Beranda | Ringkasan laporan milik sendiri per status dan laporan terbaru |
| Buat Laporan | Unggah foto, hasil prediksi model tampil seketika, pilih atau ganti kategori, tentukan lokasi lewat GPS browser, klik di peta, atau pencarian alamat |
| Laporan Saya | Riwayat laporan dengan filter, detail beserta riwayat status dan catatan admin; ubah atau hapus selama masih Pending |
| Profil | Ubah nama dan password |

Semua halaman responsif dan bisa dibuka dari HP.

## Menjalankan Lokal

Butuh Node.js 24 dan pnpm 11, serta backend yang sudah berjalan (lihat [`../backend/README.md`](../backend/README.md)).

```bash
pnpm install
cp .env.example .env     # VITE_PROXY_TARGET=http://localhost:8080
pnpm dev
```

Buka http://localhost:5173. Saat development, Vite meneruskan semua request `/api/*` ke backend (`VITE_PROXY_TARGET`), sehingga web dan API berada di origin yang sama dan cookie sesi httpOnly ikut terkirim.

## Build dan Deploy

```bash
pnpm build      # tsc -b && vite build, hasil di dist/
```

Image Docker ([`Dockerfile`](Dockerfile)) membangun file statis lalu menyajikannya dengan nginx. nginx juga meneruskan `/api/*` ke backend (`API_UPSTREAM`), sama seperti proxy Vite saat development, sehingga web dan API tetap satu origin di production.

```bash
docker build -t smart-waste-web .
docker run --rm -p 8081:8080 -e API_UPSTREAM=http://host.docker.internal:8080 smart-waste-web
```

GitHub Actions ([`.github/workflows/web-build.yaml`](../.github/workflows/web-build.yaml)) mengecek build dan mendorong image ke `ghcr.io/<owner>/web` setiap ada perubahan `web/**` di `main`.

## Struktur

```
src/
├── pages/          Halaman per route (auth, dashboard, reports, my-reports, users, profile)
├── layouts/        Layout auth dan dashboard (sidebar, breadcrumb)
├── components/
│   ├── ui/         Komponen shadcn/ui
│   └── common/     Komponen aplikasi (tabel, peta, status, foto, form field)
├── lib/
│   ├── services/   Pemanggilan API per resource
│   ├── schemas/    Validasi form (Zod)
│   ├── types/      Tipe response API
│   └── enums/      Status, kategori, role, permission
├── router.tsx      Definisi route dan guard per permission
└── main.tsx
```
