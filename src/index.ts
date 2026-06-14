#!/usr/bin/env node

// This is the entry point of our CLI tool.
// "Entry point" = the first file that runs when someone uses our command.

import { Command } from "commander";
import {
  askMode,
  askScaffoldQuestions,
  askImportQuestions,
  ProjectAnswers,
} from "./prompts.js";
import { generateServer, generateApiServer } from "./generator.js";
import { parseOpenApi } from "./openapi.js";

// "Command" helps us define our CLI: its name, version, and what it does.
const program = new Command();

program
  .name("create-mcp-server")
  .description("Generate a ready-to-run MCP server in seconds.")
  .version("0.1.0");

// .action() = the code that runs when someone types our command.
program.action(async () => {
  console.log("");
  console.log("  Welcome to create-mcp-server!");
  console.log("");

  // First, ask which flow the user wants.
  const mode = await askMode();

  try {
    if (mode === "scaffold") {
      await runScaffold();
    } else {
      await runImport();
    }
  } catch (error) {
    // If anything goes wrong, show a clear message and exit with failure.
    console.error("");
    console.error("  Could not create the server:");
    console.error(`    ${(error as Error).message}`);
    console.error("");
    process.exit(1);
  }
});

// The "start from scratch" flow.
async function runScaffold(): Promise<void> {
  const answers = await askScaffoldQuestions();

  console.log("");
  console.log(`  Creating your ${answers.language} MCP server...`);

  const targetDir = await generateServer(answers);

  console.log("");
  console.log("  Done! Your MCP server was created at:");
  console.log(`    ${targetDir}`);
  console.log("");
  printScaffoldNextSteps(answers);
}

// The "import from OpenAPI" flow.
async function runImport(): Promise<void> {
  const { name, specSource } = await askImportQuestions();

  console.log("");
  console.log("  Reading the OpenAPI spec...");

  const api = await parseOpenApi(specSource);

  console.log(
    `  Found ${api.operations.length} endpoints in "${api.title}". Generating tools...`
  );

  const targetDir = await generateApiServer(name, api);

  console.log("");
  console.log("  Done! Your MCP server was created at:");
  console.log(`    ${targetDir}`);
  console.log("");
  printImportNextSteps(name);
}

// Next steps for the scaffold flow, based on the chosen language.
function printScaffoldNextSteps(answers: ProjectAnswers): void {
  console.log("  Next steps:");
  console.log(`    cd ${answers.name}`);

  if (answers.language === "typescript") {
    console.log("    npm install");
    console.log("    npm run dev");
  } else {
    console.log("    python -m venv .venv");
    console.log("    .venv\\Scripts\\activate    (Windows)");
    console.log("    pip install -r requirements.txt");
    console.log("    python server.py");
  }
  console.log("");
}

// Next steps for the import flow (always TypeScript).
function printImportNextSteps(name: string): void {
  console.log("  Next steps:");
  console.log(`    cd ${name}`);
  console.log("    npm install");
  console.log("    npm run dev");
  console.log("");
  console.log("  Tip: set API_TOKEN if the API needs authentication.");
  console.log("");
}

// .parse() reads what the user typed and runs the matching action.
program.parse();
