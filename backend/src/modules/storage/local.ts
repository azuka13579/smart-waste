import { mkdir, rm } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";
import type { StorageService } from "./types";

export const LocalUploadsRoute = "/uploads";

/** Stores files on disk; for development or a single-server demo without R2. */
export class LocalStorageService implements StorageService {
	public constructor(
		private readonly rootDir: string,
		private readonly baseUrl: string
	) {}

	/** Absolute path for a key, or null if the key tries to escape the root folder. */
	public resolvePath(key: string) {
		const path = normalize(join(this.rootDir, key));
		return path.startsWith(normalize(this.rootDir) + sep) ? path : null;
	}

	async upload(key: string, data: Buffer) {
		const path = this.resolvePath(key);
		if (!path) throw new Error(`Invalid storage key: ${key}`);

		await mkdir(dirname(path), { recursive: true });
		await Bun.write(path, data);
	}

	async delete(key: string) {
		const path = this.resolvePath(key);
		if (path) await rm(path, { force: true });
	}

	getPublicUrl(key: string) {
		return `${this.baseUrl}${LocalUploadsRoute}/${key}`;
	}
}
