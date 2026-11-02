export enum ReportStatus {
	Pending = "pending",
	InProgress = "in_progress",
	Completed = "completed",
	Rejected = "rejected"
}

export const ReportStatusValues = Object.values(ReportStatus);

/** Date filters and daily statistics are grouped by this time zone. */
export const AppTimeZone = "Asia/Jakarta";

/** Same order and values as the model's `labels.json`. */
export enum WasteCategory {
	Glass = "glass",
	Metal = "metal",
	Organic = "organic",
	Paper = "paper",
	Plastic = "plastic",
	Textile = "textile"
}

export const WasteCategoryValues = Object.values(WasteCategory);
