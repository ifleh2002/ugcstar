import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";
import { ROLE_LABELS } from "@/types/auth";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          Chargement de la session…
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="label-base">Accès restreint</span>
        <h1 className="mt-3 font-display text-3xl font-semibold">Autorisations insuffisantes</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Cette page est réservée aux rôles&nbsp;:{" "}
          <span className="font-semibold text-foreground">
            {roles.map((r) => ROLE_LABELS[r]).join(" · ")}
          </span>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
