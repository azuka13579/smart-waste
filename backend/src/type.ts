import type { app } from ".";

export type App = typeof app;
export * from "@/constants/permissions"; // Export bitfields for the web client
