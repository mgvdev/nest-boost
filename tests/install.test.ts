import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "nest-boost-install-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "temp-app",
      version: "0.0.1",
      dependencies: {
        "@nestjs/core": "^11.0.0",
        "@nestjs/common": "^11.0.0",
        "@nestjs/typeorm": "^10.0.0",
        typeorm: "^0.3.20",
        "class-validator": "^0.14.0",
      },
    }),
  );
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("performInstall", () => {
  test("writes MCP config, guidelines, skills, and config for chosen agents", () => {
    const summary = performInstall(dir, detect(dir), {
      agents: ["claude", "generic"],
      projects: [{ name: "app", type: "application", root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
      defaultProject: "app",
      architecture: "standard",
      auth: "none",
      runner: "bunx",
    });

    // MCP config
    const mcp = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8"));
    expect(mcp.mcpServers["nest-boost"].command).toBe("bunx");
    expect(mcp.mcpServers["nest-boost"].args).toEqual(["@mgvdev/nest-boost", "mcp"]);

    // Guidelines (Claude block + generic AGENTS.md)
    const claude = readFileSync(join(dir, "CLAUDE.md"), "utf8");
    expect(claude).toContain("<!-- nest-boost:begin -->");
    expect(claude).toContain("NestJS Core Conventions");
    expect(claude).toContain("TypeORM"); // detected ecosystem guideline included
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);

    // Skills (base + detected typeorm)
    expect(existsSync(join(dir, ".claude/skills/nestjs-development/SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".claude/skills/nestjs-docs/SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, ".claude/skills/typeorm-development/SKILL.md"))).toBe(true);

    // Config persisted
    const config = JSON.parse(readFileSync(join(dir, "nest-boost.json"), "utf8"));
    expect(config.agents).toEqual(["claude", "generic"]);
    expect(config.defaultProject).toBe("app");
    expect(config.projects[0].entryModule).toBe("src/app.module.ts");
    expect(config.architecture).toBe("standard");

    expect(summary.filesWritten).toContain("nest-boost.json");
  });

  test("preserves user content outside the markers and is idempotent", () => {
    const path = join(dir, "CLAUDE.md");
    // Add user content around the managed block.
    const withUser = "# My project notes\n\n" + readFileSync(path, "utf8") + "\n## More notes\n";
    writeFileSync(path, withUser);

    performInstall(dir, detect(dir), {
      agents: ["claude"],
      projects: [{ name: "app", type: "application", root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
      defaultProject: "app",
      architecture: "standard",
      auth: "none",
      runner: "bunx",
    });

    const after = readFileSync(path, "utf8");
    expect(after).toContain("# My project notes");
    expect(after).toContain("## More notes");
    // Exactly one managed block after re-running.
    expect(after.match(/nest-boost:begin/g)).toHaveLength(1);
    expect(after.match(/nest-boost:end/g)).toHaveLength(1);
  });
});
