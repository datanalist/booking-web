import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const REGISTER_FAILURE_MESSAGE =
  "Не получилось зарегистрироваться, попробуйте еще раз";

export function RegisterPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const formEmpty = !email.trim() || !password || !confirm;
  const submitDisabled = pending || formEmpty;

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setConfirmError("");
    setFormError("");
    if (password !== confirm) {
      setConfirmError("Пароли не совпадают");
      return;
    }
    setPending(true);
    try {
      await auth.register(email, password);
      navigate("/onboarding");
    } catch {
      setFormError(REGISTER_FAILURE_MESSAGE);
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
