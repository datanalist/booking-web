type StubPageProps = {
  title: string;
};

export function StubPage({ title }: StubPageProps) {
  return (
    <div className="font-sans">
      <h1 className="mb-4 text-[28px] font-bold text-[var(--color-ink)]">
        {title}
      </h1>
      <p className="text-[16px] text-[var(--color-text)]">
        Раздел появится позже
      </p>
    </div>
  );
}
