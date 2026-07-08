import { describe, expect, test } from "bun:test";
import { mcpCommandString, mcpServerEntry, resolveRunner } from "../src/install/runner";

describe("runner", () => {
  test("respects an explicit runner choice", () => {
    expect(resolveRunner("npx")).toBe("npx");
    expect(resolveRunner("bunx")).toBe("bunx");
  });

  test("defaults to npx", () => {
    expect(resolveRunner()).toBe("npx");
    expect(resolveRunner("garbage")).toBe("npx");
  });

  test("bunx entry launches the package directly", () => {
    expect(mcpServerEntry("bunx")).toEqual({ command: "bunx", args: ["@mgvdev/nest-boost", "mcp"] });
    expect(mcpCommandString("bunx")).toBe("bunx @mgvdev/nest-boost mcp");
  });

  test("npx entry adds -y to avoid an install prompt", () => {
    expect(mcpServerEntry("npx")).toEqual({ command: "npx", args: ["-y", "@mgvdev/nest-boost", "mcp"] });
    expect(mcpCommandString("npx")).toBe("npx -y @mgvdev/nest-boost mcp");
  });
});
