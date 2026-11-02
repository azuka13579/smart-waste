import { eq } from "drizzle-orm";
import { StatusMap, status } from "elysia";
import { UserRole } from "@/constants";
import { users } from "@/database/schema";
import { db, Encryption, startSession } from "@/modules";
import { UsersService } from "../users/service";
import type { AuthModel } from "./model";

type ClientInfo = { ipAddress: string; userAgent: string };

export abstract class AuthService {
	private static async signIn(userId: string, client: ClientInfo) {
		const session = await startSession({ userId, ...client });
		return {
			token: session.token,
			expiresAt: session.expiresAt.toISOString(),
			user: await UsersService.buildProfile(userId)
		};
	}

	/** Public sign-up always creates a regular user; admins are created by other admins. */
	public static async register(data: AuthModel.registerBody, client: ClientInfo) {
		await UsersService.assertEmailAvailable(data.email);

		const [row] = await db
			.insert(users)
			.values({ ...data, password: await Encryption.hashData(data.password), role: UserRole.User })
			.returning({ id: users.id });

		if (!row) throw status(StatusMap["Internal Server Error"], "Failed to register");
		return AuthService.signIn(row.id, client);
	}

	public static async login(data: AuthModel.loginBody, client: ClientInfo) {
		const [user] = await db.select({ id: users.id, password: users.password, isActive: users.isActive }).from(users).where(eq(users.email, data.email));

		// Same message for unknown email and wrong password so emails cannot be probed
		if (!user || !(await Encryption.verifyHashedData(data.password, user.password))) {
			throw status(StatusMap.Unauthorized, "Invalid email or password");
		}

		if (!user.isActive) throw status(StatusMap.Forbidden, "Account is deactivated");

		return AuthService.signIn(user.id, client);
	}
}
