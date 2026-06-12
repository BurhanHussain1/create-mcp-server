// This file's job: take the user's answers and create a real server folder
// by copying a template and filling in every {{blank}}.

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { ProjectAnswers } from "./prompts.js";

// Work out where THIS file lives on disk, so we can find the templates folder.
// (In ES modules there is no built-in __dirname, so we build it ourselves.)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// templates/ sits one level up from this file (works in both src/ and dist/).
const TEMPLATES_ROOT = path.join(__dirname, "..", "templates");

// Replace every {{blank}} in a piece of text with the user's answers.
function fillBlanks(text: string, answers: ProjectAnswers): string {
  return text
    .replaceAll("{{serverName}}", answers.name)
    .replaceAll("{{toolName}}", answers.toolName);
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
  answers: ProjectAnswers
): Promise<void> {
  // Make sure the destination folder exists.
  await fs.mkdir(toDir, { recursive: true });

  // List everything inside the template folder.
  const entries = await fs.readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const fromPath = path.join(fromDir, entry.name);
    const toPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      // It's a folder → copy its insides too.
      await copyAndFill(fromPath, toPath, answers);
    } else {
      // It's a file → read it, fill the blanks, write the new copy.
      const original = await fs.readFile(fromPath, "utf8");
      const filled = fillBlanks(original, answers);
      await fs.writeFile(toPath, filled, "utf8");
    }
  }
}

// The main function the CLI calls. Returns the path of the created folder.
export async function generateServer(answers: ProjectAnswers): Promise<string> {
  // 1. Pick the template folder for the chosen language.
  const templateDir = path.join(TEMPLATES_ROOT, answers.language);

  // 2. The new server goes in a folder named after it, in the user's
  //    current directory (wherever they ran the command).
  const targetDir = path.resolve(process.cwd(), answers.name);

  // 3. Safety check: never overwrite something that already exists.
  if (await pathExists(targetDir)) {
    throw new Error(
      `A folder named "${answers.name}" already exists here. ` +
        `Choose a different name or remove that folder first.`
    );
  }

  // 4. Copy the template into the new folder, filling in the blanks.
  await copyAndFill(templateDir, targetDir, answers);

  return targetDir;
}
