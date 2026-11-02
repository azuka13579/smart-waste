import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserRole } from "@/constants";
import { users } from "@/database/schema";

export namespace UsersModel {
	/* ── Response ───────────────────────────────────── */
	export const userSchema = createSelectSchema(users, {
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime()
	}).omit({ password: true });

	export type userSchema = z.infer<typeof userSchema>;

	export const meSchema = userSchema.extend({
		permissions: z.array(z.string())
	});

	export type meSchema = z.infer<typeof meSchema>;

	/* ── Body ───────────────────────────────────────── */
	const email = z.email().transform(value => value.toLowerCase());
	const password = z.string().min(8).max(72);

	export const createBody = z.object({
		name: z.string().trim().min(1).max(100),
		email,
		password,
		role: z.enum(UserRole).default(UserRole.User)
	});

	export type createBody = z.output<typeof createBody>;

	export const updateBody = z
		.object({
			name: z.string().trim().min(1).max(100),
			email,
			password,
			role: z.enum(UserRole),
			isActive: z.boolean()
		})
		.partial()
		.refine(data => Object.keys(data).length > 0, {
			message: "At least one field must be provided"
		});

	export type updateBody = z.output<typeof updateBody>;

	export const updateMeBody = z
		.object({
			name: z.string().trim().min(1).max(100).optional(),
			currentPassword: z.string().optional(),
			newPassword: password.optional()
		})
		.refine(data => data.name !== undefined || data.newPassword !== undefined, {
			message: "At least one field must be provided"
		})
		.refine(data => data.newPassword === undefined || data.currentPassword !== undefined, {
			message: "currentPassword is required to change the password",
			path: ["currentPassword"]
		});

	export type updateMeBody = z.output<typeof updateMeBody>;

	/* ── Query ──────────────────────────────────────── */
	export const listQuery = z.object({
		search: z.string().trim().min(1).optional(),
		role: z.enum(UserRole).optional(),
		isActive: z
			.enum(["true", "false"])
			.transform(value => value === "true")
			.optional(),
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20)
	});

	export type listQuery = z.output<typeof listQuery>;
}
