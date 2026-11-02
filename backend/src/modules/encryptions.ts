import crypto from "node:crypto";

export class Encryption {
	private static AES_SEPARATOR = "::_::";

	/** AES-256 needs exactly 32 bytes, so any secret length is hashed down to 32. */
	private static deriveKey(key: string) {
		return crypto.createHash("sha256").update(key).digest();
	}

	/**
	 * Encrypt data using AES (two-way encryption) and return a base64url
	 * encoded string containing the encrypted data and the IV.
	 */
	static encryptAES(data: string, key: string) {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv("aes-256-cbc", Encryption.deriveKey(key), iv);

		let encrypted = cipher.update(data, "utf-8", "hex");
		encrypted += cipher.final("hex");

		return Buffer.from(`${encrypted}${Encryption.AES_SEPARATOR}${iv.toString("hex")}`).toString("base64url");
	}

	/**
	 * Decrypt data using AES (two-way encryption) and return the decrypted data.
	 * Buffer must be a base64url encoded string containing the encrypted data and the IV.
	 */
	static decryptAES(buffer: string, key: string) {
		const [encryptedData, iv] = Buffer.from(buffer, "base64url").toString("utf-8").split(Encryption.AES_SEPARATOR);

		// biome-ignore lint/style/noNonNullAssertion: Non nullable
		const decipher = crypto.createDecipheriv("aes-256-cbc", Encryption.deriveKey(key), Buffer.from(iv!, "hex"));

		// biome-ignore lint/style/noNonNullAssertion: Non nullable
		let decrypted = decipher.update(encryptedData!, "hex", "utf-8");
		decrypted += decipher.final("utf-8");

		return decrypted;
	}

	/** Hash data using argon2id (one-way encryption). */
	static async hashData(data: string) {
		return Bun.password.hash(data, { algorithm: "argon2id", memoryCost: 19_456, timeCost: 2 });
	}

	/** Compare source data with a hash produced by `hashData`. */
	static async verifyHashedData(source: string, hashed: string) {
		return Bun.password.verify(source, hashed);
	}
}
