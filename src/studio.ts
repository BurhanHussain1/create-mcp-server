// This file's job: run a small local web server (the "studio") that hosts
// the visual, no-code MCP server builder.

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { buildVisualServerFiles, VisualSpec } from "./generator.js";

// Work out where this file lives, so we can find the public/ web files.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// public/ holds the web page; it sits one level up (works in src/ and dist/).
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Validate a design sent from the browser. Returns an error message, or
// null if everything looks good. (The browser checks too, but never trust
// the client — always validate on the server.)
function validateSpec(spec: VisualSpec): string | null {
  if (!spec || typeof spec.name !== "string") return "Missing server name.";
  if (!/^[a-z][a-z0-9-]*$/.test(spec.name)) {
    return "Server name must be lowercase letters, numbers, and hyphens.";
  }
  if (!Array.isArray(spec.tools) || spec.tools.length === 0) {
    return "Add at least one tool.";
  }

  const identifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  for (const tool of spec.tools) {
    if (!identifier.test(tool.name)) {
      return `Invalid tool name: "${tool.name}".`;
    }
    if (!Array.isArray(tool.inputs)) {
      return `Tool "${tool.name}" has invalid inputs.`;
    }
    for (const input of tool.inputs) {
      if (!identifier.test(input)) {
        return `Invalid input name "${input}" in tool "${tool.name}".`;
      }
    }
  }
  return null;
}

export async function startStudio(port: number): Promise<void> {
  const app = express();

  // Let the server understand JSON request bodies (used by /api/generate).
  app.use(express.json());

  // Serve the web page and its assets (index.html, app.js, etc.).
  app.use(express.static(PUBLIC_DIR));

  // A simple health check — handy for testing the server is alive.
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // The main endpoint: take a design, build the files, zip them, send them.
  app.post("/api/generate", async (req, res) => {
    try {
      const spec = req.body as VisualSpec;

      const error = validateSpec(spec);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      // 1. Build the server files in memory.
      const files = await buildVisualServerFiles(spec);

      // 2. Put them all inside a folder named after the server, in a zip.
      const zip = new JSZip();
      for (const [relativePath, content] of files) {
        zip.file(`${spec.name}/${relativePath}`, content);
      }
      const buffer = await zip.generateAsync({ type: "nodebuffer" });

      // 3. Send the zip back as a file download.
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${spec.name}.zip"`
      );
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.listen(port, () => {
    console.log("");
    console.log("  MCP Studio is running!");
    console.log(`  Open this in your browser:  http://localhost:${port}`);
    console.log("");
    console.log("  Press Ctrl+C to stop.");
  });
}
