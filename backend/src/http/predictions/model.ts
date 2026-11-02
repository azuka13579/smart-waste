import z from "zod";
import { WasteCategory } from "@/constants";

export namespace PredictionsModel {
	/* ── Response ───────────────────────────────────── */
	export const predictionSchema = z.object({
		/** False when the top probability is below `threshold`; ask the user to pick a category. */
		recognized: z.boolean(),
		category: z.enum(WasteCategory).nullable(),
		confidence: z.number().min(0).max(1),
		threshold: z.number().min(0).max(1),
		probabilities: z.record(z.enum(WasteCategory), z.number().min(0).max(1))
	});

	export type predictionSchema = z.infer<typeof predictionSchema>;

	/* ── Body ───────────────────────────────────────── */

	/** multipart/form-data with a single image (JPEG, PNG or WebP, max 10 MB). */
	export const predictBody = z.object({
		photo: z.file()
	});
}
