import { describe, expect, test } from "bun:test";
import { mcpCommandString, mcpServerEntry, resolveRunner } from "../src/install/runner";

describe("runner", () => {
  test("respects an explicit runner choice", () => {
    expect(resolveRunner("npx")).toBe("npx");
    expect(resolveRunner("bunx")).toBe("bunx");
  });

  test("auto-detects bunx when Bun is present (it is, under bun test)", () => {
    expect(resolveRunner()).toBe("bunx");
    expect(resolveRunner("garbage")).toBe("bunx");
  });

  test("bunx entry launches the package directly", () => {
    expect(mcpServerEntry("bunx")).toEqual({ command: "bunx", args: ["nest-boost", "mcp"] });
    expect(mcpCommandString("bunx")).toBe("bunx nest-boost mcp");
  });

  test("npx entry adds -y to avoid an install prompt", () => {
    expect(mcpServerEntry("npx")).toEqual({ command: "npx", args: ["-y", "nest-boost", "mcp"] });
    expect(mcpCommandString("npx")).toBe("npx -y nest-boost mcp");
  });
});
