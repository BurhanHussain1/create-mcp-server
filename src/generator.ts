// This file's job: create a real server folder by copying a template
// and filling in every {{blank}}.

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { ProjectAnswers } from "./prompts.js";
import { ParsedApi } from "./openapi.js";

// Work out where THIS file lives on disk, so we can find the templates folder.
// (In ES modules there is no built-in __dirname, so we build it ourselves.)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// templates/ sits one level up from this file (works in both src/ and dist/).
const TEMPLATES_ROOT = path.join(__dirname, "..", "templates");

// Replace every {{key}} in the text with its matching value.
// e.g. given { serverName: "weather" }, turns {{serverName}} into "weather".
function fillBlanks(
  text: string,
  replacements: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// Small helper: does a file or folder already exist?
async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

// Copy one folder into another, filling blanks in every file as we go.
// This calls itself for sub-folders ("recursion"), so nested folders
// like src/ are copied too.
async function copyAndFill(
  fromDir: string,
  toDir: string,
  replacements: Record<string, string>
): Promise<void> {
  await fs.mkdir(toDir, { recursive: true });
  const entries = await fs.readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const fromPath = path.join(fromDir, entry.name);
    const toPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyAndFill(fromPath, toPath, replacements);
    } else {
      const original = await fs.readFile(fromPath, "utf8");
      await fs.writeFile(toPath, fillBlanks(original, replacements), "utf8");
    }
  }
}

// Read a template folder INTO MEMORY: returns a map of relative-path -> content
// (with blanks already filled). Used by the studio, which builds a zip in
// memory instead of writing to disk.
async function readTemplateFiles(
  fromDir: string,
  baseDir: string,
  replacements: Record<string, string>
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const entries = await fs.readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const fromPath = path.join(fromDir, entry.name);
    if (entry.isDirectory()) {
      const sub = await readTemplateFiles(fromPath, baseDir, replacements);
      for (const [rel, content] of sub) files.set(rel, content);
    } else {
      // Use forward slashes for the path inside the zip (works everywhere).
      const rel = path.relative(baseDir, fromPath).split(path.sep).join("/");
      const original = await fs.readFile(fromPath, "utf8");
      files.set(rel, fillBlanks(original, replacements));
    }
  }
  return files;
}

// Shared: create a project from a template folder, filling in the blanks.
async function createFromTemplate(
  templateName: string,
  serverName: string,
  replacements: Record<string, string>
): Promise<string> {
  const templateDir = path.join(TEMPLATES_ROOT, templateName);
  const targetDir = path.resolve(process.cwd(), serverName);

  // Safety check: never overwrite something that already exists.
  if (await pathExists(targetDir)) {
    throw new Error(
      `A folder named "${serverName}" already exists here. ` +
        `Choose a different name or remove that folder first.`
    );
  }

  await copyAndFill(templateDir, targetDir, replacements);
  return targetDir;
}

// SCAFFOLD mode: a starter server with one example tool.
export async function generateServer(answers: ProjectAnswers): Promise<string> {
  return createFromTemplate(answers.language, answers.name, {
    serverName: answers.name,
    toolName: answers.toolName,
  });
}

// IMPORT mode: a TypeScript server with one tool per API endpoint.
export async function generateApiServer(
  serverName: string,
  api: ParsedApi
): Promise<string> {
  // The generated server stores its endpoints as a small data array.
  const operations = api.operations.map((op) => ({
    name: op.toolName,
    description: op.description,
    method: op.method.toUpperCase(),
    path: op.path,
    params: op.params,
    hasBody: op.hasBody,
  }));

  return createFromTemplate("openapi-typescript", serverName, {
    serverName,
    baseUrl: api.baseUrl,
    // Embed the operations as JSON — which is valid TypeScript for an array.
    operations: JSON.stringify(operations, null, 2),
  });
}

// A single input (parameter) of a tool.
export interface ToolInput {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

// A tool the user designed in the visual studio.
export interface VisualTool {
  name: string;
  description: string;
  inputs: ToolInput[];
}

// A whole server the user designed in the visual studio.
export interface VisualSpec {
  name: string;
  language?: "typescript" | "python";
  tools: VisualTool[];
}

// Map a studio input type to a Python type hint.
function pythonType(type: ToolInput["type"]): string {
  if (type === "number") return "float";
  if (type === "boolean") return "bool";
  return "str";
}

// Turn a description into a safe Python triple-quoted docstring.
function pythonDocstring(text: string): string {
  const safe = (text || "").replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');
  return `"""${safe}"""`;
}

// Render the studio's tools as Python FastMCP functions. Python requires
// parameters WITHOUT defaults to come before those WITH defaults, so required
// inputs are emitted first.
function renderPythonTools(tools: VisualTool[]): string {
  return tools
    .map((tool) => {
      const ordered = [
        ...tool.inputs.filter((i) => i.required),
        ...tool.inputs.filter((i) => !i.required),
      ];
      const signature = ordered
        .map((i) =>
          i.required
            ? `${i.name}: ${pythonType(i.type)}`
            : `${i.name}: ${pythonType(i.type)} | None = None`
        )
        .join(", ");
      const argsDict = ordered.map((i) => `"${i.name}": ${i.name}`).join(", ");
      return [
        `@mcp.tool()`,
        `def ${tool.name}(${signature}) -> str:`,
        `    ${pythonDocstring(tool.description || tool.name)}`,
        `    args = {${argsDict}}`,
        `    # TODO: replace this with your real logic.`,
        `    return (`,
        `        f"Tool '${tool.name}' was called with: {args}\\n\\n"`,
        `        "Edit server.py to make this tool do something real."`,
        `    )`,
      ].join("\n");
    })
    .join("\n\n\n");
}

// STUDIO mode: build the server files IN MEMORY (no disk writes) so the web
// app can zip them up and send them to the browser. Supports TypeScript
// (data-driven) and Python (generated FastMCP functions).
export async function buildVisualServerFiles(
  spec: VisualSpec
): Promise<Map<string, string>> {
  if (spec.language === "python") {
    const dir = path.join(TEMPLATES_ROOT, "visual-python");
    return readTemplateFiles(dir, dir, {
      serverName: spec.name,
      tools: renderPythonTools(spec.tools),
    });
  }

  const dir = path.join(TEMPLATES_ROOT, "visual-typescript");
  return readTemplateFiles(dir, dir, {
    serverName: spec.name,
    tools: JSON.stringify(spec.tools, null, 2),
  });
}
