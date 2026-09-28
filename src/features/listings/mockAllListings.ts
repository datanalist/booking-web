import type { ListingTableRow } from "./ListingTableRow";

/**
 * Единый локальный мок «Мои объявления» — смесь статусов для всех вкладок
 * (макеты Figma 1:18879 / 1:19061 / 1:19171 / 1:18957).
 */
export const MOCK_ALL_LISTINGS: readonly ListingTableRow[] = [
  {
    id: "mock-1",
    title: "Уютная студия в центре Москвы",
    address: "Москва, ул. Невская 48",
    housingType: "apartment",
    status: "moderation",
    coverUrl: "/listings/cover-studio.jpg",
  },
  {
    id: "mock-2",
    title: "Частный дом в 10 км от Москвы",
    address: "Лесной, ул. Летняя 3",
    housingType: "house",
    status: "published",
    coverUrl: "/listings/cover-house.jpg",
  },
  {
    id: "mock-3",
    title: "Квартира в старом городе",
    address: "Москва, ул. Невская 48",
    housingType: "apartment",
    status: "unpublished",
    coverUrl: "/listings/cover-apartment.jpg",
  },
  {
    id: "mock-4",
    title: "Частный дом в 10 км от Москвы",
    address: "Лесной, ул. Летняя 3",
    housingType: "house",
    status: "published",
    coverUrl: "/listings/cover-house-2.jpg",
  },
  {
    id: "mock-5",
    title: "Апартаменты для семьи",
    address: "Лесной, ул. Летняя 3",
    housingType: "apartment",
    status: "published",
    coverUrl: "/listings/cover-studio-2.jpg",
  },
  {
    id: "mock-6",
    title: "Квартира в старом городе",
    address: "Лесной, ул. Летняя 3",
    housingType: "apartment",
    status: "moderation",
    coverUrl: "/listings/cover-apartment.jpg",
  },
  {
    id: "mock-7",
    title: "Уютная студия в центре Москвы",
    address: "Москва, ул. Невская 48",
    housingType: "apartment",
    status: "unpublished",
    coverUrl: "/listings/cover-studio.jpg",
  },
  {
    id: "mock-8",
    title: "Частный дом в 10 км от Москвы",
    address: "Лесной, ул. Летняя 3",
    housingType: "house",
    status: "published",
    coverUrl: "/listings/cover-house.jpg",
  },
];
