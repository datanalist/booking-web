import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function ProfilePage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmLogout(): Promise<void> {
    setPending(true);
    try {
      await auth.logout();
      navigate("/login");
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <div className="font-sans">
      <h1 className="mb-4 text-[28px] font-bold text-[var(--color-ink)]">
        Профиль
      </h1>
      <p className="mb-8 text-[16px] text-[var(--color-text)]">
        Раздел появится позже
      </p>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Выйти
      </Button>
      <Modal open={open} title="Выйти из аккаунта?" onClose={() => setOpen(false)}>
        <p className="mb-6 text-[16px] text-[var(--color-text)]">
          Вы уверены, что хотите выйти?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outlined"
            disabled={pending}
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              void confirmLogout();
            }}
            className="flex-1"
          >
            Выйти
          </Button>
        </div>
      </Modal>
    </div>
  );
}
