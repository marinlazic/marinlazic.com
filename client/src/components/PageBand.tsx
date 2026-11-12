// A photo band for the top of a page: one wide photo with rounded corners.
// The word, emoji and pin props are kept so existing pages do not change,
// but the Nov 2026 redesign shows the photo on its own.
export function PageBand({
  src,
  alt,
  position = "center",
}: {
  src: string;
  alt: string;
  word?: string;
  emoji?: string;
  pin?: string;
  position?: string;
  fixedNav?: boolean;
}) {
  return (
    <div className="ml-wrap pt-2">
      <img
        src={src}
        alt={alt}
        className="block w-full h-[200px] sm:h-[320px] object-cover rounded-lg bg-oat"
        style={{ objectPosition: position }}
        loading="eager"
      />
    </div>
  );
}
