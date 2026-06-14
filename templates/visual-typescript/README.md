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

## Where to add your logic

Open `src/index.ts`. Each tool has a handler with a `TODO` comment — replace
the placeholder response with whatever the tool should actually do.
