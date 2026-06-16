#!/usr/bin/env node

/**
 * {{serverName}} — an MCP server built with MCP Studio (create-mcp-server).
 * Each tool below is a starting point — add your own logic where marked TODO.
 *
 * Transports:
 *   - stdio (default) — for local use and desktop clients.
 *   - Streamable HTTP — set MCP_TRANSPORT=http (and optional PORT) to run
 *     it as a remote server for hosted agents.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "node:http";
import { z } from "zod";

// --- HTTP transport settings (only used when MCP_TRANSPORT=http) ---
// Inbound auth: if set, clients must send `Authorization: Bearer <token>`.
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
// DNS-rebinding protection: if set (comma-separated), only these Host
// headers are allowed (e.g. "myserver.example.com,localhost:3000").
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

// One entry per tool you designed in the studio.
type ToolInput = {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
};
type ToolDef = {
  name: string;
  description: string;
  inputs: ToolInput[];
};

const tools: ToolDef[] = {{tools}};

// Turn one input definition into a zod validator (the tool's input rules).
function buildField(input: ToolInput): z.ZodTypeAny {
  let field: z.ZodTypeAny =
    input.type === "number"
      ? z.number()
      : input.type === "boolean"
        ? z.boolean()
        : z.string();
  if (input.description) field = field.describe(input.description);
  if (!input.required) field = field.optional();
  return field;
}

// Build a fresh server with all tools registered. We make a NEW one per
// HTTP request (stateless mode), so this is a function rather than a global.
function createServer(): McpServer {
  const server = new McpServer({ name: "{{serverName}}", version: "0.1.0" });

  for (const tool of tools) {
    // Build the tool's input schema from the inputs you defined.
    const inputSchema: Record<string, z.ZodTypeAny> = {};
    for (const input of tool.inputs) inputSchema[input.name] = buildField(input);

    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema },
      async (args) => {
        const values = args as Record<string, unknown>;

        try {
          // TODO: replace this with your real logic for "{{serverName}}".
          return {
            content: [
              {
                type: "text",
                text:
                  `Tool "${tool.name}" was called with:\n` +
                  `${JSON.stringify(values, null, 2)}\n\n` +
                  `Edit src/index.ts to make this tool do something real.`,
              },
            ],
          };
        } catch (error) {
          // If your logic throws, report it as a tool error (don't crash).
          return {
            isError: true,
            content: [
              { type: "text", text: `Error: ${(error as Error).message}` },
            ],
          };
        }
      }
    );
  }

  return server;
}

// Start over stdio (default) or Streamable HTTP (MCP_TRANSPORT=http).
async function main() {
  if (process.env.MCP_TRANSPORT === "http") {
    const port = Number(process.env.PORT) || 3000;

    const httpServer = createHttpServer(async (req, res) => {
      // Public health check for load balancers / orchestrators (no auth).
      if (req.method === "GET" && req.url === "/health") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      if (req.method === "POST" && req.url === "/mcp") {
        // Inbound auth: if MCP_AUTH_TOKEN is set, require a matching token.
        if (
          MCP_AUTH_TOKEN &&
          req.headers.authorization !== `Bearer ${MCP_AUTH_TOKEN}`
        ) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }

        // Stateless Streamable HTTP: one fresh server + transport per request.
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = chunks.length
            ? JSON.parse(Buffer.concat(chunks).toString())
            : undefined;

          const server = createServer();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            ...(ALLOWED_HOSTS.length > 0
              ? { enableDnsRebindingProtection: true, allowedHosts: ALLOWED_HOSTS }
              : {}),
          });
          res.on("close", () => {
            void transport.close();
            void server.close();
          });
          await server.connect(transport);
          await transport.handleRequest(req, res, body);
        } catch (error) {
          console.error("Request error:", error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end();
          }
        }
        return;
      }

      res.statusCode = 405;
      res.end();
    });

    httpServer.listen(port, () => {
      console.error(
        `MCP server (HTTP) listening on http://localhost:${port}/mcp`
      );
    });

    // Graceful shutdown: stop accepting connections, then exit cleanly.
    const shutdown = () => {
      console.error("Shutting down...");
      httpServer.close(() => process.exit(0));
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } else {
    const server = createServer();
    await server.connect(new StdioServerTransport());
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
