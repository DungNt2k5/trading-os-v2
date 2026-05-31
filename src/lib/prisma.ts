import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";

// Auto-migrate khi app khởi động
try {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (fs.existsSync(migrationsDir)) {
    const dbUrlClean = dbUrl.replace(/\\/g, "/");
    execSync(`npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --url=${dbUrlClean}`, {
      stdio: "ignore",
      cwd: process.cwd(),
    });
    console.log("✅ Auto-migrate success");
  }
} catch (e: any) {
  console.error("Auto-migrate failed:", e.message);
}

const adapter = new PrismaLibSql({ url: dbUrl });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}