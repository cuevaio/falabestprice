import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({
  path: ".env.local",
});

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
});
