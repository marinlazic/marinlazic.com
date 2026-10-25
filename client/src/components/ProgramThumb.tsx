// The program thumbnail, as agreed in the mock: full bleed black and white photo,
// a big yellow word behind the person, an emoji sticker, a tag and a place label.
import type { Thumb } from "@shared/programs";

export const THUMB_YELLOW = "#FFD400";

export function ProgramThumb({ p, eager = false }: { p: Thumb; eager?: boolean }) {
  const lazy = eager ? "eager" : "lazy";
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
        loading={lazy}
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="absolute left-[4%] right-[2%] top-[12%] font-heading font-black lowercase leading-[0.82] tracking-[-0.045em]"
        style={{
          fontSize: p.word.length > 5 ? "26cqw" : "32cqw",
          color: THUMB_YELLOW,
          textShadow: "0 2px 14px rgba(0,0,0,0.35)",
        }}
      >
        {p.word}
      </div>
      {p.cutout ? (
        <img
          src={p.cutout}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover block"
          style={{ objectPosition: p.focus }}
          width={1000}
          height={750}
          loading={lazy}
          decoding="async"
        />
      ) : null}
      {p.tag ? (
        <span
          aria-hidden="true"
          className="absolute left-3.5 top-3.5 text-sm font-bold lowercase text-white"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}
        >
          {p.tag}
        </span>
      ) : null}
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
