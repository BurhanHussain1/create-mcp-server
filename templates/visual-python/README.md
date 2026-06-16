# {{serverName}}

An MCP server built visually with **MCP Studio** (create-mcp-server), in Python
using the official `FastMCP` framework. Each tool starts as a stub that echoes
its inputs — edit `server.py` to add your real logic.

## Run it

1. Create and activate a virtual environment:
   - **Windows:** `python -m venv .venv` then `.venv\Scripts\activate`
   - **macOS/Linux:** `python -m venv .venv` then `source .venv/bin/activate`
2. Install dependencies:
   `pip install -r requirements.txt`
3. Start the server:
   `python server.py`

## Test it in the MCP Inspector

`npx @modelcontextprotocol/inspector python server.py`

Open the URL it prints, pick a tool, fill in the inputs, and run it.

## Run as a remote (HTTP) server

For hosted/remote agents, run it over Streamable HTTP instead of stdio:

```powershell
$env:MCP_TRANSPORT = "http"; $env:PORT = "3000"; python server.py
```

It serves the MCP endpoint at `http://localhost:3000/mcp`, plus a public
`GET /health` endpoint for load balancers. It shuts down gracefully on
SIGTERM/SIGINT (handled by uvicorn).

### Securing it (environment variables)

- `MCP_AUTH_TOKEN` — if set, clients must send `Authorization: Bearer <token>`
  (the `/health` endpoint stays public).
- `ALLOWED_HOSTS` — comma-separated allowed `Host` headers; enables
  DNS-rebinding protection when set.

```powershell
$env:MCP_AUTH_TOKEN = "a-long-random-secret"
$env:ALLOWED_HOSTS = "your-domain.com"
$env:MCP_TRANSPORT = "http"; python server.py
```

## Going to production

This server handles auth, input validation, a `/health` check, and graceful
shutdown. Leave **TLS/HTTPS**, **rate limiting**, **metrics & tracing**, and
**secret storage** to your platform — usually a reverse proxy or API gateway
in front of this server.

## Where to add your logic

Open `server.py`. Each tool returns a placeholder marked `# TODO` — replace it
with whatever the tool should actually do.
