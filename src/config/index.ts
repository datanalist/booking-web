export const SERVICE_COMMISSION_RATE = 0.09;
export const DESKTOP_MIN_WIDTH = 1280;
export const CANVAS_WIDTH = 1440;
export const CANVAS_HEIGHT = 1020;
export const DESCRIPTION_MAX = 500;
export const PHOTO_MIN = 6;
export const PHOTO_MAX = 9;
export const PASSWORD_MIN = 8;
export const NAME_MIN = 2;
export const NAME_MAX = 50;

export const HOUSING_LABELS = {
  apartment: "Квартира",
  apartments: "Апартаменты",
  studio: "Студия",
  house: "Дом",
  room: "Комната",
} as const;

export const AMENITY_LABELS = {
  wifi: "Wifi",
  tv: "Телевизор",
  ac: "Кондиционер",
  heater: "Обогреватель",
  hairdryer: "Фен",
  iron: "Утюг",
  kitchen: "Кухня",
  washer: "Стиральная машина",
  dishes: "Посуда",
} as const;

export const EXTRA_AMENITY_LABELS = {
  breakfast: "Завтраки",
  pool: "Бассейн",
  fireplace: "Камин",
  smoking: "Разрешено курение",
  gym: "Спортзал",
  selfCheckIn: "Самостоятельное заселение",
  sauna: "Сауна",
  parking: "Парковка",
} as const;

export const STATUS_LABELS = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликовано",
  archived: "Архив",
} as const;
