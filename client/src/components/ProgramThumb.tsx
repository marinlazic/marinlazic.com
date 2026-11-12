// The program photo. The Nov 2026 redesign shows the photo on its own: no
// big word, sticker or pin. The Thumb fields stay in shared/programs.ts.
import type { Thumb } from "@shared/programs";

// Kept for older imports. The yellow is no longer used on the site.
export const THUMB_YELLOW = "#141413";

export function ProgramThumb({ p, eager = false }: { p: Thumb; eager?: boolean }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-oat">
      <img
        src={p.image}
        alt={p.imageAlt}
        className="absolute inset-0 w-full h-full object-cover block"
        style={{ objectPosition: p.focus }}
        width={1000}
        height={750}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
