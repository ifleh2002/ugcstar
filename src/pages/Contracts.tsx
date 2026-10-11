import { useAuth } from "@/contexts/AuthContext";
import { jsPDF } from "jspdf";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CONTRACTS } from "@/lib/mockData";
import { cn, formatDate, formatPrice, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import SignatureModal, { type SignatureResult } from "@/components/features/SignatureModal";
import {
  CONTRACT_TEMPLATES,
  formatPriceImpact,
  getTemplate,
  type ContractTemplate,
} from "@/lib/contractTemplates";
import type { Contract } from "@/types";
import { useReadOnly } from "@/hooks/useReadOnly";
import ReadOnlyBanner from "@/components/auth/ReadOnlyBanner";

interface SignatureRecord {
  signerName: string;
  signatureDataUrl: string;
  signedAt: string;
}

type SignaturesMap = Record<string, SignatureRecord>;

function downloadContract(contract: Contract, sig: SignatureRecord, template: ContractTemplate) {
  const pdf = new jsPDF();
  const margin = 18;
  let y = 22;
  const write = (value: string, size = 10) => {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(value, 174) as string[];
    for (const line of lines) {
      if (y > 275) { pdf.addPage(); y = 22; }
      pdf.text(line, margin, y);
      y += size * 0.5;
    }
    y += 4;
  };
  write("StarCast - Contrat UGC", 20);
  write(`Reference : ${contract.id}`);
  write(`Modele : ${template.name}`);
  write(`Annonceur : ${contract.brand}`);
  write(`Createur : ${contract.creatorName}`);
  write(`Montant : ${formatPrice(contract.amount)}`);
  write(`Droits : ${template.rightsDurationMonths} mois`);
  for (const clause of template.clauses) {
    write(clause.title, 12);
    write(clause.content);
  }
  write(`Signataire : ${sig.signerName}`);
  write(`Date declaree par l'appareil : ${sig.signedAt}`);
  if (y > 245) { pdf.addPage(); y = 22; }
  if (sig.signatureDataUrl.startsWith("data:image/png")) {
    pdf.addImage(sig.signatureDataUrl, "PNG", margin, y, 65, 25);
    y += 30;
  }
  write("Signature dessinee, sans certification ni horodatage tiers.");
  pdf.save(`contrat-${contract.id}-${template.id}.pdf`);
}

export default function Contracts() {
  const { user } = useAuth();
  const [signatures, setSignatures] = useLocalStorage<SignaturesMap>(`starcast:contract-signatures:${user?.id ?? "anonymous"}`, {});
  const [openContract, setOpenContract] = useState<Contract | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const isReadOnly = useReadOnly();

  const getLocalSig = (c: Contract): SignatureRecord | null => signatures[c.id] ?? null;

  const isFullySigned = (c: Contract) => c.status === "signe" || !!getLocalSig(c);

  const handleSigned = (data: SignatureResult) => {
    const record: SignatureRecord = {
      signerName: data.signerName,
      signatureDataUrl: data.signatureDataUrl,
      signedAt: data.signedAt,
    };
    setSignatures((prev) => ({ ...prev, [data.contractId]: record }));
    const contract = CONTRACTS.find((c) => c.id === data.contractId);
    if (contract) {
      const template = getTemplate(contract.templateId);
      downloadContract(contract, record, template);
      toast.success(`Contrat ${contract.id} signé · PDF téléchargé.`, {
        description: `Modèle « ${template.name} » · ${formatDate(data.signedAt)} à ${formatTime(data.signedAt)}`,
      });
    }
    setOpenContract(null);
  };

  const handleDownloadExisting = (c: Contract) => {
    const local = getLocalSig(c);
    const template = getTemplate(c.templateId);
    const record: SignatureRecord =
      local ?? {
        signerName: c.signedBy[0] ?? "Signataire",
        signatureDataUrl:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 90'><text x='10' y='60' font-family='Brush Script MT, cursive' font-size='42' fill='#1a1612'>${c.signedBy[0] ?? "Signé"}</text></svg>`,
          ),
        signedAt: c.issuedAt,
      };
    downloadContract(c, record, template);
    toast.success(`Contrat ${c.id} téléchargé · Modèle ${template.name}.`);
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Signatures électroniques</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Contrats</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Chaque commande validée génère un contrat signé à partir d'un modèle StarCast.
            Signez via canvas, horodatez, puis téléchargez le PDF.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <Link to="/contracts/analytics" className="btn-outline w-fit">
            ↗ Analytics bibliothèque
          </Link>
          <div className="flex gap-6 rounded-sm border border-border bg-card px-5 py-3">
          <div>
            <p className="label-base">Signés</p>
            <p className="font-display text-2xl font-semibold num">
              {CONTRACTS.filter((c) => isFullySigned(c)).length}
            </p>
          </div>
          <div className="h-full w-px bg-border" />
          <div>
            <p className="label-base">En attente</p>
            <p className="font-display text-2xl font-semibold num text-primary">
              {CONTRACTS.filter((c) => !isFullySigned(c)).length}
            </p>
          </div>
          <div className="h-full w-px bg-border" />
          <div>
            <p className="label-base">Modèles</p>
            <p className="font-display text-2xl font-semibold num">{CONTRACT_TEMPLATES.length}</p>
          </div>
        </div>
        </div>
      </div>

      <ReadOnlyBanner
        className="mt-6"
        message="Vous consultez la bibliothèque et les contrats émis. La signature électronique est verrouillée pour les comptes en lecture seule — téléchargez librement les contrats déjà signés."
      />

      {/* Bibliothèque de modèles */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <span className="label-base">Bibliothèque</span>
            <h2 className="mt-1 font-display text-xl font-semibold">Modèles de contrats disponibles</h2>
          </div>
          <Link to="/creators" className="hidden text-xs font-semibold text-primary hover:underline md:inline">
            Lancer une commande →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CONTRACT_TEMPLATES.map((t) => {
            const usageCount = CONTRACTS.filter((c) => getTemplate(c.templateId).id === t.id).length;
            const isOpen = expandedTemplate === t.id;
            return (
              <article key={t.id} className="card-base flex flex-col overflow-hidden">
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl text-primary">{t.symbol}</span>
                      <span className="pill">{t.badge}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground num">
                      {usageCount} actif{usageCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.tagline}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-sm bg-muted/40 p-2">
                      <dt className="text-muted-foreground">Droits</dt>
                      <dd className="font-display font-semibold num">{t.rightsDurationMonths} mois</dd>
                    </div>
                    <div className="rounded-sm bg-muted/40 p-2">
                      <dt className="text-muted-foreground">Exclusivité</dt>
                      <dd className="font-display font-semibold">{t.exclusivity ? "Oui" : "Non"}</dd>
                    </div>
                    <div className="rounded-sm bg-muted/40 p-2">
                      <dt className="text-muted-foreground">Révisions</dt>
                      <dd className="font-display font-semibold num">{t.revisionCycles}</dd>
                    </div>
                    <div className="rounded-sm bg-muted/40 p-2">
                      <dt className="text-muted-foreground">Durée</dt>
                      <dd className="font-display font-semibold num">
                        {t.minDuration}–{t.maxDuration}s
                      </dd>
                    </div>
                  </dl>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div>
                        <p className="label-base">Supports autorisés</p>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                          {t.usageRights.map((r) => (
                            <li key={r}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="label-base">Articles ({t.clauses.length})</p>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                          {t.clauses.map((c) => (
                            <li key={c.title}>· {c.title}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
                  <span className="label-base">
                    Impact · <span className="text-foreground num">{formatPriceImpact(t)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedTemplate(isOpen ? null : t.id)}
                    className="text-[11px] font-semibold uppercase tracking-wide text-primary hover:underline"
                  >
                    {isOpen ? "− Replier" : "+ Détails"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Liste des contrats */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Contrats émis</h2>
          <span className="label-base num">{CONTRACTS.length} documents</span>
        </div>

        <div className="mt-5 space-y-3">
          {CONTRACTS.map((c) => {
            const local = getLocalSig(c);
            const signed = isFullySigned(c);
            const template = getTemplate(c.templateId);
            return (
              <div
                key={c.id}
                className="card-base flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-sm bg-secondary text-primary">
                    <span className="font-display text-xl font-semibold">PDF</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold">
                        {c.brand} × {c.creatorName}
                      </p>
                      <span className="pill border-primary/30 bg-primary/5 text-primary">
                        {template.symbol} {template.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground num">
                      #{c.id} · Commande {c.orderId} · Émis le {formatDate(c.issuedAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.signedBy.map((s) => (
                        <span key={s} className="pill">
                          ✓ {s}
                        </span>
                      ))}
                      {local && !c.signedBy.includes(local.signerName) && (
                        <span className="pill border-emerald-500/40 bg-emerald-50 text-emerald-800">
                          ✓ {local.signerName} <span className="text-emerald-700/60">· vous</span>
                        </span>
                      )}
                      {!signed && (
                        <span className="pill border-primary/40 bg-primary/5 text-primary">
                          ⏱ Signature requise
                        </span>
                      )}
                    </div>
                    {local && (
                      <p className="mt-2 text-[11px] text-muted-foreground num">
                        Votre signature horodatée le {formatDate(local.signedAt)} à {formatTime(local.signedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold num">{formatPrice(c.amount)}</p>
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide",
                        signed
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {signed ? "Signé" : "En attente"}
                    </span>
                  </div>
                  {signed ? (
                    <button onClick={() => handleDownloadExisting(c)} className="btn-outline">
                      Télécharger
                    </button>
                  ) : isReadOnly ? (
                    <span className="pill border-amber-500/40 bg-amber-50 text-amber-800">
                      ⊘ Signature verrouillée
                    </span>
                  ) : (
                    <button onClick={() => setOpenContract(c)} className="btn-primary">
                      Signer & télécharger
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {openContract && (
        <SignatureModal
          contract={openContract}
          onClose={() => setOpenContract(null)}
          onSigned={handleSigned}
        />
      )}
    </div>
  );
}
