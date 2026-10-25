// The program thumbnail, as agreed in the mock: full bleed black and white photo,
// a big pale yellow word, an emoji sticker and a small place label.
import type { Thumb } from "@shared/programs";

export function ProgramThumb({ p, eager = false }: { p: Thumb; eager?: boolean }) {
  return (
    <div
      className="relative aspect-[4/3] overflow-hidden bg-[#D9D9D9]"
      style={{ containerType: "inline-size" }}
    >
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
      <div
        aria-hidden="true"
        className="absolute left-[4%] right-[2%] top-[12%] font-heading font-extrabold lowercase leading-[0.82] tracking-[-0.045em] text-[#FFF7A8]"
        style={{ fontSize: p.word.length > 5 ? "25cqw" : "31cqw" }}
      >
        {p.word}
      </div>
      <span
        aria-hidden="true"
        className="absolute right-3 bottom-12 text-[44px] leading-none"
        style={{ transform: "rotate(-10deg)" }}
      >
        {p.emoji}
      </span>
      <span className="absolute left-3.5 bottom-3.5 bg-white text-[#0B2530] text-[13px] font-semibold px-3 py-1.5 rounded-full">
        {"\u{1F4CD}"} {p.place}
      </span>
    </div>
  );
}
