/**
 * Load agent rules from the rules directory.
 * Rules are injected into the system prompt so the agent always adheres to them.
 * Prefers .agents/rules/ (same layout as .agents/skills/), falls back to rules/.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

const DEFAULT_FILE = "rules.md";

/** Look in .agents/rules first, then rules/ (cwd-relative). */
const RULES_DIRS = [".agents/rules", "rules"];

function getRulesDirs(): string[] {
  const cwd = process.cwd();
  return RULES_DIRS.map((d) => path.join(cwd, d));
}

/**
 * Loads rule content. Tries .agents/rules/<filename> first, then rules/<filename>.
 * Returns empty string if the file is not found in either place.
 */
export async function loadRules(filename: string = DEFAULT_FILE): Promise<string> {
  for (const dir of getRulesDirs()) {
    const filePath = path.join(dir, filename);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content.trim();
    } catch {
      continue;
    }
  }
  return "";
}

/**
 * Loads all .md files from the first existing rules directory (.agents/rules, then rules/)
 * and concatenates them in alphabetical order.
 */
export async function loadAllRules(): Promise<string> {
  for (const dir of getRulesDirs()) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const mdFiles = entries
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .map((e) => e.name)
        .sort();
      const parts: string[] = [];
      for (const name of mdFiles) {
        const filePath = path.join(dir, name);
        const content = (await fs.readFile(filePath, "utf-8")).trim();
        if (content) parts.push(content);
      }
      if (parts.length > 0) return parts.join("\n\n---\n\n");
    } catch {
      continue;
    }
  }
  return "";
}

/**
 * Format loaded rules for injection into the system prompt.
 * Returns empty string if no rules are loaded.
 */
export function formatRulesForPrompt(rulesContent: string): string {
  const trimmed = rulesContent.trim();
  if (!trimmed) return "";
  return `\n## Regler du måste följa\nFölj alltid dessa regler i dina svar och handlingar.\n\n${trimmed}\n`;
}
