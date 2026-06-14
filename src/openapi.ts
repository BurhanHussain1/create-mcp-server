// This file's job: read an OpenAPI spec and boil it down to a simple list
// of "operations" — one per API endpoint — that we can turn into MCP tools.

import SwaggerParser from "@apidevtools/swagger-parser";

// One parameter of an endpoint (a path or query parameter).
export interface ApiParam {
  name: string;
  in: "path" | "query"; // where it goes in the request
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

// One API endpoint, simplified into just what we need to build a tool.
export interface ApiOperation {
  toolName: string; // a safe name, e.g. "getPetById"
  description: string; // human-friendly description
  method: string; // "get", "post", "put", "patch", "delete"
  path: string; // e.g. "/pets/{petId}"
  params: ApiParam[]; // path + query parameters, with their types
  hasBody: boolean; // does this endpoint send a JSON body?
}

// The whole API, simplified.
export interface ParsedApi {
  title: string;
  baseUrl: string;
  operations: ApiOperation[];
}

// Make a safe tool name. Prefer the spec's operationId; otherwise build one
// from the method and path (e.g. GET /pets/{id} -> "get_pets_id").
function toToolName(
  operationId: string | undefined,
  method: string,
  path: string
): string {
  if (operationId) {
    return operationId.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  const cleanedPath = path
    .replace(/[{}]/g, "") // drop the { } around path params
    .replace(/[^a-zA-Z0-9]+/g, "_") // turn slashes etc. into underscores
    .replace(/^_+|_+$/g, ""); // trim leading/trailing underscores
  return `${method}_${cleanedPath}`.toLowerCase();
}

// Map an OpenAPI parameter's JSON-schema type to our simple type set.
function toParamType(schema: any): "string" | "number" | "boolean" {
  const t = schema?.type;
  if (t === "integer" || t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "string";
}

// The HTTP methods we care about.
const METHODS = ["get", "post", "put", "patch", "delete"];

export async function parseOpenApi(
  source: string | object
): Promise<ParsedApi> {
  // Loads JSON or YAML, from a file path OR a URL, and resolves all $refs.
  // We type it as `any` because spec shapes vary a lot; we only read a few
  // fields and keep things simple.
  const doc: any = await SwaggerParser.dereference(source as string);

  const title: string = doc.info?.title ?? "imported-api";

  // OpenAPI 3.x lists servers; we use the first one as the base URL.
  const baseUrl: string = doc.servers?.[0]?.url ?? "";

  const operations: ApiOperation[] = [];

  // Tool names must be unique; track the ones we've already used.
  const seen = new Set<string>();

  // Walk every path, then every method on that path.
  for (const [path, pathItem] of Object.entries<any>(doc.paths ?? {})) {
    for (const method of METHODS) {
      const op = pathItem[method];
      if (!op) continue; // this path doesn't support this method

      // Collect path + query parameters with their types.
      const rawParams: any[] = op.parameters ?? [];
      const params: ApiParam[] = rawParams
        .filter((p) => p.in === "path" || p.in === "query")
        .map((p) => ({
          name: p.name as string,
          in: p.in as "path" | "query",
          type: toParamType(p.schema),
          description: (p.description as string) ?? "",
          // Path params are always required; query params use their own flag.
          required: p.in === "path" ? true : Boolean(p.required),
        }));

      // Build a unique tool name (append _2, _3, ... on collision).
      const baseName = toToolName(op.operationId, method, path);
      let toolName = baseName;
      let counter = 2;
      while (seen.has(toolName)) {
        toolName = `${baseName}_${counter++}`;
      }
      seen.add(toolName);

      operations.push({
        toolName,
        description:
          op.summary || op.description || `${method.toUpperCase()} ${path}`,
        method,
        path,
        params,
        hasBody: Boolean(op.requestBody),
      });
    }
  }

  return { title, baseUrl, operations };
}
