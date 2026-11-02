import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { StatusMap, status } from "elysia";
import { PermissionBitfield, RolePermissions } from "@/constants";
import { users } from "@/database/schema";
import { db, Encryption, revokeAllSessions, type Session } from "@/modules";
import type { UsersModel } from "./model";

const { password: _password, ...publicColumns } = getTableColumns(users);

type PublicUserRow = Omit<typeof users.$inferSelect, "password">;

export class UsersService {
	public constructor(private readonly options: { session: Session }) {}

	/* ── Shared helpers ─────────────────────────────── */

	public static serialize(row: PublicUserRow) {
		return {
			...row,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString()
		};
	}

	public static async findPublicById(id: string) {
		const [row] = await db.select(publicColumns).from(users).where(eq(users.id, id));
		return row ?? null;
	}

	public static async assertEmailAvailable(email: string, exceptUserId?: string) {
		const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing && existing.id !== exceptUserId) {
			throw status(StatusMap.Conflict, "Email is already registered");
		}
	}

	public static async buildProfile(userId: string) {
		const row = await UsersService.findPublicById(userId);
		if (!row) throw status(StatusMap["Not Found"], "User not found");

		return {
			...UsersService.serialize(row),
			permissions: PermissionBitfield.toArray(RolePermissions[row.role])
		};
	}

	/* ── Current user ───────────────────────────────── */

	public async getMe() {
		return UsersService.buildProfile(this.options.session.userId);
	}

	public async updateMe(data: UsersModel.updateMeBody) {
		const { userId } = this.options.session;
		const changes: Partial<typeof users.$inferInsert> = {};

		if (data.name !== undefined) changes.name = data.name;

		if (data.newPassword !== undefined) {
			const [row] = await db.select({ password: users.password }).from(users).where(eq(users.id, userId));
			if (!row || !(await Encryption.verifyHashedData(data.currentPassword ?? "", row.password))) {
				throw status(StatusMap["Bad Request"], "Current password is incorrect");
			}
			changes.password = await Encryption.hashData(data.newPassword);
		}

		await db.update(users).set(changes).where(eq(users.id, userId));
		return this.getMe();
	}

	/* ── Management (admin) ─────────────────────────── */

	public async list(query: UsersModel.listQuery) {
		const { page, limit, search, role, isActive } = query;
		const offset = (page - 1) * limit;

		const whereClause = and(
			search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined,
			role ? eq(users.role, role) : undefined,
			isActive !== undefined ? eq(users.isActive, isActive) : undefined
		);

		const [totalResult] = await db.select({ total: count() }).from(users).where(whereClause);
		const total = totalResult?.total ?? 0;

		const rows = await db.select(publicColumns).from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

		return {
			users: rows.map(row => UsersService.serialize(row)),
			pagination: {
				page,
				perPage: limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / limit))
			}
		};
	}

	public async getById(id: string) {
		const row = await UsersService.findPublicById(id);
		if (!row) throw status(StatusMap["Not Found"], "User not found");
		return UsersService.serialize(row);
	}

	public async create(data: UsersModel.createBody) {
		await UsersService.assertEmailAvailable(data.email);

		const [row] = await db
			.insert(users)
			.values({ ...data, password: await Encryption.hashData(data.password) })
			.returning({ id: users.id });

		if (!row) throw status(StatusMap["Internal Server Error"], "Failed to create user");
		return this.getById(row.id);
	}

	public async update(id: string, data: UsersModel.updateBody) {
		const isSelf = id === this.options.session.userId;
		if (isSelf && (data.isActive === false || (data.role !== undefined && data.role !== this.options.session.role))) {
			throw status(StatusMap["Bad Request"], "You cannot deactivate yourself or change your own role");
		}

		if (data.email !== undefined) await UsersService.assertEmailAvailable(data.email, id);

		const { password, ...rest } = data;
		const [row] = await db
			.update(users)
			.set({ ...rest, ...(password !== undefined ? { password: await Encryption.hashData(password) } : {}) })
			.where(eq(users.id, id))
			.returning({ id: users.id });

		if (!row) throw status(StatusMap["Not Found"], "User not found");

		// Deactivated users and password resets must log in again
		if (data.isActive === false || password !== undefined) await revokeAllSessions(id);

		return this.getById(row.id);
	}

	/** Users are never hard-deleted so their reports keep an owner. */
	public async deactivate(id: string) {
		return this.update(id, { isActive: false });
	}
}
