import Elysia, { status } from "elysia";
import { RouteTag } from "@/constants";
import { ModelUnavailableError, predictWaste, readUploadedImage, resolveSession } from "@/modules";
import { ResponseBuilder, ResponseErrorSchema, SuccessResponseSchema } from "@/modules/response";
import { TrackingDecorator } from "@/utils/tracking-decorator";
import { PredictionsModel } from "./model";

export const PredictionsController = new Elysia({ prefix: "/predictions", tags: [RouteTag.Predictions] })
	.resolve(TrackingDecorator)
	.resolve(resolveSession)
	.post(
		"/",
		async ({ body }) => {
			const image = await readUploadedImage(body.photo);
			try {
				return ResponseBuilder.ok(await predictWaste(image));
			} catch (error) {
				if (error instanceof ModelUnavailableError) throw status(503, "Classification model is not available");
				throw error;
			}
		},
		{
			detail: {
				description:
					"Classify a waste photo (glass, metal, organic, paper, plastic, textile). The photo is center-cropped to a square and resized to 224×224. " +
					"Results below the confidence threshold come back with recognized=false and category=null. Nothing is stored; use this for an instant preview before creating a report."
			},
			parse: "multipart/form-data",
			body: PredictionsModel.predictBody,
			response: {
				200: SuccessResponseSchema(PredictionsModel.predictionSchema),
				400: ResponseErrorSchema,
				401: ResponseErrorSchema,
				503: ResponseErrorSchema
			}
		}
	);
