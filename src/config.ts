/**
 * Load config from environment. No secrets in code.
 */

export interface Config {
  apiKey: string;
  baseURL?: string;
  model: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY (or ANTHROPIC_API_KEY). Set it in .env or the environment."
    );
  }
  const baseURL = process.env.OPENAI_BASE_URL;
  const config: Config = {
    apiKey,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
  if (baseURL !== undefined && baseURL !== "") config.baseURL = baseURL;
  return config;
}
