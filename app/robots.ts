import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://movive-hazel-six.vercel.app";

// Allow crawling of the public marketing/legal surface; keep private and
// authenticated areas (app dashboard, admin, auth flows, API) out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/onboarding",
        "/dashboard",
        "/admin",
        "/profile",
        "/settings",
        "/nutrition",
        "/training",
        "/workouts",
        "/progress",
        "/calendar",
        "/ai",
        "/ai-coach",
        "/recommendations",
        "/notifications",
        "/subscription",
        "/feedback",
        "/forbidden",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
