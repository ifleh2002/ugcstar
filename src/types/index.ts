export type CreatorCategory = "Beauté" | "Food" | "Lifestyle" | "Tech" | "Mode" | "Sport" | "Famille" | "Voyage";
export type VideoStyle = "Testimonial" | "Unboxing" | "Tutorial" | "Narrative" | "Skit";
export type Visibility = "public" | "private";
export type OrderStatus = "briefing" | "en_production" | "en_validation" | "validee" | "rejetee" | "livree";
export type ContractStatus = "en_attente" | "signe" | "annule";
export type MessageAuthor = "client" | "star" | "plateforme";

export interface Creator {
  aiPrice?: number; realPrice?: number; commissionRate?: number; approved?: boolean; aiConsent?: boolean; demo?: boolean; socials?: {network:string;followers:number}[];
  id: string;
  name: string;
  handle: string;
  tagline: string;
  avatar: string;
  cover: string;
  city: string;
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
  id: string;
  title: string;
  cover: string;
  duration: number;
  brand: string;
  visibility: Visibility;
}

export interface Order {
  userId?: string; videoType?: "ai" | "real"; paymentStatus?: "pending" | "paid" | "refunded"; commission?: number; commissionRate?: number;
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
