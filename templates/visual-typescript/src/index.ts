#!/usr/bin/env node

/**
 * {{serverName}} — an MCP server built with MCP Studio (create-mcp-server).
 * Each tool below is a starting point — add your own logic where marked TODO.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// One entry per tool you designed in the studio.
type ToolDef = {
  name: string;
  description: string;
  inputs: string[];
};

const tools: ToolDef[] = {{tools}};

const server = new McpServer({ name: "{{serverName}}", version: "0.1.0" });

for (const tool of tools) {
  // Each input you defined becomes a required string field in the schema.
  const inputSchema: Record<string, z.ZodTypeAny> = {};
  for (const input of tool.inputs) inputSchema[input] = z.string();

  server.registerTool(
    tool.name,
    { description: tool.description, inputSchema },
    async (args) => {
      const values = args as Record<string, unknown>;

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
    }
  );
}

async function main() {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
