"use client";

import { useMemo } from "react";
import type { Campaign, CampaignAccount, CampaignTier, AccountRow } from "./types";
import {
  getMatchedTier, getTimeLeft, getVolumeProgress,
  getAccountStatus, fmtMoney, STATUS_CONFIG,
} from "./campaignLogic";

interface Props {
  campaign: Campaign;
  accounts: CampaignAccount[];
  tiers: CampaignTier[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "0.5px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "18px 20px",
      position: "relative", overflow: "visible",
      outline: "none",
      boxSizing: "border-box",
      ...style,
    }}>
      {/* neon top shimmer — dùng borderRadius để không bị tràn */}
      <div style={{ position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(34,211,238,0.18),transparent)",
        pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function SLabel({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</div>
      {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// KPI chip — neon glow number, matches AccountTable summary strip exactly
function KPI({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ flex: "1 1 130px", padding: "12px 16px", borderRadius: 10,
      background: `${color}08`, border: `0.5px solid ${color}22`,
      position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
        background: `linear-gradient(90deg,transparent,${color}55,transparent)` }} />
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 4,
        textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-geist-mono)",
        color, textShadow: `0 0 20px ${color}55` }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: `${color}65`, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Neon SVG Donut ────────────────────────────────────────────────────────────
function Donut({ segments, size = 148, thick = 22 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number; thick?: number;
}) {
  const r = (size - thick) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);

  if (total === 0) return (
    <svg width={size} height={size} style={{ outline: "none", display: "block", overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thick} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.15)" fontSize={11} fontFamily="var(--font-geist-mono)">0</text>
    </svg>
  );

  let off = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * C;
    const a = { ...seg, dash, gap: C - dash, off };
    off += dash; return a;
  });

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", outline: "none", display: "block", overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thick} />
      {/* outer glow ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(34,211,238,0.04)" strokeWidth={thick + 6} />
      {arcs.filter(a => a.value > 0).map((arc, i) => (
        <g key={i}>
          {/* glow layer */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={thick + 4}
            strokeDasharray={`${arc.dash * 0.92} ${C - arc.dash * 0.92}`}
            strokeDashoffset={-arc.off}
            style={{ opacity: 0.15, filter: `blur(4px)` }} />
          {/* main arc */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={thick}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.off}
            style={{ filter: `drop-shadow(0 0 4px ${arc.color}cc)`,
              transition: "stroke-dasharray 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
        </g>
      ))}
      {/* centre */}
      <text x={cx} y={cy - 7} textAnchor="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}
        fill="rgba(255,255,255,0.85)" fontSize={24} fontWeight={800}
        fontFamily="var(--font-geist-mono)">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}
        fill="rgba(255,255,255,0.25)" fontSize={9} fontFamily="var(--font-geist-mono)">accounts</text>
    </svg>
  );
}

// ── Neon Horizontal Bar ───────────────────────────────────────────────────────
function HBar({ bars, maxVal, color, h = 20 }: {
  bars: { label: string; value: number; sublabel?: string }[];
  maxVal: number; color: string; h?: number;
}) {
  if (bars.length === 0) return <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 12, padding: "8px 0" }}>Chưa có dữ liệu</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {bars.map((bar, i) => {
        const pct = maxVal > 0 ? Math.min(100, (bar.value / maxVal) * 100) : 0;
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "62%" }} title={bar.label}>{bar.label}</span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color, fontWeight: 700, textShadow: `0 0 8px ${color}60` }}>
                {bar.sublabel ?? fmtMoney(bar.value)}
              </span>
            </div>
            <div style={{ height: h, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
              {/* bg grid lines */}
              {[25, 50, 75].map(p => (
                <div key={p} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: "0.5px", background: "rgba(255,255,255,0.05)" }} />
              ))}
              <div style={{
                height: "100%", width: `${pct}%`,
                background: `linear-gradient(90deg, ${color}40, ${color}dd)`,
                borderRadius: 4,
                boxShadow: `0 0 12px ${color}45, inset 0 1px 0 rgba(255,255,255,0.15)`,
                transition: "width 0.65s cubic-bezier(0.16,1,0.3,1)",
                position: "relative",
              }}>
                {/* leading edge spark */}
                {pct > 3 && <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 2, background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80` }} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Timeline bar ──────────────────────────────────────────────────────────────
function Timeline({ campaign }: { campaign: Campaign }) {
  const now   = new Date();
  const start = new Date(campaign.startDate);
  const end   = new Date(campaign.endDate);
  const total   = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct     = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const daysLeft  = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400_000));
  const daysTotal = Math.ceil(total / 86400_000);
  const isOver  = now > end;
  const color   = isOver ? "#f87171" : pct > 80 ? "#fbbf24" : "#34d399";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-geist-mono)" }}>
          {new Date(campaign.startDate).toLocaleDateString("vi-VN")}
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: 13, color, fontWeight: 800, fontFamily: "var(--font-geist-mono)", textShadow: `0 0 12px ${color}90` }}>
            {isOver ? "Đã kết thúc" : `Còn ${daysLeft} / ${daysTotal} ngày`}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-geist-mono)" }}>{pct.toFixed(1)}% thời gian đã trôi qua</span>
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-geist-mono)" }}>
          {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
        </span>
      </div>
      {/* track */}
      <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 5, position: "relative", overflow: "hidden" }}>
        {/* grid */}
        {[25, 50, 75].map(p => (
          <div key={p} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: "0.5px", background: "rgba(255,255,255,0.08)" }} />
        ))}
        {/* fill */}
        <div style={{ height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}40, ${color}dd)`,
          borderRadius: 5, boxShadow: `0 0 12px ${color}60`, transition: "width 0.8s ease",
          position: "relative" }}>
          {!isOver && pct > 2 && (
            <div style={{ position: "absolute", right: 0, top: -2, bottom: -2, width: 3,
              background: color, boxShadow: `0 0 10px ${color}, 0 0 20px ${color}80` }} />
          )}
        </div>
      </div>
      {/* tick labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        {[0, 25, 50, 75, 100].map(p => (
          <span key={p} style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-geist-mono)" }}>{p}%</span>
        ))}
      </div>
    </div>
  );
}

// ── Radar-style hexagon stat (mini visual) ────────────────────────────────────
function MiniRadar({ values, labels, colors, size = 110 }: {
  values: number[]; labels: string[]; colors: string[]; size?: number;
}) {
  const n = values.length;
  const cx = size / 2, cy = size / 2;
  const maxR = size / 2 - 22;
  const angle = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => pt(i, maxR * Math.min(1, v / 100)));
  const path = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} style={{ outline: "none", display: "block", overflow: "visible" }}>
      {/* rings */}
      {rings.map(r => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, maxR * r));
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
        return <path key={r} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
      })}
      {/* spokes */}
      {Array.from({ length: n }, (_, i) => {
        const p = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
      })}
      {/* data fill */}
      <path d={path} fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth={1.5}
        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.5))" }} />
      {/* data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={colors[i] ?? "#22d3ee"}
          style={{ filter: `drop-shadow(0 0 4px ${colors[i] ?? "#22d3ee"})` }} />
      ))}
      {/* labels */}
      {Array.from({ length: n }, (_, i) => {
        const p = pt(i, maxR + 10);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill={colors[i] ?? "rgba(255,255,255,0.4)"} fontSize={8} fontFamily="var(--font-geist-mono)">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function CampaignCharts({ campaign, accounts, tiers }: Props) {
  const rows: AccountRow[] = useMemo(() => accounts.map(acc => {
    const tier = getMatchedTier(acc, tiers);
    const timeLeft = (tier && acc.depositTime) ? getTimeLeft(acc.depositTime, tier.holdTime) : 0;
    const volumeProgress = tier ? getVolumeProgress(acc.volume, tier.requiredVolume) : 0;
    const status = getAccountStatus(acc, tiers, campaign);
    return { ...acc, matchedTier: tier, status, timeLeft, volumeProgress };
  }), [accounts, tiers, campaign]);

  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return Object.entries(STATUS_CONFIG)
      .map(([key, cfg]) => ({ label: cfg.label, value: counts[key] ?? 0, color: cfg.color }))
      .filter(s => s.value > 0);
  }, [rows]);

  const tierDist = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => { const k = r.matchedTier?.id ?? "__none"; counts[k] = (counts[k] ?? 0) + 1; });
    const bars = tiers.slice().sort((a, b) => a.minDeposit - b.minDeposit)
      .map(t => ({ label: t.label ?? `$${fmtMoney(t.minDeposit)}+`, value: counts[t.id] ?? 0 }));
    const none = counts["__none"] ?? 0;
    if (none > 0) bars.push({ label: "Chưa đủ tier", value: none });
    return { bars, maxVal: Math.max(...Object.values(counts), 1) };
  }, [rows, tiers]);

  const depositByTier = useMemo(() => {
    const sums: Record<string, number> = {};
    rows.forEach(r => { const k = r.matchedTier?.label ?? "Chưa tier"; sums[k] = (sums[k] ?? 0) + r.deposit; });
    return { bars: Object.entries(sums).map(([label, value]) => ({ label, value, sublabel: "$" + fmtMoney(value) })), maxVal: Math.max(...Object.values(sums), 1) };
  }, [rows]);

  const volumeBuckets = useMemo(() => {
    const buckets = [
      { label: "0%",     range: [0, 0],    count: 0, color: "#f87171" },
      { label: "1–25%",  range: [1, 25],   count: 0, color: "#fb923c" },
      { label: "26–50%", range: [26, 50],  count: 0, color: "#fbbf24" },
      { label: "51–75%", range: [51, 75],  count: 0, color: "#a3e635" },
      { label: "76–99%", range: [76, 99],  count: 0, color: "#34d399" },
      { label: "100%+",  range: [100, 999],count: 0, color: "#22d3ee" },
    ];
    rows.filter(r => r.matchedTier).forEach(r => {
      for (const b of buckets) if (r.volumeProgress >= b.range[0] && r.volumeProgress <= b.range[1]) { b.count++; break; }
    });
    return { buckets: buckets.filter(b => b.count > 0), maxVal: Math.max(...buckets.map(b => b.count), 1) };
  }, [rows]);

  const totalDeposit    = useMemo(() => accounts.reduce((s, a) => s + a.deposit, 0), [accounts]);
  const totalVolume     = useMemo(() => accounts.reduce((s, a) => s + a.volume, 0), [accounts]);
  const potentialBonus  = useMemo(() => rows.reduce((s, r) => s + (r.matchedTier?.bonus ?? 0), 0), [rows]);
  const completedBonus  = useMemo(() => rows.filter(r => r.status === "Completed" || r.status === "Eligible").reduce((s, r) => s + (r.matchedTier?.bonus ?? 0), 0), [rows]);
  const eligibleCount   = rows.filter(r => r.status === "Eligible" || r.status === "Completed").length;
  const crossedCount    = accounts.filter(a => a.crossedBonus).length;
  const successRate     = accounts.length > 0 ? ((eligibleCount / accounts.length) * 100) : 0;
  const crossedRate     = accounts.length > 0 ? ((crossedCount / accounts.length) * 100) : 0;

  const topDeposit = useMemo(() => [...rows].filter(r => r.deposit > 0).sort((a, b) => b.deposit - a.deposit).slice(0, 8)
    .map(r => ({ label: r.email.split("@")[0], value: r.deposit, sublabel: "$" + fmtMoney(r.deposit) })), [rows]);
  const topVolume  = useMemo(() => [...rows].filter(r => r.volume > 0).sort((a, b) => b.volume - a.volume).slice(0, 8)
    .map(r => ({ label: r.email.split("@")[0], value: r.volume, sublabel: "$" + fmtMoney(r.volume) })), [rows]);

  // radar data: NoTier/Pending/Eligible/Completed/Failed as %
  const radarVals = useMemo(() => {
    const total = rows.length || 1;
    return ["NoTier","Pending","Eligible","Completed","Failed"].map(s =>
      Math.round(((rows.filter(r => r.status === s).length) / total) * 100)
    );
  }, [rows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <KPI label="Tổng accounts"    value={String(accounts.length)}        color="#a855f7" sub={`${eligibleCount} đủ ĐK`} />
        <KPI label="Tỉ lệ thành công" value={`${successRate.toFixed(0)}%`}   color="#34d399" sub={`${eligibleCount}/${accounts.length}`} />
        <KPI label="Tổng deposit"     value={"$" + fmtMoney(totalDeposit)}   color="#22d3ee" />
        <KPI label="Tổng volume"      value={"$" + fmtMoney(totalVolume)}    color="#a855f7" />
        <KPI label="Bonus tiềm năng"  value={"$" + fmtMoney(potentialBonus)} color="#fbbf24" sub={`$${fmtMoney(completedBonus)} đã đạt`} />
        <KPI label="Đã chéo bonus"    value={`${crossedCount}`}              color="#34d399" sub={`${crossedRate.toFixed(0)}% tổng acc`} />
      </div>

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      <Card>
        <SLabel title="Tiến trình chiến dịch" />
        <Timeline campaign={campaign} />
      </Card>

      {/* ── Row 1: Donut + Radar ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>

        {/* Status donut */}
        <Card>
          <SLabel title="Phân bố trạng thái" sub="Tổng quan tình trạng tài khoản" />
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ flexShrink: 0 }}>
              <Donut segments={statusDist} size={148} thick={22} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
              {statusDist.length === 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Chưa có dữ liệu</span>}
              {statusDist.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.52)", flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: "var(--font-geist-mono)", textShadow: `0 0 8px ${s.color}70` }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Radar / hex overview */}
        <Card style={{ overflow: "visible" }}>
          <SLabel title="Phân bổ tổng quan" sub="% mỗi trạng thái" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ flexShrink: 0 }}>
              <MiniRadar
                values={radarVals}
                labels={["NoTier","Pending","Eligible","Done","Failed"]}
                colors={["#94a3b8","#fbbf24","#34d399","#60a5fa","#f87171"]}
                size={160}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {["NoTier","Pending","Eligible","Completed","Failed"].map((s, i) => {
                const colors = ["#94a3b8","#fbbf24","#34d399","#60a5fa","#f87171"];
                return (
                  <span key={s} style={{ fontSize: 9, color: colors[i], fontFamily: "var(--font-geist-mono)", background: `${colors[i]}12`, border: `0.5px solid ${colors[i]}28`, borderRadius: 3, padding: "1px 6px" }}>
                    {radarVals[i]}%
                  </span>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 2: Tier dist + Volume buckets ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        <Card>
          <SLabel title="Phân bố tier" sub="Số lượng acc theo mức deposit" />
          <HBar bars={tierDist.bars} maxVal={tierDist.maxVal} color="#fbbf24" h={18} />
        </Card>

        <Card>
          <SLabel title="Tiến độ volume" sub="Acc đã đạt bao nhiêu % yêu cầu" />
          {volumeBuckets.buckets.length === 0
            ? <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>Chưa có acc nào có tier phù hợp</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {volumeBuckets.buckets.map(b => {
                  const pct = (b.count / volumeBuckets.maxVal) * 100;
                  return (
                    <div key={b.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)" }}>{b.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: b.color, fontFamily: "var(--font-geist-mono)", textShadow: `0 0 8px ${b.color}60` }}>{b.count} acc</span>
                      </div>
                      <div style={{ height: 14, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`,
                          background: `linear-gradient(90deg,${b.color}40,${b.color}dd)`,
                          borderRadius: 3, boxShadow: `0 0 8px ${b.color}45`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>
      </div>

      {/* ── Row 3: Deposit by tier + Chéo bonus ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        <Card>
          <SLabel title="Tổng deposit theo tier" sub="USDT đổ vào mỗi mức" />
          <HBar bars={depositByTier.bars} maxVal={depositByTier.maxVal} color="#22d3ee" h={18} />
        </Card>

        {/* Crossed bonus visual */}
        <Card>
          <SLabel title="Trạng thái chéo bonus" sub="Đã chéo vs chưa chéo" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* big ring */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flexShrink: 0 }}>
                <Donut segments={[
                  { label: "Đã chéo", value: crossedCount, color: "#34d399" },
                  { label: "Chưa chéo", value: accounts.length - crossedCount, color: "rgba(255,255,255,0.08)" },
                ].filter(s => s.value > 0)} size={120} thick={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Đã chéo</div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-geist-mono)", color: "#34d399", textShadow: "0 0 20px rgba(52,211,153,0.6)" }}>{crossedCount}</div>
                  <div style={{ fontSize: 11, color: "rgba(52,211,153,0.6)", fontFamily: "var(--font-geist-mono)" }}>{crossedRate.toFixed(0)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Chưa chéo</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-geist-mono)", color: "rgba(255,255,255,0.35)" }}>{accounts.length - crossedCount}</div>
                </div>
              </div>
            </div>
            {/* crossed bonus value */}
            {crossedCount > 0 && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(52,211,153,0.07)", border: "0.5px solid rgba(52,211,153,0.2)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Bonus đã chéo</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-geist-mono)", color: "#34d399", textShadow: "0 0 14px rgba(52,211,153,0.5)" }}>
                  ${fmtMoney(rows.filter(r => r.crossedBonus).reduce((s, r) => s + (r.matchedTier?.bonus ?? 0), 0))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 4: Top accounts ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <SLabel title="Top deposit" sub="8 acc có deposit cao nhất" />
          {topDeposit.length === 0
            ? <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>Chưa có dữ liệu</div>
            : <HBar bars={topDeposit} maxVal={topDeposit[0]?.value ?? 1} color="#22d3ee" h={13} />}
        </Card>
        <Card>
          <SLabel title="Top volume" sub="8 acc có volume cao nhất" />
          {topVolume.length === 0
            ? <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>Chưa có dữ liệu</div>
            : <HBar bars={topVolume} maxVal={topVolume[0]?.value ?? 1} color="#a855f7" h={13} />}
        </Card>
      </div>

      {/* ── Tier detail table ─────────────────────────────────────────────── */}
      {tiers.length > 0 && (
        <Card>
          <SLabel title="Chi tiết từng tier" sub="Thống kê acc đạt mỗi mức thưởng" />
          <div style={{ borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.35)" }}>
                  {["Tier", "Min Deposit", "Bonus", "Số acc", "Tổng deposit", "% đạt", "Đã chéo"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.slice().sort((a, b) => a.minDeposit - b.minDeposit).map((tier, i) => {
                  const tierRows  = rows.filter(r => r.matchedTier?.id === tier.id);
                  const tierDep   = tierRows.reduce((s, r) => s + r.deposit, 0);
                  const tierCrossed = tierRows.filter(r => r.crossedBonus).length;
                  const pct       = accounts.length > 0 ? ((tierRows.length / accounts.length) * 100).toFixed(0) : "0";
                  return (
                    <tr key={tier.id} style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "9px 14px", color: "#fbbf24", fontWeight: 600 }}>{tier.label ?? `Tier ${i + 1}`}</td>
                      <td style={{ padding: "9px 14px", color: "#22d3ee", fontFamily: "var(--font-geist-mono)" }}>${fmtMoney(tier.minDeposit)}</td>
                      <td style={{ padding: "9px 14px", color: "#34d399", fontFamily: "var(--font-geist-mono)", fontWeight: 700 }}>+${tier.bonus}</td>
                      <td style={{ padding: "9px 14px", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-geist-mono)" }}>{tierRows.length}</td>
                      <td style={{ padding: "9px 14px", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-geist-mono)" }}>${fmtMoney(tierDep)}</td>
                      <td style={{ padding: "9px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#fbbf24", borderRadius: 2, boxShadow: "0 0 6px rgba(251,191,36,0.5)" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#fbbf24", minWidth: 30, fontFamily: "var(--font-geist-mono)" }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "9px 14px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-geist-mono)", color: tierCrossed > 0 ? "#34d399" : "rgba(255,255,255,0.2)", textShadow: tierCrossed > 0 ? "0 0 8px rgba(52,211,153,0.5)" : "none" }}>
                          {tierCrossed}/{tierRows.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}