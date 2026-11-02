export enum Cookies {
	Session = "smart-waste.session"
}

/** Mobile app sends the session token as `Authorization: Bearer <token>` instead of a cookie. */
export const BearerPrefix = "Bearer ";

export const SessionExpirationDays = 30;
