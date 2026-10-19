import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <article className="font-sans text-[16px] leading-[1.5] text-[#1a1b1d]">
      <h1 className="mb-4 text-[28px] font-bold">Условия использования</h1>
      <p className="mb-4">
        Это шаблон условий сервиса vallome.booking для кабинета хозяина.
      </p>
      <h2 className="mb-2 text-[20px] font-bold">Аккаунт</h2>
      <p className="mb-4">
        Регистрация создаёт аккаунт хозяина. Вход паролем открывается после подтверждения почты по кнопке из письма.
      </p>
      <h2 className="mb-2 text-[20px] font-bold">Объявления и брони</h2>
      <p className="mb-4">
        Хозяин публикует объекты и отвечает на запросы гостей. Сервис хранит даты, цены и переписку по брони.
      </p>
      <h2 className="mb-2 text-[20px] font-bold">Данные</h2>
      <p className="mb-4">
        Обработка почты, телефона и сведений об объектах описана в документе{" "}
        <Link to="/privacy" className="text-[var(--color-accent)]">Политика конфиденциальности</Link>.
      </p>
    </article>
  );
}
