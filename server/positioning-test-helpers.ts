import fixture from "./fixtures/positioning-2026-10-14.json";

export const positioningExpected = fixture.expected;

export function restoreApprovedPositioning(
  file: string,
  value: string
): string {
  const replacements =
    (fixture.replacements as Record<string, { old: string; new: string }[]>)[
      file
    ] ?? [];
  return [...replacements]
    .reverse()
    .reduce((text, pair) => text.replace(pair.new, pair.old), value);
}
