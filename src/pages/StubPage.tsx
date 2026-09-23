type StubPageProps = {
  title: string;
};

export function StubPage({ title }: StubPageProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Раздел появится позже</p>
    </div>
  );
}
