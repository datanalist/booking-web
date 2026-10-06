import { defineChatSeed, type ChatSeed } from "./defineChatSeed";
import type { ChatId } from "../domain/ChatId";

/**
 * Единый сид чатов. Превью, время и непрочитанные списка считаются отсюда,
 * а не дублируются в строках списка.
 */
const EKATERINA = defineChatSeed({
  id: "chat-ekaterina",
  counterpartName: "Екатерина Кондратьева",
  counterpartRole: "guest",
  avatarKey: "ekaterina",
  dateLabel: "10 сентября",
  listingTitle: "Уютная студия в центре Москвы",
  city: "Москва",
  datesLabel: "12.09.24 - 15.09.24",
  guestsLabel: "4 гостя",
  earlier: [
    {
      kind: "text",
      id: "11111111-1111-4111-8111-111111111111",
      author: "peer",
      time: "10:05",
      body: "Добрый день, возможно ли раннее заселение? Мы приезжаем к 12:30",
      receipt: "read",
    },
    {
      kind: "text",
      id: "22222222-2222-4222-8222-222222222222",
      author: "self",
      time: "10:05",
      body: "Здравствуйте, Екатерина , к сожаланию, жилье еще не будет готово к заселению в 12:30. Но вы можете оставить багаж на 1 этаже в служебном помещении до момента заселения",
      receipt: "read",
    },
    {
      kind: "text",
      id: "33333333-3333-4333-8333-333333333333",
      author: "self",
      time: "10:07",
      body: "Помещение находится слева от лифта, код двери 348957",
      receipt: "read",
    },
    {
      kind: "photo",
      id: "44444444-4444-4444-8444-444444444444",
      author: "self",
      time: "10:07",
      alt: "Фото помещения у лифта",
      slot: "message",
      receipt: "read",
    },
    {
      kind: "text",
      id: "55555555-5555-4555-8555-555555555555",
      author: "peer",
      time: "13:20",
      body: "Оплату перевела, чек придёт следом",
      receipt: "unread",
    },
  ],
  last: {
    kind: "text",
    id: "66666666-6666-4666-8666-666666666666",
    author: "peer",
    time: "13:40",
    body: "Добрый день, бронирование оплачено",
    receipt: "unread",
  },
});

const IGNAT = defineChatSeed({
  id: "chat-ignat",
  counterpartName: "Игнат Прокопенко",
  counterpartRole: "guest",
  avatarKey: "ignat",
  dateLabel: "10 сентября",
  listingTitle: "Частный дом в 10 км от Москвы",
  city: "Лесной",
  datesLabel: "12.09.24 - 14.09.24",
  guestsLabel: "2 гостя",
  earlier: [
    {
      kind: "text",
      id: "a1000001-0001-4001-8001-000000000001",
      author: "peer",
      time: "11:02",
      body: "Здравствуйте, мы забронировали дом на выходные",
      receipt: "read",
    },
    {
      kind: "text",
      id: "a1000002-0002-4002-8002-000000000002",
      author: "self",
      time: "11:10",
      body: "Добрый день, Игнат. Бронь вижу, заезд с 15:00",
      receipt: "read",
    },
    {
      kind: "text",
      id: "a1000003-0003-4003-8003-000000000003",
      author: "peer",
      time: "11:24",
      body: "Можно приехать раньше, если жильё свободно?",
      receipt: "read",
    },
    {
      kind: "text",
      id: "a1000004-0004-4004-8004-000000000004",
      author: "self",
      time: "12:05",
      body: "Раньше 14:00 не получится, идёт уборка",
      receipt: "read",
    },
  ],
  last: {
    kind: "text",
    id: "a1000005-0005-4005-8005-000000000005",
    author: "peer",
    time: "13:40",
    body: "Хочу уточнить время заселения на 12 число",
    receipt: "read",
  },
});

const ANNA = defineChatSeed({
  id: "chat-anna",
  counterpartName: "Анна Иваненко",
  counterpartRole: "guest",
  avatarKey: "anna",
  dateLabel: "10 сентября",
  listingTitle: "Квартира в старом городе",
  city: "Москва",
  datesLabel: "18.09.24 - 21.09.24",
  guestsLabel: "3 гостя",
  earlier: [
    {
      kind: "text",
      id: "b2000001-0001-4001-8001-000000000001",
      author: "peer",
      time: "09:15",
      body: "Добрый день, хотим приехать с собакой",
      receipt: "read",
    },
    {
      kind: "text",
      id: "b2000002-0002-4002-8002-000000000002",
      author: "self",
      time: "09:40",
      body: "Здравствуйте, Анна. Питомцы разрешены, доплата 500 ₽",
      receipt: "read",
    },
    {
      kind: "photo",
      id: "b2000003-0003-4003-8003-000000000003",
      author: "peer",
      time: "09:55",
      alt: "Двор дома",
      slot: "cover",
      receipt: "read",
    },
    {
      kind: "text",
      id: "b2000004-0004-4004-8004-000000000004",
      author: "self",
      time: "10:12",
      body: "Да, это двор дома, калитка с кодом в инструкции",
      receipt: "read",
    },
    {
      kind: "text",
      id: "b2000005-0005-4005-8005-000000000005",
      author: "peer",
      time: "12:30",
      body: "Отлично, тогда бронируем",
      receipt: "read",
    },
  ],
  last: {
    kind: "text",
    id: "b2000006-0006-4006-8006-000000000006",
    author: "peer",
    time: "13:40",
    body: "Можно ли подвинуть бронь на два дня?",
    receipt: "read",
  },
});

const ILYA = defineChatSeed({
  id: "chat-ilya",
  counterpartName: "Илья Филипов",
  counterpartRole: "guest",
  avatarKey: "ilya",
  dateLabel: "10 сентября",
  listingTitle: "Апартаменты для семьи",
  city: "Москва",
  datesLabel: "02.10.24 - 06.10.24",
  guestsLabel: "5 гостей",
  earlier: [
    {
      kind: "text",
      id: "c3000001-0001-4001-8001-000000000001",
      author: "self",
      time: "08:50",
      body: "Илья, отправил схему проезда к дому",
      receipt: "read",
    },
    {
      kind: "text",
      id: "c3000002-0002-4002-8002-000000000002",
      author: "peer",
      time: "09:05",
      body: "Схему вижу, от метро минут двадцать",
      receipt: "read",
    },
    {
      kind: "text",
      id: "c3000003-0003-4003-8003-000000000003",
      author: "self",
      time: "09:18",
      body: "Да, по двору направо, домофон 24",
      receipt: "read",
    },
  ],
  last: {
    kind: "text",
    id: "c3000004-0004-4004-8004-000000000004",
    author: "peer",
    time: "13:40",
    body: "Понял, спасибо за быстрый ответ",
    receipt: "read",
  },
});

export const CHAT_SEEDS: readonly ChatSeed[] = [EKATERINA, IGNAT, ANNA, ILYA];

export function chatSeedById(id: ChatId): ChatSeed | undefined {
  return CHAT_SEEDS.find((seed) => seed.id === id);
}
