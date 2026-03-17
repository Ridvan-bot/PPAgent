#!/usr/bin/env node
/**
 * PPAgent CLI.
 *
 * Kommandon:
 *   ppagent start             – interaktiv chat (eller ppagent start "fråga")
 *   ppagent skills            – lista installerade skills
 *   ppagent install           – installera en skill (frågar efter namn/källa)
 *   ppagent config            – konfigurera LLM-modell (OPENAI_MODEL i .env)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "src", "cli.ts");
const tuiPath = path.join(projectRoot, "src", "tui.tsx");
const skillsPath = path.join(projectRoot, "src", "commands", "list-skills.ts");
const installPath = path.join(projectRoot, "src", "commands", "install-skill.ts");
const configPath = path.join(projectRoot, "src", "commands", "config.ts");

const subcommand = process.argv[2];

function runTsx(targetPath, extraArgs = []) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", targetPath, ...extraArgs],
    { stdio: "inherit", cwd: projectRoot, env: process.env }
  );
  process.exit(result.status ?? (result.signal ? 1 : 0));
}

switch (subcommand) {
  case "start": {
    // ppagent start  /  ppagent start "fråga"
    runTsx(cliPath, process.argv.slice(3));
    break;
  }
  case "tui": {
    // ppagent tui – TUI-baserad chat
    runTsx(tuiPath, process.argv.slice(3));
    break;
  }
  case "skills": {
    // ppagent skills
    runTsx(skillsPath, process.argv.slice(3));
    break;
  }
  case "install": {
    // ppagent install
    runTsx(installPath, process.argv.slice(3));
    break;
  }
  case "config": {
    // ppagent config
    runTsx(configPath, process.argv.slice(3));
    break;
  }
  default: {
    console.log("PPAgent");
    console.log("");
    console.log("Usage:");
    console.log("  ppagent start              Interaktiv chat");
    console.log("  ppagent start \"fråga\"     Enskild fråga");
    console.log("  ppagent tui                TUI-baserad chat");
    console.log("  ppagent skills             Lista installerade skills");
    console.log("  ppagent install            Installera en skill");
    console.log("  ppagent config             Konfigurera LLM-modell (OPENAI_MODEL i .env)");
    console.log("");
    console.log("Exempel:");
    console.log("  ppagent start");
    console.log("  ppagent start \"hjälp mig med min kod\"");
    console.log("  ppagent skills");
    console.log("  ppagent install");
    process.exit(
      subcommand === "--help" || subcommand === "-h" || subcommand === undefined ? 0 : 1
    );
  }
}
