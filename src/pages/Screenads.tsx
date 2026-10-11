import { useMemo, useState } from "react";
import { PLAYLISTS, SCHEDULE, SCREENS } from "@/lib/mockData";
import { cn, formatTime } from "@/lib/utils";
import { useReadOnly } from "@/hooks/useReadOnly";
import ReadOnlyBanner from "@/components/auth/ReadOnlyBanner";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Screenads() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(PLAYLISTS[0].id);
  const playlist = PLAYLISTS.find((p) => p.id === selectedPlaylist)!;
  const isReadOnly = useReadOnly();
  const stats = useMemo(() => ({
    online: SCREENS.filter((s) => s.status === "online").length,
    syncing: SCREENS.filter((s) => s.status === "syncing").length,
    offline: SCREENS.filter((s) => s.status === "offline").length,
  }), []);

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Diffusion</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Screenads · Réseau d'écrans
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Composez vos playlists de vidéos UGC validées, planifiez les plages horaires et surveillez
            l'état de chaque terminal en temps réel.
          </p>
        </div>
        <div className="flex gap-3">
          {isReadOnly ? (
            <span className="pill border-amber-500/40 bg-amber-50 text-amber-800">
              ⊘ Diffusion en consultation
            </span>
          ) : (
            <>
              <button className="btn-outline">Nouveau playlist</button>
              <button className="btn-primary">Pousser sync</button>
            </>
          )}
        </div>
      </div>

      <ReadOnlyBanner
        className="mt-6"
        message="Vous consultez l'état du réseau Screenads et le planning hebdomadaire. La composition de playlists et la synchronisation sont réservées aux opérateurs plateforme."
      />

      {/* Fleet stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Écrans en ligne" value={stats.online} dot="bg-emerald-500" />
        <StatCard label="En synchronisation" value={stats.syncing} dot="bg-primary" />
        <StatCard label="Hors ligne" value={stats.offline} dot="bg-red-500" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Playlists sidebar */}
        <aside className="space-y-3">
          <h2 className="label-base">Playlists</h2>
          {PLAYLISTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlaylist(p.id)}
              className={cn(
                "w-full text-left card-base p-4 transition-colors",
                selectedPlaylist === p.id ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-semibold">{p.name}</p>
                <span className="pill num">{p.items.length} items</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.totalDuration}s · {p.screenGroups.join(", ")}
              </p>
            </button>
          ))}
        </aside>

        {/* Playlist editor */}
        <div className="min-w-0 space-y-10">
          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold">{playlist.name}</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Boucle : <strong className="text-foreground">{playlist.loop ? "Oui" : "Non"}</strong></span>
                <span>·</span>
                <span>Groupes : <strong className="text-foreground">{playlist.screenGroups.join(", ")}</strong></span>
              </div>
            </div>

            <ol className="mt-5 card-base divide-y divide-border">
              {playlist.items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 p-4">
                  <span className="font-display text-2xl font-semibold text-muted-foreground num w-10">{String(it.order).padStart(2, "0")}</span>
                  <img src={it.cover} alt="" className="h-14 w-10 flex-shrink-0 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold line-clamp-1">{it.title}</p>
                    <p className="text-xs text-muted-foreground">{it.creator}</p>
                  </div>
                  <span className="pill num">{it.duration}s</span>
                  {!isReadOnly && <button className="btn-ghost text-xs">Retirer</button>}
                </li>
              ))}
            </ol>
          </section>

          {/* Schedule */}
          <section>
            <h2 className="font-display text-2xl font-semibold">Planning hebdomadaire</h2>
            <p className="mt-1 text-sm text-muted-foreground">Protocole SyncCast · heartbeat 30s · décalage ≤ 40ms garanti.</p>

            <div className="mt-5 card-base overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[64px_repeat(24,minmax(28px,1fr))] border-b border-border bg-muted/40 text-[10px] font-medium text-muted-foreground">
                  <div className="px-2 py-2"></div>
                  {HOURS.map((h) => (
                    <div key={h} className="border-l border-border px-1 py-2 text-center num">{h}</div>
                  ))}
                </div>
                {DAYS.map((d) => (
                  <div key={d} className="grid grid-cols-[64px_repeat(24,minmax(28px,1fr))] border-b border-border last:border-b-0">
                    <div className="flex items-center px-3 py-3 text-xs font-semibold uppercase tracking-wide">{d}</div>
                    {HOURS.map((h) => {
                      const slot = SCHEDULE.find((s) => s.day === d && h >= s.startHour && h < s.endHour);
                      const active = slot?.playlistId === playlist.id;
                      const other = slot && !active;
                      return (
                        <div
                          key={h}
                          className={cn(
                            "border-l border-border py-3",
                            active && "bg-primary/80",
                            other && "bg-muted"
                          )}
                          title={slot ? PLAYLISTS.find((p) => p.id === slot.playlistId)?.name : ""}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Screens */}
          <section>
            <h2 className="font-display text-2xl font-semibold">Terminaux</h2>
            <div className="mt-5 card-base overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="text-left label-base">
                    <th className="px-4 py-3">Écran</th>
                    <th className="px-4 py-3">Groupe</th>
                    <th className="px-4 py-3">Résolution</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Dernier heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {SCREENS.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-4">
                        <p className="font-display text-base font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.location}</p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{s.group}</td>
                      <td className="px-4 py-4 num text-muted-foreground">{s.resolution}</td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "pill",
                          s.status === "online" && "border-emerald-500 text-emerald-700",
                          s.status === "syncing" && "border-primary text-primary",
                          s.status === "offline" && "border-red-500 text-red-700"
                        )}>
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            s.status === "online" && "bg-emerald-500",
                            s.status === "syncing" && "bg-primary animate-pulse",
                            s.status === "offline" && "bg-red-500"
                          )} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs text-muted-foreground num">{formatTime(s.lastHeartbeat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <p className="label-base">{label}</p>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold num">{value}</p>
    </div>
  );
}
