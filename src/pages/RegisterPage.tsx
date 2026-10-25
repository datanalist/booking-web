import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { subscribeEmailVerifiedNotice } from "./emailVerifiedNoticeChannel";

const REGISTER_FAILURE_MESSAGE =
  "Не получилось зарегистрироваться, попробуйте еще раз";
const MAIL_SEND_FAILURE_MESSAGE =
  "Не удалось отправить письмо. Попробуйте ещё раз";

export function RegisterPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  useEffect(
    () =>
      subscribeEmailVerifiedNotice(() => {
        navigate("/login", {
          replace: true,
          state: { verified: true, email: sentEmail || undefined },
        });
      }),
    [navigate, sentEmail],
  );

  const formEmpty = !email.trim() || !password || !confirm;
  const submitDisabled = pending || formEmpty || !accepted;

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSentEmail("");
    setConfirmError("");
    setFormError("");
    if (password !== confirm) {
      setConfirmError("Пароли не совпадают");
      return;
    }
    setPending(true);
    try {
      const registered = await auth.register(email, password);
      setSentEmail(registered.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setFormError(
        message === MAIL_SEND_FAILURE_MESSAGE
          ? MAIL_SEND_FAILURE_MESSAGE
          : REGISTER_FAILURE_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="flex w-full flex-col items-center gap-[40px]"
      onSubmit={onSubmit}
    >
      <h1 className="m-0 text-center text-[32px] font-bold leading-none text-[#1a1b1d]">
        Регистрация
      </h1>

      <div className="flex w-full flex-col items-start gap-[20px]">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Введите email"
          variant="auth"
        />
        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Введите пароль"
          variant="auth"
          passwordToggle
        />
        <Input
          label="Повторите пароль"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Повторите пароль"
          variant="auth"
          passwordToggle
          error={confirmError}
        />
        {formError ? (
          <div className="flex w-full items-start gap-2">
            <img
              src="/icon-info-circle.svg"
              alt=""
              width={20}
              height={20}
              className="shrink-0"
            />
            <p className="m-0 text-[14px] leading-[1.4] text-[#e34043]">
              {formError}
            </p>
          </div>
        ) : null}
        {sentEmail ? (
          <p className="m-0 w-full text-[14px] leading-[1.4] text-[#1a1b1d]">
            {`Письмо отправлено на ${sentEmail}. Подтвердите почту по кнопке в письме. Войти можно после подтверждения.`}
          </p>
        ) : null}
        <label className="flex w-full cursor-pointer items-start gap-2 text-[14px] leading-[1.4] text-[#525353]">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>
            Я соглашаюсь с{" "}
            <Link
              to="/terms"
              className="text-[var(--color-accent)] no-underline"
              onClick={(event) => event.stopPropagation()}
            >
              Условиями использования
            </Link>
          </span>
        </label>
      </div>

      <div className="flex w-full flex-col items-center gap-[24px]">
        <Button
          type="submit"
          disabled={submitDisabled}
          className={`w-full !rounded-[8px]${formEmpty ? " opacity-40" : ""}`}
        >
          Зарегистрироваться
        </Button>
        <p className="m-0 w-full text-center text-[14px] leading-[1.4]">
          <span className="text-[#525353]">Есть аккаунт? </span>
          <Link to="/login" className="text-[var(--color-accent)] no-underline">
            Войти
          </Link>
        </p>
      </div>
    </form>
  );
}
