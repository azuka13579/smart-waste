import z from "zod";
import { ReportStatus, WasteCategory } from "@/constants";

export namespace StatisticsModel {
	/* ── Response ───────────────────────────────────── */
	export const dashboardSchema = z.object({
		totals: z.object({
			reports: z.number().int(),
			/** Reports created today (Asia/Jakarta). */
			reportsToday: z.number().int(),
			/** Active accounts with role `user`. */
			users: z.number().int()
		}),
		byStatus: z.record(z.enum(ReportStatus), z.number().int()),
		byCategory: z.object({
			...Object.fromEntries(Object.values(WasteCategory).map(category => [category, z.number().int()])),
			uncategorized: z.number().int()
		}) as z.ZodObject<Record<WasteCategory | "uncategorized", z.ZodNumber>>,
		/** One entry per day for the last `days` days, oldest first, zero-filled. */
		daily: z.array(z.object({ date: z.iso.date(), count: z.number().int() })),
		/** How often users and admins kept the model's category. */
		model: z.object({
			/** Reports where the model returned a category. */
			predicted: z.number().int(),
			/** Reports where the model ran but was below the confidence threshold. */
			notRecognized: z.number().int(),
			/** Predicted reports whose final category still equals the model's. */
			agreed: z.number().int(),
			/** agreed / predicted, null when nothing was predicted yet. */
			agreementRate: z.number().min(0).max(1).nullable()
		})
	});

	export type dashboardSchema = z.infer<typeof dashboardSchema>;

	/* ── Query ──────────────────────────────────────── */
	export const dashboardQuery = z.object({
		days: z.coerce.number().int().min(1).max(365).default(30)
	});

	export type dashboardQuery = z.output<typeof dashboardQuery>;
}
