import Elysia, { type Cookie } from "elysia";
import { isProduction } from "elysia/error";
import { Cookies, RouteTag, SessionExpirationDays } from "@/constants";
import { resolveSession, revokeSession } from "@/modules";
import { ResponseBuilder, ResponseErrorSchema, SuccessResponseSchema } from "@/modules/response";
import { TrackingDecorator } from "@/utils/tracking-decorator";
import { AuthModel } from "./model";
import { AuthService } from "./service";

function setSessionCookie(cookie: Record<string, Cookie<unknown>>, token: string) {
	const sessionCookie = cookie[Cookies.Session];
	// biome-ignore lint/style/noNonNullAssertion: Set ops
	sessionCookie!.set({
		value: token,
		httpOnly: true,
		maxAge: SessionExpirationDays * 24 * 60 * 60,
		sameSite: "lax",
		secure: isProduction,
		path: "/"
	});
}

export const AuthController = new Elysia({ prefix: "/auth", tags: [RouteTag.Auth] })
	.resolve(TrackingDecorator)
	.post(
		"/register",
		async ({ body, cookie, ipAddress, userAgent, status }) => {
			const result = await AuthService.register(body, { ipAddress, userAgent });
			setSessionCookie(cookie, result.token);
			return status(201, ResponseBuilder.created(result));
		},
		{
			detail: { description: "Register a regular user account and start a session." },
			body: AuthModel.registerBody,
			response: { 201: SuccessResponseSchema(AuthModel.signInResponse), 400: ResponseErrorSchema, 409: ResponseErrorSchema }
		}
	)
	.post(
		"/login",
		async ({ body, cookie, ipAddress, userAgent }) => {
			const result = await AuthService.login(body, { ipAddress, userAgent });
			setSessionCookie(cookie, result.token);
			return ResponseBuilder.ok(result);
		},
		{
			detail: { description: "Log in with email and password. Returns the session token and also sets it as an httpOnly cookie." },
			body: AuthModel.loginBody,
			response: { 200: SuccessResponseSchema(AuthModel.signInResponse), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema }
		}
	)
	.resolve(resolveSession)
	.delete(
		"/session",
		async ({ session, cookie }) => {
			await revokeSession(session.id);
			cookie[Cookies.Session]?.remove();
			return ResponseBuilder.ok({ message: "Logged out successfully" });
		},
		{
			detail: { description: "Revoke the current session (logout)." },
			response: { 200: SuccessResponseSchema(AuthModel.messageResponse), 401: ResponseErrorSchema }
		}
	);
