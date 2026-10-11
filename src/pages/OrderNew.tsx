import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CREATORS } from "@/lib/mockData";
import type { ContractTemplateId, VideoStyle } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { useReadOnly } from "@/hooks/useReadOnly";
import {
  CONTRACT_TEMPLATES,
  formatPriceImpact,
  getTemplate,
  getTemplateSurcharge,
} from "@/lib/contractTemplates";

const STYLES: VideoStyle[] = ["Testimonial", "Unboxing", "Tutorial", "Narrative", "Skit"];

export default function OrderNew() {
  const { id } = useParams();
  const nav = useNavigate();
  const creator = CREATORS.find((c) => c.id === id);

  const [templateId, setTemplateId] = useState<ContractTemplateId>("ugc-standard");
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [style, setStyle] = useState<VideoStyle>("Testimonial");
  const [duration, setDuration] = useState(30);
  const [voiceover, setVoiceover] = useState<"oui_fr" | "oui_en" | "non">("oui_fr");
  const [briefing, setBriefing] = useState("");
  const isReadOnly = useReadOnly();

  if (!creator) return <NotFound />;

  if (isReadOnly) {
    return (
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-xl">
          <Link to={`/creators/${creator.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour au profil
          </Link>
          <div className="mt-6 card-base p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 font-display text-2xl text-amber-700">
              ⊘
            </div>
            <span className="mt-5 inline-block label-base text-amber-700">
              Accès en consultation
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Création de commande indisponible
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Votre compte <strong className="text-foreground">Marque / Annonceur</strong> est en lecture seule.
              Pour commander une vidéo auprès de <strong className="text-foreground">{creator.name}</strong>,
              contactez votre interlocuteur StarCast qui pourra émettre le brief et le contrat en votre nom.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/dashboard" className="btn-outline">Mes commandes</Link>
              <Link to="/creators" className="btn-primary">Explorer les créateurs</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const template = getTemplate(templateId);

  const handleTemplateChange = (id: ContractTemplateId) => {
    setTemplateId(id);
    const t = getTemplate(id);
    setDuration((prev) => {
      if (prev < t.minDuration) return t.recommendedDuration;
      if (prev > t.maxDuration) return t.recommendedDuration;
      return prev;
    });
  };

  const templateSurcharge = getTemplateSurcharge(creator.pricePerVideo, template);
  const durationSurcharge = template.id !== "long-format" && duration > 60 ? 200 : 0;
  const voiceoverSurcharge = voiceover !== "non" ? 80 : 0;
  const total = creator.pricePerVideo + templateSurcharge + durationSurcharge + voiceoverSurcharge;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !product || !briefing) {
      toast.error("Veuillez renseigner tous les champs du brief.");
      return;
    }
    toast.success(`Simulation de commande · Modèle « ${template.name} »`, {
      description: "Données de démonstration : aucune commande ni aucun contrat n’a été envoyé.",
    });
    setTimeout(() => nav("/dashboard"), 900);
  };

  return (
    <div className="container py-10 md:py-14">
      <Link to={`/creators/${creator.id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Retour au profil
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <span className="label-base">Nouvelle commande</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Brief pour {creator.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Décrivez précisément votre besoin : plus le brief est détaillé, meilleur sera le rendu. Un contrat
            PDF sera généré automatiquement après signature électronique des deux parties.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            {/* Template picker */}
            <section>
              <div className="flex items-end justify-between">
                <label className="label-base">1 — Modèle de contrat</label>
                <span className="text-[11px] text-muted-foreground">Bibliothèque StarCast</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {CONTRACT_TEMPLATES.map((t) => {
                  const selected = templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateChange(t.id)}
                      aria-pressed={selected}
                      className={cn(
                        "group relative flex h-full flex-col rounded-sm border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-background hover:border-foreground/50 hover:bg-muted/40",
                      )}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          ✓
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl text-primary">{t.symbol}</span>
                        <span
                          className={cn(
                            "pill",
                            selected && "border-primary/40 bg-primary/10 text-primary",
                          )}
                        >
                          {t.badge}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-base font-semibold leading-tight">{t.name}</h3>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t.tagline}</p>
                      <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                        {t.features.map((f) => (
                          <li key={f} className="flex gap-1.5">
                            <span className="text-primary">·</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
                        <span className="label-base">Impact</span>
                        <span className="font-display font-semibold num text-foreground">
                          {formatPriceImpact(t)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {template.description}
              </p>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-6">
              <label className="label-base block">2 — Spécifications du contenu</label>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label-base">Nom de la marque</label>
                  <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex. Lumi Cosmetics" className="input-base mt-2" />
                </div>
                <div>
                  <label className="label-base">Produit / service</label>
                  <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex. Sérum Éclat" className="input-base mt-2" />
                </div>
              </div>

              <div>
                <label className="label-base">Style de vidéo</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={cn(
                        "rounded-sm border px-4 py-2 text-sm font-medium transition-colors",
                        style === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between">
                  <label className="label-base">
                    Durée · <span className="num text-foreground">{duration}s</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground num">
                    Plage {template.name} : {template.minDuration}–{template.maxDuration}s
                  </span>
                </div>
                <input
                  type="range"
                  min={template.minDuration}
                  max={template.maxDuration}
                  step={template.durationStep}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-3 w-full accent-[hsl(var(--primary))]"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground num">
                  <span>{template.minDuration}s</span>
                  <span>{Math.round((template.minDuration + template.maxDuration) / 2)}s</span>
                  <span>{template.maxDuration}s</span>
                </div>
              </div>

              <div>
                <label className="label-base">Voix off</label>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {[
                    { v: "oui_fr", l: "Oui — Français" },
                    { v: "oui_en", l: "Oui — Anglais" },
                    { v: "non", l: "Pas de voix off" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setVoiceover(opt.v as typeof voiceover)}
                      className={cn(
                        "rounded-sm border px-4 py-3 text-left text-sm font-medium transition-colors",
                        voiceover === opt.v
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-base">Briefing détaillé</label>
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  rows={6}
                  placeholder="Objectif, ambiance, références visuelles, mentions obligatoires, call-to-action…"
                  className="input-base mt-2 resize-none"
                />
              </div>
            </section>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <Link to={`/creators/${creator.id}`} className="btn-ghost">Annuler</Link>
              <button type="submit" className="btn-primary">Envoyer la commande</button>
            </div>
          </form>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card-base p-6">
            <div className="flex items-center gap-3">
              <img src={creator.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-display text-base font-semibold">{creator.name}</p>
                <p className="text-xs text-muted-foreground">
                  Délai · {creator.turnaroundDays + template.turnaroundExtraDays} jours
                  {template.turnaroundExtraDays > 0 && (
                    <span className="text-primary"> (+{template.turnaroundExtraDays}j modèle)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif de base</span>
                <span className="font-display font-semibold num">{formatPrice(creator.pricePerVideo)}</span>
              </div>
              {templateSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Modèle <span className="text-foreground">{template.name}</span>
                  </span>
                  <span className="font-display font-semibold num text-primary">
                    + {formatPrice(templateSurcharge)}
                  </span>
                </div>
              )}
              {durationSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée &gt; 60s</span>
                  <span className="font-display font-semibold num">+ {formatPrice(durationSurcharge)}</span>
                </div>
              )}
              {voiceoverSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voix off</span>
                  <span className="font-display font-semibold num">+ {formatPrice(voiceoverSurcharge)}</span>
                </div>
              )}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="label-base">Total</span>
              <span className="font-display text-3xl font-semibold text-primary num">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <h3 className="label-base">Modèle sélectionné</h3>
              <span className="font-display text-sm text-primary">{template.symbol}</span>
            </div>
            <p className="mt-3 font-display text-base font-semibold">{template.name}</p>
            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Droits d'exploitation</dt>
                <dd className="font-semibold num">{template.rightsDurationMonths} mois</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Exclusivité</dt>
                <dd className="font-semibold">{template.exclusivity ? "Oui — sectorielle" : "Non"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Révisions incluses</dt>
                <dd className="font-semibold num">{template.revisionCycles}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-border pt-3">
              <p className="label-base">Supports autorisés</p>
              <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {template.usageRights.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card-base p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="label-base text-foreground">Inclus dans toute commande</p>
            <ul className="mt-3 space-y-2">
              <li>· Messagerie tripartite tracée</li>
              <li>· Contrat PDF avec signature dessinée</li>
              <li>· Diffusion Screenads activable</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
