import Elysia, { status, t } from "elysia";
import z from "zod";
import { PermissionFlags, RouteTag } from "@/constants";
import { resolveSession, userHasAnyPermissionGuard } from "@/modules";
import { ResponseBuilder, ResponseErrorSchema, SuccessResponseSchema } from "@/modules/response";
import { TrackingDecorator } from "@/utils/tracking-decorator";
import { ReportsModel } from "./model";
import { ReportsService } from "./service";

const idParams = z.object({ id: z.uuidv7() });

/** Reports owned by the logged-in user (mobile app and the user's web view). */
export const MyReportsController = new Elysia({ prefix: "/users/@me/reports", tags: [RouteTag.Reports] })
	.resolve(TrackingDecorator)
	.resolve(resolveSession)
	.resolve(options => ({
		reportsService: new ReportsService({ session: options.session }),
		scope: { ownerId: options.session.userId }
	}))
	.onBeforeHandle(userHasAnyPermissionGuard([PermissionFlags.SEND_REPORTS]))
	.get(
		"/",
		async ({ query, reportsService, scope }) => {
			const result = await reportsService.list(query, scope);
			return ResponseBuilder.paginated(result.reports, result.pagination);
		},
		{
			detail: { description: "List own reports, newest first, with status/category/date filters." },
			query: ReportsModel.myListQuery,
			response: { 200: SuccessResponseSchema(ReportsModel.reportSchema.array()), 401: ResponseErrorSchema, 403: ResponseErrorSchema }
		}
	)
	.get("/summary", async ({ reportsService, scope }) => ResponseBuilder.ok(await reportsService.summary(scope)), {
		detail: { description: "Number of own reports per status (user dashboard)." },
		response: { 200: SuccessResponseSchema(ReportsModel.summarySchema), 401: ResponseErrorSchema, 403: ResponseErrorSchema }
	})
	.post("/", async ({ body, reportsService, status }) => status(201, ResponseBuilder.created(await reportsService.create(body))), {
		detail: {
			description:
				"Create a report (multipart/form-data) with a photo, GPS location and description. The photo is classified on the server; " +
				"`category` defaults to the model's result when omitted. Starts as pending."
		},
		parse: "multipart/form-data",
		body: ReportsModel.createBody,
		response: { 201: SuccessResponseSchema(ReportsModel.createdReportSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema }
	})
	.get("/:id", async ({ params: { id }, reportsService, scope }) => ResponseBuilder.ok(await reportsService.getById(id, scope)), {
		detail: { description: "Get an own report with its status history." },
		params: idParams,
		response: { 200: SuccessResponseSchema(ReportsModel.reportDetailSchema), 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.patch("/:id", async ({ params: { id }, body, reportsService, scope }) => ResponseBuilder.ok(await reportsService.update(id, body, scope)), {
		detail: { description: "Edit description, address or category of an own report while it is still pending." },
		params: idParams,
		body: ReportsModel.updateBody,
		response: {
			200: SuccessResponseSchema(ReportsModel.reportDetailSchema),
			400: ResponseErrorSchema,
			401: ResponseErrorSchema,
			403: ResponseErrorSchema,
			404: ResponseErrorSchema,
			409: ResponseErrorSchema
		}
	})
	.delete(
		"/:id",
		async ({ params: { id }, reportsService, scope }) => {
			await reportsService.delete(id, scope);
			return status(204);
		},
		{
			detail: { description: "Delete an own report while it is still pending." },
			params: idParams,
			response: { 204: t.Void(), 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema, 409: ResponseErrorSchema }
		}
	);

/** All reports, for admins. */
export const ReportsController = new Elysia({ prefix: "/reports", tags: [RouteTag.Reports] })
	.resolve(TrackingDecorator)
	.resolve(resolveSession)
	.resolve(options => ({
		reportsService: new ReportsService({ session: options.session })
	}))
	.onBeforeHandle(userHasAnyPermissionGuard([PermissionFlags.MANAGE_REPORTS]))
	.get(
		"/",
		async ({ query, reportsService }) => {
			const result = await reportsService.list(query, {});
			return ResponseBuilder.paginated(result.reports, result.pagination);
		},
		{
			detail: { description: "List all reports with search (description, address, reporter name) and status/category/user/date filters (admin)." },
			query: ReportsModel.listQuery,
			response: { 200: SuccessResponseSchema(ReportsModel.reportSchema.array()), 401: ResponseErrorSchema, 403: ResponseErrorSchema }
		}
	)
	.get("/:id", async ({ params: { id }, reportsService }) => ResponseBuilder.ok(await reportsService.getById(id, {})), {
		detail: { description: "Get a report with its status history (admin)." },
		params: idParams,
		response: { 200: SuccessResponseSchema(ReportsModel.reportDetailSchema), 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.patch("/:id", async ({ params: { id }, body, reportsService }) => ResponseBuilder.ok(await reportsService.update(id, body, {})), {
		detail: { description: "Edit description, address or correct the category of any report (admin)." },
		params: idParams,
		body: ReportsModel.updateBody,
		response: { 200: SuccessResponseSchema(ReportsModel.reportDetailSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.patch("/:id/status", async ({ params: { id }, body, reportsService }) => ResponseBuilder.ok(await reportsService.updateStatus(id, body)), {
		detail: { description: "Change a report's status (pending, in_progress, completed, rejected) and log it. A note is required when rejecting (admin)." },
		params: idParams,
		body: ReportsModel.updateStatusBody,
		response: { 200: SuccessResponseSchema(ReportsModel.reportDetailSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.delete(
		"/:id",
		async ({ params: { id }, reportsService }) => {
			await reportsService.delete(id, {});
			return status(204);
		},
		{
			detail: { description: "Delete a report and its photo (admin)." },
			params: idParams,
			response: { 204: t.Void(), 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
		}
	);
