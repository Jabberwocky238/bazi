import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://bazi.app238.com/sitemap.xml",
    host: "https://bazi.app238.com",
  };
}
