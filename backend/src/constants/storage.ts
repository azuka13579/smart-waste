export const FileConfig = {
	ReportPhoto: {
		key: (reportId: string) => `reports/${reportId}.jpg`,
		maxSize: 10 * 1024 * 1024,
		/** Formats sharp can decode out of the box (no HEIC). */
		allowedFormats: ["jpeg", "png", "webp"],
		/** Longest side after resize; keeps uploads small without hurting the admin's view. */
		maxDimension: 1600,
		jpegQuality: 80
	}
} as const;
