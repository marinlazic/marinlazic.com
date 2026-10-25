// A photo tile in the same style as the program thumbnails: black and white
// photo, a big yellow word, an emoji sticker and a white place pill.
import { THUMB_YELLOW } from "@/components/ProgramThumb";

export function WordTile({
  src,
  alt,
  word,
  emoji,
  pin,
  aspect = "aspect-[4/3]",
  position = "center",
  eager = false,
  className = "",
}: {
  src: string;
  alt: string;
  word: string;
  emoji: string;
  pin?: string;
  aspect?: string;
  position?: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#D9D9D9] ${aspect} ${className}`}
      style={{ containerType: "inline-size" }}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover block"
        style={{ objectPosition: position, filter: "grayscale(1) contrast(1.12)" }}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="absolute left-[4%] right-[2%] top-[12%] font-heading font-black lowercase leading-[0.82] tracking-[-0.045em]"
        style={{
          fontSize: word.length > 5 ? "24cqw" : "32cqw",
          color: THUMB_YELLOW,
          textShadow: "0 2px 14px rgba(0,0,0,0.35)",
        }}
      >
        {word}
      </div>
      <span aria-hidden="true" className="absolute right-3 bottom-12 text-[44px] leading-none" style={{ transform: "rotate(-10deg)" }}>
        {emoji}
      </span>
      {pin ? (
        <span className="absolute left-3.5 bottom-3.5 bg-white text-[#0B2530] text-[13px] font-semibold px-3 py-1.5 rounded-full">
          {"\u{1F4CD}"} {pin}
        </span>
      ) : null}
    </div>
  );
}
