// The program image: one drawing, one flat colour and one photo, 4:5.
// Made 18 Nov 2026. The files live in client/public/images/library/programs.
import { programArt, type Program } from "@shared/programs";

// Kept for older imports. The yellow is no longer used on the site.
export const THUMB_YELLOW = "#141413";

export function ProgramThumb({
  p,
  eager = false,
}: {
  p: Pick<Program, "slug" | "image" | "imageAlt">;
  eager?: boolean;
}) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-stone">
      <img
        src={programArt(p)}
        alt={p.imageAlt}
        className="absolute inset-0 w-full h-full object-cover block"
        width={800}
        height={1000}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
