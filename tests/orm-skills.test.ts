import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detect } from "../src/install/detect";
import { skillsForDetection } from "../src/install/writers/skills";
import { skillsDir } from "../src/lib/resources";

function makeProject(deps: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-orm-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "orm-app",
      dependencies: { "@nestjs/core": "^11.0.0", "@nestjs/common": "^11.0.0", ...deps },
    }),
  );
  return dir;
}

const CASES: Array<{ id: string; skill: string; pkg: string }> = [
  { id: "typeorm", skill: "typeorm-development", pkg: "@nestjs/typeorm" },
  { id: "prisma", skill: "prisma-development", pkg: "@prisma/client" },
  { id: "sequelize", skill: "sequelize-development", pkg: "@nestjs/sequelize" },
  { id: "mikro-orm", skill: "mikro-orm-development", pkg: "@mikro-orm/nestjs" },
  { id: "mongoose", skill: "mongoose-development", pkg: "@nestjs/mongoose" },
];

describe("ORM skills", () => {
  for (const { skill } of CASES) {
    test(`packaged skill ${skill} exists`, () => {
      expect(existsSync(join(skillsDir(), skill, "SKILL.md"))).toBe(true);
    });
  }

  for (const { id, skill, pkg } of CASES) {
    test(`${id} is detected and installs ${skill} when ${pkg} present`, () => {
      const dir = makeProject({ [pkg]: "^1.0.0" });
      try {
        const d = detect(dir);
        expect(d.entries.map((e) => e.id)).toContain(id);
        expect(skillsForDetection(d)).toContain(skill);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  test("no ORM skill installed when none present", () => {
    const dir = makeProject({});
    try {
      const skills = skillsForDetection(detect(dir));
      for (const { skill } of CASES) expect(skills).not.toContain(skill);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
