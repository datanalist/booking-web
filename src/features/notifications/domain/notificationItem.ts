export type NotificationItem = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly read: boolean;
  readonly receivedAt: string;
  readonly timeLabel: string;
};
