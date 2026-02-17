/**
 * Tool: run_command – run a shell command and return stdout/stderr.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Tool } from "./types.js";
import { logTool } from "../logger.js";

const execAsync = promisify(exec);

async function runCommand(args: Record<string, unknown>): Promise<string> {
  const command = args.command as string;
  if (!command || typeof command !== "string") {
    logTool("run_command", "Error: command required");
    return "Error: 'command' (string) is required.";
  }
  logTool("run_command", "run_command", { command });
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 2 * 1024 * 1024,
    });
    const out = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n--- stderr ---\n");
    logTool("run_command", "ok", { command, stdoutLength: stdout.length, stderrLength: stderr.length });
    return out || "(no output)";
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    const out = [err.stdout, err.stderr].filter(Boolean).join("\n");
    logTool("run_command", "error", { command, error: err.message ?? String(e) });
    return `Error: ${err.message ?? e}\n${out}`;
  }
}

export const runTool: Tool = {
  definition: {
    type: "function",
    function: {
      name: "run_command",
      description: "Run a shell command in the project directory. Use for running scripts, tests, or shell tools.",
      parameters: {
        type: "object",
        properties: { command: { type: "string", description: "Shell command to run" } },
        required: ["command"],
      },
    },
  },
  handler: runCommand,
};
