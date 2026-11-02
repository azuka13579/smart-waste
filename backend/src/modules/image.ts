import { status } from "elysia";
import sharp from "sharp";
import { FileConfig } from "@/constants";

/**
 * Read an uploaded photo and make sure it is a real image in an allowed format.
 * Throws 400 for anything else, whatever the client claimed in `Content-Type`.
 */
export async function readUploadedImage(file: File) {
	const config = FileConfig.ReportPhoto;
	if (file.size > config.maxSize) {
		throw status(400, `Photo exceeds the maximum size of ${config.maxSize / 1024 / 1024} MB`);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const metadata = await sharp(buffer)
		.metadata()
		.catch(() => null);

	if (!metadata?.format || !(config.allowedFormats as readonly string[]).includes(metadata.format)) {
		throw status(400, `Invalid photo. Allowed formats: ${config.allowedFormats.join(", ")}`);
	}

	return buffer;
}

/** Normalize a report photo for storage: apply EXIF rotation, cap the size, re-encode as JPEG. */
export async function toReportPhoto(buffer: Buffer) {
	const config = FileConfig.ReportPhoto;
	return sharp(buffer).rotate().resize(config.maxDimension, config.maxDimension, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: config.jpegQuality, mozjpeg: true }).toBuffer();
}
