#!/usr/bin/env node

// This is the entry point of our CLI tool.
// "Entry point" = the first file that runs when someone uses our command.

import { Command } from "commander";
import { askQuestions, ProjectAnswers } from "./prompts.js";
import { generateServer } from "./generator.js";

// "Command" helps us define our CLI: its name, version, and what it does.
const program = new Command();

program
  .name("create-mcp-server")
  .description("Generate a ready-to-run MCP server in seconds.")
  .version("0.1.0");

// .action() = the code that runs when someone types our command.
// It is "async" because asking questions and writing files takes time.
program.action(async () => {
  console.log("");
  console.log("  Welcome to create-mcp-server!");
  console.log("");

  // Ask the questions and wait for the user's answers.
  const answers = await askQuestions();

  console.log("");
  console.log(`  Creating your ${answers.language} MCP server...`);

  try {
    // Turn the answers into a real folder on disk.
    const targetDir = await generateServer(answers);

    console.log("");
    console.log("  Done! Your MCP server was created at:");
    console.log(`    ${targetDir}`);
    console.log("");
    printNextSteps(answers);
  } catch (error) {
    // If anything goes wrong, show a clear message and exit with failure.
    console.error("");
    console.error("  Could not create the server:");
    console.error(`    ${(error as Error).message}`);
    console.error("");
    process.exit(1);
  }
});

// Print the commands the user should run next, based on their language.
function printNextSteps(answers: ProjectAnswers): void {
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

// .parse() reads what the user typed and runs the matching action.
program.parse();
