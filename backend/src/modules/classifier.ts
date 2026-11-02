import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { modelConfidenceThreshold, modelLabelsPath, modelPath } from "@/config";
import { type WasteCategory, WasteCategoryValues } from "@/constants";
import { logger } from "./logger";

/** Input size the model was trained on (see ml/notebooks/train_waste_classifier.ipynb). */
const IMAGE_SIZE = 224;

export class ModelUnavailableError extends Error {}

export interface WastePrediction {
	/** False when the top probability is below the threshold. */
	recognized: boolean;
	/** Top class when recognized, otherwise null. */
	category: WasteCategory | null;
	/** Top class probability (0–1), reported even when not recognized. */
	confidence: number;
	threshold: number;
	probabilities: Record<WasteCategory, number>;
}

/**
 * Turn any photo into the model input: EXIF rotation, center square crop so phone photos
 * are not squashed, resize to 224×224, RGB float32 NHWC with raw 0–255 pixels
 * (normalization is inside the model).
 */
async function toTensor(image: Buffer) {
	const data = await sharp(image).rotate().resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "cover", position: "centre" }).removeAlpha().raw().toBuffer();
	return new ort.Tensor("float32", Float32Array.from(data), [1, IMAGE_SIZE, IMAGE_SIZE, 3]);
}

async function loadModel() {
	const [modelFile, labelsFile] = [Bun.file(modelPath), Bun.file(modelLabelsPath)];
	if (!(await modelFile.exists()) || !(await labelsFile.exists())) {
		throw new ModelUnavailableError(`Model files not found (${modelPath}, ${modelLabelsPath})`);
	}

	const labels: string[] = await labelsFile.json();
	if (labels.length !== WasteCategoryValues.length || labels.some(label => !WasteCategoryValues.includes(label as WasteCategory))) {
		throw new ModelUnavailableError(`labels.json must contain exactly: ${WasteCategoryValues.join(", ")}`);
	}

	const session = await ort.InferenceSession.create(modelPath);
	logger.info(`[Classifier] Loaded ${modelPath} (${labels.join(", ")})`);
	return { session, labels: labels as WasteCategory[] };
}

let modelPromise: ReturnType<typeof loadModel> | null = null;

/** Loads the model on first use; a failed load is retried on the next call. */
function getModel() {
	modelPromise ??= loadModel().catch(error => {
		modelPromise = null;
		throw error;
	});
	return modelPromise;
}

export async function predictWaste(image: Buffer): Promise<WastePrediction> {
	const { session, labels } = await getModel();
	const output = await session.run({ [session.inputNames[0] as string]: await toTensor(image) });
	const probs = Array.from(output[session.outputNames[0] as string]?.data as Float32Array);

	const best = probs.indexOf(Math.max(...probs));
	const confidence = probs[best] ?? 0;
	const recognized = confidence >= modelConfidenceThreshold;

	return {
		recognized,
		category: recognized ? (labels[best] ?? null) : null,
		confidence,
		threshold: modelConfidenceThreshold,
		probabilities: Object.fromEntries(labels.map((label, i) => [label, probs[i] ?? 0])) as Record<WasteCategory, number>
	};
}

/** Like `predictWaste`, but returns null instead of failing when the model is missing or errors. */
export async function tryPredictWaste(image: Buffer) {
	try {
		return await predictWaste(image);
	} catch (error) {
		logger.warn(error, "[Classifier] Prediction skipped");
		return null;
	}
}
