import z from "zod/v4";

export const isDevelopment = (process.env.BUN_ENV ?? process.env.NODE_ENV ?? "development") !== "production";
export const logLevel = isDevelopment ? "trace" : "info";

const env = z
	.object({
		SERVER_PORT: z.coerce.number().default(8080),
		SERVER_HOST: z.ipv4().default("127.0.0.1"),

		APP_SECRET: z.string().min(32),
		APP_BASE_URL: z.url().transform(url => url.replace(/\/+$/, "")),
		CORS_ORIGINS: z
			.string()
			.default("")
			.transform(s =>
				s
					.split(",")
					.map(d => d.trim())
					.filter(Boolean)
			),
		DATABASE_URL: z.url(),

		ADMIN_NAME: z.string().min(1).default("Administrator"),
		ADMIN_EMAIL: z.email(),
		ADMIN_PASSWORD: z.string().min(8),

		STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
		S3_API_ENDPOINT: z.url().optional(),
		S3_ACCESS_KEY_ID: z.string().optional(),
		S3_SECRET_ACCESS_KEY: z.string().optional(),
		S3_BUCKET_NAME: z.string().optional(),
		S3_REGION: z.string().default("auto"),
		S3_PUBLIC_URL: z
			.url()
			.transform(url => url.replace(/\/+$/, ""))
			.optional(),

		MODEL_PATH: z.string().default("models/waste_classifier.onnx"),
		MODEL_LABELS_PATH: z.string().default("models/labels.json"),
		MODEL_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.6)
	})
	.superRefine((value, ctx) => {
		if (value.STORAGE_DRIVER !== "s3") return;
		for (const key of ["S3_API_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET_NAME", "S3_PUBLIC_URL"] as const) {
			if (!value[key]) ctx.addIssue({ code: "custom", path: [key], message: `${key} is required when STORAGE_DRIVER=s3` });
		}
	})
	.parse(process.env);

export const {
	SERVER_PORT: serverPort,
	SERVER_HOST: serverHost,
	APP_SECRET: appSecret,
	APP_BASE_URL: appBaseUrl,
	DATABASE_URL: databaseUrl,
	ADMIN_NAME: adminName,
	ADMIN_EMAIL: adminEmail,
	ADMIN_PASSWORD: adminPassword,
	STORAGE_DRIVER: storageDriver,
	S3_API_ENDPOINT: s3ApiEndpoint,
	S3_ACCESS_KEY_ID: s3AccessKeyId,
	S3_SECRET_ACCESS_KEY: s3SecretAccessKey,
	S3_BUCKET_NAME: s3BucketName,
	S3_REGION: s3Region,
	S3_PUBLIC_URL: s3PublicUrl,
	MODEL_PATH: modelPath,
	MODEL_LABELS_PATH: modelLabelsPath,
	MODEL_CONFIDENCE_THRESHOLD: modelConfidenceThreshold
} = env;

export const corsOrigin = isDevelopment || env.CORS_ORIGINS.length === 0 ? true : env.CORS_ORIGINS;
