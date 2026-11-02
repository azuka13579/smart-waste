/**
 * Membandingkan hasil model ONNX di Bun dengan hasil di Colab (onnx_reference.json).
 *
 * Butuh file dari MyDrive/smart-waste/outputs/ yang disalin ke ml/models/:
 *   waste_classifier.onnx, labels.json, onnx_reference.json
 * dan gambar test lokal di ml/data/dataset_6class/test/ (hasil scripts/prepare_dataset.py).
 *
 * Opsional: bun run check.ts <path-foto> untuk mencoba satu foto sendiri.
 */
import { join } from "node:path";
import { loadClassifier } from "./classifier";

const ML_DIR = join(import.meta.dir, "..");
const MODELS_DIR = join(ML_DIR, "models");
const DATASET_DIR = join(ML_DIR, "data", "dataset_6class");
// Selisih kecil wajar karena decoder JPEG di TensorFlow dan sharp tidak identik.
const TOLERANCE = 0.02;

type Reference = {
	class_names: string[];
	img_size: number;
	samples: { file: string; label: string; probs: number[] }[];
};

const classNames: string[] = await Bun.file(join(MODELS_DIR, "labels.json")).json();
const predict = await loadClassifier(join(MODELS_DIR, "waste_classifier.onnx"), classNames);

const photo = process.argv[2];
if (photo) {
	const start = performance.now();
	const result = await predict(photo);
	console.log(result);
	console.log(`waktu: ${(performance.now() - start).toFixed(0)} ms`);
	process.exit(0);
}

const reference: Reference = await Bun.file(join(MODELS_DIR, "onnx_reference.json")).json();
let failed = 0;
for (const sample of reference.samples) {
	const result = await predict(join(DATASET_DIR, sample.file));
	const expected = reference.class_names[sample.probs.indexOf(Math.max(...sample.probs))];
	const maxDiff = Math.max(...reference.class_names.map((name, i) => Math.abs(result.probabilities[name] - sample.probs[i])));
	const ok = result.category === expected && maxDiff <= TOLERANCE;
	if (!ok) failed++;
	console.log(
		`${ok ? "✅" : "❌"} ${sample.file.padEnd(62)} colab=${expected.padEnd(8)} bun=${result.category.padEnd(8)} ` +
			`(${(result.confidence * 100).toFixed(1)}%) selisih=${maxDiff.toFixed(4)}`,
	);
}

console.log(failed === 0 ? `\nSemua ${reference.samples.length} sampel cocok dengan Colab.` : `\n${failed} sampel tidak cocok.`);
process.exit(failed === 0 ? 0 : 1);
