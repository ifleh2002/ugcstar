export type CreatorCategory = "Beauté" | "Food" | "Lifestyle" | "Tech" | "Mode" | "Sport" | "Famille" | "Voyage";
export type VideoStyle = "Testimonial" | "Unboxing" | "Tutorial" | "Narrative" | "Skit";
export type Visibility = "public" | "private";
export type OrderStatus = "briefing" | "en_production" | "en_validation" | "validee" | "rejetee" | "livree";
export type ContractStatus = "en_attente" | "signe" | "annule";
export type ContractTemplateId = "ugc-standard" | "exclusivity" | "long-format";
export type MessageAuthor = "client" | "star" | "plateforme";

export interface Creator {
  demo?: boolean;
  aiPrice?: number;
  realPrice?: number;
  socials?: { network: string; url: string; followers: number }[];
  id: string;
  name: string;
  handle: string;
  tagline: string;
  avatar: string;
  cover: string;
  city: string;
  country?: string;
  languages: string[];
  categories: CreatorCategory[];
  styles: VideoStyle[];
  followers: number;
  avgViews: number;
  engagement: number;
  rating: number;
  reviews: number;
  pricePerVideo: number;
  turnaroundDays: number;
  verified: boolean;
  bio: string;
  portfolio: PortfolioItem[];
}

export interface PortfolioItem {
  url?: string;
  id: string;
  title: string;
  cover: string;
  duration: number;
  brand: string;
  visibility: Visibility;
}

export interface Order {
  id: string;
  creatorId: string;
  brand: string;
  product: string;
  style: VideoStyle;
  duration: number;
  voiceover: "oui_fr" | "oui_en" | "non";
  briefing: string;
  budget: number;
  status: OrderStatus;
  createdAt: string;
  dueDate: string;
  renderUrl?: string;
  renderThumbnail?: string;
  revisionsUsed: number;
  revisionsAllowed: number;
  templateId?: ContractTemplateId;
}

export interface Message {
  id: string;
  orderId: string;
  author: MessageAuthor;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  orderId: string;
  brand: string;
  creatorName: string;
  amount: number;
  issuedAt: string;
  status: ContractStatus;
  signedBy: string[];
  templateId?: ContractTemplateId;
}

export interface Screen {
  id: string;
  name: string;
  location: string;
  resolution: string;
  status: "online" | "offline" | "syncing";
  lastHeartbeat: string;
  group: string;
}

export interface Playlist {
  id: string;
  name: string;
  loop: boolean;
  totalDuration: number;
  items: PlaylistItem[];
  screenGroups: string[];
}

export interface PlaylistItem {
  id: string;
  title: string;
  cover: string;
  duration: number;
  creator: string;
  order: number;
}

export interface ScheduleSlot {
  id: string;
  playlistId: string;
  day: "Lun" | "Mar" | "Mer" | "Jeu" | "Ven" | "Sam" | "Dim";
  startHour: number;
  endHour: number;
}
