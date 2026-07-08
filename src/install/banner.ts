/**
 * Welcome banner shown at the top of `nest-boost install` — a NEST-BOOST wordmark
 * (ANSI Shadow style) in a random accent color, à la Laravel Boost. Each glyph is
 * padded to its own width in code, so column alignment can't drift.
 */

const GLYPHS: Record<string, string[]> = {
  N: [
    "███╗   ██╗",
    "████╗  ██║",
    "██╔██╗ ██║",
    "██║╚██╗██║",
    "██║ ╚████║",
    "╚═╝  ╚═══╝",
  ],
  E: [
    "███████╗",
    "██╔════╝",
    "█████╗",
    "██╔══╝",
    "███████╗",
    "╚══════╝",
  ],
  S: [
    "███████╗",
    "██╔════╝",
    "███████╗",
    "╚════██║",
    "███████║",
    "╚══════╝",
  ],
  T: [
    "████████╗",
    "╚══██╔══╝",
    "   ██║",
    "   ██║",
    "   ██║",
    "   ╚═╝",
  ],
  B: [
    "██████╗",
    "██╔══██╗",
    "██████╔╝",
    "██╔══██╗",
    "██████╔╝",
    "╚═════╝",
  ],
  O: [
    " ██████╗",
    "██╔═══██╗",
    "██║   ██║",
    "██║   ██║",
    "╚██████╔╝",
    " ╚═════╝",
  ],
  "-": [
    "",
    "",
    "██████╗",
    "╚═════╝",
    "",
    "",
  ],
  " ": ["", "", "", "", "", ""],
};

const HEIGHT = 6;

function pad(rows: string[]): string[] {
  const width = Math.max(...rows.map((r) => [...r].length));
  return rows.map((r) => r + " ".repeat(width - [...r].length));
}

export function renderWord(word: string): string[] {
  const out = Array.from({ length: HEIGHT }, () => "");
  for (const ch of word.toUpperCase()) {
    const glyph = pad(GLYPHS[ch] ?? GLYPHS[" "]);
    for (let r = 0; r < HEIGHT; r++) out[r] += glyph[r] + "  ";
  }
  return out.map((r) => r.replace(/\s+$/, ""));
}

/** Accent colors (RGB) the banner picks from at random. */
const PALETTE: Record<string, [number, number, number]> = {
  blue: [59, 130, 246],
  red: [239, 68, 68],
  orange: [249, 115, 22],
  green: [34, 197, 94],
};

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function useColor(): boolean {
  return !process.env.NO_COLOR && !!process.stdout.isTTY;
}

function pickColor(): [number, number, number] {
  const names = Object.keys(PALETTE);
  return PALETTE[names[Math.floor(Math.random() * names.length)]];
}

/** Print the welcome banner to stdout. */
export function printBanner(version = ""): void {
  const color = useColor();
  const [r, g, b] = pickColor();
  const accent = `\x1b[38;2;${r};${g};${b}m`;
  const paint = (s: string) => (color ? accent + s + RESET : s);
  const dim = (s: string) => (color ? DIM + s + RESET : s);

  const art = renderWord("NEST-BOOST").map((line) => "  " + paint(line));
  const tagline = "  " + dim("🚀 Laravel Boost, for NestJS" + (version ? `  ·  v${version}` : ""));

  process.stdout.write("\n" + art.join("\n") + "\n\n" + tagline + "\n\n");
}
