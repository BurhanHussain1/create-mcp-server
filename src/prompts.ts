// This file's only job: ask the user questions and return their answers.
// Keeping it separate from index.ts keeps each file focused on one task.

import prompts from "prompts";

// The two ways to build a server.
export type Mode = "scaffold" | "import";

// Answers for the "start from scratch" flow.
export interface ProjectAnswers {
  name: string;
  language: "typescript" | "python";
  toolName: string;
}

// Answers for the "import from OpenAPI" flow.
export interface ImportAnswers {
  name: string;
  specSource: string;
}

// If the user presses Ctrl+C mid-way, stop nicely instead of crashing.
const onCancel = () => {
  console.log("\n  Cancelled. No files were created.");
  process.exit(0);
};

// A reusable "server name" question (used by both flows).
const nameQuestion: prompts.PromptObject = {
  type: "text",
  name: "name",
  message: "What is your MCP server's name?",
  initial: "my-mcp-server",
  // A server name becomes a folder + package name, so keep it safe:
  // lowercase letters/numbers/hyphens, starting with a letter.
  validate: (value: string) =>
    /^[a-z][a-z0-9-]*$/.test(value)
      ? true
      : "Use lowercase letters, numbers, and hyphens only (e.g. my-mcp-server).",
};

// First question: which flow does the user want?
export async function askMode(): Promise<Mode> {
  const { mode } = await prompts(
    {
      type: "select",
      name: "mode",
      message: "How do you want to build your MCP server?",
      choices: [
        { title: "Start from scratch (a starter template)", value: "scaffold" },
        {
          title: "Import from an OpenAPI spec (one tool per endpoint)",
          value: "import",
        },
      ],
      initial: 0,
    },
    { onCancel }
  );
  return mode as Mode;
}

// "Start from scratch" flow: name, language, sample tool.
export async function askScaffoldQuestions(): Promise<ProjectAnswers> {
  const answers = await prompts(
    [
      nameQuestion,
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
        // A tool name becomes a Python function name, so it must be a valid
        // identifier: letters/numbers/underscores, no spaces or hyphens.
        validate: (value: string) =>
          /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
            ? true
            : "Use a valid name: letters, numbers, underscores; no spaces or hyphens (e.g. say_hello).",
      },
    ],
    { onCancel }
  );
  return answers as ProjectAnswers;
}

// "Import from OpenAPI" flow: name and the spec location.
export async function askImportQuestions(): Promise<ImportAnswers> {
  const answers = await prompts(
    [
      nameQuestion,
      {
        type: "text",
        name: "specSource",
        message: "Path or URL to the OpenAPI spec (JSON or YAML):",
        validate: (value: string) =>
          value.trim().length > 0
            ? true
            : "Please provide a file path or URL.",
      },
    ],
    { onCancel }
  );
  return answers as ImportAnswers;
}
