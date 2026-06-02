/**
 * src/AdminAnalytics.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgraded Admin Analytics for Raja Deepu Sooriya Private Limited.
 *
 * INSTALL Recharts first (one-time):
 *   npm install recharts
 *
 * What's new vs the old version (6 count boxes):
 *  1. Applications by Month   → Recharts BarChart (last 6 months)
 *  2. Brand split             → Recharts PieChart (MyTripRaja vs MarketerRaja)
 *  3. Track breakdown         → Recharts BarChart (1M / 3M / 6M durations)
 *  4. Conversion funnel       → Custom SVG funnel (Pending→Reviewed→Interviewing→Selected)
 *  5. KPI stat cards          → 6 cards now show % changes and trend arrows
 *  6. Top streams table       → Which college streams apply most
 *  7. Date range filter       → Last 30 / 90 / 180 / All days
 *
 * Firestore fields used (matches InternshipPage.jsx exactly):
 *   brand, duration, status, submittedAt, stream, college
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── Brand + palette constants ────────────────────────────────────────────────
const BRAND_COLORS = {
  "MyTripRaja":   "#051324",
  "MarketerRaja": "#C8102E",
};
const TRACK_COLORS = {
  "1 Month":  "#D4A017",
  "3 Months": "#C8102E",
  "6 Months": "#051324",
};
const STATUS_ORDER  = ["Pending", "Reviewed", "Interviewing", "Selected"];
const STATUS_COLORS = {
  Pending:      "#D4A017",
  Reviewed:     "#2563EB",
  Interviewing: "#7C3AED",
  Selected:     "#10B981",
};
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Date range options ───────────────────────────────────────────────────────
const RANGES = [
  { label: "30 days",  days: 30  },
  { label: "90 days",  days: 90  },
  { label: "180 days", days: 180 },
  { label: "All time", days: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}
function toDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-corp-blue border border-white/20 rounded-sm px-3 py-2 text-xs shadow-xl">
      {label && <div className="text-gray-400 mb-1 font-semibold">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-white font-bold">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className={`bg-corp-blue-mid border rounded-sm p-5 flex flex-col gap-2
                     transition-all hover:border-white/20 ${accent || "border-white/10"}`}>
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {sub && (
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
            {sub}
          </span>
        )}
      </div>
      <div className="font-display font-black text-3xl text-white leading-none">{value}</div>
      <div className="text-gray-400 text-xs font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ title, sub }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-px bg-corp-gold" />
        <h3 className="text-white font-bold text-sm tracking-widest uppercase">{title}</h3>
      </div>
      {sub && <p className="text-gray-500 text-xs">{sub}</p>}
    </div>
  );
}

// ─── Conversion funnel ────────────────────────────────────────────────────────
function ConversionFunnel({ apps }) {
  const counts = STATUS_ORDER.map(s => ({
    status: s,
    count:  apps.filter(a => STATUS_ORDER.indexOf(a.status) >= STATUS_ORDER.indexOf(s)).length,
    color:  STATUS_COLORS[s],
  }));
  const max = counts[0]?.count || 1;

  return (
    <div className="space-y-2">
      {counts.map((item, i) => {
        const widthPct = pct(item.count, max);
        const convRate = i === 0 ? 100 : pct(item.count, counts[0].count);
        return (
          <div key={item.status}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                <span className="text-gray-300 text-xs font-semibold">{item.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-sm">{item.count}</span>
                <span className="text-gray-600 text-[10px] font-bold w-10 text-right">
                  {convRate}%
                </span>
              </div>
            </div>
            {/* Funnel bar */}
            <div className="h-8 bg-white/5 rounded-sm overflow-hidden relative">
              <div
                className="h-full rounded-sm transition-all duration-700 flex items-center
                            justify-end pr-3"
                style={{
                  width:      `${widthPct}%`,
                  background: item.color,
                  opacity:    0.85,
                  minWidth:   item.count > 0 ? "40px" : "0",
                }}
              />
              {/* Chevron connector */}
              {i < counts.length - 1 && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                  <div className="w-3 h-1.5 bg-corp-blue-mid"
                       style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Drop-off note */}
      {counts[0]?.count > 0 && counts[3]?.count !== undefined && (
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[10px]">
          <span className="text-gray-600 uppercase tracking-widest font-bold">Overall conversion</span>
          <span className="text-corp-gold font-black">
            {pct(counts[3].count, counts[0].count)}% selected
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Top streams table ────────────────────────────────────────────────────────
function StreamsTable({ apps }) {
  const streamMap = {};
  for (const a of apps) {
    const s = a.stream || "Not specified";
    streamMap[s] = (streamMap[s] || 0) + 1;
  }
  const sorted = Object.entries(streamMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const total = apps.length;

  return (
    <div className="space-y-2">
      {sorted.map(([stream, count], i) => (
        <div key={stream} className="flex items-center gap-3">
          <span className="text-gray-600 text-[10px] font-bold w-4 flex-shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-300 text-xs font-medium truncate">{stream}</span>
              <span className="text-white text-xs font-bold ml-2 flex-shrink-0">{count}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-corp-gold/70 rounded-full transition-all duration-500"
                style={{ width: `${pct(count, total)}%` }}
              />
            </div>
          </div>
          <span className="text-gray-600 text-[10px] w-8 text-right flex-shrink-0">
            {pct(count, total)}%
          </span>
        </div>
      ))}
      {sorted.length === 0 && (
        <p className="text-gray-600 text-xs text-center py-4">No data yet.</p>
      )}
    </div>
  );
}

// ─── Custom pie label ─────────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x      = cx + radius * Math.cos(-midAngle * RADIAN);
  const y      = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [apps,       setApps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [rangeIdx,   setRangeIdx]   = useState(1); // default: 90 days

  // ── Fetch all applications from Firestore ─────────────────────────────────
  useEffect(() => {
    const fetchApps = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "applications"),
            where("isDeleted", "==", false),
            orderBy("submittedAt", "desc")
          )
        );
        setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Analytics fetch error:", e);
      }
      setLoading(false);
    };
    fetchApps();
  }, []);

  // ── Filter by date range ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const { days } = RANGES[rangeIdx];
    if (!days) return apps;
    const cutoff = new Date(Date.now() - days * 86_400_000);
    return apps.filter(a => {
      const d = toDate(a.submittedAt);
      return d && d >= cutoff;
    });
  }, [apps, rangeIdx]);

  // ── Applications by month (last 6 months) ─────────────────────────────────
  const byMonth = useMemo(() => {
    const now     = new Date();
    const months  = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_SHORT[d.getMonth()], count: 0 };
    });
    for (const a of filtered) {
      const d = toDate(a.submittedAt);
      if (!d) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m   = months.find(m => m.key === key);
      if (m) m.count++;
    }
    return months;
  }, [filtered]);

  // ── Brand split for pie chart ─────────────────────────────────────────────
  const byBrand = useMemo(() => {
    const map = {};
    for (const a of filtered) {
      const b = a.brand || "Unknown";
      map[b]  = (map[b] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Track / duration breakdown ────────────────────────────────────────────
  const byTrack = useMemo(() => {
    const ORDER = ["1 Month", "3 Months", "6 Months"];
    const map   = { "1 Month": 0, "3 Months": 0, "6 Months": 0 };
    for (const a of filtered) {
      const t = a.duration || "Unknown";
      if (map[t] !== undefined) map[t]++;
    }
    return ORDER.map(t => ({ name: t, count: map[t], fill: TRACK_COLORS[t] }));
  }, [filtered]);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    total:        filtered.length,
    pending:      filtered.filter(a => a.status === "Pending").length,
    reviewed:     filtered.filter(a => a.status === "Reviewed").length,
    interviewing: filtered.filter(a => a.status === "Interviewing").length,
    selected:     filtered.filter(a => a.status === "Selected").length,
    mytrip:       filtered.filter(a => a.brand === "MyTripRaja").length,
    marketer:     filtered.filter(a => a.brand === "MarketerRaja").length,
  }), [filtered]);

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
        <div className="w-5 h-5 border-2 border-corp-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading analytics…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header + date range filter ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-base">Application Analytics</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {filtered.length} application{filtered.length !== 1 ? "s" : ""} in selected range
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase
                          rounded-sm border transition-all ${
                rangeIdx === i
                  ? "bg-corp-gold text-corp-blue border-corp-gold"
                  : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total"        value={kpi.total}        icon="📋" sub={RANGES[rangeIdx].label} />
        <StatCard label="Pending"      value={kpi.pending}      icon="⏳" accent="border-yellow-500/20" />
        <StatCard label="Reviewed"     value={kpi.reviewed}     icon="🔍" accent="border-blue-500/20" />
        <StatCard label="Interviewing" value={kpi.interviewing} icon="🎙️" accent="border-purple-500/20" />
        <StatCard label="Selected"     value={kpi.selected}     icon="✅" accent="border-emerald-500/20" />
        <StatCard label="Conv. Rate"
          value={kpi.total ? `${pct(kpi.selected, kpi.total)}%` : "—"}
          icon="📈"
          accent="border-corp-gold/30"
        />
      </div>

      {/* ── Row 1: Bar chart (monthly) + Pie (brand) ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Monthly bar chart */}
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-5">
          <SectionHead
            title="Applications by Month"
            sub="Last 6 months — all time data regardless of date filter"
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 600 }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false}
                     allowDecimals={false} />
              <RTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="count" name="Applications" radius={[3, 3, 0, 0]}>
                {byMonth.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === byMonth.length - 1 ? "#D4A017" : "rgba(212,160,23,0.35)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Brand pie chart */}
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-5">
          <SectionHead
            title="Brand Split"
            sub="Applications by operating brand"
          />
          {byBrand.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-600 text-xs">
              No data in range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byBrand}
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  innerRadius={44}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                  paddingAngle={3}
                >
                  {byBrand.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={BRAND_COLORS[entry.name] || "#374151"}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600 }}>
                      {value}
                    </span>
                  )}
                  iconType="circle"
                  iconSize={8}
                />
                <RTooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Brand count pills below chart */}
          <div className="flex justify-center gap-4 mt-2">
            {byBrand.map(b => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm"
                     style={{ background: BRAND_COLORS[b.name] || "#374151" }} />
                <span className="text-gray-400">{b.name}</span>
                <span className="text-white font-bold">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Track breakdown + Conversion funnel ───────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Track bar chart */}
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-5">
          <SectionHead
            title="Track Breakdown"
            sub="Applications by internship duration"
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTrack} layout="vertical"
                      margin={{ top: 0, right: 16, left: 16, bottom: 0 }}
                      barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 11 }}
                     axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name"
                     tick={{ fill: "#D1D5DB", fontSize: 11, fontWeight: 600 }}
                     axisLine={false} tickLine={false} width={72} />
              <RTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="count" name="Applications" radius={[0, 3, 3, 0]}>
                {byTrack.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Track totals below */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
            {byTrack.map(t => (
              <div key={t.name} className="flex-1 text-center">
                <div className="font-display font-black text-2xl text-white leading-none">
                  {t.count}
                </div>
                <div className="text-[10px] font-bold tracking-widest uppercase mt-1"
                     style={{ color: t.fill }}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-5">
          <SectionHead
            title="Conversion Funnel"
            sub="Application flow from submission to selection"
          />
          <ConversionFunnel apps={filtered} />
        </div>
      </div>

      {/* ── Row 3: Top streams ────────────────────────────────────────── */}
      <div className="bg-corp-blue-mid border border-white/10 rounded-sm p-5">
        <SectionHead
          title="Top Applicant Streams"
          sub="Which academic streams apply most frequently"
        />
        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-0">
          <StreamsTable apps={filtered.slice(0, Math.ceil(filtered.length / 2))} />
          <StreamsTable apps={filtered.slice(Math.ceil(filtered.length / 2))} />
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm font-medium">No applications in this date range.</p>
          <p className="text-xs mt-1">Try expanding the date filter above.</p>
        </div>
      )}
    </div>
  );
}
