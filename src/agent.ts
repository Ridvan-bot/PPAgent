/**
 * Agent loop: chat with LLM, execute tool calls, repeat until done.
 */

import OpenAI, { type ClientOptions } from "openai";
import type { Config } from "./config.js";
import type { Tool } from "./tools/types.js";
import { logAgent } from "./logger.js";

export type Message = OpenAI.Chat.ChatCompletionMessageParam;

export interface AgentOptions {
  config: Config;
  tools: Tool[];
  systemPrompt: string;
  maxTurns?: number;
}

function openAIClient(config: Config): OpenAI {
  const options: ClientOptions = { apiKey: config.apiKey };
  if (config.baseURL !== undefined) options.baseURL = config.baseURL;
  return new OpenAI(options);
}

export async function runAgent(
  options: AgentOptions,
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<{ content: string; messages: Message[] }> {
  const { config, tools, systemPrompt, maxTurns = 10 } = options;
  const client = openAIClient(config);
  const toolDefs = tools.map((t) => t.definition);
  const toolMap = new Map(tools.map((t) => [t.definition.function.name, t.handler]));

  const messages: Message[] = [
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  logAgent("runAgent started", { messageLength: userMessage.length, historyLength: conversationHistory.length });

  let turns = 0;
  while (turns < maxTurns) {
    turns++;
    logAgent("LLM request", { turn: turns, model: config.model });
    const body: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: config.model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    };
    if (toolDefs.length > 0) {
      body.tools = toolDefs;
      body.tool_choice = "auto";
    }
    const response = await client.chat.completions.create(body);

    const choice = response.choices[0];
    if (!choice?.message) {
      logAgent("No message in response");
      return { content: "No response from model.", messages };
    }

    const msg = choice.message;
    messages.push(msg as Message);

    const toolCalls = msg.tool_calls;
    if (!toolCalls?.length) {
      const raw = msg.content as string | Array<{ type?: string; text?: string }> | null | undefined;
      const content =
        typeof raw === "string"
          ? raw
          : Array.isArray(raw)
            ? raw.map((c) => (c.type === "text" ? c.text ?? "" : "")).join("")
            : "";
      logAgent("Agent response (final)", { turn: turns, contentLength: content.length });
      return { content: content.trim() || "(no text response)", messages };
    }

    logAgent("Tool calls", { turn: turns, count: toolCalls.length, tools: toolCalls.map((tc) => tc.function?.name) });
    for (const tc of toolCalls) {
      const name = tc.function?.name;
      const fn = name ? toolMap.get(name) : undefined;
      let result: string;
      try {
        const raw = tc.function?.arguments ?? "{}";
        const args = JSON.parse(raw) as Record<string, unknown>;
        logAgent("Tool executed", { tool: name, args: Object.keys(args) });
        result = fn ? await fn(args) : `Unknown tool: ${name}`;
        logAgent("Tool result", { tool: name, resultLength: result.length });
      } catch (e) {
        result = `Error: ${e instanceof Error ? e.message : String(e)}`;
        logAgent("Tool error", { tool: name, error: result });
      }
      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tc.id,
      } as Message);
    }
  }

  logAgent("Max turns reached");
  return {
    content: "Max turns reached. Try a shorter or simpler request.",
    messages,
  };
}