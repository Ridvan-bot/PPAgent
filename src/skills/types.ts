/**
 * Skill format for PPAgent. Supports both project skills and Cursor-style SKILL.md.
 */

import type { Tool } from "../tools/types.js";

export interface SkillMeta {
  name: string;
  description: string;
}

/** A loaded skill: metadata + optional tools and system prompt fragment. */
export interface LoadedSkill {
  meta: SkillMeta;
  systemPrompt?: string;
  tools: Tool[];
}
