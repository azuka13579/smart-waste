/* ──────────────────────────────────────────────────────────────────────────
   Response Contracts
   ────────────────────────────────────────────────────────────────────────── */

import type { mapValueError } from "elysia";
import { z } from "zod";

/* ── Schemas ─────────────────────────────────────────────────────────── */

/** Pagination metadata returned alongside list responses. */
export const PaginationMetaSchema = z.object({
	/** Current page number (1-based). */
	page: z.number().int().min(1),
	/** Items per page. */
	perPage: z.number().int().min(1),
	/** Total number of items available. */
	total: z.number().int().min(0),
	/** Total number of pages. */
	totalPages: z.number().int().min(0)
});

/** Meta block – currently only pagination, extend as needed. */
export const ResponseMetaSchema = z.object({
	pagination: PaginationMetaSchema.nullable()
});

/* ── Success ─────────────────────────────────────────────────────── */

export const SuccessResponseSchema = <TData extends z.ZodTypeAny>(dataSchema: TData) =>
	z.object({
		message: z.string(),
		data: dataSchema,
		meta: ResponseMetaSchema.nullable()
	});

/* ── Error ───────────────────────────────────────────────────────────── */

/** A single field-level validation issue. */
export type ValidationIssue = ReturnType<typeof mapValueError>;

export const ValidationError = z.object({
	summary: z.string(),
	path: z.string(),
	message: z.string(),
	value: z.any()
});

export const ErrorResponseSchema = <TError extends z.ZodTypeAny = z.ZodUnknown>(errorSchema?: TError) =>
	z.object({
		message: z.string(),
		/** Arbitrary error payload (stack trace in dev, error code, etc.). */
		error: z.union([ValidationError, errorSchema ?? z.unknown()])
	});

/* ── Inferred Types ──────────────────────────────────────────────────── */

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type ResponseMeta = z.infer<typeof ResponseMetaSchema>;

export interface SuccessResponse<TData = unknown> {
	message: string;
	data: TData;
	meta: ResponseMeta | null;
}

export interface ErrorResponse<TError = unknown> {
	message: string;
	error?: TError;
}

/* ── Union ───────────────────────────────────────────────────────────── */

export type ApiResponse<TData = unknown, TError = unknown> = SuccessResponse<TData> | ErrorResponse<TError>;
