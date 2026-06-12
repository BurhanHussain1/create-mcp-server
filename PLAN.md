# Project Plan: create-mcp-server

A tool that helps anyone build an MCP server quickly.

---

## 1. What are we building? (in simple words)

MCP (Model Context Protocol) is a standard way to connect AI assistants
(like Claude) to outside tools and data — databases, APIs, files, etc.
Building an MCP server by hand means writing a lot of boilerplate code.

**Our tool removes that pain.** A person runs one command, answers a few
questions, and gets a complete, working MCP server they can run right away.

Think of it like `create-react-app`, but for MCP servers.

---

## 2. Who is it for?

- Developers who want an MCP server but don't want to start from scratch.
- Beginners who don't fully understand the MCP spec yet.
- AI engineers who want to turn an existing API into an MCP server fast.

---

## 3. The big picture (3 stages)

We build in 3 stages. Each stage produces something useful on its own,
so the project is never "half-finished."

| Stage | What it does | Result |
|-------|--------------|--------|
| **1. CLI scaffolder** | Ask questions in the terminal, generate a server | A working command-line tool |
| **2. OpenAPI importer** | Paste an API spec, auto-create tools for every endpoint | The "wow" feature people share |
| **3. Visual builder** | Click to design tools in a web page, then export | The no-code centerpiece |

We do them in order. We do NOT start Stage 2 until Stage 1 fully works.

---

## 4. Tech we will use (and why, simply)

- **TypeScript** — the language. Most MCP tools use it, and it lets us
  add the web page (Stage 3) later without switching languages.
- **commander** — reads the command and its options (like `--name`).
- **prompts** — asks the user friendly questions in the terminal.
- **ejs (templates)** — fills in blanks in template files to generate code.
- **Node.js** — runs the tool. Users start it with `npx`, no install needed.

The tool is written in TypeScript, but it can **generate servers in both
Python and TypeScript**, so Python users are covered too.

---

## 5. Stage 1 — step by step (our first goal)

Small steps, each one testable:

1. **Set up the project** — create the folder, `package.json`, TypeScript
   config, and a `src/` folder.
2. **Make the CLI run** — typing the command prints a welcome message.
3. **Ask questions** — server name, language (Python or TS), and one
   sample tool name.
4. **Build the templates** — prepare template files for a basic MCP server
   (one for Python, one for TypeScript).
5. **Generate the project** — take the answers, fill the templates, and
   write a complete new folder on disk.
6. **Add a README to the output** — so the user knows how to run their
   new server.
7. **Test it end to end** — generate a server, run it, and confirm it
   connects in the MCP Inspector (the official testing tool).

**Stage 1 is "done" when:** a generated server actually starts and shows
its sample tool in the Inspector.

---

## 6. What the project folder will look like

```
create-mcp-server/
├── src/
│   ├── index.ts          # the main command (entry point)
│   ├── prompts.ts        # the questions we ask the user
│   └── generator.ts      # fills templates and writes files
├── templates/
│   ├── typescript/       # template for a TS MCP server
│   └── python/           # template for a Python MCP server
├── package.json
├── tsconfig.json
└── README.md
```

---

## 7. After Stage 1 (later goals)

- **Stage 2:** read an OpenAPI file and turn each API endpoint into an
  MCP tool automatically.
- **Stage 3:** a simple web page where you design tools by clicking,
  then download the generated server.

---

## 8. Definition of success

- Stage 1: one command creates a server that runs. (Portfolio-ready.)
- Stage 2: turns any REST API into an MCP server. (Shareable.)
- Stage 3: non-coders can build a server in the browser. (Standout.)
