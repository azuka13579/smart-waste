import { sql } from "drizzle-orm";
import { type PgTimestampConfig, timestamp, uuid } from "drizzle-orm/pg-core";

/* ──────────────────────────────────────────────────────────────────────────
   ID (UUID v7, butuh PostgreSQL 18+)
   ────────────────────────────────────────────────────────────────────────── */

export const id = uuid;

export const idPrimaryKey = id().primaryKey().default(sql`uuidv7()`);

export type Id = ReturnType<typeof id>;

/* ──────────────────────────────────────────────────────────────────────────
   Timestamps
   ────────────────────────────────────────────────────────────────────────── */

export function timestamptz(
	name?: string,
	options?: {
		mode?: PgTimestampConfig["mode"];
		precision?: PgTimestampConfig["precision"];
	}
) {
	const base = { withTimezone: true, ...(options ?? {}) };
	return name === undefined ? timestamp(base) : timestamp(name, base);
}

export function createdAt(name?: string) {
	return timestamptz(name).notNull().defaultNow();
}

export function updatedAt(name?: string) {
	// drizzle will call this on UPDATE to set current timestamp
	return timestamptz(name)
		.notNull()
		.defaultNow()
		.$onUpdate((): Date => new Date());
}
