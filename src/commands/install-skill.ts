#!/usr/bin/env node
/**
 * Install a skill: copy source into project skills/ folder.
 * Usage: npm run agent:install -- <path-to-skill-dir>
 * Or: npm run agent:install -- <skill-name> (to create from template)
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { logCommand, logError } from "../logger.js";

const PROJECT_SKILLS = path.join(process.cwd(), "skills");

async function main(): Promise<void> {
  const arg = process.argv[2];
  logCommand("agent:install started", { arg });
  if (!arg) {
    console.log("Usage: npm run agent:install -- <path-to-skill-dir>");
    console.log("  The skill folder should contain skill.json or SKILL.md (Cursor format).");
    process.exit(1);
  }

  const src = path.resolve(process.cwd(), arg);
  const stat = await fs.stat(src).catch(() => null);
  if (!stat?.isDirectory()) {
    logCommand("agent:install failed: not a directory", { src });
    console.error("Not a directory:", src);
    process.exit(1);
  }

  const name = path.basename(src);
  const dest = path.join(PROJECT_SKILLS, name);
  await fs.mkdir(PROJECT_SKILLS, { recursive: true });
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const destPath = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
  logCommand("skill installed", { name, dest });
  console.log("Installed skill:", name, "->", dest);
}

async function copyDir(srcDir: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(srcDir, e.name);
    const destPath = path.join(destDir, e.name);
    if (e.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

main().catch((err) => {
  logError("agent:install", err);
  console.error(err);
  process.exit(1);
});
