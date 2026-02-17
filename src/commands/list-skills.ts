#!/usr/bin/env node
/**
 * List installed skills. Usage: npm run agent:skills
 */

import { loadAllSkills } from "../skills/loader.js";
import { logCommand, logError } from "../logger.js";

async function main(): Promise<void> {
  logCommand("agent:skills started");
  const skills = await loadAllSkills();
  logCommand("agent:skills list", { count: skills.length });
  if (skills.length === 0) {
    console.log("No skills installed. Add folders under skills/ or run npm run agent:install -- <path>");
    return;
  }
  console.log("Installed skills:\n");
  for (const s of skills) {
    console.log("  ", s.meta.name);
    console.log("    ", s.meta.description);
    if (s.tools.length) console.log("    tools:", s.tools.map((t) => t.definition.function.name).join(", "));
    console.log();
  }
}

main().catch((err) => {
  logError("agent:skills", err);
  console.error(err);
  process.exit(1);
});
