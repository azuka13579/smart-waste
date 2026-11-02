import { randomUUIDv7 } from "bun";
import { and, asc, count, desc, eq, getTableColumns, ilike, or, type SQL, sql } from "drizzle-orm";
import { StatusMap, status } from "elysia";
import { AppTimeZone, FileConfig, ReportStatus, ReportStatusValues } from "@/constants";
import { reportStatusLogs, reports, users } from "@/database/schema";
import { db, logger, readUploadedImage, type Session, storage, toReportPhoto, tryPredictWaste } from "@/modules";
import type { ReportsModel } from "./model";

/**
 * `ownerId` limits every query to one user's reports (the `/users/@me/reports` routes).
 * Without it the caller acts as an admin over all reports.
 */
export type ReportScope = { ownerId?: string };

const { photoKey: _photoKey, ...reportColumns } = getTableColumns(reports);

export class ReportsService {
	public constructor(private readonly options: { session: Session }) {}

	/* ── Private helpers ────────────────────────────── */

	private selectColumns() {
		return {
			...reportColumns,
			photoKey: reports.photoKey,
			user: { id: users.id, name: users.name, email: users.email }
		};
	}

	private serialize(row: typeof reports.$inferSelect & { user: { id: string; name: string; email: string } }) {
		const { photoKey, ...rest } = row;
		return {
			...rest,
			photoUrl: storage.getPublicUrl(photoKey),
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString()
		};
	}

	private scopeFilter(scope: ReportScope) {
		return scope.ownerId ? eq(reports.userId, scope.ownerId) : undefined;
	}

	/** Report row the scope may see, or 404 (other users' reports look like they don't exist). */
	private async findInScope(id: string, scope: ReportScope) {
		const [row] = await db
			.select(this.selectColumns())
			.from(reports)
			.innerJoin(users, eq(reports.userId, users.id))
			.where(and(eq(reports.id, id), this.scopeFilter(scope)));

		if (!row) throw status(StatusMap["Not Found"], "Report not found");
		return row;
	}

	/** Owners may only change a report while nobody has started handling it. */
	private assertOwnerCanModify(row: { status: ReportStatus }, scope: ReportScope) {
		if (scope.ownerId && row.status !== ReportStatus.Pending) {
			throw status(StatusMap.Conflict, "Only pending reports can be changed");
		}
	}

	/* ── Public API ─────────────────────────────────── */

	public async list(query: ReportsModel.listQuery, scope: ReportScope) {
		const { page, limit, search, status: reportStatus, category, userId, from, to } = query;
		const offset = (page - 1) * limit;

		const filters: (SQL | undefined)[] = [
			this.scopeFilter(scope),
			search ? or(ilike(reports.description, `%${search}%`), ilike(reports.address, `%${search}%`), ilike(users.name, `%${search}%`)) : undefined,
			reportStatus ? eq(reports.status, reportStatus) : undefined,
			category ? eq(reports.category, category) : undefined,
			userId ? eq(reports.userId, userId) : undefined,
			from ? sql`${reports.createdAt} >= (${from}::date)::timestamp at time zone ${AppTimeZone}` : undefined,
			to ? sql`${reports.createdAt} < (${to}::date + 1)::timestamp at time zone ${AppTimeZone}` : undefined
		];
		const whereClause = and(...filters);

		const [totalResult] = await db.select({ total: count() }).from(reports).innerJoin(users, eq(reports.userId, users.id)).where(whereClause);
		const total = totalResult?.total ?? 0;

		const rows = await db.select(this.selectColumns()).from(reports).innerJoin(users, eq(reports.userId, users.id)).where(whereClause).orderBy(desc(reports.createdAt)).limit(limit).offset(offset);

		return {
			reports: rows.map(row => this.serialize(row)),
			pagination: {
				page,
				perPage: limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / limit))
			}
		};
	}

	public async getById(id: string, scope: ReportScope) {
		const row = await this.findInScope(id, scope);

		const logs = await db
			.select({
				id: reportStatusLogs.id,
				fromStatus: reportStatusLogs.fromStatus,
				toStatus: reportStatusLogs.toStatus,
				note: reportStatusLogs.note,
				createdAt: reportStatusLogs.createdAt,
				changedBy: { id: users.id, name: users.name }
			})
			.from(reportStatusLogs)
			.innerJoin(users, eq(reportStatusLogs.changedBy, users.id))
			.where(eq(reportStatusLogs.reportId, id))
			.orderBy(asc(reportStatusLogs.createdAt));

		return {
			...this.serialize(row),
			statusLogs: logs.map(log => ({ ...log, createdAt: log.createdAt.toISOString() }))
		};
	}

	/** Counts of the scope's reports per status (user dashboard). */
	public async summary(scope: ReportScope) {
		const rows = await db.select({ status: reports.status, count: count() }).from(reports).where(this.scopeFilter(scope)).groupBy(reports.status);

		const byStatus = Object.fromEntries(ReportStatusValues.map(value => [value, 0])) as Record<ReportStatus, number>;
		for (const row of rows) byStatus[row.status] = row.count;

		return { total: rows.reduce((sum, row) => sum + row.count, 0), byStatus };
	}

	/**
	 * Store the photo, classify it, and save the report with its first status log.
	 * The model runs here (not only in POST /predictions) so the stored result cannot be forged by the client.
	 */
	public async create(data: ReportsModel.createBody) {
		const { userId } = this.options.session;
		const image = await readUploadedImage(data.photo);
		const [prediction, photo] = await Promise.all([tryPredictWaste(image), toReportPhoto(image)]);

		const reportId = randomUUIDv7();
		const photoKey = FileConfig.ReportPhoto.key(reportId);
		await storage.upload(photoKey, photo, "image/jpeg");

		try {
			await db.transaction(async tx => {
				await tx.insert(reports).values({
					id: reportId,
					userId,
					description: data.description,
					photoKey,
					latitude: data.latitude,
					longitude: data.longitude,
					address: data.address,
					category: data.category ?? prediction?.category ?? null,
					modelCategory: prediction?.category ?? null,
					modelConfidence: prediction?.confidence ?? null
				});
				await tx.insert(reportStatusLogs).values({ reportId, changedBy: userId, fromStatus: null, toStatus: ReportStatus.Pending });
			});
		} catch (error) {
			await storage.delete(photoKey).catch(err => logger.warn(err, `Failed to clean up photo ${photoKey}`));
			throw error;
		}

		return { ...(await this.getById(reportId, {})), prediction };
	}

	public async update(id: string, data: ReportsModel.updateBody, scope: ReportScope) {
		const row = await this.findInScope(id, scope);
		this.assertOwnerCanModify(row, scope);

		await db.update(reports).set(data).where(eq(reports.id, id));
		return this.getById(id, scope);
	}

	/** Admin action: change status and record who did it and why. */
	public async updateStatus(id: string, data: ReportsModel.updateStatusBody) {
		const row = await this.findInScope(id, {});
		if (row.status === data.status) {
			throw status(StatusMap["Bad Request"], `Report is already ${data.status}`);
		}

		await db.transaction(async tx => {
			await tx.update(reports).set({ status: data.status }).where(eq(reports.id, id));
			await tx.insert(reportStatusLogs).values({
				reportId: id,
				changedBy: this.options.session.userId,
				fromStatus: row.status,
				toStatus: data.status,
				note: data.note
			});
		});

		return this.getById(id, {});
	}

	public async delete(id: string, scope: ReportScope) {
		const row = await this.findInScope(id, scope);
		this.assertOwnerCanModify(row, scope);

		await db.delete(reports).where(eq(reports.id, id));
		await storage.delete(row.photoKey).catch(err => logger.warn(err, `Failed to delete photo ${row.photoKey}`));
	}
}
