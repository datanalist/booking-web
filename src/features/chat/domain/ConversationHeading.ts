/** Шапка гостевого чата: собеседник и карточка объявления. */
export type ListingConversationHeading = {
  readonly kind: "listing";
  readonly peerName: string;
  readonly peerAvatarUrl: string;
  readonly listingTitle: string;
  readonly city: string;
  readonly datesLabel: string;
  readonly guestsLabel: string;
  readonly listingThumbUrl: string;
};

/** Шапка без объявления: поддержка. */
export type DirectConversationHeading = {
  readonly kind: "direct";
  readonly peerName: string;
  readonly peerAvatarUrl: string;
};

/** Шапка открытого чата. У поддержки нет карточки жилья. */
export type ConversationHeading = ListingConversationHeading | DirectConversationHeading;
