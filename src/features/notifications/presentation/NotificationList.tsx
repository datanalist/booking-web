import type { NotificationItem } from "../domain/notificationItem";
import { NotificationCard } from "./NotificationCard";

type NotificationListProps = {
  items: readonly NotificationItem[];
  onMarkRead?: (id: string) => void;
};

export function NotificationList({ items, onMarkRead }: NotificationListProps) {
  return (
    <section className="flex min-h-0 w-full flex-1 flex-col items-start rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white p-5">
      <div className="flex w-[534px] flex-col gap-5">
        {items.map((item) => (
          <NotificationCard key={item.id} item={item} onMarkRead={onMarkRead} />
        ))}
      </div>
    </section>
  );
}
