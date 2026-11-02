# ML – Klasifikasi Gambar Sampah

## Dataset

Sumber: Alistair King, *Recyclable and Household Waste Classification*, Kaggle –
https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification

Dataset asli berisi 15.000 foto PNG dalam 30 subfolder (masing-masing 250 foto `default` dan 250 `real_world`). Subfolder digabung menjadi 6 kelas:

| Kelas | Subfolder |
|---|---|
| plastic | plastic_water_bottles, plastic_soda_bottles, plastic_detergent_bottles, plastic_shopping_bags, plastic_trash_bags, plastic_food_containers, disposable_plastic_cutlery, plastic_straws, plastic_cup_lids |
| paper | newspaper, office_paper, magazines, cardboard_boxes, cardboard_packaging |
| glass | glass_beverage_bottles, glass_food_jars, glass_cosmetic_containers |
| metal | aluminum_soda_cans, aluminum_food_cans, steel_food_cans, aerosol_cans |
| organic | food_waste, eggshells, coffee_grounds, tea_bags |
| textile | clothing, shoes |

Tidak dipakai: `paper_cups`, `styrofoam_cups`, `styrofoam_food_containers` (bahan campuran).

## Menyiapkan Dataset

1. Ekstrak dataset Kaggle ke `data/images/`.
2. Jalankan:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install pillow
   python scripts/prepare_dataset.py
   ```

Script mengambil 1.000 foto per kelas secara seimbang (rata per subfolder, setengah `default` dan setengah `real_world`), mengecilkannya ke 224×224 JPG, lalu membaginya 70/15/15:

```
data/dataset_6class/
├── train/<kelas>/   700 foto per kelas
├── val/<kelas>/     150 foto per kelas
├── test/<kelas>/    150 foto per kelas
└── manifest.csv     asal setiap foto (subfolder, default/real_world)
data/dataset_6class.zip   ← upload ke Google Drive untuk training di Colab
```

Nama file berformat `<subfolder>__<default|real_world>__<nama asli>.jpg`, sehingga akurasi bisa dievaluasi terpisah untuk foto studio dan foto dunia nyata.

Opsi: `--per-class`, `--size`, `--seed`, `--out`, `--no-zip` (lihat `python scripts/prepare_dataset.py --help`).

## Training

Notebook: [`notebooks/train_waste_classifier.ipynb`](notebooks/train_waste_classifier.ipynb), dijalankan di Google Colab.

1. Upload `data/dataset_6class.zip` ke Google Drive di `MyDrive/smart-waste/`.
2. Buka notebook di Colab, pilih **Runtime → Change runtime type → T4 GPU**, lalu **Run all**.

Model: MobileNetV2 (ImageNet) dengan *transfer learning* dua tahap:

| Tahap | Layer yang dilatih | Learning rate | Epoch maks. |
|---|---|---|---|
| 1. Classifier head | Dense + Dropout | 1e-3 | 10 |
| 2. Fine-tuning | + 30 layer terakhir MobileNetV2 | 1e-5 | 10 |

Augmentasi (flip, rotasi, zoom, kontras, brightness) dan normalisasi ada di dalam model, jadi input untuk prediksi cukup gambar RGB 224×224 dengan nilai piksel 0–255. Training memakai *early stopping* pada `val_loss`.

Hasil tersimpan di `MyDrive/smart-waste/outputs/`. Salin ke repo sebagai berikut:

| File | Tujuan di repo |
|---|---|
| `waste_classifier.keras`, `labels.json` | `ml/models/` |
| `confusion_matrix.png`, `training_history.png`, `classification_report.txt`, `metrics.json` | `docs/evaluation/` |

`metrics.json` juga berisi akurasi terpisah untuk foto `default` dan `real_world`.

## Export ke ONNX

Model dijalankan langsung di backend Elysia (Bun) dengan `onnxruntime-node`, tanpa server Python terpisah.

1. Jalankan [`notebooks/export_onnx.ipynb`](notebooks/export_onnx.ipynb) di Colab (cukup CPU). Notebook ini:
   - membuang layer augmentasi (hanya dipakai saat training),
   - mengekspor model ke `waste_classifier.onnx`,
   - membandingkan prediksi Keras dan ONNX pada 900 gambar test (harus identik),
   - menyimpan `onnx_reference.json` berisi probabilitas 12 gambar test sebagai acuan.
2. Salin `waste_classifier.onnx`, `labels.json`, dan `onnx_reference.json` dari `MyDrive/smart-waste/outputs/` ke `ml/models/`.
3. Uji model yang sama di Bun:

   ```bash
   cd onnx-check
   bun install
   bun run check.ts                 # bandingkan dengan hasil Colab
   bun run check.ts path/ke/foto.jpg  # coba satu foto
   ```

Format model ONNX:

| | |
|---|---|
| Input | `float32 [N, 224, 224, 3]`, RGB, nilai piksel 0–255 (normalisasi sudah di dalam model) |
| Output | `float32 [N, 6]`, probabilitas sesuai urutan `labels.json` |

Preprocessing di [`onnx-check/classifier.ts`](onnx-check/classifier.ts): putar sesuai EXIF, potong persegi di tengah, resize ke 224×224. Foto HP yang tidak persegi jadi tidak gepeng. File ini nanti dipindah ke backend.
