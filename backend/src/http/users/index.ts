import Elysia from "elysia";
import z from "zod";
import { PermissionFlags, RouteTag } from "@/constants";
import { resolveSession, userHasAnyPermissionGuard } from "@/modules";
import { ResponseBuilder, ResponseErrorSchema, SuccessResponseSchema } from "@/modules/response";
import { TrackingDecorator } from "@/utils/tracking-decorator";
import { UsersModel } from "./model";
import { UsersService } from "./service";

export const UsersController = new Elysia({ prefix: "/users", tags: [RouteTag.Users] })
	.resolve(TrackingDecorator)
	.resolve(resolveSession)
	.resolve(options => ({
		usersService: new UsersService({ session: options.session })
	}))
	.get("/@me", async ({ usersService }) => ResponseBuilder.ok(await usersService.getMe()), {
		detail: { description: "Get the logged-in user's profile and permissions." },
		response: { 200: SuccessResponseSchema(UsersModel.meSchema), 401: ResponseErrorSchema }
	})
	.patch("/@me", async ({ body, usersService }) => ResponseBuilder.ok(await usersService.updateMe(body)), {
		detail: { description: "Update own name and/or password (password change requires currentPassword)." },
		body: UsersModel.updateMeBody,
		response: { 200: SuccessResponseSchema(UsersModel.meSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema }
	})
	.onBeforeHandle(userHasAnyPermissionGuard([PermissionFlags.MANAGE_USERS]))
	.get(
		"/",
		async ({ query, usersService }) => {
			const result = await usersService.list(query);
			return ResponseBuilder.paginated(result.users, result.pagination);
		},
		{
			detail: { description: "List users with search, role and active filters (admin)." },
			query: UsersModel.listQuery,
			response: { 200: SuccessResponseSchema(UsersModel.userSchema.array()), 401: ResponseErrorSchema, 403: ResponseErrorSchema }
		}
	)
	.post("/", async ({ body, usersService, status }) => status(201, ResponseBuilder.created(await usersService.create(body))), {
		detail: { description: "Create a user or admin account (admin)." },
		body: UsersModel.createBody,
		response: { 201: SuccessResponseSchema(UsersModel.userSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema, 409: ResponseErrorSchema }
	})
	.get("/:id", async ({ params: { id }, usersService }) => ResponseBuilder.ok(await usersService.getById(id)), {
		detail: { description: "Get a user (admin)." },
		params: z.object({ id: z.uuidv7() }),
		response: { 200: SuccessResponseSchema(UsersModel.userSchema), 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	})
	.patch("/:id", async ({ params: { id }, body, usersService }) => ResponseBuilder.ok(await usersService.update(id, body)), {
		detail: { description: "Update a user's name, email, password, role or active status (admin). Deactivating or resetting the password logs the user out." },
		params: z.object({ id: z.uuidv7() }),
		body: UsersModel.updateBody,
		response: {
			200: SuccessResponseSchema(UsersModel.userSchema),
			400: ResponseErrorSchema,
			401: ResponseErrorSchema,
			403: ResponseErrorSchema,
			404: ResponseErrorSchema,
			409: ResponseErrorSchema
		}
	})
	.delete("/:id", async ({ params: { id }, usersService }) => ResponseBuilder.ok(await usersService.deactivate(id)), {
		detail: { description: "Deactivate a user (admin). Users are never hard-deleted so their reports keep an owner." },
		params: z.object({ id: z.uuidv7() }),
		response: { 200: SuccessResponseSchema(UsersModel.userSchema), 400: ResponseErrorSchema, 401: ResponseErrorSchema, 403: ResponseErrorSchema, 404: ResponseErrorSchema }
	});
