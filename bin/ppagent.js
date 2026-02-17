#!/usr/bin/env node
/**
 * PPAgent CLI. Run: ppagent start (or ppagent start "fråga")
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "src", "cli.ts");

const subcommand = process.argv[2];

if (subcommand === "start") {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, ...process.argv.slice(3)],
    { stdio: "inherit", cwd: projectRoot, env: process.env }
  );
  process.exit(result.status ?? (result.signal ? 1 : 0));
} else {
  console.log("PPAgent");
  console.log("");
  console.log("Usage:");
  console.log("  ppagent start              Interaktiv chat");
  console.log("  ppagent start \"fråga\"     Enskild fråga");
  console.log("");
  console.log("Andra kommandon: npm run agent:skills  npm run agent:install");
  process.exit(subcommand === "--help" || subcommand === "-h" ? 0 : 1);
}
