import type { Detection } from "./detect";

/**
 * Authentication strategies a user can pick at install time. Like architecture,
 * the choice is persisted and drives an auth guideline + skill. Better Auth
 * additionally exposes a way to pull its official community skill.
 */
export interface AuthStrategy {
  id: string;
  label: string;
  description: string;
  /** Guideline file relative to resources/guidelines (omitted for "none"). */
  guideline?: string;
  /** Skill folder under resources/skills (omitted for "none"). */
  skill?: string;
  /** Command that fetches the official community skill for this strategy. */
  fetchSkillCommand?: string;
}

export const AUTH_STRATEGIES: AuthStrategy[] = [
  {
    id: "none",
    label: "None / custom",
    description: "No auth guidance installed.",
  },
  {
    id: "passport",
    label: "Passport (@nestjs/passport + JWT)",
    description: "Strategy providers, AuthGuard, JWT issuance, roles.",
    guideline: "auth/passport.md",
    skill: "auth-passport",
  },
  {
    id: "better-auth",
    label: "Better Auth",
    description: "better-auth via @thallesp/nestjs-better-auth: AuthModule + session decorators.",
    guideline: "auth/better-auth.md",
    skill: "auth-better-auth",
    fetchSkillCommand: "npx skills add better-auth/skills",
  },
];

export const DEFAULT_AUTH = "none";

export function authById(id: string): AuthStrategy | undefined {
  return AUTH_STRATEGIES.find((a) => a.id === id);
}

/** Pick a sensible default auth strategy from what the project already depends on. */
export function defaultAuthFor(detection: Detection): string {
  const names = new Set(detection.packages.map((p) => p.name));
  if (names.has("better-auth") || names.has("@thallesp/nestjs-better-auth")) return "better-auth";
  if (names.has("@nestjs/passport") || names.has("passport") || names.has("@nestjs/jwt")) {
    return "passport";
  }
  return DEFAULT_AUTH;
}
