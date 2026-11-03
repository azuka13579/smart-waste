export namespace HealthModel {
	export type HealthResponse = {
		status: "ok" | "error";
		version: string;
		uptime: number;
		timestamp: string;
	};
}
