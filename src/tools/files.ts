/**
 * File tools: read_file, write_file, list_dir.
 * Paths are resolved relative to cwd; no escaping above cwd.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Tool } from "./types.js";
import { logTool } from "../logger.js";

const ROOT = process.cwd();

function resolveSafe(filePath: string): string {
  const resolved = path.resolve(ROOT, filePath);
  if (!resolved.startsWith(ROOT)) {
    throw new Error(`Path outside project: ${filePath}`);
  }
  return resolved;
}

async function readFile(args: Record<string, unknown>): Promise<string> {
  const filePath = args.path as string;
  if (!filePath || typeof filePath !== "string") {
    logTool("read_file", "Error: path required");
    return "Error: 'path' (string) is required.";
  }
  logTool("read_file", "invoked", { path: filePath });
  try {
    const p = resolveSafe(filePath);
    const content = await fs.readFile(p, "utf-8");
    logTool("read_file", "ok", { path: filePath, bytes: content.length });
    return content;
  } catch (e) {
    logTool("read_file", "error", { path: filePath, error: e instanceof Error ? e.message : String(e) });
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function writeFile(args: Record<string, unknown>): Promise<string> {
  const filePath = args.path as string;
  const content = args.content as string;
  if (!filePath || typeof filePath !== "string") {
    logTool("write_file", "Error: path required");
    return "Error: 'path' (string) is required.";
  }
  if (typeof content !== "string") {
    logTool("write_file", "Error: content required");
    return "Error: 'content' (string) is required.";
  }
  logTool("write_file", "write_file", { path: filePath, contentLength: content.length });
  try {
    const p = resolveSafe(filePath);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, content, "utf-8");
    logTool("write_file", "ok", { path: filePath });
    return `Wrote ${filePath}`;
  } catch (e) {
    logTool("write_file", "error", { path: filePath, error: e instanceof Error ? e.message : String(e) });
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function listDir(args: Record<string, unknown>): Promise<string> {
  const dirPath = (args.path as string) ?? ".";
  logTool("list_dir", "list_dir", { path: dirPath });
  try {
    const p = resolveSafe(dirPath);
    const entries = await fs.readdir(p, { withFileTypes: true });
    const lines = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    logTool("list_dir", "ok", { path: dirPath, entryCount: entries.length });
    return lines.join("\n");
  } catch (e) {
    logTool("list_dir", "error", { path: dirPath, error: e instanceof Error ? e.message : String(e) });
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export const fileTools: Tool[] = [
  {
    definition: {
      type: "function",
      function: {
        name: "read_file",
        description: "Read the full text content of a file. Path is relative to project root.",
        parameters: {
          type: "object",
          properties: { path: { type: "string", description: "Relative file path" } },
          required: ["path"],
        },
      },
    },
    handler: readFile,
  },
  {
    definition: {
      type: "function",
      function: {
        name: "write_file",
        description: "Write text content to a file. Creates parent directories if needed.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Relative file path" },
            content: { type: "string", description: "Content to write" },
          },
          required: ["path", "content"],
        },
      },
    },
    handler: writeFile,
  },
  {
    definition: {
      type: "function",
      function: {
        name: "list_dir",
        description: "List files and directories in a path. Path is relative to project root.",
        parameters: {
          type: "object",
          properties: { path: { type: "string", description: "Directory path (default: .)" } },
        },
      },
    },
    handler: listDir,
  },
];
