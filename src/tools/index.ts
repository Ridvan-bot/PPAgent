import { Tool } from "./types.js";
import { fileTools } from "./files.js";
import { runTool } from "./run.js";
import { longtermTools } from "./longterm.js";

export type { Tool, ToolDefinition, ToolHandler } from "./types.js";
export { fileTools, runTool, longtermTools };

/** All built-in tools. Skills can add more. */
export const builtinTools: Tool[] = [...fileTools, ...longtermTools, runTool];
