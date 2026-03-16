import { readFile } from "node:fs/promises";
import * as path from "node:path";

/**
 * Ladda huvud-systemprompten för PPAgent från en Markdown-fil.
 * Gör det enkelt att läsa och ändra prompten utan att röra koden.
 */
export async function loadSystemPrompt(): Promise<string> {
  const p = path.join(process.cwd(), "prompts", "system-longterm.md");
  return readFile(p, "utf-8");
}

