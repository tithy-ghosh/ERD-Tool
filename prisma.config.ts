import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// dotenv reads only .env by default, but Next.js uses .env.local
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});