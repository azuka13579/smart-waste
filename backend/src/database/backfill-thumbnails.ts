/**
 * Create the 240×240 thumbnail for reports uploaded before thumbnails existed.
 *
 *   bun run thumbnails:backfill
 *
 * Downloads each stored photo from its public URL, so it works for both STORAGE_DRIVER=local and s3.
 * Safe to run more than once: existing thumbnails are simply overwritten.
 */
import { FileConfig } from "@/constants";
import { reports } from "@/database/schema";
import { db, logger, storage, toReportThumbnail } from "@/modules";

const rows = await db.select({ id: reports.id, photoKey: reports.photoKey }).from(reports);
let created = 0;

for (const row of rows) {
	const photoUrl = storage.getPublicUrl(row.photoKey);
	try {
		const response = await fetch(photoUrl);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const thumbnail = await toReportThumbnail(Buffer.from(await response.arrayBuffer()));
		await storage.upload(FileConfig.ReportThumbnail.key(row.photoKey), thumbnail, "image/jpeg");
		created++;
	} catch (error) {
		logger.warn(error, `[thumbnails] Skipped report ${row.id} (${photoUrl})`);
	}
}

logger.info(`[thumbnails] Done. ${created}/${rows.length} thumbnails created.`);
process.exit(0);
