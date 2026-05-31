import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { execSync } from "child_process";
import path from "path";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";

// Auto-migrate khi app khởi động
try {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "ignore",
    cwd: path.join(process.cwd()),
  });
} catch (e) {
  console.error("Auto-migrate failed:", e);
}

const adapter = new PrismaLibSql({
  url: dbUrl,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}