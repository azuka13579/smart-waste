export interface StorageService {
	/** Store `data` under `key` (e.g. `reports/<id>.jpg`). */
	upload(key: string, data: Buffer, contentType: string): Promise<void>;
	delete(key: string): Promise<void>;
	/** Public URL for a stored key. Only keys are saved in the database. */
	getPublicUrl(key: string): string;
}
