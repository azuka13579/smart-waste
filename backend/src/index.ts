import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import Elysia, { ElysiaCustomStatusResponse, status } from "elysia";
import { BunAdapter } from "elysia/adapter/bun";
import * as z from "zod";
import { corsOrigin, serverHost, serverPort } from "./config";
import { RouteTag, RouteTagsMeta } from "./constants";
import { Database } from "./database";
import { AuthController } from "./http/auth";
import { PredictionsController } from "./http/predictions";
import { MyReportsController, ReportsController } from "./http/reports";
import { StatisticsController } from "./http/statistics";
import { UsersController } from "./http/users";
import { dbClient, LocalUploadsRoute, localStorageService, logger } from "./modules";
import { ResponseBuilder } from "./modules/response";

// Global shutdown state tracking
declare global {
	var isShuttingDown: boolean | undefined;
	var activeRequests: number;
}
globalThis.activeRequests = 0;
globalThis.isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
	if (globalThis.isShuttingDown) return;

	logger.info(`Received ${signal}. Starting graceful shutdown...`);
	globalThis.isShuttingDown = true;

	try {
		const shutdownTimeout = 25_000;
		const startTime = Date.now();

		while (globalThis.activeRequests > 0) {
			if (Date.now() - startTime >= shutdownTimeout) {
				logger.warn(`Shutdown timeout reached. Force closing ${globalThis.activeRequests} remaining requests.`);
				break;
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		if (app.server) await app.server.stop(true);
		await Database.close();

		logger.info("Graceful shutdown completed");
		process.exit(0);
	} catch (error) {
		logger.error(error, "Error during shutdown:");
		process.exit(1);
	}
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", error => {
	logger.error(error, "Uncaught Exception:");
	gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", reason => {
	logger.error(reason, "Unhandled Rejection:");
	gracefulShutdown("unhandledRejection");
});

const app = new Elysia({
	name: "smart-waste-backend-api",
	adapter: BunAdapter,
	aot: true,
	normalize: true
})
	.onError(({ error, code, request }) => {
		if (error instanceof ElysiaCustomStatusResponse) {
			const payload = error.response;

			if (typeof payload === "object" && payload !== null && "message" in payload) {
				return status(code as number, payload);
			}

			return status(code as number, ResponseBuilder.error(typeof payload === "string" ? payload : "Request failed"));
		}

		switch (code) {
			case "VALIDATION": {
				return status(400, ResponseBuilder.validation(error.all, "Validation Error"));
			}

			case "NOT_FOUND": {
				return status(404, ResponseBuilder.notFound("Resource Not Found"));
			}

			case "PARSE": {
				return status(400, ResponseBuilder.badRequest("Malformed request body"));
			}

			default: {
				logger.error(error, `Unhandled error on ${request.method} ${request.url}:`);
				return status(
					500,
					ResponseBuilder.internal("Internal Server Error", {
						message: error instanceof Error ? error.message : String(error)
					})
				);
			}
		}
	})
	.onRequest(({ status, server }) => {
		if (globalThis.isShuttingDown) {
			return status(503, { message: "Service Is Shutting Down", data: {} });
		}
		if (server !== null) globalThis.activeRequests++;
	})
	.onAfterResponse(() => {
		if (globalThis.activeRequests > 0) globalThis.activeRequests--;
	})
	.use(cors({ origin: corsOrigin, credentials: true }))
	.use(
		openapi({
			documentation: {
				info: {
					title: "Smart Waste Management API",
					description:
						"Backend for the Smart Waste Management System. Authenticate with `POST /auth/login`, then send the token as `Authorization: Bearer <token>` " +
						"(mobile) or rely on the httpOnly session cookie (web).",
					version: "1.0.0"
				},
				tags: RouteTagsMeta,
				components: {
					securitySchemes: {
						bearerAuth: { type: "http", scheme: "bearer" }
					}
				},
				security: [{ bearerAuth: [] }]
			},
			path: "/docs",
			exclude: {
				paths: ["/healthz", "/readyz", `${LocalUploadsRoute}/*`]
			},
			mapJsonSchema: {
				zod: z.toJSONSchema
			}
		})
	)
	.get(
		"/",
		() => {
			return { message: "Hello, World!" as const, data: { version: "1.0.0" } };
		},
		{
			tags: [RouteTag.General],
			detail: { description: "Base endpoint to verify that the API is running." },
			response: {
				200: z.object({
					message: z.literal("Hello, World!"),
					data: z.object({ version: z.string() })
				})
			}
		}
	)
	.get("/healthz", ({ status }) => {
		if (globalThis.isShuttingDown) {
			return status(503, { message: "Service Is Shutting Down", data: {} });
		}
		return { message: "Healthy", data: {} };
	})
	.get("/readyz", async ({ status }) => {
		try {
			await dbClient`SELECT 1`;
		} catch (error) {
			logger.error(error, "Readiness check database error:");
			return status(503, { message: "Not Ready", data: {} });
		}
		return { message: "Ready", data: {} };
	})
	// Serves photos when STORAGE_DRIVER=local; R2 serves them from S3_PUBLIC_URL instead
	.get(`${LocalUploadsRoute}/*`, async ({ params, status }) => {
		const path = localStorageService?.resolvePath(params["*"]);
		const file = path ? Bun.file(path) : null;
		if (!file || !(await file.exists())) return status(404, ResponseBuilder.notFound("File not found"));
		return file;
	})
	.use(AuthController)
	.use(UsersController)
	.use(MyReportsController)
	.use(ReportsController)
	.use(PredictionsController)
	.use(StatisticsController);

if (import.meta.main) {
	app.listen({
		hostname: serverHost,
		port: serverPort
	});

	logger.info(`🚀 smart-waste-backend is running at http://${app.server?.hostname}:${app.server?.port} (docs: /docs)`);
}

export type { app };
