# create-mcp-server

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
| `templates/` | The TypeScript, Python, and OpenAPI server templates |

## Tech stack

- **TypeScript** + **Node.js**
- [`commander`](https://github.com/tj/commander.js) — CLI argument parsing
- [`prompts`](https://github.com/terkelg/prompts) — interactive questions
- [`@apidevtools/swagger-parser`](https://github.com/APIDevTools/swagger-parser) — parses OpenAPI/Swagger specs
- Official MCP SDKs ([`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk), [`mcp`](https://github.com/modelcontextprotocol/python-sdk)) in the generated servers

## Roadmap

- [x] **Stage 1** — interactive CLI scaffolder (TypeScript + Python templates)
- [x] **Stage 2** — import an OpenAPI/Swagger spec and auto-generate a tool per endpoint
- [ ] **Stage 3** — a visual, no-code web builder that exports a server

## License

MIT
