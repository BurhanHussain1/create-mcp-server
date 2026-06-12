// This file's only job: ask the user questions and return their answers.
// Keeping it separate from index.ts keeps each file focused on one task.

import prompts from "prompts";

// This describes the SHAPE of the answers we expect to collect.
// TypeScript uses it to catch mistakes (e.g. a typo in "language").
export interface ProjectAnswers {
  name: string;
  language: "typescript" | "python";
  toolName: string;
}

export async function askQuestions(): Promise<ProjectAnswers> {
  // If the user presses Ctrl+C mid-way, stop nicely instead of crashing.
  const onCancel = () => {
    console.log("\n  Cancelled. No files were created.");
    process.exit(0);
  };

  const answers = await prompts(
    [
      {
        type: "text",
        name: "name",
        message: "What is your MCP server's name?",
        initial: "my-mcp-server",
      },
      {
        type: "select",
        name: "language",
        message: "Which language do you want?",
        choices: [
          { title: "TypeScript", value: "typescript" },
          { title: "Python", value: "python" },
        ],
        initial: 0,
      },
      {
        type: "text",
        name: "toolName",
        message: "Name one sample tool to include:",
        initial: "say_hello",
      },
    ],
    { onCancel }
  );

  return answers as ProjectAnswers;
}
