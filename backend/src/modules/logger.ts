import * as pino from "pino";
import { logLevel } from "../config";

export class Logger {
	private static instance: pino.Logger;

	public static getInstance(level: pino.LevelWithSilentOrString = "info"): pino.Logger {
		if (!Logger.instance) {
			Logger.instance = pino.pino({
				level,
				timestamp: pino.stdTimeFunctions.isoTime
			});
		}
		return Logger.instance;
	}

	public static getLogger(): pino.Logger {
		return Logger.getInstance();
	}
}

// Initialize logger singleton with app configuration
export const logger = Logger.getInstance(logLevel);
