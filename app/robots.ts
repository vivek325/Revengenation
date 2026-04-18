import { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://revengenationstories.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/story/", "/about", "/privacy", "/terms", "/disclaimer", "/contact", "/communities/"],
        disallow: [
          "/admin",
          "/rn-control",
          "/api/",
          "/profile",
          "/reset-password",
          "/login",
          "/submit",
          "/communities/new",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
