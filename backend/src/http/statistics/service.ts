import { and, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { AppTimeZone, type ReportStatus, ReportStatusValues, UserRole, type WasteCategory, WasteCategoryValues } from "@/constants";
import { reports, users } from "@/database/schema";
import { db } from "@/modules";
import type { StatisticsModel } from "./model";

const localDate = sql`(${reports.createdAt} at time zone ${AppTimeZone})::date`;
const today = sql`(now() at time zone ${AppTimeZone})::date`;

export abstract class StatisticsService {
	public static async dashboard({ days, status }: StatisticsModel.dashboardQuery) {
		const dailyStatusFilter = status ? sql`and ${reports.status} = ${status}` : sql``;

		const [statusRows, categoryRows, dailyRows, [reportTotals], [userTotals], [modelTotals]] = await Promise.all([
			db.select({ status: reports.status, count: count() }).from(reports).groupBy(reports.status),
			db.select({ category: reports.category, count: count() }).from(reports).groupBy(reports.category),
			db.execute<{ date: string; count: number }>(sql`
				select to_char(day, 'YYYY-MM-DD') as date, count(${reports.id})::int as count
				from generate_series(${today} - ${days - 1}::int, ${today}, interval '1 day') as day
				left join ${reports} on ${localDate} = day::date ${dailyStatusFilter}
				group by day
				order by day
			`),
			db
				.select({
					reports: count(),
					reportsToday: sql<number>`count(*) filter (where ${localDate} = ${today})::int`
				})
				.from(reports),
			db
				.select({ users: count() })
				.from(users)
				.where(and(eq(users.role, UserRole.User), eq(users.isActive, true))),
			db
				.select({
					predicted: sql<number>`count(*) filter (where ${isNotNull(reports.modelCategory)})::int`,
					notRecognized: sql<number>`count(*) filter (where ${and(isNull(reports.modelCategory), isNotNull(reports.modelConfidence))})::int`,
					agreed: sql<number>`count(*) filter (where ${reports.category} = ${reports.modelCategory})::int`
				})
				.from(reports)
		]);

		const byStatus = Object.fromEntries(ReportStatusValues.map(value => [value, 0])) as Record<ReportStatus, number>;
		for (const row of statusRows) byStatus[row.status] = row.count;

		const byCategory = Object.fromEntries([...WasteCategoryValues, "uncategorized"].map(value => [value, 0])) as Record<WasteCategory | "uncategorized", number>;
		for (const row of categoryRows) byCategory[row.category ?? "uncategorized"] = row.count;

		const predicted = modelTotals?.predicted ?? 0;
		const agreed = modelTotals?.agreed ?? 0;

		return {
			totals: {
				reports: reportTotals?.reports ?? 0,
				reportsToday: reportTotals?.reportsToday ?? 0,
				users: userTotals?.users ?? 0
			},
			byStatus,
			byCategory,
			daily: dailyRows.map(row => ({ date: row.date, count: Number(row.count) })),
			model: {
				predicted,
				notRecognized: modelTotals?.notRecognized ?? 0,
				agreed,
				agreementRate: predicted > 0 ? agreed / predicted : null
			}
		};
	}
}
