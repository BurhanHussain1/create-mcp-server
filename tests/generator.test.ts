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
