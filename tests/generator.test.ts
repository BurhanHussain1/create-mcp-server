import { describe, it, expect } from "vitest";
import { buildVisualServerFiles } from "../src/generator.js";

describe("buildVisualServerFiles", () => {
  it("produces a complete set of server files", async () => {
    const files = await buildVisualServerFiles({
      name: "demo",
      tools: [
        {
          name: "greet",
          description: "Greet someone",
          inputs: [
            { name: "who", type: "string", description: "name", required: true },
          ],
        },
      ],
    });
    expect(files.has("package.json")).toBe(true);
    expect(files.has("tsconfig.json")).toBe(true);
    expect(files.has("src/index.ts")).toBe(true);
  });

  it("embeds the tool and its typed inputs into the server code", async () => {
    const files = await buildVisualServerFiles({
      name: "demo",
      tools: [
        {
          name: "add",
          description: "Add numbers",
          inputs: [
            { name: "a", type: "number", description: "", required: true },
          ],
        },
      ],
    });
    const index = files.get("src/index.ts")!;
    expect(index).toContain('"name": "add"');
    expect(index).toContain('"type": "number"');
    // No unfilled placeholders should remain.
    expect(index).not.toContain("{{");
  });

  it("fills the server name into package.json", async () => {
    const files = await buildVisualServerFiles({
      name: "my-server",
      tools: [{ name: "t", description: "d", inputs: [] }],
    });
    const pkg = JSON.parse(files.get("package.json")!);
    expect(pkg.name).toBe("my-server");
  });
});

describe("buildVisualServerFiles (python)", () => {
  it("produces the python server files", async () => {
    const files = await buildVisualServerFiles({
      name: "py-demo",
      language: "python",
      tools: [{ name: "t", description: "d", inputs: [] }],
    });
    expect(files.has("server.py")).toBe(true);
    expect(files.has("requirements.txt")).toBe(true);
    expect(files.has("README.md")).toBe(true);
    // The TypeScript-only files must NOT be present in a python build.
    expect(files.has("package.json")).toBe(false);
  });

  it("renders tools as typed FastMCP functions", async () => {
    const files = await buildVisualServerFiles({
      name: "py-demo",
      language: "python",
      tools: [
        {
          name: "greet",
          description: "Greet someone",
          inputs: [
            { name: "who", type: "string", description: "name", required: true },
            { name: "loud", type: "boolean", description: "", required: false },
          ],
        },
      ],
    });
    const server = files.get("server.py")!;
    expect(server).toContain("@mcp.tool()");
    expect(server).toContain("def greet(who: str, loud: bool | None = None) -> str:");
    // No unfilled placeholders should remain.
    expect(server).not.toContain("{{");
  });

  it("includes the HTTP transport, inbound auth, and health boilerplate", async () => {
    const files = await buildVisualServerFiles({
      name: "py-demo",
      language: "python",
      tools: [{ name: "t", description: "d", inputs: [] }],
    });
    const server = files.get("server.py")!;
    // Env-var contract matching the TypeScript server.
    expect(server).toContain('os.environ.get("MCP_TRANSPORT")');
    expect(server).toContain("MCP_AUTH_TOKEN");
    expect(server).toContain("ALLOWED_HOSTS");
    // HTTP wiring: streamable-http app, public /health route, DNS-rebinding.
    expect(server).toContain("streamable_http_app()");
    expect(server).toContain('@mcp.custom_route("/health"');
    expect(server).toContain("TransportSecuritySettings");
    // stdio stays the default.
    expect(server).toContain("mcp.run()");
  });
});
