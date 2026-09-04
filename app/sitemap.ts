import type { MetadataRoute } from "next";

// Public, indexable marketing/legal routes. Authenticated app areas
// (dashboard, nutrition, training, admin, auth flows…) are intentionally
// excluded — they are private and disallowed in robots.ts.
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://movive-hazel-six.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
