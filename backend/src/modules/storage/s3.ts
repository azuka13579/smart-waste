import { S3Client } from "bun";
import type { StorageService } from "./types";

export interface S3Config {
	endpoint: string;
	region: string;
	accessKey: string;
	secretKey: string;
	bucketName: string;
	publicUrl: string;
}

/** Cloudflare R2 / S3 storage using Bun's native S3 client. */
export class S3StorageService implements StorageService {
	private client: S3Client;
	private publicUrl: string;

	constructor(config: S3Config) {
		this.publicUrl = config.publicUrl;
		this.client = new S3Client({
			endpoint: config.endpoint,
			region: config.region,
			accessKeyId: config.accessKey,
			secretAccessKey: config.secretKey,
			bucket: config.bucketName
		});
	}

	async upload(key: string, data: Buffer, contentType: string) {
		await this.client.write(key, data, { type: contentType });
	}

	async delete(key: string) {
		await this.client.delete(key);
	}

	getPublicUrl(key: string) {
		return `${this.publicUrl}/${key}`;
	}
}
