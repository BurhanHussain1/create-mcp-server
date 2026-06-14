# {{serverName}}

An MCP server built visually with **MCP Studio** (part of create-mcp-server).
Each tool starts as a stub that echoes its inputs — edit `src/index.ts` to add
your real logic.

## Run it

1. Install dependencies:
   `npm install`
2. Start in dev mode:
   `npm run dev`

## Test it in the MCP Inspector

`npm run build`
`npx @modelcontextprotocol/inspector node dist/index.js`

Open the URL it prints, pick a tool, fill in the inputs, and run it.

## Run as a remote (HTTP) server

For hosted/remote agents, run it over Streamable HTTP instead of stdio:

```powershell
npm run build
$env:MCP_TRANSPORT = "http"; $env:PORT = "3000"; npm start
```

It serves the MCP endpoint at `http://localhost:3000/mcp`.

## Deploy with Docker

A `Dockerfile` is included (defaults to HTTP mode on port 3000):

```bash
docker build -t {{serverName}} .
docker run -p 3000:3000 {{serverName}}
```

## Where to add your logic

Open `src/index.ts`. Each tool has a handler with a `TODO` comment — replace
the placeholder response with whatever the tool should actually do.
