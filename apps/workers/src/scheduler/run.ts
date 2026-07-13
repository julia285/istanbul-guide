import { prisma } from "@istanbul-guide/db";
import { runSource } from "./run-source.js";

const TICK_MS = 60 * 1000; // scheduler wakes every minute; each source runs on its own intervalMinutes
const FAILURE_THRESHOLD = 3; // consecutive failures before auto-disabling publish and marking FAILED

async function tick(): Promise<void> {
  const now = new Date();
  const allActive = await prisma.source.findMany({ where: { active: true } });
  const dueSources = allActive.filter((source) => {
    if (!source.lastRunAt) return true;
    const dueAt = source.lastRunAt.getTime() + source.intervalMinutes * 60 * 1000;
    return dueAt <= now.getTime();
  });

  for (const source of dueSources) {
    const run = await prisma.parserRun.create({
      data: { sourceId: source.id, status: "RUNNING" },
    });
    const startedAt = Date.now();

    try {
      const result = await runSource(source);
      console.log(
        `[parser] ${result.sourceSlug}: discovered ${result.discovered}, created ${result.created}, updated ${result.updated}, rejected ${result.rejected}, processing errors ${result.processingErrors}`,
      );

      await Promise.all([
        prisma.parserRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
            durationMs: Date.now() - startedAt,
            discoveredCount: result.discovered,
            newCount: result.created,
            updatedCount: result.updated,
            rejectedCount: result.rejected,
            errorCount: result.processingErrors,
          },
        }),
        prisma.source.update({
          where: { id: source.id },
          data: {
            lastRunAt: new Date(),
            lastSuccessAt: new Date(),
            consecutiveFailures: 0,
            healthStatus: "HEALTHY",
            // Deliberately not re-enabled here even after a healthy run —
            // once auto-disabled by repeated failures, it stays off until a
            // human confirms the underlying issue (e.g. a selector change)
            // is actually fixed, not just that one run happened to work.
          },
        }),
      ]);
    } catch (error) {
      console.error(`[parser] ${source.slug} failed:`, error);
      const consecutiveFailures = source.consecutiveFailures + 1;
      const failed = consecutiveFailures >= FAILURE_THRESHOLD;

      await Promise.all([
        prisma.parserRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            durationMs: Date.now() - startedAt,
            errorCount: 1,
            errorSummary: { message: error instanceof Error ? error.message : String(error) },
          },
        }),
        prisma.source.update({
          where: { id: source.id },
          data: {
            lastRunAt: new Date(),
            lastFailureAt: new Date(),
            consecutiveFailures,
            healthStatus: failed ? "FAILED" : "DEGRADED",
            // Auto-disabled once a source crosses the failure threshold, so a
            // broken selector/feed can't silently keep auto-publishing
            // garbage — stays off until a human re-enables it, even after
            // the source starts succeeding again.
            autoPublishEnabled: failed ? false : source.autoPublishEnabled,
          },
        }),
      ]);
    }
  }
}

async function main(): Promise<void> {
  await tick();

  // `--once` supports one-shot manual/CI runs; the container's default
  // mode is the always-on loop, waking every minute to check which
  // sources are due per their own intervalMinutes.
  if (process.argv.includes("--once")) {
    await prisma.$disconnect();
    return;
  }

  setInterval(() => {
    tick().catch((error) => console.error("[parser] tick failed:", error));
  }, TICK_MS);
}

main().catch((error) => {
  console.error("[parser] fatal error:", error);
  process.exit(1);
});
