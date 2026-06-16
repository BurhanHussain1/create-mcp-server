# create-mcp-server

[![CI](https://github.com/BurhanHussain1/create-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/BurhanHussain1/create-mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A command-line tool that generates a **ready-to-run [MCP](https://modelcontextprotocol.io) server** in seconds — like `create-react-app`, but for Model Context Protocol servers.

Answer three quick questions and get a complete, working server you can run immediately.

```
$ npx create-mcp-server

  Welcome to create-mcp-server!

  ? What is your MCP server's name?  weather-server
  ? Which language do you want?      TypeScript
  ? Name one sample tool to include: get_weather

  Done! Your MCP server was created at:
    /path/to/weather-server

  Next steps:
    cd weather-server
    npm install
    npm run dev
```

## Features

- **Two languages** — generates servers in **TypeScript** or **Python**, using the official MCP SDKs.
- **Actually runnable** — every generated server includes a working example tool, its dependencies, and a README.
- **Interactive** — a friendly question-and-answer flow (powered by `prompts`).
- **Safe** — never overwrites an existing folder.
- **Import from any API** — point it at an OpenAPI/Swagger spec (file or URL) and it generates one tool per endpoint, each calling the real API.
- **Visual builder** — run `create-mcp-server studio` to design a server in your browser (no code) and download it as a zip.
- **Production-ready output** — typed inputs, error handling, request timeouts + retries, an optional Streamable HTTP transport with **bearer-token auth**, DNS-rebinding protection, a `/health` check, graceful shutdown, and a `Dockerfile`. (TLS, rate limiting, and observability are left to your deployment platform.)

## Usage

```bash
# Run it directly (no install needed)
npx create-mcp-server

# Or clone this repo and run in dev mode
npm install
npm run dev
```

### Two ways to build

When you run it, you pick a mode:

1. **Start from scratch** — a starter server with one example tool (TypeScript or Python).
2. **Import from an OpenAPI spec** — give it a spec file or URL and it generates a TypeScript server with one tool per endpoint. Try the included example:

   ```bash
   npx create-mcp-server
   # choose "Import from an OpenAPI spec"
   # spec path: examples/catfact.json
   ```

   The generated tools call the live API. Set `API_TOKEN` for APIs that need auth.

### Visual builder (MCP Studio)

Prefer clicking to typing? Launch the no-code builder:

```bash
npx create-mcp-server studio
# then open http://localhost:4321 in your browser
```

Add tools and their inputs in the browser, click **Generate**, and a
ready-to-run server downloads as a zip. Unzip it, then `npm install` and
`npm run dev`.

## What the generated server looks like

A TypeScript server is a single small file built on three ideas — create a server, register a tool, connect a transport:

```ts
const server = new McpServer({ name: "weather-server", version: "0.1.0" });

server.registerTool(
  "get_weather",
  { description: "Say hello to the given name.", inputSchema: { name: z.string() } },
  async ({ name }) => ({ content: [{ type: "text", text: `Hello, ${name}!` }] })
);

await server.connect(new StdioServerTransport());
```

The Python version uses the `FastMCP` framework, where a decorated function becomes a tool automatically.

## How it works

```
your answers  →  pick template  →  copy files + fill {{blanks}}  →  new server folder
```

| File | Responsibility |
|------|----------------|
| `src/index.ts` | The CLI entry point — wires everything together |
| `src/prompts.ts` | Asks the questions and returns a typed answers object |
| `src/generator.ts` | Copies the chosen template and fills in the placeholders |
| `src/openapi.ts` | Reads an OpenAPI spec and extracts its endpoints |
| `src/studio.ts` | The visual builder's local web server + generate endpoint |
| `public/` | The browser UI for the visual builder |
| `templates/` | The server templates (scaffold, OpenAPI, and studio) |

## Tech stack

- **TypeScript** + **Node.js**
- [`commander`](https://github.com/tj/commander.js) — CLI argument parsing
- [`prompts`](https://github.com/terkelg/prompts) — interactive questions
- [`@apidevtools/swagger-parser`](https://github.com/APIDevTools/swagger-parser) — parses OpenAPI/Swagger specs
- [`express`](https://expressjs.com/) + [`jszip`](https://stuk.github.io/jszip/) — power the visual builder (web server + zip download)
- Official MCP SDKs ([`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk), [`mcp`](https://github.com/modelcontextprotocol/python-sdk)) in the generated servers

## Development

```bash
npm install        # install dependencies
npm run dev        # run the CLI from source
npm test           # run the test suite (Vitest)
npm run lint       # lint with ESLint
npm run format     # format with Prettier
npm run typecheck  # type-check without emitting
npm run build      # compile to dist/
```

Every push and pull request runs type-check, lint, format check, tests, and
build via GitHub Actions (`.github/workflows/ci.yml`).

## Publishing

```bash
npm login
npm publish        # prepublishOnly builds dist/ automatically
```

## Roadmap

- [x] **Stage 1** — interactive CLI scaffolder (TypeScript + Python templates)
- [x] **Stage 2** — import an OpenAPI/Swagger spec and auto-generate a tool per endpoint
- [x] **Stage 3** — a visual, no-code web builder (`studio`) that exports a server
- [x] **Stage 4** — production hardening: typed inputs, error handling, HTTP transport, Docker, tests + CI
- [x] **Stage 5** — security & ops: inbound auth, DNS-rebinding protection, retries, `/health`, graceful shutdown

### Future ideas
- Generate Python servers from the visual builder and OpenAPI import
- Enum / array input types
- One-click deploy to a cloud host

## License

MIT
