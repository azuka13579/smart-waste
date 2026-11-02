import { boolean, index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { UserRole } from "@/constants";
import { createdAt, idPrimaryKey, timestamptz, updatedAt } from "@/database/helpers";
import { userRoleEnum } from "./enum";

export const users = pgTable("users", {
	id: idPrimaryKey,

	name: varchar({ length: 100 }).notNull(),
	/** Always stored in lowercase. */
	email: varchar({ length: 255 }).notNull().unique(),
	/** Argon2id hash, never the plain password. */
	password: varchar({ length: 255 }).notNull(),
	role: userRoleEnum().notNull().default(UserRole.User),
	isActive: boolean().notNull().default(true),

	createdAt: createdAt(),
	updatedAt: updatedAt()
});

export const userSessions = pgTable(
	"user_sessions",
	{
		id: idPrimaryKey,

		userId: uuid()
			.references(() => users.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		token: text().notNull().unique(),
		ipAddress: text().notNull(),
		userAgent: text().notNull(),
		expiresAt: timestamptz().notNull(),

		createdAt: createdAt()
	},
	table => [index().on(table.userId)]
);
