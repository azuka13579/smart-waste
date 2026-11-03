import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { ReportStatus, WasteCategory } from "@/constants";
import { reports } from "@/database/schema";
import { PredictionsModel } from "../predictions/model";

export namespace ReportsModel {
	/* ── Response ───────────────────────────────────── */
	export const reportSchema = createSelectSchema(reports, {
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime()
	})
		.omit({ photoKey: true })
		.extend({
			photoUrl: z.url(),
			/** 240×240 preview for lists; reports created before thumbnails existed only have it after `bun run thumbnails:backfill`. */
			thumbnailUrl: z.url(),
			user: z.object({ id: z.uuid(), name: z.string(), email: z.string() })
		});

	export type reportSchema = z.infer<typeof reportSchema>;

	export const statusLogSchema = z.object({
		id: z.uuid(),
		fromStatus: z.enum(ReportStatus).nullable(),
		toStatus: z.enum(ReportStatus),
		note: z.string().nullable(),
		createdAt: z.iso.datetime(),
		changedBy: z.object({ id: z.uuid(), name: z.string() })
	});

	export const reportDetailSchema = reportSchema.extend({
		/** Oldest first; the first entry is the report's creation. */
		statusLogs: statusLogSchema.array()
	});

	export type reportDetailSchema = z.infer<typeof reportDetailSchema>;

	export const createdReportSchema = reportDetailSchema.extend({
		/** Model output for the uploaded photo; null when the model is unavailable. */
		prediction: PredictionsModel.predictionSchema.nullable()
	});

	export const summarySchema = z.object({
		total: z.number().int(),
		byStatus: z.record(z.enum(ReportStatus), z.number().int())
	});

	/* ── Body ───────────────────────────────────────── */

	/** multipart/form-data: numbers arrive as strings, hence `z.coerce`. */
	export const createBody = z.object({
		photo: z.file(),
		description: z.string().trim().min(1).max(2000),
		latitude: z.coerce.number().min(-90).max(90),
		longitude: z.coerce.number().min(-180).max(180),
		address: z.string().trim().max(500).optional(),
		/** Omit to use the model's prediction; send to override it. */
		category: z.enum(WasteCategory).optional()
	});

	export type createBody = z.output<typeof createBody>;

	export const updateBody = z
		.object({
			description: z.string().trim().min(1).max(2000),
			address: z.string().trim().max(500).nullable(),
			category: z.enum(WasteCategory).nullable()
		})
		.partial()
		.refine(data => Object.keys(data).length > 0, {
			message: "At least one field must be provided"
		});

	export type updateBody = z.output<typeof updateBody>;

	export const updateStatusBody = z
		.object({
			status: z.enum(ReportStatus),
			note: z.string().trim().min(1).max(1000).optional()
		})
		.refine(data => data.status !== ReportStatus.Rejected || data.note !== undefined, {
			message: "A note explaining the rejection is required",
			path: ["note"]
		});

	export type updateStatusBody = z.output<typeof updateStatusBody>;

	/* ── Query ──────────────────────────────────────── */
	export const listQuery = z.object({
		/** Matches description, address, or reporter name. */
		search: z.string().trim().min(1).optional(),
		status: z.enum(ReportStatus).optional(),
		category: z.enum(WasteCategory).optional(),
		userId: z.uuid().optional(),
		/** Inclusive dates (YYYY-MM-DD), Asia/Jakarta. */
		from: z.iso.date().optional(),
		to: z.iso.date().optional(),
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20)
	});

	export type listQuery = z.output<typeof listQuery>;

	export const myListQuery = listQuery.omit({ userId: true });
}
