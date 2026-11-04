import { useEffect, useState, type ReactElement } from "react";

type ListingPreviewPhotoProps = {
  src: string;
};

/** Фото в плитке галереи; если файл не загрузился, показываем нейтральную заглушку. */
export function ListingPreviewPhoto({ src }: ListingPreviewPhotoProps): ReactElement | null {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
        data-testid="listing-preview-photo-missing"
      >
        Фото недоступно
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 size-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
