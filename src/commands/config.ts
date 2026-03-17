#!/usr/bin/env node
/**
 * ppagent config
 *
 * Enkel konfigurationsdialog för LLM-modell.
 * Just nu stöds bara OpenAI-kompatibla modeller via OPENAI_API_KEY + OPENAI_MODEL i .env.
 */

import "dotenv/config";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import inquirer from "inquirer";

async function ensureEnvFile(): Promise<string> {
  const envPath = path.join(process.cwd(), ".env");
  try {
    await fs.access(envPath);
  } catch {
    await fs.writeFile(envPath, "", "utf-8");
  }
  return envPath;
}

async function readEnv(envPath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(envPath, "utf-8");
    return content.split(/\r?\n/);
  } catch {
    return [];
  }
}

function updateEnvLines(lines: string[], key: string, value: string): string[] {
  const newLine = `${key}=${value}`;
  let found = false;
  const updated = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const [k] = trimmed.split("=", 1);
    if (k === key) {
      found = true;
      return newLine;
    }
    return line;
  });
  if (!found) {
    updated.push(newLine);
  }
  // Trim tomma rader i slutet
  while (updated.length > 0 && updated[updated.length - 1].trim() === "") {
    updated.pop();
  }
  return updated;
}

async function main(): Promise<void> {
  const envPath = await ensureEnvFile();
  const lines = await readEnv(envPath);

  const currentModel =
    process.env.OPENAI_MODEL ||
    (lines
      .map((line) => line.trim())
      .find((line) => line.startsWith("OPENAI_MODEL="))
      ?.split("=", 2)[1] ?? "");

  const currentApiKey =
    process.env.OPENAI_API_KEY ||
    (lines
      .map((line) => line.trim())
      .find((line) => line.startsWith("OPENAI_API_KEY="))
      ?.split("=", 2)[1] ?? "");

  const presetModels = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1",
    "gpt-4.1-mini",
    "o3-mini",
  ];

  console.log("PPAgent – konfiguration");
  console.log("");

  const { configureLLM } = await inquirer.prompt<{ configureLLM: boolean }>([
    {
      type: "confirm",
      name: "configureLLM",
      message: "Vill du konfigurera LLM (modell + OpenAI API-nyckel) nu?",
      default: true,
    },
  ]);

  if (!configureLLM) {
    console.log("Ingen förändring gjord. LLM-konfigurationen lämnades oförändrad.");
    return;
  }

  console.log("Endast OpenAI-kompatibla modeller stöds just nu.");
  console.log("Välj en modell genom att markera med [space] och bekräfta med [enter].");
  console.log("");
  console.log(`Nuvarande OPENAI_MODEL: ${currentModel || "(inte satt)"}`);
  console.log(`OPENAI_API_KEY: ${currentApiKey ? "(redan satt)" : "(inte satt)"}`);
  console.log("");

  const choices = [
    ...presetModels.map((m) => ({
      name: m,
      value: m,
      short: m,
    })),
    { name: "Ange egen modellsträng…", value: "__custom__", short: "custom" },
  ];

  const { model } = await inquirer.prompt<{
    model: string;
  }>([
    {
      type: "list",
      name: "model",
      message: "Välj modell (piltangenter = välj, enter = bekräfta):",
      choices,
      default:
        currentModel && presetModels.includes(currentModel)
          ? presetModels.indexOf(currentModel)
          : 0,
    },
  ]);

  const picked = model;

  let selectedModel = "";

  if (picked === "__custom__") {
    const { custom } = await inquirer.prompt<{ custom: string }>([
      {
        type: "input",
        name: "custom",
        message: "Ange modellnamn exakt som din provider förväntar sig:",
        validate: (value: string) =>
          value.trim() === "" ? "Modellnamn får inte vara tomt." : true,
      },
    ]);
    selectedModel = custom.trim();
  } else {
    selectedModel = picked;
  }

  if (!selectedModel) {
    console.log("Ingen modell vald. Avbryter utan ändring.");
    return;
  }

  const { apiKeyInput } = await inquirer.prompt<{ apiKeyInput: string }>([
    {
      type: "password",
      name: "apiKeyInput",
      message: currentApiKey
        ? "Ny OpenAI API-nyckel (lämna tomt för att behålla befintlig):"
        : "Ange din OpenAI API-nyckel (OPENAI_API_KEY):",
      mask: "*",
      validate: (value: string) => {
        if (!currentApiKey && value.trim() === "") {
          return "API-nyckeln får inte vara tom när ingen nyckel finns sedan tidigare.";
        }
        return true;
      },
    },
  ]);

  const finalApiKey = apiKeyInput.trim() !== "" ? apiKeyInput.trim() : currentApiKey;

  let newLines = updateEnvLines(lines, "OPENAI_MODEL", selectedModel);
  if (finalApiKey) {
    newLines = updateEnvLines(newLines, "OPENAI_API_KEY", finalApiKey);
  }

  await fs.writeFile(envPath, newLines.join("\n") + "\n", "utf-8");

  console.log("");
  console.log(`Uppdaterade ${path.relative(process.cwd(), envPath)} med:`);
  console.log(`OPENAI_MODEL=${selectedModel}`);
  if (finalApiKey) {
    console.log("OPENAI_API_KEY=(satt)");
  }
}

main().catch((err) => {
  console.error("Kunde inte uppdatera konfigurationen:", err);
  process.exit(1);
});

