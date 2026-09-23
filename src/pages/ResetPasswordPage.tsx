import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function ResetPasswordPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setPasswordError("");
    setPending(true);
    try {
      await auth.confirmPasswordReset(token, password);
      navigate("/login");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Ссылка недействительна",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="mb-2 text-[32px] font-bold text-[var(--color-ink)]">
        Новый пароль
      </h1>
      <Input
        label="Новый пароль"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Минимум 8 символов"
        error={passwordError}
      />
      <Button type="submit" disabled={pending || !token} className="w-full">
        Сохранить пароль
      </Button>
      <Link to="/login" className="text-[14px] text-[var(--color-accent)]">
        Вернуться ко входу
      </Link>
    </form>
  );
}
