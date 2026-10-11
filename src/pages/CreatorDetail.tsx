import { Link, useParams } from "react-router-dom";
import { CREATORS } from "@/lib/mockData";
import { formatCompact, formatPrice } from "@/lib/utils";
import NotFound from "@/pages/NotFound";
import { useReadOnly } from "@/hooks/useReadOnly";

export default function CreatorDetail() {
  const { id } = useParams();
  const creator = CREATORS.find((c) => c.id === id);
  const isReadOnly = useReadOnly();
  if (!creator) return <NotFound />;

  return (
    <div>
      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden bg-muted md:h-80">
        <img src={creator.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container -mt-24 pb-16">
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
            {isReadOnly ? (
              <span className="pill border-amber-500/40 bg-amber-50 text-amber-800">
                ⊘ Consultation
              </span>
            ) : (
              <Link to={`/creators/${creator.id}/order`} className="btn-primary">Commander une vidéo</Link>
            )}
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
              <p className="label-base">Tarif de base</p>
              <p className="mt-2 font-display text-4xl font-semibold num">{formatPrice(creator.pricePerVideo)}</p>
              <p className="mt-1 text-xs text-muted-foreground">par vidéo · 2 révisions incluses</p>
              {isReadOnly ? (
                <div className="mt-5 rounded-sm border border-dashed border-amber-500/40 bg-amber-50/50 p-3 text-center text-[11px] leading-snug text-amber-900">
                  ⊘ Commande indisponible — accès en consultation
                </div>
              ) : (
                <Link to={`/creators/${creator.id}/order`} className="btn-primary mt-5 w-full">
                  Démarrer une commande
                </Link>
              )}
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
