export type UserRole = "admin" | "collaborator" | "user" | "creator";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  collaborator: "Collaborateur",
  user: "Marque / Annonceur",
  creator: "Créateur / Star",
};

export const ROLE_SHORT: Record<UserRole, string> = {
  admin: "Admin",
  collaborator: "Collab",
  user: "Marque",
  creator: "Créateur",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Supervise la plateforme, les comptes, paiements et commissions.",
  collaborator: "Équipe interne StarCast, pilote la relation client et les projets.",
  user: "Entreprise ou marque — commandes, contrats, validation et messagerie.",
  creator: "Créateur ou star qui produit du contenu vidéo pour les marques.",
};

export const ROLE_SYMBOLS: Record<UserRole, string> = {
  admin: "◆",
  collaborator: "◇",
  user: "◼",
  creator: "★",
};
