import { randomUUIDv7 } from "bun";

export const TrackingDecorator = ({ headers, request, server }: { headers: Record<string, string | undefined>; request: Request; server: Bun.Server<unknown> | null }) => {
	const ipAddress = headers["cf-connecting-ip"] || headers["x-forwarded-for"] || headers["ip"] || server?.requestIP(request)?.address || "unknown";
	return {
		ipAddress,
		userAgent: headers["user-agent"] || "unknown",
		requestId: randomUUIDv7()
	};
};
