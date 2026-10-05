declare const chatPhotoUrlBrand: unique symbol;

/** Адрес фото сообщения: объектный URL или путь к статике. */
export type ChatPhotoUrl = string & { readonly [chatPhotoUrlBrand]: true };

export type ChatPhoto = {
  readonly url: ChatPhotoUrl;
  readonly alt: string;
};

/** Пустая строка не становится адресом фото. */
export function chatPhotoUrl(value: string): ChatPhotoUrl | null {
  if (value.trim().length === 0) {
    return null;
  }
  return value as ChatPhotoUrl;
}
