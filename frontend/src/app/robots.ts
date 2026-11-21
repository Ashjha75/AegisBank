import type { MetadataRoute } from "next";

/** Keep crawlers out of the private docs UI and the API routes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/v1/admin/", "/api/"] }],
  };
}
