import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, ROLE_SYMBOLS } from "@/types/auth";

const links = [
  { to: "/creators", label: "Créateurs" },
  { to: "/dashboard", label: "Commandes" },
  { to: "/screenads", label: "Screenads" },
  { to: "/contracts", label: "Contrats" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnexion réussie.");
    setMenuOpen(false);
    nav("/", { replace: true });
  };

  const initials = user
    ? user.username
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-sm bg-secondary">
            <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold text-primary">★</span>
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">StarCast</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-secondary text-secondary-foreground" : "text-foreground hover:bg-muted"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"
                )
              }
            >
              ◆ Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-sm bg-muted" />
          ) : user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-[11px] font-bold text-primary-foreground">
                  {initials || "·"}
                </span>
                <span className="hidden sm:inline">{user.username}</span>
                <span className="text-xs text-muted-foreground">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-sm border border-border bg-card shadow-lg">
                  <div className="border-b border-border p-4">
                    <p className="font-display text-sm font-semibold">{user.username}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground num break-all">{user.email}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {ROLE_SYMBOLS[user.role]} {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-sm px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Tableau de bord
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                      >
                        Console admin
                      </Link>
                    )}
                    <Link
                      to="/contracts"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-sm px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Mes contrats
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
              >
                Connexion
              </Link>
              <Link to="/auth/register" className="btn-primary">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
