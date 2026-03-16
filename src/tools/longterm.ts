/**
 * Long-term memory file for PPAgent.
 * Stored under .agents/longterm.md at the project root.
 *
 * The idea is:
 * - The agent can ALWAYS read this file to respect persistent instructions.
 * - When the user asks to "save to longterm", the agent appends a new entry.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Tool } from "./types.js";
import { logTool } from "../logger.js";

const ROOT = process.cwd();
const LONGTERM_DIR = ".agents";
const LONGTERM_FILE = "longterm.md";

function getLongtermPath(): string {
  return path.join(ROOT, LONGTERM_DIR, LONGTERM_FILE);
}

async function ensureLongtermFile(): Promise<void> {
  const dir = path.join(ROOT, LONGTERM_DIR);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(getLongtermPath());
  } catch {
    const header = "# PPAgent long-term memory\n\n";
    await fs.writeFile(getLongtermPath(), header, "utf-8");
  }
}

async function readLongterm(_args: Record<string, unknown>): Promise<string> {
  logTool("read_longterm_memory", "invoked");
  try {
    await ensureLongtermFile();
    const content = await fs.readFile(getLongtermPath(), "utf-8");
    logTool("read_longterm_memory", "ok", { bytes: content.length });
    return content;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logTool("read_longterm_memory", "error", { error: msg });
    return `Error: ${msg}`;
  }
}

async function appendLongterm(args: Record<string, unknown>): Promise<string> {
  const note = args.note as string;
  if (typeof note !== "string" || note.trim() === "") {
    logTool("append_longterm_memory", "Error: note required");
    return "Error: 'note' (non-empty string) is required.";
  }
  logTool("append_longterm_memory", "invoked", { noteLength: note.length });
  try {
    await ensureLongtermFile();
    const ts = new Date().toISOString();
    const line = `\n## ${ts}\n\n${note.trim()}\n`;
    await fs.appendFile(getLongtermPath(), line, "utf-8");
    logTool("append_longterm_memory", "ok", { noteLength: note.length });
    return "Saved to long-term memory.";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logTool("append_longterm_memory", "error", { error: msg });
    return `Error: ${msg}`;
  }
}

export const longtermTools: Tool[] = [
  {
    definition: {
      type: "function",
      function: {
        name: "read_longterm_memory",
        description:
          "Read the agent's global long-term memory from .agents/longterm.md. Use this to respect persistent user instructions and facts.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    handler: readLongterm,
  },
  {
    definition: {
      type: "function",
      function: {
        name: "append_longterm_memory",
        description:
          "Append a new entry to the global long-term memory file (.agents/longterm.md). Use when the user explicitly asks to save something in longterm memory.",
        parameters: {
          type: "object",
          properties: {
            note: {
              type: "string",
              description:
                "The text to store in long-term memory, e.g. user preferences, standing instructions, or important facts.",
            },
          },
          required: ["note"],
        },
      },
    },
    handler: appendLongterm,
  },
];

