import { useReadOnly } from "@/hooks/useReadOnly";
import { cn } from "@/lib/utils";

interface Props {
  message?: string;
  className?: string;
}

/**
 * Amber banner shown at the top of any page where the current "user"
 * (Marque / Annonceur) is in read-only consultation mode.
 * Renders nothing for admins, collaborators, creators or logged-out visitors.
 */
export default function ReadOnlyBanner({ message, className }: Props) {
  const isReadOnly = useReadOnly();
  if (!isReadOnly) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-sm border border-amber-500/30 bg-amber-50 px-4 py-3",
        className,
      )}
    >
      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-display text-base text-amber-700">
        ⊘
      </span>
      <div className="min-w-0 text-xs text-amber-900">
        <p className="font-display text-sm font-semibold text-amber-900">
          Mode consultation
        </p>
        <p className="mt-0.5 leading-relaxed">
          {message ??
            "Votre compte Marque / Annonceur est en lecture seule. Vous pouvez consulter les informations, contrats, commandes et messagerie. Les actions d'écriture sont désactivées."}
        </p>
      </div>
    </div>
  );
}
