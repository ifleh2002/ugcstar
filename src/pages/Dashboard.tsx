import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CREATORS, ORDERS } from "@/lib/mockData";
import type { OrderStatus } from "@/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { useReadOnly } from "@/hooks/useReadOnly";
import ReadOnlyBanner from "@/components/auth/ReadOnlyBanner";

const STATUS_LABEL: Record<OrderStatus, string> = {
  briefing: "Briefing",
  en_production: "En production",
  en_validation: "À valider",
  validee: "Validée",
  rejetee: "Rejetée",
  livree: "Livrée",
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  briefing: "bg-muted text-foreground",
  en_production: "bg-secondary text-secondary-foreground",
  en_validation: "bg-primary text-primary-foreground",
  validee: "bg-emerald-100 text-emerald-900",
  rejetee: "bg-red-100 text-red-900",
  livree: "bg-foreground text-background",
};

export default function Dashboard() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const isReadOnly = useReadOnly();

  const orders = useMemo(
    () => (filter === "all" ? ORDERS : ORDERS.filter((o) => o.status === filter)),
    [filter]
  );

  const stats = {
    total: ORDERS.length,
    toValidate: ORDERS.filter((o) => o.status === "en_validation").length,
    inProd: ORDERS.filter((o) => o.status === "en_production").length,
    revenue: ORDERS.reduce((s, o) => s + o.budget, 0),
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Mes commandes</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Workflow en cours
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Suivez chaque étape : briefing, production, validation du rendu, livraison.
          </p>
        </div>
        {isReadOnly ? (
          <span className="pill border-amber-500/40 bg-amber-50 text-amber-800">
            ⊘ Mode consultation
          </span>
        ) : (
          <Link to="/creators" className="btn-primary">+ Nouvelle commande</Link>
        )}
      </div>

      <ReadOnlyBanner
        className="mt-6"
        message="Vous consultez le workflow de vos commandes. L'émission de nouvelles commandes est réservée à l'équipe plateforme StarCast."
      />

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Commandes actives", value: stats.total.toString(), accent: false },
          { label: "À valider", value: stats.toValidate.toString(), accent: true },
          { label: "En production", value: stats.inProd.toString(), accent: false },
          { label: "Volume signé", value: formatPrice(stats.revenue), accent: false },
        ].map((s) => (
          <div key={s.label} className="card-base p-5">
            <p className="label-base">{s.label}</p>
            <p className={cn("mt-3 font-display text-4xl font-semibold num", s.accent && "text-primary")}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-wrap gap-2 border-b border-border pb-4">
        {(["all", "briefing", "en_production", "en_validation", "livree"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "Toutes" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="mt-6 space-y-3">
        {orders.map((o) => {
          const creator = CREATORS.find((c) => c.id === o.creatorId)!;
          return (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="card-base flex flex-col gap-4 p-5 transition-shadow hover:shadow-md md:flex-row md:items-center md:gap-6"
            >
              <div className="flex items-center gap-4 md:w-72">
                <img src={creator.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-display text-base font-semibold">{creator.name}</p>
                  <p className="text-xs text-muted-foreground num">#{o.id} · {formatDate(o.createdAt)}</p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-display text-base font-semibold line-clamp-1">{o.brand} — {o.product}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Style · <strong className="text-foreground">{o.style}</strong></span>
                  <span>Durée · <strong className="text-foreground num">{o.duration}s</strong></span>
                  <span>Révisions · <strong className="text-foreground num">{o.revisionsUsed}/{o.revisionsAllowed}</strong></span>
                  <span>Livraison · <strong className="text-foreground">{formatDate(o.dueDate)}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 md:justify-end">
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", STATUS_COLOR[o.status])}>
                  {STATUS_LABEL[o.status]}
                </span>
                <span className="font-display text-xl font-semibold num">{formatPrice(o.budget)}</span>
              </div>
            </Link>
          );
        })}
        {orders.length === 0 && (
          <div className="card-base p-16 text-center text-muted-foreground">
            Aucune commande dans cet état.
          </div>
        )}
      </div>
    </div>
  );
}
