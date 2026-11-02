import { pgEnum } from "drizzle-orm/pg-core";
import { ReportStatus, UserRole, WasteCategory } from "@/constants";

export const userRoleEnum = pgEnum("user_role", UserRole);

export const reportStatusEnum = pgEnum("report_status", ReportStatus);
export const wasteCategoryEnum = pgEnum("waste_category", WasteCategory);
