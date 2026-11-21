import { connection } from "next/server";

/**
 * Liveness check for Docker HEALTHCHECK, ECS and Render. Answers as long as the Next.js server
 * is up - it deliberately does NOT call the backend, so a backend outage doesn't restart this container.
 */
export async function GET() {
  await connection(); // evaluate per request, never prerendered
  return Response.json(
    {
      status: "UP",
      service: "aegisbank-frontend",
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
