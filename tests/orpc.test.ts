import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detect } from "../src/install/detect";
import { skillsForDetection } from "../src/install/writers/skills";
import { skillsDir } from "../src/lib/resources";

function makeProject(deps: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-orpc-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "orpc-app",
      dependencies: { "@nestjs/core": "^12.0.0", "@nestjs/common": "^12.0.0", ...deps },
    }),
  );
  return dir;
}

describe("oRPC skill", () => {
  test("the packaged skill exists", () => {
    expect(existsSync(join(skillsDir(), "orpc-development", "SKILL.md"))).toBe(true);
  });

  test("detected when @orpc/nest is a dependency and installs the skill", () => {
    const dir = makeProject({ "@orpc/nest": "^1.0.0" });
    try {
      const d = detect(dir);
      expect(d.entries.map((e) => e.id)).toContain("orpc");
      expect(skillsForDetection(d)).toContain("orpc-development");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("not installed when oRPC is absent", () => {
    const dir = makeProject({});
    try {
      expect(skillsForDetection(detect(dir))).not.toContain("orpc-development");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
