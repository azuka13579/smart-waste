import Elysia from "elysia";
import { PermissionFlags, RouteTag } from "@/constants";
import { resolveSession, userHasAnyPermissionGuard } from "@/modules";
import { ResponseBuilder, ResponseErrorSchema, SuccessResponseSchema } from "@/modules/response";
import { TrackingDecorator } from "@/utils/tracking-decorator";
import { StatisticsModel } from "./model";
import { StatisticsService } from "./service";

export const StatisticsController = new Elysia({ prefix: "/statistics", tags: [RouteTag.Statistics] })
	.resolve(TrackingDecorator)
	.resolve(resolveSession)
	.get("/", async ({ query }) => ResponseBuilder.ok(await StatisticsService.dashboard(query)), {
		detail: { description: "Admin dashboard: totals, reports per status and category, daily trend for the last `days` days, and model agreement." },
		beforeHandle: userHasAnyPermissionGuard([PermissionFlags.VIEW_STATISTICS]),
		query: StatisticsModel.dashboardQuery,
		response: { 200: SuccessResponseSchema(StatisticsModel.dashboardSchema), 401: ResponseErrorSchema, 403: ResponseErrorSchema }
	});
