import { describe, expect, test } from "bun:test";
import { printBanner, renderWord } from "../src/install/banner";

describe("banner", () => {
  test("renders a 6-row aligned wordmark", () => {
    const rows = renderWord("NEST-BOOST");
    expect(rows).toHaveLength(6);
    for (const r of rows) expect(r.length).toBeGreaterThan(0);
    // block-drawing characters present
    expect(rows.join("")).toContain("█");
  });

  test("printBanner writes without throwing (NO_COLOR)", () => {
    const prev = process.env.NO_COLOR;
    process.env.NO_COLOR = "1";
    const chunks: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    (process.stdout as any).write = (s: string) => {
      chunks.push(String(s));
      return true;
    };
    try {
      printBanner("9.9.9");
    } finally {
      (process.stdout as any).write = orig;
      if (prev === undefined) delete process.env.NO_COLOR;
      else process.env.NO_COLOR = prev;
    }
    const out = chunks.join("");
    expect(out).toContain("Laravel Boost, for NestJS");
    expect(out).toContain("v9.9.9");
    expect(out).not.toContain("\x1b["); // no color codes under NO_COLOR
  });
});
