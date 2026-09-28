type ListingThumbProps = {
  src?: string;
  alt: string;
};

/** Главное фото объявления 48×48. Без src — нейтральная заглушка. */
export function ListingThumb({ src, alt }: ListingThumbProps) {
  if (!src) {
    return (
      <div aria-hidden className="size-12 shrink-0 rounded-lg bg-[#e8e4dc]" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="size-12 shrink-0 rounded-lg object-cover"
    />
  );
}
