/**
 * Where test files live in the project. Chosen at install, persisted in
 * nest-boost.json, and composed into the guidelines so the agent places new
 * tests the way the team expects. Adding a layout = one entry + its guideline.
 */
export interface TestLayout {
  id: string;
  label: string;
  description: string;
  /** Guideline file relative to resources/guidelines. */
  guideline: string;
}

export const TEST_LAYOUTS: TestLayout[] = [
  {
    id: "colocated",
    label: "Colocated (Nest default)",
    description: "*.spec.ts next to the source file; e2e in a top-level test/ folder.",
    guideline: "test-layout/colocated.md",
  },
  {
    id: "colocated-subfolder",
    label: "Colocated in __tests__/",
    description: "Unit specs in a __tests__/ folder beside the source; e2e in test/.",
    guideline: "test-layout/colocated-subfolder.md",
  },
  {
    id: "central",
    label: "Central test/ folder (Unit + Feature)",
    description: "All tests under test/ mirroring src, split into unit/ and feature/ (e2e).",
    guideline: "test-layout/central.md",
  },
];

export const DEFAULT_TEST_LAYOUT = "colocated";

export function testLayoutById(id: string): TestLayout | undefined {
  return TEST_LAYOUTS.find((l) => l.id === id);
}
