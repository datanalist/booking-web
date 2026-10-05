/** Шапка открытого чата: собеседник и объявление, только примитивы. */
export type ConversationHeading = {
  readonly peerName: string;
  readonly peerAvatarUrl: string;
  readonly listingTitle: string;
  readonly city: string;
  readonly datesLabel: string;
  readonly guestsLabel: string;
  readonly listingThumbUrl: string;
};
