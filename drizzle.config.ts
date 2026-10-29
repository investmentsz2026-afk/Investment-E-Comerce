import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit se ejecuta fuera de Next.js, así que cargamos .env.local manualmente.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
