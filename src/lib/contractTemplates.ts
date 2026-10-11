import type { ContractTemplateId } from "@/types";

export interface TemplateClause {
  title: string;
  content: string;
}

export interface ContractTemplate {
  id: ContractTemplateId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  symbol: string;
  priceMultiplier: number;
  flatSurcharge: number;
  rightsDurationMonths: number;
  exclusivity: boolean;
  minDuration: number;
  maxDuration: number;
  durationStep: number;
  recommendedDuration: number;
  revisionCycles: number;
  usageRights: string[];
  turnaroundExtraDays: number;
  features: string[];
  clauses: TemplateClause[];
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "ugc-standard",
    name: "UGC Standard",
    tagline: "Format court, droits souples",
    description:
      "Idéal pour tester un angle créatif ou activer rapidement un créneau social. Cession non-exclusive de six mois sur les supports digitaux organiques.",
    badge: "Populaire",
    symbol: "◼",
    priceMultiplier: 1,
    flatSurcharge: 0,
    rightsDurationMonths: 6,
    exclusivity: false,
    minDuration: 15,
    maxDuration: 60,
    durationStep: 5,
    recommendedDuration: 30,
    revisionCycles: 2,
    usageRights: ["Réseaux sociaux", "Site web annonceur", "Email marketing"],
    turnaroundExtraDays: 0,
    features: [
      "Non-exclusif",
      "6 mois d'exploitation",
      "2 cycles de révision",
      "Livraison standard",
    ],
    clauses: [
      {
        title: "Article 1 — Objet",
        content:
          "Production d'une vidéo UGC (User Generated Content) à vocation publicitaire courte, conforme aux spécifications décrites dans la commande enregistrée sur la plateforme StarCast.",
      },
      {
        title: "Article 2 — Rémunération",
        content:
          "L'annonceur verse au créateur la somme forfaitaire indiquée ci-dessus, incluant la commission StarCast de 15 %. Aucune rémunération complémentaire ne pourra être exigée tant que l'usage reste conforme à l'article 3.",
      },
      {
        title: "Article 3 — Droits & cession",
        content:
          "Cession non-exclusive des droits d'exploitation pour une durée de six (6) mois sur les supports suivants : réseaux sociaux (organique), site web de l'annonceur et communication email. Toute diffusion TV, cinéma ou achat média payant nécessitera un avenant.",
      },
      {
        title: "Article 4 — Validation & livraison",
        content:
          "Deux (2) cycles de révision sont inclus. La vidéo est réputée validée après approbation explicite via la plateforme, ou à défaut, 72 heures après le dépôt du rendu.",
      },
      {
        title: "Article 5 — Confidentialité",
        content:
          "Les parties s'engagent à préserver la confidentialité des briefings et rushes échangés jusqu'à la publication officielle de la campagne.",
      },
    ],
  },
  {
    id: "exclusivity",
    name: "Exclusivité secteur",
    tagline: "Cession premium & non-concurrence",
    description:
      "Verrouille votre créateur sur votre marché pendant un an. Droits étendus tous supports (dont TV et Screenads) et clause de non-concurrence sectorielle.",
    badge: "Premium",
    symbol: "★",
    priceMultiplier: 1.8,
    flatSurcharge: 500,
    rightsDurationMonths: 12,
    exclusivity: true,
    minDuration: 20,
    maxDuration: 90,
    durationStep: 5,
    recommendedDuration: 45,
    revisionCycles: 3,
    usageRights: [
      "Tous supports digitaux",
      "TV & cinéma",
      "Affichage Screenads",
      "Achat média (SEA / SMA / display)",
    ],
    turnaroundExtraDays: 3,
    features: [
      "Exclusivité sectorielle 6 mois",
      "12 mois · tous supports",
      "3 cycles de révision",
      "Clause de non-concurrence",
    ],
    clauses: [
      {
        title: "Article 1 — Objet",
        content:
          "Production d'une vidéo publicitaire premium avec cession exclusive à l'annonceur, conformément aux spécifications décrites dans la commande StarCast.",
      },
      {
        title: "Article 2 — Rémunération & majoration exclusivité",
        content:
          "L'annonceur verse la somme totale indiquée ci-dessus. Cette somme intègre un supplément d'exclusivité ainsi que la commission plateforme StarCast de 15 %. Aucun paiement complémentaire ne pourra être exigé pour les supports listés à l'article 3 pendant la durée de cession.",
      },
      {
        title: "Article 3 — Cession exclusive des droits",
        content:
          "Cession exclusive des droits d'exploitation pour une durée de douze (12) mois. Supports autorisés : réseaux sociaux, sites web, applications mobiles, télévision, cinéma, affichage digital (réseau Screenads inclus), achat média payant (SEA / SMA / display). Territorialité : monde entier.",
      },
      {
        title: "Article 4 — Clause de non-concurrence",
        content:
          "Le créateur s'engage à ne produire aucun contenu publicitaire pour une marque directement concurrente de l'annonceur (même catégorie produit) pendant une durée de six (6) mois à compter de la date de signature du présent contrat.",
      },
      {
        title: "Article 5 — Validation & livraison",
        content:
          "Trois (3) cycles de révision sont inclus. Le délai de production intègre un délai supplémentaire de trois jours ouvrés lié au niveau d'exigence qualité requis par ce modèle premium.",
      },
      {
        title: "Article 6 — Confidentialité renforcée",
        content:
          "Les parties s'engagent à une confidentialité absolue sur l'ensemble des échanges, rushes, versions intermédiaires et éléments stratégiques, y compris après la fin du contrat, pour une durée de trois (3) ans.",
      },
    ],
  },
  {
    id: "long-format",
    name: "Long Format",
    tagline: "Interview, démo, documentaire",
    description:
      "Pour les formats narratifs longs : interviews fondateur, démos produit détaillées, mini-documentaires jusqu'à cinq minutes. Livraison multi-chapitres et archivage source.",
    badge: "Long format",
    symbol: "▶",
    priceMultiplier: 1.5,
    flatSurcharge: 300,
    rightsDurationMonths: 24,
    exclusivity: false,
    minDuration: 60,
    maxDuration: 300,
    durationStep: 15,
    recommendedDuration: 120,
    revisionCycles: 3,
    usageRights: [
      "YouTube & web long",
      "Site corporate",
      "Formation interne",
      "Événementiel pro",
    ],
    turnaroundExtraDays: 5,
    features: [
      "Jusqu'à 5 minutes",
      "24 mois d'exploitation",
      "Montage multi-chapitres",
      "Fichiers sources archivés",
    ],
    clauses: [
      {
        title: "Article 1 — Objet",
        content:
          "Production d'une vidéo au format long (interview, démonstration produit détaillée, mini-documentaire corporate ou tutoriel approfondi), conforme aux spécifications de la commande StarCast.",
      },
      {
        title: "Article 2 — Rémunération",
        content:
          "L'annonceur verse la somme totale ci-dessus, intégrant un supplément lié à la durée du contenu et à la complexité du montage multi-chapitres. Commission plateforme StarCast de 15 % incluse.",
      },
      {
        title: "Article 3 — Droits d'exploitation étendue",
        content:
          "Cession non-exclusive des droits pour une durée de vingt-quatre (24) mois sur : chaînes YouTube / Vimeo, site corporate, intranet et modules de formation interne, événements professionnels, salons et prises de parole publiques.",
      },
      {
        title: "Article 4 — Livraison multi-chapitres",
        content:
          "La vidéo sera livrée en version complète ainsi qu'en versions chapitrées (teaser 15s, extraits courts par chapitre), permettant une rediffusion segmentée sur réseaux sociaux. Trois (3) cycles de révision sont inclus.",
      },
      {
        title: "Article 5 — Archivage des fichiers sources",
        content:
          "Les fichiers sources (rushes 4K, projets de montage, pistes audio) seront archivés par StarCast pendant deux (2) ans et pourront être remis à l'annonceur sur simple demande, moyennant frais techniques.",
      },
      {
        title: "Article 6 — Confidentialité",
        content:
          "Les parties s'engagent à préserver la confidentialité des interviews, documents et informations échangés jusqu'à la publication officielle du contenu.",
      },
    ],
  },
];

export function getTemplate(id: ContractTemplateId | undefined): ContractTemplate {
  return CONTRACT_TEMPLATES.find((t) => t.id === id) ?? CONTRACT_TEMPLATES[0];
}

export function getTemplateSurcharge(basePrice: number, template: ContractTemplate): number {
  return Math.round(basePrice * (template.priceMultiplier - 1)) + template.flatSurcharge;
}

export function formatPriceImpact(template: ContractTemplate): string {
  if (template.priceMultiplier === 1 && template.flatSurcharge === 0) return "Prix standard";
  const pct = Math.round((template.priceMultiplier - 1) * 100);
  const parts: string[] = [];
  if (pct > 0) parts.push(`+${pct}%`);
  if (template.flatSurcharge > 0) parts.push(`+${template.flatSurcharge} €`);
  return parts.join(" · ");
}
