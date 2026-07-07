import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";
import { defaultAuthFor } from "../src/install/auth";
import { composeGuidelines } from "../src/install/writers/guidelines";
import { skillsForDetection } from "../src/install/writers/skills";

const dirs: string[] = [];

function makeProject(deps: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-auth-"));
  dirs.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "auth-app",
      dependencies: { "@nestjs/core": "^11.0.0", "@nestjs/common": "^11.0.0", ...deps },
    }),
  );
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("auth strategy selection", () => {
  test("composeGuidelines includes the chosen auth section", () => {
    const d = detect(makeProject());
    expect(composeGuidelines(d, { auth: "passport" })).toContain("Auth: Passport");
    expect(composeGuidelines(d, { auth: "better-auth" })).toContain("Auth: Better Auth");
    // "none" adds no auth section
    expect(composeGuidelines(d, { auth: "none" })).not.toContain("Auth: Passport");
  });

  test("skillsForDetection includes the auth skill", () => {
    const d = detect(makeProject());
    expect(skillsForDetection(d, { auth: "passport" })).toContain("auth-passport");
    expect(skillsForDetection(d, { auth: "better-auth" })).toContain("auth-better-auth");
    expect(skillsForDetection(d, { auth: "none" })).not.toContain("auth-passport");
  });

  test("defaultAuthFor infers strategy from installed packages", () => {
    expect(defaultAuthFor(detect(makeProject({ "better-auth": "^1.0.0" })))).toBe("better-auth");
    expect(defaultAuthFor(detect(makeProject({ "@nestjs/passport": "^11.0.0" })))).toBe("passport");
    expect(defaultAuthFor(detect(makeProject()))).toBe("none");
  });

  test("install adapts guidelines + skills to Better Auth and hints the official skill", () => {
    const dir = makeProject({ "better-auth": "^1.0.0", "@thallesp/nestjs-better-auth": "^1.0.0" });
    const summary = performInstall(dir, detect(dir), {
      agents: ["claude"],
      entryModule: "src/app.module.ts",
      moduleExport: "AppModule",
      architecture: "standard",
      auth: "better-auth",
      runner: "bunx",
    });

    const claude = readFileSync(join(dir, "CLAUDE.md"), "utf8");
    expect(claude).toContain("Auth: Better Auth");
    expect(claude).toContain("better-auth.com/llms.txt");

    expect(existsSync(join(dir, ".claude/skills/auth-better-auth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".claude/skills/auth-passport"))).toBe(false);

    // The official-skill fetch command is surfaced as a hint.
    expect(summary.hints.some((h) => h.includes("npx skills add better-auth/skills"))).toBe(true);

    const config = JSON.parse(readFileSync(join(dir, "nest-boost.json"), "utf8"));
    expect(config.auth).toBe("better-auth");
  });
});
