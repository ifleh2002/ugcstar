import { Link } from "react-router-dom";
import { lazy, Suspense } from "react";
const ImageGrid = lazy(() => import("@/components/hero/ImageGrid"));
const screenadsImg="https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&fit=crop";
import {useRemote} from "@/lib/api";
import type {Creator} from "@/types";
import { formatCompact } from "@/lib/utils";

export default function Landing() {
  const {data:creators}=useRemote<Creator[]>("/stars",[]);
  const featured = creators.slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border">
        <div className="container grid gap-8 pb-12 md:grid-cols-12 md:pb-16">
          <div className="min-w-0 md:col-span-12">
            <div className="h-[320px] overflow-hidden rounded-md border border-border sm:h-[440px] lg:h-[500px]">
              <Suspense fallback={<div className="h-full w-full bg-muted" />}>
                <ImageGrid cell={103} cardSize={40} magnify={8} radius={240} drain={10} assemble />
              </Suspense>
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>Mosaïque d’inspiration · Image Grid</span>
              <span>Survolez ou touchez la mosaïque pour agrandir les images</span>
            </div>
          </div>
          <div className="md:col-span-7 flex flex-col justify-center">
            <span className="label-base">N°001 — Plateforme UGC</span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
              Votre star. Votre marque. <em className="not-italic text-primary">Notre création IA.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              StarCast crée vos vidéos publicitaires avec l’IA et l’image autorisée des stars. Choisissez aussi une vidéo réelle, tournée avec la star à un tarif supérieur.
              Chaque rendu est validé par le client avant sa livraison.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/creators" className="btn-dark">Explorer les stars</Link>
              <Link to="/dashboard" className="btn-outline">Voir le workflow</Link>
            </div>
          </div>

          <div className="md:col-span-5 md:self-end">
            <dl className="grid grid-cols-3 gap-4 rounded-md border border-border bg-card p-6">
              <div>
                <dt className="label-base">Modes de production</dt>
                <dd className="mt-2 font-display text-2xl font-semibold num">IA / Réel</dd>
              </div>
              <div>
                <dt className="label-base">Révisions incluses</dt>
                <dd className="mt-2 font-display text-2xl font-semibold num">2</dd>
              </div>
              <div>
                <dt className="label-base">Validation</dt>
                <dd className="mt-2 font-display text-2xl font-semibold num">Client</dd>
              </div>
            </dl>
          </div>


        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-b border-border bg-secondary py-4 text-secondary-foreground">
        <div className="flex gap-12 overflow-hidden">
          <div className="animate-marquee flex min-w-full flex-shrink-0 gap-12 pr-12 font-display text-lg tracking-tight">
            {["Lumi Cosmetics", "NovaTech", "DairyCo", "Maison L.", "PeakGear", "Épicerie Barjac", "AudioLab", "Skinpure"].map((b) => (
              <span key={b} className="whitespace-nowrap opacity-80">— {b}</span>
            ))}
          </div>
          <div className="animate-marquee flex min-w-full flex-shrink-0 gap-12 pr-12 font-display text-lg tracking-tight" aria-hidden>
            {["Lumi Cosmetics", "NovaTech", "DairyCo", "Maison L.", "PeakGear", "Épicerie Barjac", "AudioLab", "Skinpure"].map((b) => (
              <span key={b} className="whitespace-nowrap opacity-80">— {b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CREATORS */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="label-base">N°002 — Casting</span>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                Stars en vedette
              </h2>
            </div>
            <Link to="/creators" className="btn-ghost self-start md:self-end">Voir toutes les stars →</Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c, idx) => (
              <Link
                key={c.id}
                to={`/creators/${c.id}`}
                className="group card-base overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <img src={c.cover} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 pill bg-background/90">
                    N°{String(idx + 1).padStart(2, "0")}
                  </span>
                  {c.verified && <span className="absolute right-3 top-3 pill bg-secondary text-secondary-foreground border-secondary">Vérifié</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                    <span className="text-xs text-muted-foreground">{c.city}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{c.tagline}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs font-medium text-muted-foreground">{formatCompact(c.followers)} abonnés</span>
                    <span className="font-display text-sm font-semibold text-primary">★ {c.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="border-b border-border bg-muted/40">
        <div className="container py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="label-base">N°003 — Workflow</span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Du brief à l'écran, sans friction.
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Brief détaillé", d: "Choisissez la star, le mode IA ou réel, puis votre style, durée et message." },
              { n: "02", t: "Messagerie tripartite", d: "Client, star et plateforme sur un fil unique, traçable." },
              { n: "03", t: "Validation signée", d: "Rendu validé par le client avant sa livraison finale." },
              { n: "04", t: "Livraison finale", d: "L’administration partage votre vidéo prête à être utilisée." },
            ].map((s) => (
              <li key={s.n} className="card-base p-6">
                <span className="font-display text-5xl font-semibold text-primary num">{s.n}</span>
                <h3 className="mt-6 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SCREENADS CTA */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="label-base text-primary">N°004 — Screenads</span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Un réseau d'écrans synchronisés, pilotés depuis un seul endroit.
            </h2>
            <p className="mt-6 max-w-xl text-base text-secondary-foreground/80">
              Composez des playlists, planifiez des créneaux horaires, surveillez l'état de chaque terminal.
              Le module Screenads fourni dans le projet est une simulation de gestion des écrans.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/screenads" className="btn-primary">Ouvrir Screenads</Link>
              <Link to="/dashboard" className="btn-outline border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">Mes commandes</Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-md border border-secondary-foreground/20">
            <img src={screenadsImg} alt="Visualisation du réseau Screenads" className="aspect-[3/2] w-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
