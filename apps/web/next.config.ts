import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // No transpilePackages needed: @istanbul-guide/db and @istanbul-guide/shared
  // both ship compiled JS from their own `build` step (see their package.json),
  // so webpack consumes them like any other prebuilt dependency.
  //
  // Prisma's query engine binary is resolved via runtime filesystem paths
  // that break once webpack bundles @prisma/client — keep it a real
  // require() instead. See https://pris.ly/d/nextjs-prisma-vercel
  //
  // @istanbul-guide/db does its own filesystem path computation (locating
  // the engine binary — see its src/index.ts) relative to the running
  // module's own location; that breaks the same way if webpack bundles it,
  // so it needs to stay external too.
  serverExternalPackages: ["@prisma/client", "@istanbul-guide/db"],
  // The Prisma client (and its native query engine binary) lives in a
  // sibling workspace package, so Next's serverless bundler doesn't
  // discover it via static analysis and silently drops it from the deployed
  // function — this explicitly tells it to include the whole generated
  // client directory. See https://pris.ly/d/engine-not-found-nextjs
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  outputFileTracingIncludes: {
    "/**/*": ["../../packages/db/generated/client/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
