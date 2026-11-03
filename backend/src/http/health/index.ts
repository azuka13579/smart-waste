import { Elysia } from "elysia";
import { RouteTag } from "@/constants";

export const HealthController = new Elysia({ prefix: "/health", tags: [RouteTag.Health] }).get(
	"/",
	async ({ status }) => {
		return status(200, {
			status: "ok",
			version: process.env.npm_package_version || "unknown",
			uptime: process.uptime(),
			timestamp: new Date().toISOString()
		});
	},
	{
		detail: { description: "Check the health of the API." }
	}
);
