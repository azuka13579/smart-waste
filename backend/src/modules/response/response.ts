import type { mapValueError } from "elysia";
import { isDevelopment } from "@/config";
import type { ErrorResponse, PaginationMeta, ResponseMeta, SuccessResponse, ValidationIssue } from "./contract";
import { ErrorResponseSchema as ErrorResponseSchemaBase, SuccessResponseSchema as SuccessResponseSchemaBase } from "./contract";

/* ──────────────────────────────────────────────────────────────────────────
   Response Builder
   ────────────────────────────────────────────────────────────────────────
   Utility for constructing typed API response envelopes in route handlers.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Internal helpers ────────────────────────────────────────────────── */

function success<TData>(options: { message?: string; data: TData; meta?: ResponseMeta }): SuccessResponse<TData> {
	return {
		message: options.message ?? "OK",
		data: options.data,
		meta: options.meta ?? null
	};
}

function error<TError = unknown>(options: { message: string; error?: TError }): ErrorResponse<TError> {
	return {
		message: options.message,
		...(options.error !== undefined ? { error: options.error } : {})
	};
}

function validationError(message: string, errors: ValidationIssue[]): ErrorResponse<ValidationIssue[]> {
	return {
		message,
		error: errors
	};
}

function paginationMeta(page: number, perPage: number, total: number): PaginationMeta {
	return {
		page,
		perPage,
		total,
		totalPages: Math.max(1, Math.ceil(total / perPage))
	};
}

/* ── Public API ──────────────────────────────────────────────────────── */
export const SuccessResponseSchema = SuccessResponseSchemaBase;

export const ResponseErrorSchema = ErrorResponseSchemaBase();

export const ResponseBuilder = {
	/* ── Success ──────────────────────────────────────────────────────── */

	/** Generic 200 OK with data. */
	ok<TData>(data: TData, message = "OK"): SuccessResponse<TData> {
		return success({ message, data });
	},

	/** 201 Created. */
	created<TData>(data: TData, message = "Created"): SuccessResponse<TData> {
		return success({ message, data });
	},

	/** 200 with pagination metadata. */
	paginated<TData>(data: TData, pagination: PaginationMeta, message = "OK"): SuccessResponse<TData> {
		return success({ data, message, meta: { pagination } });
	},

	/** Shorthand: compute pagination meta from raw numbers + build response. */
	paginatedFrom<TData>(data: TData, page: number, perPage: number, total: number, message = "OK"): SuccessResponse<TData> {
		return success({ data, message, meta: { pagination: paginationMeta(page, perPage, total) } });
	},

	/* ── Errors ───────────────────────────────────────────────────────── */

	/** 400 Bad Request. */
	badRequest(message = "Bad request", err?: unknown): ErrorResponse {
		return error({ message, error: err });
	},

	/** 401 Unauthorized. */
	unauthorized(message = "Unauthorized"): ErrorResponse {
		return error({ message });
	},

	/** 403 Forbidden. */
	forbidden(message = "Forbidden"): ErrorResponse {
		return error({ message });
	},

	/** 404 Not Found. */
	notFound(message = "Not found"): ErrorResponse {
		return error({ message });
	},

	/** 409 Conflict. */
	conflict(message = "Conflict", err?: unknown): ErrorResponse {
		return error({ message, error: err });
	},

	/** Validation error from a pre-built list of issues. */
	validation(errors: ReturnType<typeof mapValueError>[], message = "Validation failed"): ErrorResponse {
		return validationError(message, errors);
	},

	/** 500 Internal Server Error. */
	internal(message = "Internal server error", err?: unknown): ErrorResponse {
		return error({ message, error: isDevelopment ? err : undefined });
	},

	/** Arbitrary status code error. */
	error(message: string, err?: unknown): ErrorResponse {
		return error({ message, error: err });
	}
} as const;
