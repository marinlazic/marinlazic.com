// The program photo. Plain black and white photography, as on the rest of the site.
import type { Program } from "@shared/programs";

export function ProgramThumb({ p, eager = false }: { p: Program; eager?: boolean }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[#D9D9D9]">
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
