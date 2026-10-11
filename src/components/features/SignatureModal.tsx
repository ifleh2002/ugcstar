import { useEffect, useRef, useState } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Contract } from "@/types";

export interface SignatureResult {
  contractId: string;
  signerName: string;
  signatureDataUrl: string;
  signedAt: string;
}

interface SignatureModalProps {
  contract: Contract;
  onClose: () => void;
  onSigned: (data: SignatureResult) => void;
}

export default function SignatureModal({ contract, onClose, onSigned }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signerName, setSignerName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1612";
    ctx.lineWidth = 2.2;
  }, []);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSigned) setHasSigned(true);
  };

  const end = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const confirm = () => {
    if (!signerName.trim()) {
      toast.error("Veuillez saisir votre nom complet.");
      return;
    }
    if (!hasSigned) {
      toast.error("Veuillez tracer votre signature.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Veuillez accepter l’enregistrement de votre signature.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSigned({
      contractId: contract.id,
      signerName: signerName.trim(),
      signatureDataUrl: dataUrl,
      signedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-secondary/70 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-title"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-md border border-border bg-card shadow-2xl md:rounded-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <span className="label-base">Signature électronique</span>
            <h2 id="signature-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">
              Contrat #{contract.id}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground num">
              {contract.brand} × {contract.creatorName} · Commande {contract.orderId}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-sm px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="signer-name" className="label-base mb-2 block">
              Nom complet du signataire
            </label>
            <input
              id="signer-name"
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="ex : Léa Marchand"
              autoComplete="name"
              className="input-base"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label-base">Tracez votre signature</label>
              <button
                type="button"
                onClick={clear}
                className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
              >
                ↺ Effacer
              </button>
            </div>
            <div className="relative overflow-hidden rounded-sm border border-dashed border-border bg-muted/40">
              <canvas
                ref={canvasRef}
                className="h-48 w-full touch-none"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onPointerLeave={end}
              />
              {!hasSigned && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="text-xs italic text-muted-foreground">
                    Dessinez votre signature à la souris ou au doigt
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-foreground/15" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-sm border border-border bg-background p-3 text-[11px] num">
            <div>
              <p className="label-base mb-1">Horodatage local</p>
              <p className="font-mono text-foreground">
                {formatDate(now)} · {formatTime(now)}
              </p>
            </div>
            <div>
              <p className="label-base mb-1">UTC (ISO 8601)</p>
              <p className="font-mono text-muted-foreground">{new Date(now).toISOString()}</p>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-sm border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-primary"
            />
            <span>
              Je reconnais que ma signature manuscrite ci-dessus, associée à mon identité et à l'horodatage,
              sera enregistrée avec le document. L’horodatage provient de cet appareil ; cette fonction ne fournit pas de certification de signature.
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-muted-foreground">
            Signature enregistrée sur cet appareil ; sauvegardez le document téléchargé.
          </p>
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="btn-ghost">
              Annuler
            </button>
            <button onClick={confirm} className="btn-primary">
              Signer & Télécharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
