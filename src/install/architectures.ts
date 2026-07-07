/**
 * Application architecture styles a user can pick at install time. The choice is
 * persisted in nest-boost.json and drives which architecture guideline and skill
 * are composed/installed, so the agent follows the project's chosen structure.
 * Adding a style = one entry here + its guideline + skill folder.
 */
export interface Architecture {
  id: string;
  label: string;
  /** One-line description shown in the install prompt. */
  description: string;
  /** Guideline file relative to resources/guidelines (composed into the guidelines). */
  guideline: string;
  /** Skill folder under resources/skills installed for this style. */
  skill: string;
}

export const ARCHITECTURES: Architecture[] = [
  {
    id: "standard",
    label: "Standard (layered modules)",
    description: "Classic Nest: feature modules with controller → service → repository.",
    guideline: "architecture/standard.md",
    skill: "architecture-standard",
  },
  {
    id: "cqrs",
    label: "CQRS",
    description: "@nestjs/cqrs: commands, queries, events, handlers, and sagas.",
    guideline: "architecture/cqrs.md",
    skill: "architecture-cqrs",
  },
  {
    id: "hexagonal",
    label: "Hexagonal (ports & adapters)",
    description: "Domain/application/infrastructure layers with ports and adapters.",
    guideline: "architecture/hexagonal.md",
    skill: "architecture-hexagonal",
  },
];

export const DEFAULT_ARCHITECTURE = "standard";

export function architectureById(id: string): Architecture | undefined {
  return ARCHITECTURES.find((a) => a.id === id);
}
