import { join } from "node:path";
import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/config";

const schemaPath = join("src/database/schema/**/*.ts").replace(/\\/g, "/");

export default defineConfig({
	schema: schemaPath,
	out: "./drizzle",
	dbCredentials: {
		url: databaseUrl
	},
	dialect: "postgresql",
	strict: true,
	verbose: true,
	casing: "snake_case",
	introspect: {
		casing: "camel"
	}
});
