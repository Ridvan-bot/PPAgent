/**
 * File logger for PPAgent. All activity is appended to logs/ppagent.log.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

const LOG_DIR = "logs";
const LOG_FILE = "ppagent.log";
const MAX_MESSAGE_LENGTH = 2000;

function getLogPath(): string {
  return path.join(process.cwd(), LOG_DIR, LOG_FILE);
}

function formatMessage(category: string, message: string, data?: Record<string, unknown>): string {
  const line = message.replace(/\r?\n/g, " ");
  const truncated = line.length > MAX_MESSAGE_LENGTH ? line.slice(0, MAX_MESSAGE_LENGTH) + "…" : line;
  const extra = data && Object.keys(data).length > 0 ? " " + JSON.stringify(data) : "";
  return `${new Date().toISOString()} [${category}] ${truncated}${extra}\n`;
}

async function ensureLogDir(): Promise<void> {
  const dir = path.join(process.cwd(), LOG_DIR);
  await fs.mkdir(dir, { recursive: true });
}

async function append(category: string, message: string, data?: Record<string, unknown>): Promise<void> {
  try {
    await ensureLogDir();
    const line = formatMessage(category, message, data);
    await fs.appendFile(getLogPath(), line, "utf-8");
  } catch (e) {
    process.stderr.write(`[logger] Failed to write log: ${e instanceof Error ? e.message : String(e)}\n`);
  }
}

/** Log from CLI (user input, session start/end). */
export function logCli(message: string, data?: Record<string, unknown>): void {
  append("cli", message, data).catch(() => {});
}

/** Log from agent (turns, tool calls, response). */
export function logAgent(message: string, data?: Record<string, unknown>): void {
  append("agent", message, data).catch(() => {});
}

/** Log from a tool (read_file, write_file, list_dir, run_command). */
export function logTool(toolName: string, message: string, data?: Record<string, unknown>): void {
  append("tool", message, { tool: toolName, ...data }).catch(() => {});
}

/** Log from skills loader. */
export function logSkills(message: string, data?: Record<string, unknown>): void {
  append("skills", message, data).catch(() => {});
}

/** Log from commands (install, list). */
export function logCommand(message: string, data?: Record<string, unknown>): void {
  append("command", message, data).catch(() => {});
}

/** Log errors. */
export function logError(context: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error);
  append("error", msg, { context }).catch(() => {});
}
