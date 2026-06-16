"""
{{serverName}} — an MCP server built with MCP Studio (create-mcp-server).
Each tool below is a starting point — add your own logic where marked TODO.

Transports:
  - stdio (default) — for local use and desktop clients like Claude Desktop.
  - Streamable HTTP — set MCP_TRANSPORT=http (and optional PORT) to run it
    as a remote server for hosted agents.
"""

import os

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# --- HTTP transport settings (only used when MCP_TRANSPORT=http) ---
# Inbound auth: if set, clients must send `Authorization: Bearer <token>`.
MCP_AUTH_TOKEN = os.environ.get("MCP_AUTH_TOKEN")
# DNS-rebinding protection: if set (comma-separated), only these Host
# headers are allowed (e.g. "myserver.example.com,localhost:3000").
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()]

# Enable DNS-rebinding protection only when ALLOWED_HOSTS is set (matches the
# TypeScript server). Otherwise leave it off so the server works behind any host.
_transport_security = (
    TransportSecuritySettings(enable_dns_rebinding_protection=True, allowed_hosts=ALLOWED_HOSTS)
    if ALLOWED_HOSTS
    else TransportSecuritySettings(enable_dns_rebinding_protection=False)
)

# Create the MCP server. host/port/stateless only matter in HTTP mode:
#   - bind 0.0.0.0 so it's reachable when hosted (not just localhost),
#   - stateless_http=True makes each HTTP request self-contained (no sticky
#     sessions), which is friendliest behind a load balancer.
mcp = FastMCP(
    "{{serverName}}",
    host="0.0.0.0",
    port=int(os.environ.get("PORT", "3000")),
    stateless_http=True,
    transport_security=_transport_security,
)


@mcp.custom_route("/health", methods=["GET"])
async def health_check(_request: Request) -> Response:
    # Public health check for load balancers / orchestrators (no auth).
    return JSONResponse({"status": "ok"})


{{tools}}


class _BearerAuthMiddleware:
    """Pure-ASGI middleware: if a token is configured, require
    `Authorization: Bearer <token>` on every request except the public
    /health check. Returns 401 otherwise. (Pure ASGI so it doesn't buffer
    the streaming MCP responses.)"""

    def __init__(self, app, token: str):
        self.app = app
        self.token = token

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope.get("path") != "/health":
            headers = dict(scope.get("headers") or [])
            provided = headers.get(b"authorization", b"").decode()
            if provided != f"Bearer {self.token}":
                response = JSONResponse({"error": "Unauthorized"}, status_code=401)
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


def _run_http() -> None:
    # Serve the Streamable HTTP app at /mcp, plus the public /health route.
    import uvicorn

    app = mcp.streamable_http_app()
    if MCP_AUTH_TOKEN:
        app = _BearerAuthMiddleware(app, MCP_AUTH_TOKEN)

    # uvicorn installs SIGTERM/SIGINT handlers and shuts down gracefully
    # (drains in-flight requests, runs the app's shutdown lifespan).
    uvicorn.run(app, host=mcp.settings.host, port=mcp.settings.port)


if __name__ == "__main__":
    if os.environ.get("MCP_TRANSPORT") == "http":
        # Run as a remote server over Streamable HTTP (endpoint: /mcp).
        _run_http()
    else:
        # Run over stdio — the simplest transport, used by the MCP Inspector
        # and local clients like Claude Desktop.
        mcp.run()
