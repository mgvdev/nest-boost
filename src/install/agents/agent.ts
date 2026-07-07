import { existsSync } from "node:fs";
import { join } from "node:path";

/** The key every agent registers the nest-boost MCP server under. */
export const MCP_SERVER_KEY = "nest-boost";

export interface McpConfigTarget {
  /** Project-relative JSON file to merge the server entry into. */
  file: string;
}

export interface GuidelinesTarget {
  /** Project-relative markdown file to write composed guidelines into. */
  file: string;
  /**
   * "block" — insert between nest-boost markers, preserving the rest of the file
   * (for shared files like CLAUDE.md / AGENTS.md).
   * "whole" — the file is owned entirely by nest-boost (e.g. a Cursor rule).
   */
  mode: "block" | "whole";
  /** Optional header prepended in "whole" mode (e.g. Cursor .mdc frontmatter). */
  header?: string;
}

export interface SkillsTarget {
  /** Project-relative directory to copy skill folders into. */
  dir: string;
}

/**
 * A supported coding agent. Capabilities are expressed by which optional targets
 * are present; adding a new agent is a single object literal. Mirrors Laravel
 * Boost's Agent + Supports{Mcp,Guidelines,Skills} contracts.
 */
export interface Agent {
  id: string;
  label: string;
  /** Heuristic that marks the agent as already present in a project. */
  isPresent(projectRoot: string): boolean;
  mcp?: McpConfigTarget;
  /**
   * Shown as a next step when MCP is registered via a CLI rather than a file.
   * Receives the resolved launch command (e.g. "bunx nest-boost mcp").
   */
  mcpHint?: (command: string) => string;
  guidelines?: GuidelinesTarget;
  skills?: SkillsTarget;
}

function has(projectRoot: string, ...paths: string[]): boolean {
  return paths.some((p) => existsSync(join(projectRoot, p)));
}

export const AGENTS: Agent[] = [
  {
    id: "claude",
    label: "Claude Code",
    isPresent: (root) => has(root, "CLAUDE.md", ".claude", ".mcp.json"),
    mcp: { file: ".mcp.json" },
    guidelines: { file: "CLAUDE.md", mode: "block" },
    skills: { dir: ".claude/skills" },
  },
  {
    id: "cursor",
    label: "Cursor",
    isPresent: (root) => has(root, ".cursor"),
    mcp: { file: ".cursor/mcp.json" },
    guidelines: {
      file: ".cursor/rules/nest-boost.mdc",
      mode: "whole",
      header: "---\ndescription: NestJS conventions (nest-boost)\nalwaysApply: true\n---\n",
    },
  },
  {
    id: "codex",
    label: "Codex",
    isPresent: (root) => has(root, ".codex", "AGENTS.md"),
    guidelines: { file: "AGENTS.md", mode: "block" },
    mcpHint: (command) => `codex mcp add nest-boost -- ${command}`,
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    isPresent: (root) => has(root, ".gemini"),
    mcp: { file: ".gemini/settings.json" },
    guidelines: { file: "AGENTS.md", mode: "block" },
  },
  {
    id: "generic",
    label: "Generic (AGENTS.md + .mcp.json)",
    isPresent: () => false,
    mcp: { file: ".mcp.json" },
    guidelines: { file: "AGENTS.md", mode: "block" },
  },
];

export function agentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}
