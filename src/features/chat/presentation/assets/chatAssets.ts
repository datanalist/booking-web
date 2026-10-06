import attachPhotoIcon from "./attach-photo-icon.svg";
import avatarAnna from "./avatar-anna.jpg";
import avatarEkaterina from "./avatar-ekaterina.jpg";
import avatarHost from "./avatar-host.png";
import avatarIgnat from "./avatar-ignat.png";
import avatarIlya from "./avatar-ilya.jpg";
import avatarSupport from "./avatar-support.png";
import avatarSidebar from "./avatar-sidebar.jpg";
import brandLogo from "./brand-logo.svg";
import listingCover from "./listing-cover.jpg";
import listingMetaDot from "./listing-meta-dot.svg";
import listingThumbnail from "./listing-thumbnail.png";
import messagePhoto from "./message-photo.png";
import searchIcon from "./search-icon.svg";
import selectChatIllustration from "./select-chat-illustration.svg";
import sendIcon from "./send-icon.svg";
import sidebarIconBookings from "./sidebar-icon-bookings.svg";
import sidebarIconChatsActive from "./sidebar-icon-chats-active.svg";
import sidebarIconChats from "./sidebar-icon-chats.svg";
import sidebarIconListings from "./sidebar-icon-listings.svg";
import sidebarIconNotifications from "./sidebar-icon-notifications.svg";
import sidebarIconProfile from "./sidebar-icon-profile.svg";

/**
 * Статические картинки макета чата арендодатель ↔ модератор.
 * Растровые файлы — исходники заливок Figma; круглые аватарки собирает вёрстка.
 */
export const chatAssets = {
  selectChatIllustration,
  attachPhotoIcon,
  sendIcon,
  searchIcon,
  listingMetaDot,
  brandLogo,
  sidebarIconListings,
  sidebarIconBookings,
  sidebarIconChats,
  sidebarIconChatsActive,
  sidebarIconNotifications,
  sidebarIconProfile,
  avatarSupport,
  avatarHost,
  avatarEkaterina,
  guestMessageAvatar: avatarEkaterina,
  avatarIgnat,
  avatarAnna,
  moderatorAvatar: avatarHost,
  avatarIlya,
  avatarSidebar,
  listingCover,
  listingThumbnail,
  messagePhoto,
} as const;
