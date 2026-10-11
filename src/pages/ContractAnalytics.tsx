import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CONTRACTS } from "@/lib/mockData";
import { CONTRACT_TEMPLATES, type ContractTemplate } from "@/lib/contractTemplates";
import { formatPrice } from "@/lib/utils";

const COLORS: Record<string, string> = {
  "ugc-standard": "#1a1612",
  "exclusivity": "#d14d2c",
  "long-format": "#8b7355",
};

const GRID = "#e5e0d8";
const AXIS_TXT = "#4a3e35";
const AXIS = "#1a1612";

const tooltipStyle = {
  backgroundColor: "#faf7f2",
  border: `1px solid ${GRID}`,
  borderRadius: 2,
  fontSize: 12,
  fontFamily: "inherit",
  padding: "8px 12px",
};

const labelStyle = {
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: AXIS_TXT,
  marginBottom: 4,
};

const monthlyTrend = [
  { month: "Mai", "UGC Standard": 4, "Exclusivité": 1, "Long Format": 2 },
  { month: "Juin", "UGC Standard": 6, "Exclusivité": 2, "Long Format": 1 },
  { month: "Juil", "UGC Standard": 5, "Exclusivité": 2, "Long Format": 3 },
  { month: "Août", "UGC Standard": 3, "Exclusivité": 1, "Long Format": 2 },
  { month: "Sep", "UGC Standard": 7, "Exclusivité": 3, "Long Format": 2 },
  { month: "Oct", "UGC Standard": 2, "Exclusivité": 1, "Long Format": 1 },
];

interface Stat {
  template: ContractTemplate;
  count: number;
  revenue: number;
  signedCount: number;
  pendingCount: number;
  avg: number;
  commission: number;
  color: string;
}

export default function ContractAnalytics() {
  const stats: Stat[] = CONTRACT_TEMPLATES.map((t) => {
    const list = CONTRACTS.filter((c) => (c.templateId ?? "ugc-standard") === t.id);
    const revenue = list.reduce((s, c) => s + c.amount, 0);
    return {
      template: t,
      count: list.length,
      revenue,
      signedCount: list.filter((c) => c.status === "signe").length,
      pendingCount: list.filter((c) => c.status === "en_attente").length,
      avg: list.length > 0 ? Math.round(revenue / list.length) : 0,
      commission: Math.round(revenue * 0.15),
      color: COLORS[t.id] ?? "#666",
    };
  });

  const totalContracts = CONTRACTS.length;
  const totalRevenue = CONTRACTS.reduce((s, c) => s + c.amount, 0);
  const totalCommission = Math.round(totalRevenue * 0.15);
  const avgContract = totalContracts ? Math.round(totalRevenue / totalContracts) : 0;
  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const maxRevenue = Math.max(...stats.map((s) => s.revenue), 1);

  const usageData = stats.map((s) => ({ name: s.template.name, contrats: s.count, color: s.color }));
  const revenueData = stats.map((s) => ({ name: s.template.name, revenu: s.revenue, color: s.color }));

  const sortedRev = [...stats].sort((a, b) => b.revenue - a.revenue);
  const sortedUsage = [...stats].sort((a, b) => b.count - a.count);
  const sortedAvg = [...stats].sort((a, b) => b.avg - a.avg);
  const topRevenue = sortedRev[0];
  const topUsage = sortedUsage[0];
  const topAvg = sortedAvg[0];

  return (
    <div className="container py-10 md:py-14">
      <Link to="/contracts" className="text-sm text-muted-foreground hover:text-foreground">
        ← Retour aux contrats
      </Link>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-base">Analytics bibliothèque</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Performance des modèles
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Usage, revenus et commissions générés par chaque modèle de contrat sur StarCast.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/contracts" className="btn-outline">Voir les contrats</Link>
          <Link to="/creators" className="btn-primary">Nouvelle commande</Link>
        </div>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        <div className="card-base p-6">
          <p className="label-base">Contrats émis</p>
          <p className="mt-2 font-display text-4xl font-semibold num">{totalContracts}</p>
          <p className="mt-2 text-xs text-muted-foreground">Toutes périodes</p>
        </div>
        <div className="card-base bg-secondary/40 p-6">
          <p className="label-base">Volume total</p>
          <p className="mt-2 font-display text-4xl font-semibold num text-primary">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">TTC toutes commandes</p>
        </div>
        <div className="card-base p-6">
          <p className="label-base">Commission plateforme</p>
          <p className="mt-2 font-display text-4xl font-semibold num">{formatPrice(totalCommission)}</p>
          <p className="mt-2 text-xs text-muted-foreground">15 % du volume</p>
        </div>
        <div className="card-base p-6">
          <p className="label-base">Panier moyen</p>
          <p className="mt-2 font-display text-4xl font-semibold num">{formatPrice(avgContract)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Par contrat</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-base p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="label-base">Usage</span>
              <h2 className="mt-1 font-display text-xl font-semibold">Contrats par modèle</h2>
            </div>
            <span className="text-xs text-muted-foreground num">{totalContracts} actifs</span>
          </div>
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS_TXT }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: AXIS_TXT }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(26,22,18,0.04)" }}
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  formatter={(value: number) => [value, "Contrats"]}
                />
                <Bar dataKey="contrats" radius={[4, 4, 0, 0]} maxBarSize={80}>
                  {usageData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="label-base">Chiffre d'affaires</span>
              <h2 className="mt-1 font-display text-xl font-semibold">Revenus par modèle</h2>
            </div>
            <span className="text-xs text-muted-foreground num">{formatPrice(totalRevenue)}</span>
          </div>
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS_TXT }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: AXIS_TXT }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(26,22,18,0.04)" }}
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  formatter={(value: number) => [formatPrice(value), "Revenus"]}
                />
                <Bar dataKey="revenu" radius={[4, 4, 0, 0]} maxBarSize={80}>
                  {revenueData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6 card-base p-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="label-base">Tendance 6 mois</span>
            <h2 className="mt-1 font-display text-xl font-semibold">Évolution des commandes</h2>
          </div>
          <span className="text-xs text-muted-foreground">Données consolidées</span>
        </div>
        <div className="mt-6 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: AXIS_TXT }} axisLine={{ stroke: AXIS }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: AXIS_TXT }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="UGC Standard" stroke={COLORS["ugc-standard"]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Exclusivité" stroke={COLORS["exclusivity"]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Long Format" stroke={COLORS["long-format"]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <span className="label-base">Décomposition</span>
            <h2 className="mt-1 font-display text-xl font-semibold">Performance détaillée</h2>
          </div>
          <span className="text-xs text-muted-foreground num">{CONTRACT_TEMPLATES.length} modèles</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const sharePct = totalRevenue > 0 ? Math.round((stat.revenue / totalRevenue) * 100) : 0;
            const usagePct = totalContracts > 0 ? Math.round((stat.count / totalContracts) * 100) : 0;
            return (
              <article key={stat.template.id} className="card-base flex flex-col overflow-hidden">
                <div className="border-l-[3px] p-5" style={{ borderColor: stat.color }}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl" style={{ color: stat.color }}>
                      {stat.template.symbol}
                    </span>
                    <span className="pill">{stat.template.badge}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold leading-tight">
                    {stat.template.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.template.tagline}</p>
                </div>
                <div className="flex-1 space-y-4 border-t border-border p-5">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="label-base">Contrats</span>
                      <span className="font-display text-2xl font-semibold num">{stat.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(stat.count / maxCount) * 100}%`, backgroundColor: stat.color }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground num">{usagePct}% du volume</p>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="label-base">Revenus</span>
                      <span className="font-display text-2xl font-semibold num" style={{ color: stat.color }}>
                        {formatPrice(stat.revenue)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(stat.revenue / maxRevenue) * 100}%`, backgroundColor: stat.color }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground num">
                      {sharePct}% du chiffre d'affaires
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px]">
                    <div>
                      <dt className="text-muted-foreground">Panier moyen</dt>
                      <dd className="font-display font-semibold num">{formatPrice(stat.avg)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Commission</dt>
                      <dd className="font-display font-semibold num">{formatPrice(stat.commission)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Signés</dt>
                      <dd className="font-display font-semibold num text-emerald-700">{stat.signedCount}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">En attente</dt>
                      <dd className="font-display font-semibold num text-primary">{stat.pendingCount}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 card-base p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm text-[#faf7f2]"
            style={{ backgroundColor: COLORS["exclusivity"] }}
          >
            <span className="font-display text-lg">↗</span>
          </div>
          <div className="flex-1">
            <span className="label-base">Lecture stratégique</span>
            <h3 className="mt-1 font-display text-lg font-semibold">Pistes d'optimisation</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                · <span className="font-semibold text-foreground">{topUsage.template.name}</span>{" "}
                reste le modèle le plus choisi par les annonceurs ({topUsage.count} contrat
                {topUsage.count > 1 ? "s" : ""}) — maintenir la visibilité du modèle.
              </li>
              <li>
                · <span className="font-semibold text-foreground">{topRevenue.template.name}</span>{" "}
                génère la plus grosse part du chiffre d'affaires ({formatPrice(topRevenue.revenue)}) —
                levier de rentabilité à cultiver.
              </li>
              <li>
                · Panier moyen le plus élevé sur{" "}
                <span className="font-semibold text-foreground">{topAvg.template.name}</span>{" "}
                ({formatPrice(topAvg.avg)}) — proposer en upsell dans le funnel de commande.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
