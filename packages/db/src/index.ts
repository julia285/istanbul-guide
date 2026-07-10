import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/client/index.js";

// Prisma's own runtime engine-lookup heuristics only check paths relative
// to where @prisma/client itself is installed — they never guess "a sibling
// workspace package," which is where our custom `output` path (see
// prisma/schema.prisma) puts the generated client. Next.js's serverless
// bundler (via outputFileTracingIncludes in next.config.ts) does correctly
// ship the engine binary in production, but Prisma still can't find it on
// its own, so we point it there explicitly. See:
// https://pris.ly/d/engine-not-found-nextjs
if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const generatedClientDir = path.join(moduleDir, "../generated/client");
  const exists = fs.existsSync(generatedClientDir);
  // TEMPORARY debug logging — remove once the engine binary is confirmed
  // found in production. See conversation 2026-07-10 re: Prisma engine
  // resolution on Vercel.
  console.error("[prisma-debug] moduleDir:", moduleDir);
  console.error("[prisma-debug] generatedClientDir:", generatedClientDir);
  console.error("[prisma-debug] exists:", exists);
  if (exists) {
    const engineFiles = fs
      .readdirSync(generatedClientDir)
      .filter((file) => file.startsWith("libquery_engine"));
    console.error("[prisma-debug] engineFiles:", engineFiles);
    const match =
      engineFiles.find((file) =>
        process.platform === "darwin" ? file.includes("darwin") : !file.includes("darwin"),
      ) ?? engineFiles[0];
    if (match) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(generatedClientDir, match);
      console.error("[prisma-debug] set PRISMA_QUERY_ENGINE_LIBRARY:", process.env.PRISMA_QUERY_ENGINE_LIBRARY);
    }
  } else {
    try {
      console.error("[prisma-debug] moduleDir listing:", fs.readdirSync(moduleDir));
      console.error("[prisma-debug] moduleDir/.. listing:", fs.readdirSync(path.join(moduleDir, "..")));
    } catch (err) {
      console.error("[prisma-debug] listing failed:", err);
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export * from "../generated/client/index.js";
