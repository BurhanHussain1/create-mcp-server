// This file's job: run a small web server (the "studio") that hosts
// the visual, no-code MCP server builder. Safe to host publicly.

import express from "express";
import { rateLimit } from "express-rate-limit";
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
  if (
    spec.language !== undefined &&
    spec.language !== "typescript" &&
    spec.language !== "python"
  ) {
    return "Language must be 'typescript' or 'python'.";
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
    const validTypes = ["string", "number", "boolean"];
    for (const input of tool.inputs) {
      if (!input || !identifier.test(input.name)) {
        return `Invalid input name in tool "${tool.name}".`;
      }
      if (!validTypes.includes(input.type)) {
        return `Input "${input.name}" in tool "${tool.name}" has an invalid type.`;
      }
    }
  }
  return null;
}

export async function startStudio(port: number): Promise<void> {
  const app = express();

  // Trust one proxy hop (PaaS hosts like Render/Railway sit behind a proxy),
  // so the rate limiter sees the real client IP.
  app.set("trust proxy", 1);

  // Parse JSON bodies, capped at 100kb (a server design is tiny).
  app.use(express.json({ limit: "100kb" }));

  // Serve the web page and its assets (index.html, app.js, etc.).
  app.use(express.static(PUBLIC_DIR));

  // Health check — used by hosting platforms to confirm the app is alive.
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Limit how often the generate endpoint can be hit (per IP), so a public
  // deployment can't be spammed.
  const generateLimiter = rateLimit({
    windowMs: 60_000, // 1 minute
    limit: 30, // 30 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please wait a minute and try again.",
    },
  });

  // The main endpoint: take a design, build the files, zip them, send them.
  app.post("/api/generate", generateLimiter, async (req, res) => {
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

  const server = app.listen(port, () => {
    console.log("");
    console.log("  MCP Studio is running!");
    console.log(`  Open this in your browser:  http://localhost:${port}`);
    console.log("");
    console.log("  Press Ctrl+C to stop.");
  });

  // Graceful shutdown: stop accepting connections, then exit cleanly.
  const shutdown = () => {
    console.log("\n  Shutting down MCP Studio...");
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
