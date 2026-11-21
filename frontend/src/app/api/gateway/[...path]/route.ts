import { forwardToGateway } from "@/lib/api/gateway-proxy";
import { serverEnv } from "@/lib/env";

/**
 * Backend-for-frontend proxy: /api/gateway/v1/... -> <API_GATEWAY_URL>/api/v1/...
 * The gateway URL is read per request, so the same image works in every environment.
 */
async function handler(
  request: Request,
  { params }: RouteContext<"/api/gateway/[...path]">,
) {
  const { path } = await params;
  const env = serverEnv();
  return forwardToGateway(request, path, {
    gatewayUrl: env.API_GATEWAY_URL,
    timeoutMs: env.API_TIMEOUT_MS,
  });
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
