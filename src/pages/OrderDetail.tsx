import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CREATORS, MESSAGES, ORDERS } from "@/lib/mockData";
import type { Message } from "@/types";
import { cn, formatDate, formatPrice, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { useReadOnly } from "@/hooks/useReadOnly";
import ReadOnlyBanner from "@/components/auth/ReadOnlyBanner";

export default function OrderDetail() {
  const { id } = useParams();
  const order = ORDERS.find((o) => o.id === id);
  const [messages, setMessages] = useState<Message[]>(() => MESSAGES.filter((m) => m.orderId === id));
  const [draft, setDraft] = useState("");
  const [decision, setDecision] = useState<"idle" | "approved" | "revision">("idle");
  const isReadOnly = useReadOnly();

  if (!order) return <NotFound />;
  const creator = CREATORS.find((c) => c.id === order.creatorId)!;

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        orderId: order.id,
        author: "client",
        authorName: order.brand,
        content: draft.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  };

  const approve = () => {
    setDecision("approved");
    toast.success("Simulation : rendu approuvé sur cette page, sans envoi ni archivage serveur.");
  };
  const requestRevision = () => {
    setDecision("revision");
    toast.info("Simulation de révision : aucune demande n’a été envoyée.");
  };

  return (
    <div className="container py-10 md:py-14">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Toutes les commandes
      </Link>

      <div className="mt-4 flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base num">#{order.id}</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            {order.brand} — {order.product}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Avec <Link to={`/creators/${creator.id}`} className="text-foreground underline-offset-4 hover:underline">{creator.name}</Link> · Livraison prévue {formatDate(order.dueDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="pill border-primary bg-primary/10 text-primary">
            {order.status === "en_validation" ? "À valider" : order.status}
          </span>
          <span className="font-display text-3xl font-semibold num">{formatPrice(order.budget)}</span>
        </div>
      </div>

      <ReadOnlyBanner
        className="mt-6"
        message="Vous consultez le détail de la commande. L'approbation du rendu, les demandes de révision et l'envoi de messages sont désactivés."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: Render + Messages */}
        <div className="space-y-10">
          {/* Rendu */}
          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold">Rendu à valider</h2>
              <span className="label-base num">Révision {order.revisionsUsed}/{order.revisionsAllowed}</span>
            </div>
            <div className="mt-4 card-base overflow-hidden">
              {order.renderThumbnail ? (
                <div className="relative aspect-video bg-secondary">
                  <img src={order.renderThumbnail} alt="Rendu vidéo" className="h-full w-full object-cover opacity-90" />
                  <button className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105">
                      ▶
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                  Le créateur n'a pas encore déposé de rendu.
                </div>
              )}

              {order.renderThumbnail && (
                <div className="flex flex-col gap-3 border-t border-border p-5 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    V{order.revisionsUsed + 1} — déposée le {formatDate(order.createdAt)}
                  </div>
                  {isReadOnly ? (
                    <span className="rounded-sm bg-amber-50 px-3 py-1.5 text-[11px] italic text-amber-800">
                      ⊘ Validation réservée à l'équipe plateforme
                    </span>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={requestRevision} disabled={decision !== "idle"} className="btn-outline">Demander une révision</button>
                      <button onClick={approve} disabled={decision !== "idle"} className="btn-primary">
                        {decision === "approved" ? "✓ Approuvé" : "Approuver le rendu"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Messages tripartite */}
          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold">Messagerie tripartite</h2>
              <div className="flex gap-2">
                <span className="pill">Client</span>
                <span className="pill border-primary/30 text-primary">Star</span>
                <span className="pill border-secondary bg-secondary text-secondary-foreground">Plateforme</span>
              </div>
            </div>

            <div className="mt-4 card-base divide-y divide-border">
              {messages.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">Aucun message pour le moment.</div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="flex gap-4 p-5">
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      m.author === "client" && "bg-muted text-foreground",
                      m.author === "star" && "bg-primary text-primary-foreground",
                      m.author === "plateforme" && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {m.authorName.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-sm font-semibold">{m.authorName}</p>
                      <span className="text-xs text-muted-foreground num">{formatDate(m.createdAt)} · {formatTime(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {isReadOnly ? (
              <div className="mt-4 flex items-center gap-3 rounded-sm border border-dashed border-amber-500/30 bg-amber-50/60 px-4 py-3 text-xs text-amber-900">
                <span className="font-display text-base">⊘</span>
                <span>
                  Envoi de message désactivé — compte en lecture seule. Vous consultez normalement les échanges tripartites.
                </span>
              </div>
            ) : (
              <div className="mt-4 flex items-end gap-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrire un message à l'équipe…"
                  rows={2}
                  className="input-base resize-none"
                />
                <button onClick={send} className="btn-dark h-fit">Envoyer</button>
              </div>
            )}
          </section>
        </div>

        {/* Right: Brief recap */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card-base p-6">
            <h3 className="label-base">Spécifications</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Style</dt><dd className="font-display font-semibold">{order.style}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Durée</dt><dd className="font-display font-semibold num">{order.duration}s</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Voix off</dt><dd className="font-display font-semibold">{order.voiceover === "non" ? "Non" : order.voiceover === "oui_fr" ? "Oui — FR" : "Oui — EN"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Révisions</dt><dd className="font-display font-semibold num">{order.revisionsUsed}/{order.revisionsAllowed}</dd></div>
            </dl>
          </div>

          <div className="card-base p-6">
            <h3 className="label-base">Briefing</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{order.briefing}</p>
          </div>

          <div className="card-base p-6">
            <h3 className="label-base">Prochaines étapes</h3>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3"><span className="font-display font-semibold text-primary num">01</span> Approbation du rendu final</li>
              <li className="flex gap-3"><span className="font-display font-semibold text-primary num">02</span> Archivage du contrat PDF</li>
              <li className="flex gap-3"><span className="font-display font-semibold text-primary num">03</span> Diffusion sur Screenads</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
