export function PrivacyPage() {
  return (
    <article className="font-sans text-[16px] leading-[1.5] text-[#1a1b1d]">
      <h1 className="mb-4 text-[28px] font-bold">Политика конфиденциальности</h1>
      <p className="mb-4">Это шаблон политики сервиса vallome.booking.</p>
      <h2 className="mb-2 text-[20px] font-bold">Какие данные</h2>
      <p className="mb-4">Почта, пароль в виде хеша, имя, телефон и данные объявлений.</p>
      <h2 className="mb-2 text-[20px] font-bold">Зачем</h2>
      <p className="mb-4">Чтобы создать аккаунт, подтвердить почту, показать кабинет и вести брони.</p>
      <h2 className="mb-2 text-[20px] font-bold">Кому видно</h2>
      <p>Почта хозяина другим пользователям не показывается. Её видит владелец аккаунта и сервис.</p>
    </article>
  );
}
