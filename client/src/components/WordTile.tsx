// A photo tile. The word, emoji and pin props are kept so existing pages do
// not change, but the Nov 2026 redesign shows the photo on its own.
export function WordTile({
  src,
  alt,
  aspect = "aspect-[4/3]",
  position = "center",
  eager = false,
  className = "",
}: {
  src: string;
  alt: string;
  word?: string;
  emoji?: string;
  pin?: string;
  aspect?: string;
  position?: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-oat ${aspect} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover block"
        style={{ objectPosition: position }}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
