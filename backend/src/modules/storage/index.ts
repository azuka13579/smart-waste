import { resolve } from "node:path";
import { appBaseUrl, s3AccessKeyId, s3ApiEndpoint, s3BucketName, s3PublicUrl, s3Region, s3SecretAccessKey, storageDriver } from "@/config";
import { LocalStorageService } from "./local";
import { S3StorageService } from "./s3";
import type { StorageService } from "./types";

export * from "./local";
export * from "./s3";
export * from "./types";

export const localStorageService = storageDriver === "local" ? new LocalStorageService(resolve("uploads"), appBaseUrl) : null;

export const storage: StorageService =
	localStorageService ??
	new S3StorageService({
		// config.ts guarantees these are set when STORAGE_DRIVER=s3
		endpoint: s3ApiEndpoint as string,
		region: s3Region,
		accessKey: s3AccessKeyId as string,
		secretKey: s3SecretAccessKey as string,
		bucketName: s3BucketName as string,
		publicUrl: s3PublicUrl as string
	});
