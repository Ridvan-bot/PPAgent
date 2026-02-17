/**
 * Tool types for the agent. Matches OpenAI-style tool definitions.
 */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
