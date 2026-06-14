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
    pathParams: op.pathParams,
    queryParams: op.queryParams,
    hasBody: op.hasBody,
  }));

  return createFromTemplate("openapi-typescript", serverName, {
    serverName,
    baseUrl: api.baseUrl,
    // Embed the operations as JSON — which is valid TypeScript for an array.
    operations: JSON.stringify(operations, null, 2),
  });
}
