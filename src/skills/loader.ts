/**
 * Load skills from the project skills directory.
 * Each skill is a folder with skill.json (or SKILL.md for Cursor-style).
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { LoadedSkill, SkillMeta } from "./types.js";
import type { Tool } from "../tools/types.js";
import { logSkills } from "../logger.js";

const SKILLS_DIR = "skills";

function getSkillsPath(): string {
  const cwd = process.cwd();
  return path.join(cwd, SKILLS_DIR);
}

async function parseSkillMetaFromMarkdown(skillDir: string): Promise<SkillMeta | null> {
  const skillPath = path.join(skillDir, "SKILL.md");
  try {
    const raw = await fs.readFile(skillPath, "utf-8");
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;
    const front = match[1];
    const name = front.match(/name:\s*(.+)/)?.[1]?.trim() ?? path.basename(skillDir);
    const desc = front.match(/description:\s*(.+?)(?=\n[A-Za-z]|$)/s)?.[1]?.trim() ?? "";
    return { name, description: desc };
  } catch {
    return null;
  }
}

async function loadSkillDir(skillDir: string): Promise<LoadedSkill | null> {
  const name = path.basename(skillDir);
  let meta: SkillMeta = { name, description: "" };
  let systemPrompt: string | undefined;
  const tools: Tool[] = [];

  const skillJsonPath = path.join(skillDir, "skill.json");
  try {
    const data = await fs.readFile(skillJsonPath, "utf-8");
    const json = JSON.parse(data) as { name?: string; description?: string; systemPrompt?: string };
    meta = { name: json.name ?? name, description: json.description ?? "" };
    systemPrompt = json.systemPrompt;
  } catch {
    const fromMd = await parseSkillMetaFromMarkdown(skillDir);
    if (fromMd) {
      meta = fromMd;
      try {
        const mdPath = path.join(skillDir, "SKILL.md");
        const body = await fs.readFile(mdPath, "utf-8");
        const bodyOnly = body.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").trim();
        systemPrompt = bodyOnly;
      } catch {}
    }
  }

  // Optional: skill can have index.js (compiled) that exports tools and systemPrompt.
  const indexJs = path.resolve(skillDir, "index.js");
  try {
    await fs.access(indexJs);
    const mod = await import(pathToFileURL(indexJs).href) as {
      tools?: Tool[];
      systemPrompt?: string;
    };
    if (mod.tools?.length) tools.push(...mod.tools);
    if (mod.systemPrompt) systemPrompt = (systemPrompt ? systemPrompt + "\n\n" : "") + mod.systemPrompt;
  } catch {
    // no index.js
  }

  const loaded: LoadedSkill = { meta, tools };
  if (systemPrompt !== undefined && systemPrompt !== "") loaded.systemPrompt = systemPrompt;
  return loaded;
}

export async function loadAllSkills(): Promise<LoadedSkill[]> {
  const base = getSkillsPath();
  logSkills("loadAllSkills started", { base });
  try {
    const entries = await fs.readdir(base, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."));
    const loaded: LoadedSkill[] = [];
    for (const d of dirs) {
      const skill = await loadSkillDir(path.join(base, d.name));
      if (skill) {
        loaded.push(skill);
        logSkills("skill loaded", { name: skill.meta.name });
      }
    }
    logSkills("loadAllSkills finished", { count: loaded.length, names: loaded.map((s) => s.meta.name) });
    return loaded;
  } catch (e) {
    logSkills("loadAllSkills error", { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

export function getSkillsDir(): string {
  return getSkillsPath();
}

export function buildSystemPrompt(skills: LoadedSkill[], basePrompt: string): string {
  const parts = [basePrompt];
  for (const s of skills) {
    if (s.systemPrompt) {
      parts.push(`\n## Skill: ${s.meta.name}\n${s.systemPrompt}`);
    }
  }
  return parts.join("\n");
}

export function collectTools(skills: LoadedSkill[], builtinTools: Tool[]): Tool[] {
  const byName = new Map<string, Tool>();
  for (const t of builtinTools) {
    byName.set(t.definition.function.name, t);
  }
  for (const s of skills) {
    for (const t of s.tools) {
      byName.set(t.definition.function.name, t);
    }
  }
  return [...byName.values()];
}
