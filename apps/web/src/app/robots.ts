import type { MetadataRoute } from "next";

const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://istanbul-guide-delta.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/*/admin"],
    },
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
  };
}
