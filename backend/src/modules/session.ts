import { Result } from "@sapphire/result";
import { randomUUIDv7 } from "bun";
import { and, eq } from "drizzle-orm";
import { type Cookie, status } from "elysia";
import { appSecret } from "@/config";
import { BearerPrefix, Cookies, PermissionBitfield, PermissionFlags, RolePermissions, SessionExpirationDays } from "@/constants";
import { userSessions, users } from "@/database/schema";
import { db } from "./database";
import { Encryption } from "./encryptions";

export type Session = Awaited<ReturnType<typeof resolveSession>>["session"];

/** Web sends the token in a cookie, mobile in `Authorization: Bearer <token>`. */
function readSessionToken(cookie: Record<string, Cookie<unknown>>, headers: Record<string, string | undefined>) {
	const authorization = headers["authorization"];
	if (authorization?.startsWith(BearerPrefix)) return authorization.slice(BearerPrefix.length).trim();

	return cookie[Cookies.Session]?.value as string | undefined;
}

export async function resolveSession({ cookie, headers }: { cookie: Record<string, Cookie<unknown>>; headers: Record<string, string | undefined> }) {
	const sessionToken = readSessionToken(cookie, headers);
	if (!sessionToken) {
		throw status(401, "Unauthorized");
	}

	const sessionResult = Result.from(() => Encryption.decryptAES(sessionToken, appSecret));
	if (sessionResult.isErr()) {
		throw status(401, "Unauthorized");
	}

	const userId = sessionResult.unwrap().split(":")[0] ?? "";
	const [row] = await db
		.select({ session: userSessions, role: users.role, isActive: users.isActive })
		.from(userSessions)
		.innerJoin(users, eq(userSessions.userId, users.id))
		.where(and(eq(userSessions.userId, userId), eq(userSessions.token, sessionToken)));

	if (!row?.isActive) {
		throw status(401, "Unauthorized");
	}

	if (row.session.expiresAt < new Date()) {
		await db.delete(userSessions).where(eq(userSessions.id, row.session.id));
		throw status(401, "Session expired");
	}

	return {
		session: {
			id: row.session.id,
			userId: row.session.userId,
			role: row.role,
			permissions: RolePermissions[row.role]
		}
	};
}

export async function startSession({ userId, ipAddress, userAgent }: { userId: string; ipAddress: string; userAgent: string }) {
	const token = Encryption.encryptAES(`${userId}:${randomUUIDv7()}`, appSecret);

	const [session] = await db
		.insert(userSessions)
		.values({
			expiresAt: new Date(Date.now() + SessionExpirationDays * 24 * 60 * 60 * 1000),
			ipAddress,
			userAgent,
			token,
			userId
		})
		.returning();

	// biome-ignore lint/style/noNonNullAssertion: insert ... returning always yields a row
	return session!;
}

export async function revokeSession(sessionId: string) {
	await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export async function revokeAllSessions(userId: string) {
	await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

export function hasPermission(session: { permissions: number }, permission: number, bypassAdministrator = true) {
	if (bypassAdministrator && PermissionBitfield.has(session.permissions, PermissionFlags.ADMINISTRATOR)) return true;
	return PermissionBitfield.has(session.permissions, permission);
}

export function userHasAnyPermissionGuard(permissions: number[], bypassAdministrator = true) {
	return ({ session }: { session: { permissions: number } }) => {
		if (permissions.some(perm => hasPermission(session, perm, bypassAdministrator))) {
			return;
		}

		throw status(403, "Forbidden");
	};
}
