import type { MetadataRoute } from "next";

/** Keep crawlers out of the private docs UI, the API routes and the banking screens. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/v1/admin/", "/api/", "/app"] },
    ],
  };
}
