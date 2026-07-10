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
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
