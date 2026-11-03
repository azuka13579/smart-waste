export enum RouteTag {
	General = "General",
	Health = "Health",
	Auth = "Auth",
	Users = "Users",
	Reports = "Reports",
	Predictions = "Predictions",
	Statistics = "Statistics"
}

export const RouteTagsMeta = [
	{
		name: RouteTag.General,
		description: "General routes"
	},
	{
		name: RouteTag.Health,
		description: "Health check endpoints"
	},
	{
		name: RouteTag.Auth,
		description: "Register, login, and logout"
	},
	{
		name: RouteTag.Users,
		description: "Current user profile and user management (admin)"
	},
	{
		name: RouteTag.Reports,
		description: "Waste reports: own reports (/users/@me/reports) and management (admin)"
	},
	{
		name: RouteTag.Predictions,
		description: "Waste image classification"
	},
	{
		name: RouteTag.Statistics,
		description: "Dashboard statistics (admin)"
	}
];
