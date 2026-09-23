import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function ForgotPasswordPage() {
  const { auth } = useSession();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setEmailError("");
    setPending(true);
    try {
      const resetToken = await auth.requestPasswordReset(email);
      setToken(resetToken);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  if (token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[32px] font-bold text-[var(--color-ink)]">
          Проверьте почту
        </h1>
        <p className="text-[16px] text-[var(--color-text)]">
          Мы отправили ссылку для сброса пароля. В демо можно перейти сразу:
        </p>
        <Link
          to={`/reset-password?token=${encodeURIComponent(token)}`}
          className="text-[var(--color-accent)] no-underline"
        >
          Задать новый пароль
        </Link>
        <Link to="/login" className="text-[14px] text-[var(--color-text)]">
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="mb-2 text-[32px] font-bold text-[var(--color-ink)]">
        Забыли пароль?
      </h1>
      <p className="text-[16px] text-[var(--color-text)]">
        Введите email — пришлём ссылку для сброса пароля.
      </p>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="Введите email"
        error={emailError}
      />
      <Button type="submit" disabled={pending} className="w-full">
        Отправить ссылку
      </Button>
      <Link to="/login" className="text-[14px] text-[var(--color-accent)]">
        Вернуться ко входу
      </Link>
    </form>
  );
}
