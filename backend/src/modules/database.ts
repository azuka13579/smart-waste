import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { adminEmail, adminName, adminPassword, databaseUrl } from "@/config";
import { UserRole } from "@/constants";
import { Database } from "@/database";
import { users } from "@/database/schema";
import { Encryption } from "./encryptions";
import { logger } from "./logger";

async function runMigrationsWithLock() {
	if (Bun.argv.includes("--no-migrations")) {
		logger.info("[Database Migrations] --no-migrations flag detected, skipping migrations");
		return;
	}

	const migrationsClient = Database.createUniquePostgresInstance(databaseUrl, {
		applicationName: "smart-waste-backend-migrations",
		maxConnections: 1,
		onNotice: notice => logger.debug(notice, "[Database Migrations] Notice")
	});

	// Convert hash to a valid bigint for PostgreSQL advisory lock
	const hashHex = createHash("sha256").update("smart-waste-backend-migrations").digest("hex").substring(0, 15);
	const MIGRATION_LOCK_ID = BigInt(`0x${hashHex}`);

	let lockAcquired = false;

	try {
		logger.info("[Database Migrations] Attempting to acquire migration lock...");
		const lockResult = await migrationsClient`SELECT pg_try_advisory_lock(${MIGRATION_LOCK_ID.toString()}) as acquired`;

		if (!lockResult[0]?.acquired) {
			logger.info("[Database Migrations] Migration lock held by another instance, skipping migrations");
			return;
		}

		lockAcquired = true;
		logger.info("[Database Migrations] Migration lock acquired, running migrations...");

		const d = drizzle(migrationsClient, { casing: "snake_case" });
		await migrate(d, { migrationsFolder: "drizzle" });
		logger.info("[Database Migrations] Migrations complete");

		const [existingAdmin] = await d.select({ id: users.id }).from(users).where(eq(users.email, adminEmail.toLowerCase()));
		if (!existingAdmin) {
			await d.insert(users).values({
				name: adminName,
				email: adminEmail.toLowerCase(),
				password: await Encryption.hashData(adminPassword),
				role: UserRole.Admin
			});
			logger.info(`[Database Migrations] Seeded admin account ${adminEmail}`);
		}
	} catch (error) {
		logger.error(error, "[Database Migrations] Migration error:");
		throw error;
	} finally {
		if (lockAcquired) {
			try {
				await migrationsClient`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID.toString()})`;
				logger.info("[Database Migrations] Migration lock released");
			} catch {
				logger.warn("[Database Migrations] Failed to explicitly unlock migration lock (will auto-release on connection close)");
			}
		}

		await migrationsClient.end();
	}
}

await runMigrationsWithLock();

export const dbClient = Database.getInstance(databaseUrl);
export const db = Database.getDrizzle();
