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
  // import.meta.url is unreliable here: Next.js's build pipeline statically
  // inlines it as the build-time absolute path (e.g. "/vercel/path0/...")
  // even for externalized packages, which doesn't exist at runtime (Vercel
  // serverless functions run from "/var/task/..."). So this tries a fixed
  // list of plausible runtime roots instead of deriving one dynamically.
  const candidateDirs = [
    "/var/task/packages/db/generated/client", // Vercel serverless runtime
    path.join(process.cwd(), "packages/db/generated/client"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../generated/client"), // local dev/workers
  ];
  const generatedClientDir = candidateDirs.find((dir) => fs.existsSync(dir));
  if (generatedClientDir) {
    const engineFiles = fs
      .readdirSync(generatedClientDir)
      .filter((file) => file.startsWith("libquery_engine"));
    const match =
      engineFiles.find((file) =>
        process.platform === "darwin" ? file.includes("darwin") : !file.includes("darwin"),
      ) ?? engineFiles[0];
    if (match) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(generatedClientDir, match);
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
