import { prisma } from "@istanbul-guide/db";
import { runSource } from "./run-source.js";

const HOUR_MS = 60 * 60 * 1000;

async function tick(): Promise<void> {
  const dueSources = await prisma.source.findMany({
    where: {
      active: true,
      OR: [
        { lastRunAt: null },
        { lastRunAt: { lt: new Date(Date.now() - HOUR_MS) } },
      ],
    },
  });

  for (const source of dueSources) {
    try {
      const result = await runSource(source);
      console.log(
        `[parser] ${result.sourceSlug}: fetched ${result.fetched}, changed ${result.changed}`,
      );
    } catch (error) {
      console.error(`[parser] ${source.slug} failed:`, error);
      await prisma.source.update({
        where: { id: source.id },
        data: { healthStatus: "error" },
      });
    }
  }
}

async function main(): Promise<void> {
  await tick();

  // `--once` supports one-shot manual/CI runs; the container's default
  // mode is the always-on hourly loop described in the architecture doc.
  if (process.argv.includes("--once")) {
    await prisma.$disconnect();
    return;
  }

  setInterval(() => {
    tick().catch((error) => console.error("[parser] tick failed:", error));
  }, HOUR_MS);
}

main().catch((error) => {
  console.error("[parser] fatal error:", error);
  process.exit(1);
});
