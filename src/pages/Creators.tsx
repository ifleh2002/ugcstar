import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CREATORS } from "@/lib/mockData";
import type { CreatorCategory, VideoStyle } from "@/types";
import { cn, formatCompact, formatPrice } from "@/lib/utils";

import { COUNTRIES } from "@/lib/marketing";
const CATEGORIES: CreatorCategory[] = ["Beauté", "Food", "Lifestyle", "Tech", "Mode", "Sport", "Famille", "Voyage"];
const STYLES: VideoStyle[] = ["Testimonial", "Unboxing", "Tutorial", "Narrative", "Skit"];

type SortKey = "rating" | "followers" | "price" | "turnaround";

export default function Creators() {
  const [params, setParams] = useSearchParams();
  const country = params.get("country") || "";
  const language = params.get("language") || "";
  const categoryParam = params.get("category") || "";
  const setFilterParam = (key: string, value: string) => { const next = new URLSearchParams(params); if(value) next.set(key,value); else next.delete(key); setParams(next); };
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<CreatorCategory[]>(CATEGORIES.includes(categoryParam as CreatorCategory) ? [categoryParam as CreatorCategory] : []);
  useEffect(() => { setCats(CATEGORIES.includes(categoryParam as CreatorCategory) ? [categoryParam as CreatorCategory] : []); }, [categoryParam]);
  const [styles, setStyles] = useState<VideoStyle[]>([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("rating");
  const [compare, setCompare] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let list = CREATORS.filter((c) => {
      if (country && c.country !== country) return false;
      if (language && !c.languages.includes(language)) return false;
      if (query && !`${c.name} ${c.tagline} ${c.city}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (cats.length && !c.categories.some((cat) => cats.includes(cat))) return false;
      if (styles.length && !c.styles.some((s) => styles.includes(s))) return false;
      if (c.pricePerVideo > maxPrice) return false;
      if (verifiedOnly && !c.verified) return false;
      return true;
    });
    list = list.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "followers") return b.followers - a.followers;
      if (sort === "price") return a.pricePerVideo - b.pricePerVideo;
      return a.turnaroundDays - b.turnaroundDays;
    });
    return list;
  }, [query, cats, styles, maxPrice, verifiedOnly, sort, country, language]);

  const toggleCat = (c: CreatorCategory) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleStyle = (s: VideoStyle) =>
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleCompare = (id: string) =>
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );

  const comparedCreators = CREATORS.filter((c) => compare.includes(c.id));

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Casting</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Explorer les créateurs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} profils correspondent à vos critères — sélectionnez-en jusqu'à 3 pour comparer. Données de démonstration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="label-base">Trier par</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input-base max-w-[200px]"
          >
            <option value="rating">Note</option>
            <option value="followers">Audience</option>
            <option value="price">Prix croissant</option>
            <option value="turnaround">Délai</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar filters */}
        <aside className="h-fit space-y-6 lg:sticky lg:top-24">
          <div className="card-base p-5 space-y-4">
            <label className="label-base block">Pays<select aria-label="Pays" className="input-base mt-2" value={country} onChange={e => setFilterParam("country", e.target.value)}><option value="">Tous les pays</option>{COUNTRIES.map(([code,flag,name]) => <option key={code} value={code}>{flag} {name}</option>)}</select></label>
            <label className="label-base block">Langue<select aria-label="Langue" className="input-base mt-2" value={language} onChange={e => setFilterParam("language",e.target.value)}><option value="">Toutes les langues</option>{[["FR","Français"],["EN","Anglais"],["AR","Arabe"],["ES","Espagnol"]].map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>
          </div>
          <div className="card-base p-5">
            <h3 className="label-base">Recherche</h3>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, ville, mot-clé…"
              className="input-base mt-3"
            />
          </div>

          <div className="card-base p-5">
            <h3 className="label-base">Catégories</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    cats.includes(c)
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="label-base">Style de vidéo</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    styles.includes(s)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="label-base">Budget max · {formatPrice(maxPrice)}</h3>
            <input
              type="range"
              min={300}
              max={2000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-4 w-full accent-[hsl(var(--primary))]"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground num">
              <span>300 €</span>
              <span>2 000 €</span>
            </div>
          </div>

          <label className="card-base flex cursor-pointer items-center justify-between p-5">
            <span className="text-sm font-medium">Profils vérifiés uniquement</span>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
          </label>
        </aside>

        {/* Creator cards */}
        <div className="min-w-0">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(c => <article key={c.id} className="sc-talent-card">
              <Link to={`/creators/${c.id}`} className="sc-talent-photos" aria-label={`Voir le profil de ${c.name}`}>
                {[c.avatar, ...c.portfolio.slice(0,2).map(item=>item.cover)].map((src,i)=><img key={i} loading="lazy" src={src} alt={i===0?c.name:`Portfolio ${c.name}`} />)}
              </Link>
              <div className="sc-talent-info"><Link to={`/creators/${c.id}`}><strong>{c.name} {c.verified && <span className="sc-verified">●</span>}</strong></Link><span className="sc-rating">★ {c.rating}</span><p>{c.city} · {c.languages.join(' / ')}</p><small>{formatCompact(c.followers)} abonnés · {c.reviews} avis</small>
                <div className="mt-3 flex flex-wrap gap-1">{c.categories.map(cat=><span className="pill !px-2 !py-0.5 !text-[9px]" key={cat}>{cat}</span>)}</div>
                <div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs font-semibold">{formatPrice(c.pricePerVideo)}</span><span className="text-[10px] text-muted-foreground">{c.turnaroundDays} jours · tarif démo</span></div>
                <label className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={compare.includes(c.id)} disabled={!compare.includes(c.id) && compare.length>=3} onChange={()=>toggleCompare(c.id)} aria-label={`Comparer ${c.name}`}/>Comparer ce profil</label>
              </div>
            </article>)}
          </div>
          {!filtered.length && <div className="card-base p-10 text-center"><h2 className="font-semibold">Aucun créateur pour ces critères</h2><p className="mt-2 text-sm text-muted-foreground">Le catalogue actuel contient des profils de démonstration en France. Essayez un autre filtre.</p><button className="sc-button mt-5" onClick={()=>{setQuery('');setCats([]);setStyles([]);setMaxPrice(2000);setVerifiedOnly(false);setParams({});}}>Réinitialiser les filtres</button></div>}

          {/* Comparison panel */}
          {comparedCreators.length >= 2 && (
            <div className="mt-8 card-base p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">Comparaison ({comparedCreators.length})</h3>
                <button onClick={() => setCompare([])} className="text-sm text-muted-foreground hover:text-foreground">
                  Réinitialiser
                </button>
              </div>
              <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${comparedCreators.length}, 1fr)` }}>
                <div className="label-base self-end">Critère</div>
                {comparedCreators.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <img src={c.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <p className="font-display font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.city}</p>
                    </div>
                  </div>
                ))}

                {[
                  { label: "Audience", values: comparedCreators.map((c) => formatCompact(c.followers)) },
                  { label: "Engagement", values: comparedCreators.map((c) => `${c.engagement}%`) },
                  { label: "Note moyenne", values: comparedCreators.map((c) => `★ ${c.rating}`) },
                  { label: "Prix", values: comparedCreators.map((c) => formatPrice(c.pricePerVideo)) },
                  { label: "Délai livraison", values: comparedCreators.map((c) => `${c.turnaroundDays} jours`) },
                  { label: "Styles", values: comparedCreators.map((c) => c.styles.join(", ")) },
                ].map((row) => (
                  <>
                    <div className="border-t border-border pt-3 text-sm text-muted-foreground">{row.label}</div>
                    {row.values.map((v, i) => (
                      <div key={i} className="border-t border-border pt-3 font-display text-base font-semibold num">{v}</div>
                    ))}
                  </>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
