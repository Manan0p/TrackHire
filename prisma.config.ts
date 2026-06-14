import { defineConfig } from "prisma/config";

const connectionString = "postgresql://neondb_owner:npg_lnaCwi6Z5FVU@ep-hidden-sound-aihycp5q-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: connectionString,
  },
});
