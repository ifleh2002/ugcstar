import { Link, useParams } from "react-router-dom";
import { useRemote } from "@/lib/api";
import type {Creator} from "@/types";
import { formatCompact, formatPrice } from "@/lib/utils";
import NotFound from "@/pages/NotFound";

export default function CreatorDetail() {
  const { id } = useParams();
  const {data:CREATORS,error}=useRemote<Creator[]>("/stars",[]);
  const {data:reviews}=useRemote<{id:string;creatorId:string;name:string;rating:number;content:string}[]>("/reviews",[]);
  const creator = CREATORS.find((c) => c.id === id);
  if (!creator) return CREATORS.length ? <NotFound /> : <p className="container py-10">{error || "Chargement du profil…"}</p>;

  return (
    <div>
      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden bg-muted md:h-80">
        <img src={creator.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container relative -mt-24 pb-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-5">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="h-28 w-28 rounded-md border-4 border-background object-cover shadow-lg"
            />
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-4xl font-semibold tracking-tight">{creator.name}</h1>
                {creator.verified && <span className="pill border-secondary bg-secondary text-secondary-foreground">Vérifié</span>}
              </div>
              <p className="mt-1 text-base text-muted-foreground">{creator.handle} · {creator.city}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/creators" className="btn-outline">← Retour</Link>
            <Link to={`/creators/${creator.id}/order`} className="btn-primary">Commander une vidéo</Link>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="font-display text-xl leading-relaxed text-foreground">{creator.tagline}</p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">{creator.bio}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {creator.categories.map((c) => <span key={c} className="pill">{c}</span>)}
              {creator.styles.map((s) => <span key={s} className="pill border-primary/30 text-primary">{s}</span>)}
              {creator.languages.map((l) => <span key={l} className="pill">{l}</span>)}
            </div>

            <section className="mt-8 card-base p-6"><h2 className="text-xl">Réseaux sociaux & avis</h2><p className="mt-3">{creator.socials?.map(s=>s.network+' : '+formatCompact(s.followers)+' abonnés').join(' · ')||'Statistiques en cours de vérification'}</p><p className="mt-3 text-primary">{'★'.repeat(Math.round(creator.rating))} {creator.rating}/5 · {creator.reviews} avis {creator.demo?'de démonstration':''}</p><p className="mt-3 text-xs text-muted-foreground">Droits d’image et de voix validés avant production. Les statistiques initiales sont fictives.</p><h3 className="text-lg mt-6">Avis de clients après livraison</h3>{reviews.filter(r=>r.creatorId===creator.id).map(r=><div key={r.id} className="border-t mt-3 pt-3"><strong>{r.name} · {r.rating}/5</strong><p className="text-sm mt-2">{r.content}</p></div>)}{!reviews.some(r=>r.creatorId===creator.id)&&<p className="text-sm text-muted-foreground mt-3">Aucun avis de commande livrée pour le moment.</p>}</section>
            {/* Portfolio */}
            <section className="mt-14">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-3xl font-semibold">Bibliothèque partagée</h2>
                <span className="label-base">{creator.portfolio.length} éléments</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {creator.portfolio.map((p) => (
                  <article key={p.id} className="group card-base overflow-hidden">
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      {p.visibility === "private" ? (
                        <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground">
                          <div className="text-center">
                            <div className="font-display text-5xl">🔒</div>
                            <p className="mt-2 label-base text-primary">Privé — NDA</p>
                          </div>
                        </div>
                      ) : (
                        <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      )}
                      <span className="absolute left-3 top-3 pill bg-background/90 num">{p.duration}s</span>
                    </div>
                    <div className="p-4">
                      <p className="font-display text-base font-semibold line-clamp-1">{p.title}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{p.brand}</span>
                        <span className={p.visibility === "public" ? "text-foreground" : "text-primary"}>
                          {p.visibility === "public" ? "Public" : "Privé"}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Stats sidebar */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="card-base p-6">
              <p className="label-base">Vidéo IA · plateforme</p>
              <p className="mt-2 font-display text-4xl font-semibold num">{formatPrice(creator.aiPrice||creator.pricePerVideo)}</p>
              <p className="mt-1 text-xs text-muted-foreground">par vidéo · 2 révisions incluses</p>
              <p className="mt-3 text-sm">Vidéo réelle : <strong>{formatPrice(creator.realPrice||creator.pricePerVideo*2)}</strong></p><p className="mt-2 text-xs text-muted-foreground">L’IA est produite par StarCast. Le réel nécessite un tournage avec la star.</p>
              <Link to={`/creators/${creator.id}/order`} className="btn-primary mt-5 w-full">
                Démarrer une commande
              </Link>
            </div>
            <div className="card-base divide-y divide-border">
              {[
                { label: "Abonnés", value: formatCompact(creator.followers) },
                { label: "Vues moyennes", value: formatCompact(creator.avgViews) },
                { label: "Engagement", value: `${creator.engagement}%` },
                { label: "Note", value: `★ ${creator.rating} (${creator.reviews})` },
                { label: "Délai moyen", value: `${creator.turnaroundDays} jours` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="font-display text-base font-semibold num">{row.value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
