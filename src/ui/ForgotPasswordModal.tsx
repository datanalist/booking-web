import {
  FormEvent,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { useSession } from "../app/session";
import { Button } from "./Button";
import { Input } from "./Input";

type ForgotPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after user presses «Ок» on success step — parent stays on /login */
  onDone: () => void;
};

type Step = "form" | "success";

export function ForgotPasswordModal({
  open,
  onClose,
  onDone,
}: ForgotPasswordModalProps): ReactElement | null {
  const { auth } = useSession();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("form");
      setEmail("");
      setError("");
      setPending(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!email.trim() || pending) {
      return;
    }
    setError("");
    setPending(true);
    try {
      await auth.requestPasswordReset(email);
      setStep("success");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Ошибка",
      );
    } finally {
      setPending(false);
    }
  }

  const cardShadow =
    "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#525353] font-sans"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className={`relative flex w-[438px] flex-col items-center gap-10 overflow-hidden rounded-[12px] bg-white p-6 ${cardShadow}`}
        onClick={(event) => event.stopPropagation()}
      >
        {step === "form" ? (
          <form
            className="flex w-full flex-col items-center gap-10"
            onSubmit={onSubmit}
          >
            <div className="flex w-full flex-col gap-6">
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <h2
                    id="forgot-password-title"
                    className="m-0 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]"
                  >
                    Забыли пароль?
                  </h2>
                  <button
                    type="button"
                    aria-label="Закрыть"
                    className="flex size-10 items-center justify-center rounded-[8px] border-0 bg-transparent p-0"
                    onClick={onClose}
                  >
                    <img
                      src="/icon-modal-close.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
                <p className="m-0 text-[16px] font-normal leading-[1.45] text-[#1a1b1d]">
                  Введите адрес электронной почты, чтобы восстановить пароль
                </p>
              </div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Введите email"
                variant="auth"
                error={error || undefined}
              />
            </div>
            <Button
              type="submit"
              disabled={!email.trim() || pending}
              className="w-full !rounded-[8px] disabled:opacity-40"
            >
              Отправить
            </Button>
          </form>
        ) : (
          <>
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full items-center justify-between">
                <h2
                  id="forgot-password-title"
                  className="m-0 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]"
                >
                  Восстановление пароля
                </h2>
                <button
                  type="button"
                  aria-label="Закрыть"
                  className="flex size-10 items-center justify-center rounded-[8px] border-0 bg-transparent p-0"
                  onClick={onClose}
                >
                  <img
                    src="/icon-modal-close.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </div>
              <p className="m-0 text-[16px] font-normal leading-[1.45] text-[#1a1b1d]">
                Письмо с ссылкой для восстановления пароля выслано на{" "}
                <span className="font-bold leading-[1.2] text-[#1a1b1d]">
                  {email.trim().toLowerCase()}
                </span>
              </p>
            </div>
            <Button
              type="button"
              className="w-full !rounded-[8px]"
              onClick={onDone}
            >
              Ок
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
