# Hasil Evaluasi Model

Model klasifikasi gambar sampah: **MobileNetV2** (bobot ImageNet) dengan *transfer learning* dua tahap, 6 kelas. Training dan evaluasi ada di [`ml/notebooks/train_waste_classifier.ipynb`](../../ml/notebooks/train_waste_classifier.ipynb).

## Ringkasan

| Metrik | Nilai |
|---|---|
| **Test accuracy** | **90,22%** (812 dari 900 gambar) |
| Macro F1-score | 0,9024 |
| Target soal | minimal 80% |
| Model ONNX vs Keras | prediksi identik pada 900/900 gambar test |

Data test adalah 150 gambar per kelas yang tidak pernah dipakai saat training maupun validasi.

## Classification Report

| Kelas | Precision | Recall | F1-score | Support |
|---|---|---|---|---|
| glass | 0,8421 | 0,9600 | 0,8972 | 150 |
| metal | 0,9559 | 0,8667 | 0,9091 | 150 |
| organic | 0,9013 | 0,9133 | 0,9073 | 150 |
| paper | 0,9441 | 0,9000 | 0,9215 | 150 |
| plastic | 0,8456 | 0,8400 | 0,8428 | 150 |
| textile | 0,9396 | 0,9333 | 0,9365 | 150 |
| **macro avg** | 0,9048 | 0,9022 | 0,9024 | 900 |

## Analisis

- **Kesalahan terbanyak terjadi antara plastic dan glass.** Botol plastik bening dan botol kaca sama-sama transparan dan memantulkan cahaya, sehingga precision glass (0,84) dan F1 plastic (0,84) menjadi yang terendah. Kaleng logam yang mengkilap juga beberapa kali tertukar dengan glass.
- **Textile dan paper paling mudah dikenali** (F1 0,94 dan 0,92) karena teksturnya khas.
- **Tidak ada overfitting yang merugikan.** Akurasi test (90,2%) hampir sama dengan akurasi validasi (sekitar 90,7%). Fine-tuning 20 epoch menaikkan akurasi test dari 88,78% (10 epoch) ke 90,22%. Setelah epoch 21, akurasi train mulai melampaui validasi, jadi training tidak diperpanjang lagi.

## Konfigurasi Training

| | Nilai |
|---|---|
| Dataset | 6.000 gambar (1.000 per kelas), dibagi 70/15/15 secara stratified |
| Ukuran input | 224×224 RGB |
| Augmentasi | flip horizontal, rotasi, zoom, kontras, brightness |
| Tahap 1 | hanya classifier head, Adam lr 1e-3, maks. 10 epoch |
| Tahap 2 | fine-tuning 30 layer terakhir MobileNetV2, Adam lr 1e-5, 20 epoch |
| Regularisasi | Dropout 0,3, early stopping pada `val_loss` (patience 3) |
| Seed | 42 |

## File

| File | Isi |
|---|---|
| `confusion_matrix.png` | Confusion matrix pada data test |
| `training_history.png` | Grafik akurasi dan loss per epoch (train dan validasi) |
| `classification_report.txt` | Classification report lengkap |
| `metrics.json` | Semua metrik dalam format JSON, termasuk akurasi terpisah untuk foto `default` (studio) dan `real_world` |
