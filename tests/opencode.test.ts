import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performInstall } from "../src/commands/install";
import { detect } from "../src/install/detect";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "nest-boost-oc-"));
  dirs.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "oc", dependencies: { "@nestjs/core": "^12.0.0", "@nestjs/common": "^12.0.0" } }),
  );
  return dir;
}

const BASE = {
  projects: [{ name: "app", type: "application" as const, root: ".", entryModule: "src/app.module.ts", moduleExport: "AppModule" }],
  defaultProject: "app",
  architecture: "standard",
  auth: "none",
};

describe("opencode agent", () => {
  test("writes opencode.json with the `mcp` / type:local schema", () => {
    const dir = makeProject();
    performInstall(dir, detect(dir), { ...BASE, agents: ["opencode"], runner: "npx" });

    const cfg = JSON.parse(readFileSync(join(dir, "opencode.json"), "utf8"));
    // NOT the mcpServers shape
    expect(cfg.mcpServers).toBeUndefined();
    expect(cfg.mcp["nest-boost"]).toEqual({
      type: "local",
      command: ["npx", "-y", "@mgvdev/nest-boost", "mcp"],
      enabled: true,
    });
    // opencode reads AGENTS.md for guidelines
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
  });

  test("preserves existing opencode.json content", () => {
    const dir = makeProject();
    writeFileSync(
      join(dir, "opencode.json"),
      JSON.stringify({ theme: "dark", mcp: { other: { type: "local", command: ["x"] } } }),
    );
    performInstall(dir, detect(dir), { ...BASE, agents: ["opencode"], runner: "bunx" });

    const cfg = JSON.parse(readFileSync(join(dir, "opencode.json"), "utf8"));
    expect(cfg.theme).toBe("dark");
    expect(cfg.mcp.other).toBeDefined();
    expect(cfg.mcp["nest-boost"].command).toEqual(["bunx", "@mgvdev/nest-boost", "mcp"]);
  });
});
