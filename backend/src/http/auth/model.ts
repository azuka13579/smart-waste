import z from "zod";
import { UsersModel } from "../users/model";

export namespace AuthModel {
	/* ── Response ───────────────────────────────────── */
	export const signInResponse = z.object({
		/** Send as `Authorization: Bearer <token>` (mobile). Web gets the same token as an httpOnly cookie. */
		token: z.string(),
		expiresAt: z.iso.datetime(),
		user: UsersModel.meSchema
	});

	export type signInResponse = z.infer<typeof signInResponse>;

	export const messageResponse = z.object({ message: z.string() });

	/* ── Body ───────────────────────────────────────── */
	export const registerBody = UsersModel.createBody.omit({ role: true });

	export type registerBody = z.output<typeof registerBody>;

	export const loginBody = z.object({
		email: z.email().transform(value => value.toLowerCase()),
		password: z.string().min(1)
	});

	export type loginBody = z.output<typeof loginBody>;
}
