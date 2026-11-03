/** Единая причина изменения: кнопка генерации обложки под сеткой фото мастера. */
import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { generateListingCover } from "../features/listings/generateListingCover";

type GenerateCoverButtonProps = {
  coverUrl: string | null;
  title: string;
  address: string;
  priceNight: number;
  maxGuests: number;
  hasKitchen: boolean;
  pending?: boolean;
  onGenerated: (url: string) => void;
};

export function GenerateCoverButton({
  coverUrl,
  title,
  address,
  priceNight,
  maxGuests,
  hasKitchen,
  pending = false,
  onGenerated,
}: GenerateCoverButtonProps) {
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = coverUrl === null || pending || loading;

  async function generate(): Promise<void> {
    if (busy.current || coverUrl === null || pending) {
      return;
    }
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const url = await generateListingCover({
        coverUrl,
        title,
        address,
        priceNight,
        maxGuests,
        hasKitchen,
      });
      onGenerated(url);
    } catch (caught) {
      setError(caught instanceof Error && caught.message.trim() !== ""
        ? caught.message
        : "Не удалось сгенерировать обложку");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        aria-label="Сгенерировать обложку"
        aria-busy={loading}
        disabled={disabled}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[var(--color-ink)] px-5 py-3 font-sans text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => {
          void generate();
        }}
      >
        <WandSparkles aria-hidden="true" size={16} strokeWidth={2} />
        {loading ? "Генерация обложки…" : "Сгенерировать обложку"}
      </button>
      {error !== null ? (
        <p className="m-0 text-[14px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
