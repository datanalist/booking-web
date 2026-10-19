/** Раскрытый пользователь в `expand` чата. */
export type PbUserExpand = {
  readonly id: string;
  readonly name?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly avatar?: string;
};

/** Раскрытое объявление в `expand` чата. */
export type PbListingExpand = {
  readonly id: string;
  readonly title?: string;
  readonly city?: string;
  readonly address?: string;
  readonly photos?: readonly string[];
};

/** Раскрытая бронь в `expand` чата. */
export type PbBookingExpand = {
  readonly id: string;
  readonly check_in?: string;
  readonly check_out?: string;
  readonly adults?: number;
  readonly children?: number;
};

/** Запись коллекции `chats`. */
export type PbChatRecord = {
  readonly id: string;
  readonly kind: "listing" | "support";
  readonly listing?: string;
  readonly booking?: string;
  readonly guest: string;
  readonly host?: string;
  readonly staff?: string;
  readonly last_message?: string;
  readonly last_message_at?: string;
  readonly guest_last_read?: string;
  readonly host_last_read?: string;
  readonly created?: string;
  readonly updated?: string;
  readonly expand?: {
    readonly guest?: PbUserExpand;
    readonly staff?: PbUserExpand;
    readonly listing?: PbListingExpand;
    readonly booking?: PbBookingExpand;
  };
};

/** Запись коллекции `messages`. */
export type PbMessageRecord = {
  readonly id: string;
  readonly chat: string;
  readonly author: string;
  readonly text?: string;
  readonly images?: readonly string[];
  readonly files?: readonly string[];
  readonly created: string;
  readonly updated?: string;
};

/** Запись коллекции `notifications`. */
export type PbNotificationRecord = {
  readonly id: string;
  readonly user: string;
  readonly title: string;
  readonly body?: string;
  readonly read: boolean;
  readonly booking?: string;
  readonly listing?: string;
  readonly chat?: string;
  readonly created: string;
  readonly updated?: string;
};
