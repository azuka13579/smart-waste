import { index, numeric, pgTable, real, text, uuid, varchar } from "drizzle-orm/pg-core";
import { ReportStatus } from "@/constants";
import { createdAt, idPrimaryKey, updatedAt } from "@/database/helpers";
import { reportStatusEnum, wasteCategoryEnum } from "./enum";
import { users } from "./users";

export const reports = pgTable(
	"reports",
	{
		id: idPrimaryKey,

		userId: uuid()
			.references(() => users.id, {
				onDelete: "restrict",
				onUpdate: "cascade"
			})
			.notNull(),

		description: text().notNull(),
		/** Object key in storage (R2/local), not a full URL. */
		photoKey: varchar({ length: 255 }).notNull(),
		latitude: numeric({ precision: 9, scale: 6, mode: "number" }).notNull(),
		longitude: numeric({ precision: 9, scale: 6, mode: "number" }).notNull(),
		address: text(),

		/** Final category: accepted model result, the user's manual choice, or an admin correction. */
		category: wasteCategoryEnum(),
		/** Model result at creation; null when confidence is below the threshold ("not recognized"). */
		modelCategory: wasteCategoryEnum(),
		/** 0–1, highest class probability. */
		modelConfidence: real(),

		/** Current status, mirrored from the latest row in `report_status_logs`. */
		status: reportStatusEnum().notNull().default(ReportStatus.Pending),

		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	table => [index().on(table.userId), index().on(table.status), index().on(table.createdAt), index().on(table.category)]
);

export const reportStatusLogs = pgTable(
	"report_status_logs",
	{
		id: idPrimaryKey,

		reportId: uuid()
			.references(() => reports.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		changedBy: uuid()
			.references(() => users.id, {
				onDelete: "restrict",
				onUpdate: "cascade"
			})
			.notNull(),

		/** Null for the first row, written when the report is created. */
		fromStatus: reportStatusEnum(),
		toStatus: reportStatusEnum().notNull(),
		/** E.g. the reason a report was rejected. */
		note: text(),

		createdAt: createdAt()
	},
	table => [index().on(table.reportId)]
);
