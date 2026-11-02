import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database singleton for the shared Postgres.js connection pool.
 *
 * @example
 * ```typescript
 * Database.getInstance("postgresql://localhost:5432/mydb");
 * const db = Database.getDrizzle();
 * ```
 */
export class Database {
	private static instance: postgres.Sql;

	/** Create a separate Postgres.js pool (e.g. a single connection for migrations). */
	public static createUniquePostgresInstance(
		connectionString: string,
		options?: {
			maxConnections?: number;
			applicationName?: string;
			onNotice?: (notice: postgres.Notice) => void;
		}
	): postgres.Sql {
		const { maxConnections = 10, applicationName = "smart-waste-backend", onNotice } = options ?? {};

		return postgres(connectionString, {
			connection: { application_name: applicationName },
			max: maxConnections,
			onnotice: onNotice
		});
	}

	/** Get or create the shared pool; `connectionString` is required on the first call. */
	public static getInstance(connectionString?: string, options?: { maxConnections?: number; applicationName?: string }) {
		const globalDb = globalThis as unknown as { _postgresInstance: postgres.Sql | undefined };

		if (!Database.instance && !globalDb._postgresInstance) {
			if (!connectionString) {
				throw new Error("Database connection string is required for first initialization");
			}

			const instance = Database.createUniquePostgresInstance(connectionString, options);
			Database.instance = instance;
			globalDb._postgresInstance = instance;
		} else if (!Database.instance && globalDb._postgresInstance) {
			Database.instance = globalDb._postgresInstance;
		}

		return Database.instance;
	}

	/** Drizzle instance on the shared pool. */
	public static getDrizzle() {
		if (!Database.instance) {
			throw new Error("Database instance not initialized. Call getInstance() first.");
		}
		return drizzle(Database.instance, { schema, casing: "snake_case" });
	}

	/** Close the pool during shutdown. */
	public static async close() {
		if (Database.instance) {
			await Database.instance.end();
		}
	}
}
