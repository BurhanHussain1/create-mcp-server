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

## Usage

```bash
# Run it directly (no install needed)
npx create-mcp-server

# Or clone this repo and run in dev mode
npm install
npm run dev
```

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
| `templates/` | The TypeScript and Python server templates |

## Tech stack

- **TypeScript** + **Node.js**
- [`commander`](https://github.com/tj/commander.js) — CLI argument parsing
- [`prompts`](https://github.com/terkelg/prompts) — interactive questions
- Official MCP SDKs ([`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk), [`mcp`](https://github.com/modelcontextprotocol/python-sdk)) in the generated servers

## Roadmap

- [x] **Stage 1** — interactive CLI scaffolder (TypeScript + Python templates)
- [ ] **Stage 2** — import an OpenAPI/Swagger spec and auto-generate a tool per endpoint
- [ ] **Stage 3** — a visual, no-code web builder that exports a server

## License

MIT
