import { CONTRACTS } from "@/lib/mockData";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function Contracts() {
  const download = (id: string) => {
    toast.success(`Contrat ${id} — téléchargement du PDF signé démarré.`);
  };

  return (
    <div className="container py-10 md:py-14"><p className="card-base p-4 mb-6 text-sm">Module de démonstration conservé du projet initial : données fictives, sans connexion aux nouveaux projets.</p>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Signatures électroniques</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Contrats</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chaque commande validée génère automatiquement un contrat PDF signé par les trois parties.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {CONTRACTS.map((c) => (
          <div key={c.id} className="card-base flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm bg-secondary text-primary">
                <span className="font-display text-xl font-semibold">PDF</span>
              </div>
              <div>
                <p className="font-display text-lg font-semibold">{c.brand} × {c.creatorName}</p>
                <p className="mt-1 text-xs text-muted-foreground num">
                  #{c.id} · Rattaché à {c.orderId} · Émis le {formatDate(c.issuedAt)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.signedBy.map((s) => (
                    <span key={s} className="pill">✓ {s}</span>
                  ))}
                  {!c.signedBy.includes("Léa Marchand") && !c.signedBy.includes("Chloé Vidal") && c.status === "en_attente" && (
                    <span className="pill border-primary text-primary">⏱ En attente créateur</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="font-display text-2xl font-semibold num">{formatPrice(c.amount)}</p>
                <span className={cn(
                  "mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide",
                  c.status === "signe" ? "bg-emerald-100 text-emerald-900" : "bg-primary/10 text-primary"
                )}>
                  {c.status === "signe" ? "Signé" : c.status === "en_attente" ? "En attente" : "Annulé"}
                </span>
              </div>
              <button
                onClick={() => download(c.id)}
                disabled={c.status !== "signe"}
                className="btn-dark disabled:opacity-40"
              >
                Télécharger
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
