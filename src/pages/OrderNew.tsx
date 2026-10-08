import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, useAuth, useRemote } from "@/lib/api";
import type { Creator, Order } from "@/types";
import type { VideoStyle } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";

const STYLES: VideoStyle[] = ["Testimonial", "Unboxing", "Tutorial", "Narrative", "Skit"];

export default function OrderNew() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: creators, error } = useRemote<Creator[]>("/stars", []);
  const { user } = useAuth();
  const creator = creators.find((c) => c.id === id);
  const [videoType, setVideoType] = useState<"ai" | "real">("ai");
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [style, setStyle] = useState<VideoStyle>("Testimonial");
  const [duration, setDuration] = useState(30);
  const [voiceover, setVoiceover] = useState<"oui_fr" | "oui_en" | "non">("oui_fr");
  const [briefing, setBriefing] = useState("");

  if (error) return <p role="alert" className="container py-10">{error}</p>;
  if (!creator) return creators.length ? <NotFound /> : <p className="container py-10">Chargement du profil…</p>;

  const base = videoType === "ai" ? creator.aiPrice || creator.pricePerVideo : creator.realPrice || creator.pricePerVideo * 2;
  const total = base + (duration > 60 ? 200 : 0) + (voiceover !== "non" ? 80 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { nav('/connexion?next=' + encodeURIComponent(location.pathname)); return; }
    setBusy(true);
    try {
      const order = await api<Order>('/orders', {creatorId:creator.id, brand,product,style,duration,voiceover,briefing,videoType});
      toast.success('Commande enregistrée. La plateforme prend en charge la production.');
      nav('/orders/'+order.id);
    } catch(e) { toast.error((e as Error).message); } finally { setBusy(false); }
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
            sera préparé par la plateforme avant production. Les droits d’image et de voix doivent être autorisés par la star.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <fieldset><legend className="label-base">Mode de production</legend><div className="grid sm:grid-cols-2 gap-3 mt-3">{(["ai","real"] as const).map(type=><button type="button" key={type} aria-pressed={videoType===type} onClick={()=>setVideoType(type)} className={(videoType===type?'border-primary bg-primary/5':'border-border')+' border rounded-md p-5 text-left'}><strong className="block">{type==='ai'?'✦ Vidéo IA · créée par StarCast':'◎ Vidéo réelle · tournage avec la star'}</strong><span className="block text-sm text-muted-foreground mt-2">{type==='ai'?'La plateforme génère et monte la vidéo avec les droits autorisés.':'Tournage authentique, coordination et montage : tarif et délai supérieurs.'}</span><span className="block font-semibold mt-3">{formatPrice(type==='ai'?creator.aiPrice||0:creator.realPrice||0)}</span></button>)}</div></fieldset>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label-base">Nom de la marque</label>
                <input required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex. Lumi Cosmetics" className="input-base mt-2" />
              </div>
              <div>
                <label className="label-base">Produit / service</label>
                <input required value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex. Sérum Éclat" className="input-base mt-2" />
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
                    className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
                      style === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-base">Durée · {duration}s</label>
              <input
                type="range"
                min={15}
                max={90}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) === 75 ? 90 : Number(e.target.value))}
                className="mt-3 w-full accent-[hsl(var(--primary))]"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground num">
                <span>15s</span>
                <span>60s</span>
                <span>90s</span>
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
                    className={`rounded-sm border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      voiceover === opt.v
                        ? "border-secondary bg-secondary text-secondary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-base">Briefing détaillé</label>
              <textarea
                required value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                rows={6}
                placeholder="Objectif, ambiance, références visuelles, mentions obligatoires, Call-to-action…"
                className="input-base mt-2 resize-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <Link to={`/creators/${creator.id}`} className="btn-ghost">Annuler</Link>
              <button type="submit" disabled={busy} className="btn-primary">{busy?"Enregistrement…":"Envoyer la commande"}</button>
            </div>
          </form>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card-base p-6">
            <div className="flex items-center gap-3">
              <img src={creator.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-display text-base font-semibold">{creator.name}</p>
                <p className="text-xs text-muted-foreground">Délai moyen · {creator.turnaroundDays + (videoType === "real" ? 5 : 0)} jours</p>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tarif de base</span><span className="font-display font-semibold num">{formatPrice(base)}</span></div>
              {duration > 60 && <div className="flex justify-between"><span className="text-muted-foreground">Supplément durée (&gt;60s)</span><span className="font-display font-semibold num">+ 200 €</span></div>}
              {voiceover !== "non" && <div className="flex justify-between"><span className="text-muted-foreground">Voix off</span><span className="font-display font-semibold num">+ 80 €</span></div>}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="label-base">Total</span>
              <span className="font-display text-3xl font-semibold text-primary num">{formatPrice(total)}</span>
            </div>
          </div>
          <div className="card-base p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="label-base text-foreground">Inclus</p>
            <ul className="mt-3 space-y-2">
              <li>· Messagerie tripartite tracée</li>
              <li>· 2 cycles de révisions</li>
              <li>· Validation du rendu avant livraison</li>
              <li>· Production coordonnée par StarCast</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
