import { BitField } from "@sapphire/bitfield";
import { UserRole } from "./user";

export const PermissionFlags = Object.freeze({
	// Wildcard
	ADMINISTRATOR: 1 << 0,

	// Users
	MANAGE_USERS: 1 << 1,

	// Reports
	SEND_REPORTS: 1 << 2,
	MANAGE_REPORTS: 1 << 3,

	// Dashboard
	VIEW_STATISTICS: 1 << 4
});

export const PermissionBitfield = new BitField(PermissionFlags);

/** Permissions are derived from `users.role`; there is no role table. */
export const RolePermissions: Record<UserRole, number> = {
	[UserRole.Admin]: PermissionBitfield.resolve(["ADMINISTRATOR"]),
	[UserRole.User]: PermissionBitfield.resolve(["SEND_REPORTS"]),
	[UserRole.Petugas]: PermissionBitfield.resolve(["MANAGE_REPORTS", "VIEW_STATISTICS"])
};
