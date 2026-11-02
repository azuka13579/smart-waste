# Deploy ke K3s dengan Flux

Alur yang dipakai sama dengan MySOC: setiap push ke `main` membuat image baru, lalu Flux di cluster menemukannya dan meng-update deployment sendiri.

```
git push origin main
   │
   ▼
GitHub Actions (.github/workflows/build.yaml di root repo, hanya jalan jika backend/** berubah)
   ├─ biome check + typecheck
   └─ docker build → ghcr.io/<owner>/backend:main-20261102153045   (main-<UTC yyyyMMddHHmmss>)
                      ghcr.io/<owner>/backend:latest
   │
   ▼
Flux di cluster
   ├─ ImageRepository   scan tag di ghcr setiap 1 menit
   ├─ ImagePolicy       ambil tag ^main-(\d+)$ dengan angka terbesar
   └─ ImageUpdateAutomation  commit tag baru ke repo infra (penanda {"$imagepolicy": ...} di deployment.yaml)
   │
   ▼
Kustomization apps-smart-waste-backend → rolling update pod backend
```

Tag `main-<tanggal>` berupa angka yang selalu naik, sehingga `policy: numerical` selalu memilih build terbaru.

Semua manifest siap salin ada di [`deploy/flux/`](../deploy/flux/). Struktur foldernya sama dengan repo infrastruktur, jadi cukup disalin ke root repo itu.

```
deploy/flux/
├── clusters/sea/apps/smart-waste/backend.yaml   Namespace + Flux Kustomization
└── apps/smart-waste/backend/
    ├── kustomization.yaml
    ├── database.yaml           CloudNativePG, PostgreSQL 18
    ├── image.yaml              ImageRepository, ImagePolicy, ImageUpdateAutomation
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml            haproxy + cert-manager
    ├── smart-waste.config.env  konfigurasi non-rahasia → ConfigMap
    └── secrets.example.yaml    contoh secret (salin jadi secrets.yaml lalu enkripsi SOPS)
```

## Prasyarat

- Monorepo `smart-waste` sudah ada di GitHub. Backend ada di folder `backend/`, dan workflow-nya di `.github/workflows/build.yaml` di root repo. Workflow hanya berjalan untuk push atau PR ke **`main`** yang mengubah `backend/**`.
- Cluster K3s dengan Flux (beserta `image-reflector-controller` dan `image-automation-controller`), CloudNativePG, cert-manager, dan haproxy-ingress. Semua ini sudah ada di repo infrastruktur.
- `kubectl`, `flux`, `sops`, dan `age` terpasang di laptop.
- Bucket Cloudflare R2 dan API token-nya (lihat bagian R2 di [README](../README.md#penyimpanan-foto)). Di Kubernetes, foto **wajib** disimpan di R2, karena disk pod hilang setiap kali pod dibuat ulang.
- Domain untuk API, misalnya `api.smartwaste.example.com`, dengan DNS yang mengarah ke ingress cluster.

## 1. Build image pertama

1. Gabungkan perubahan backend ke `main`, misalnya lewat Pull Request dari branch fitur. Saat PR dibuka, workflow sudah mengecek lint, typecheck, dan memastikan image bisa di-build, tapi belum mem-push image. Setelah di-merge, image di-push.
2. Buka tab **Actions** di GitHub. Workflow **Backend: build & push to container registry** harus hijau.
3. Image muncul di **Packages** milik akun atau organisasi, dengan nama `backend` dan tag `main-<tanggal>` serta `latest`.

Workflow memakai `GITHUB_TOKEN`, jadi tidak perlu menambahkan secret apa pun di repo. Kalau push ke ghcr ditolak (403), buka **Settings → Actions → General → Workflow permissions** dan pilih **Read and write permissions**.

## 2. Siapkan akses pull dari ghcr

Package ghcr baru bersifat **private**. Cluster butuh kredensial untuk menarik image dan membaca daftar tag:

1. Buat Personal Access Token (classic) dengan scope **`read:packages`**.
2. Buat isi secret `ghcr-pull`:
   ```bash
   kubectl create secret docker-registry ghcr-pull --docker-server=ghcr.io --docker-username=<github-username> --docker-password=<PAT> --dry-run=client -o yaml
   ```
   Salin nilai `.dockerconfigjson` dari output perintah itu ke `secrets.yaml` (langkah 4).

Alternatifnya, jadikan package **public** (Package settings → Change visibility). Setelah itu, hapus `imagePullSecrets` di `deployment.yaml` dan `secretRef` di `image.yaml`.

## 3. Salin manifest ke repo infrastruktur

Dari root repo `smart-waste`:

```bash
cp -r backend/deploy/flux/clusters/sea/apps/smart-waste   <repo-infra>/clusters/sea/apps/
cp -r backend/deploy/flux/apps/smart-waste                <repo-infra>/apps/
```

Ubah placeholder berikut di repo infra:

| File | Ubah |
|---|---|
| `image.yaml`, `deployment.yaml` | `<owner>` → user/organisasi GitHub (huruf kecil) |
| `deployment.yaml` | tag awal → tag dari langkah 1 (setelah itu diurus Flux) |
| `ingress.yaml` | `api.smartwaste.example.com` → domain API |
| `smart-waste.config.env` | `APP_BASE_URL`, `CORS_ORIGINS` (domain web), `ADMIN_EMAIL`, `S3_*` |

## 4. Secret + enkripsi SOPS

Secret tidak boleh di-commit dalam bentuk teks biasa. Pakai pola yang sama dengan monopoli:

1. Buat age key khusus untuk aplikasi ini:
   ```bash
   age-keygen -o smart-waste.agekey
   ```
   Catat public key-nya (`age1...`).
2. Daftarkan key itu ke Flux:
   ```bash
   kubectl -n flux-system create secret generic sops-smart-waste-age --from-file=age.agekey=smart-waste.agekey
   ```
   Simpan `smart-waste.agekey` di tempat aman, misalnya password manager, dan jangan di-commit.
3. Tambahkan aturan di `.sops.yaml` repo infra:
   ```yaml
   creation_rules:
     - path_regex: apps/smart-waste/backend/secrets\.yaml$
       encrypted_regex: '^(data|stringData)$'
       age: age1...   # public key dari langkah 1
   ```
4. Buat dan enkripsi secret-nya:
   ```bash
   cd <repo-infra>/apps/smart-waste/backend
   cp secrets.example.yaml secrets.yaml && rm secrets.example.yaml
   # isi APP_SECRET (openssl rand -base64 48), ADMIN_PASSWORD, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, .dockerconfigjson
   sops --encrypt --in-place secrets.yaml
   ```
   Pastikan nilainya sudah berubah menjadi `ENC[AES256_GCM,...]` sebelum di-commit.

`DATABASE_URL` tidak perlu diisi manual. CloudNativePG membuat secret `smart-waste-db-app` beserta key `uri`-nya.

## 5. Commit repo infra

```bash
git add clusters/sea/apps/smart-waste apps/smart-waste .sops.yaml
git commit -m "feat(app-smart-waste-backend): add backend"
git push
```

Flux menerapkannya dalam beberapa menit. Untuk mempercepat:

```bash
flux reconcile source git flux-system
flux reconcile kustomization apps-smart-waste-backend
```

## 6. Cek hasilnya

```bash
flux get kustomizations apps-smart-waste-backend
flux get images all -n smart-waste-backend        # ImagePolicy harus menunjuk tag terbaru
kubectl -n smart-waste-backend get cluster,pods,ingress,certificate
kubectl -n smart-waste-backend logs deploy/backend
curl https://api.smartwaste.example.com/readyz    # {"message":"Ready","data":{}}
```

Di log pertama harus ada `Migrations complete` dan `Seeded admin account ...`. Setelah itu, login dengan `ADMIN_EMAIL`/`ADMIN_PASSWORD` dan buka `https://api.smartwaste.example.com/docs`.

## Update berikutnya

Cukup merge atau push perubahan di `backend/` ke `main`. Sekitar 1–2 menit setelah Actions selesai, Flux meng-commit tag baru ke repo infra (`chore(app-smart-waste-backend): update image tags`) dan pod di-update secara bergilir. Migrasi database baru berjalan otomatis saat pod start.

**Rollback:** hentikan update otomatis, lalu tulis tag lama secara manual:

```bash
flux suspend image update image-auto-update -n smart-waste-backend
# edit tag di apps/smart-waste/backend/deployment.yaml → commit → push
flux resume image update image-auto-update -n smart-waste-backend   # setelah perbaikan dirilis
```

## Troubleshooting

| Gejala | Penyebab umum |
|---|---|
| Pod `ImagePullBackOff` | `ghcr-pull` salah, atau PAT tidak punya `read:packages` |
| `flux get images` tidak menemukan tag | Tag tidak cocok dengan `^main-(\d+)$`, atau ImageRepository tidak bisa login ke ghcr |
| Init container `wait-for-db` timeout | Cluster `smart-waste-db` belum siap; cek `kubectl get cluster -n smart-waste-backend` |
| Log `function uuidv7() does not exist` | PostgreSQL di bawah 18; pastikan `imageName` memakai `postgresql:18` |
| Upload foto gagal dengan 413 | Naikkan `proxy-body-size` di `ingress.yaml` |
| URL foto mengarah ke `/uploads/...` | `STORAGE_DRIVER` masih `local`; set ke `s3` dan isi `S3_*` |
| Web tidak bisa login (cookie tidak tersimpan) | Domain web belum ada di `CORS_ORIGINS` |
