import * as ort from "onnxruntime-node";
import sharp from "sharp";

export type Prediction = {
	category: string;
	confidence: number;
	probabilities: Record<string, number>;
};

/**
 * Ubah gambar apa pun (JPG/PNG/WebP, ukuran dan rasio bebas) menjadi tensor input model:
 * diputar sesuai EXIF, dipotong persegi di tengah, di-resize ke size×size, RGB 0–255 float32 NHWC.
 */
export async function preprocess(input: string | Buffer, size: number): Promise<ort.Tensor> {
	const { data } = await sharp(input)
		.rotate()
		.resize(size, size, { fit: "cover", position: "centre" })
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	return new ort.Tensor("float32", Float32Array.from(data), [1, size, size, 3]);
}

export async function loadClassifier(modelPath: string, classNames: string[], size = 224) {
	const session = await ort.InferenceSession.create(modelPath);
	const inputName = session.inputNames[0];
	const outputName = session.outputNames[0];

	return async function predict(input: string | Buffer): Promise<Prediction> {
		const tensor = await preprocess(input, size);
		const output = await session.run({ [inputName]: tensor });
		const probs = Array.from(output[outputName].data as Float32Array);
		const best = probs.indexOf(Math.max(...probs));
		return {
			category: classNames[best],
			confidence: probs[best],
			probabilities: Object.fromEntries(classNames.map((name, i) => [name, probs[i]])),
		};
	};
}
