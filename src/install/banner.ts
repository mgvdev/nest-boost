/**
 * Welcome banner shown at the top of `nest-boost install` — an ASCII wordmark in
 * Nest red, à la Laravel Boost. Glyphs are joined programmatically so column
 * alignment can never drift.
 */

// Each glyph is 5 rows tall. Widths may differ between letters — they're joined
// with a single-space gutter, which reads as a proportional wordmark.
const GLYPHS: Record<string, string[]> = {
  N: ["█▛▖ █", "█▝▙ █", "█ ▝▙█", "█  ▜█", "▀   ▀"],
  E: ["█████", "█▄▄  ", "█▀▀  ", "█▄▄▄ ", "▀▀▀▀▀"],
  S: ["▗████", "█▖   ", "▝███▖", "   ▗█", "████▘"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  ▀  "],
  B: ["███▖ ", "█▄▟▘ ", "█▀▜▖ ", "█▄▟▘ ", "▀▀▀  "],
  O: ["▗███▖", "█▘ ▝█", "█   █", "█▖ ▗█", "▝███▘"],
  "-": ["     ", "     ", " ▄▄▄ ", "     ", "     "],
  " ": ["  ", "  ", "  ", "  ", "  "],
};

export function renderWord(word: string): string[] {
  const rows = ["", "", "", "", ""];
  for (const ch of word.toUpperCase()) {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < 5; r++) rows[r] += glyph[r] + " ";
  }
  return rows.map((r) => r.replace(/\s+$/, ""));
}

const NEST_RED = "\x1b[38;2;224;35;78m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function useColor(): boolean {
  return !process.env.NO_COLOR && !!process.stdout.isTTY;
}

/** Print the welcome banner to stdout. */
export function printBanner(version = ""): void {
  const color = useColor();
  const red = (s: string) => (color ? NEST_RED + s + RESET : s);
  const dim = (s: string) => (color ? DIM + s + RESET : s);

  const art = renderWord("NEST-BOOST").map((line) => "  " + red(line));
  const tagline = "  " + dim("🚀 Laravel Boost, for NestJS" + (version ? `  ·  v${version}` : ""));

  process.stdout.write("\n" + art.join("\n") + "\n\n" + tagline + "\n\n");
}
