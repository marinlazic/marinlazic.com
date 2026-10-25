// A full width photo band for the top of a page: black and white photo,
// a big yellow word, an emoji and a place pill. Same look as the library hero.
import { THUMB_YELLOW } from "@/components/ProgramThumb";

export function PageBand({
  src,
  alt,
  word,
  emoji,
  pin,
  position = "center",
  fixedNav = false,
}: {
  src: string;
  alt: string;
  word: string;
  emoji: string;
  pin: string;
  position?: string;
  fixedNav?: boolean;
}) {
  return (
    <div className={fixedNav ? "pt-16" : ""}>
      <div
        className="relative w-full h-[220px] sm:h-[340px] overflow-hidden bg-[#D9D9D9] border-b border-black"
        style={{ containerType: "inline-size" }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "grayscale(1) contrast(1.12)", objectPosition: position }}
          loading="eager"
        />
        <div
          aria-hidden="true"
          className="absolute left-[4%] bottom-[8%] font-heading font-black lowercase leading-[0.8] tracking-[-0.05em] pointer-events-none"
          style={{ fontSize: word.length > 6 ? "11cqw" : "15cqw", color: THUMB_YELLOW, textShadow: "0 3px 20px rgba(0,0,0,0.45)" }}
        >
          {word}
        </div>
        <span aria-hidden="true" className="absolute right-6 top-4 text-6xl rotate-12">{emoji}</span>
        <span className="absolute left-4 top-4 bg-white text-[#0B2530] text-[13px] font-semibold px-3 py-1.5 rounded-full">
          {"\u{1F4CD}"} {pin}
        </span>
      </div>
    </div>
  );
}
