import { NOTIFICATION_TABS, type NotificationTabId } from "../domain/notificationTab";

type NotificationTabsProps = {
  value: NotificationTabId;
  onChange?: (tab: NotificationTabId) => void;
};

export function NotificationTabs({ value, onChange }: NotificationTabsProps) {
  return (
    <div role="tablist" className="flex border-b border-[#ffe4b8]">
      {NOTIFICATION_TABS.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`-mb-px w-[160px] border-b-2 p-[10px] text-[14px] font-normal leading-[1.4] ${
              selected
                ? "border-[#1a1b1d] text-[#1a1b1d]"
                : "border-transparent text-[#525353]"
            }`}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
