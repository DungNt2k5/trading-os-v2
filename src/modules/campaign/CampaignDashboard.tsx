"use client";
// src/modules/campaign/CampaignDashboard.tsx

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "./types";
import CampaignForm from "./CampaignForm";
import { Plus, Swords, TrendingUp, Users, BarChart2, Zap, Clock, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CELESTIAL BACKGROUND — Tu Tiên: khí công vòng tròn + long mạch + linh khí
// ─────────────────────────────────────────────────────────────────────────────
function CelestialBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── LINH KHÍ PARTICLES — tinh thể lục + kim bay lên ──
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; color: string;
      pulse: number; pulseSpeed: number;
      shape: "diamond" | "circle" | "cross";
    };
    const LINH_KHI_COLORS = [
      "#4ade80", "#86efac", "#fbbf24", "#fde68a",
      "#34d399", "#6ee7b7", "#a3e635", "#d9f99d",
    ];
    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
      y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
      vx: (Math.random() - 0.5) * 0.18,
      vy: -Math.random() * 0.28 - 0.04,
      size: Math.random() * 2.2 + 0.3,
      alpha: Math.random() * 0.35 + 0.04,
      color: LINH_KHI_COLORS[Math.floor(Math.random() * LINH_KHI_COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.012 + Math.random() * 0.022,
      shape: (["diamond", "circle", "cross"] as const)[Math.floor(Math.random() * 3)],
    }));

    // ── KHÍ CÔNG VÒNG TRÒN — xoay đồng tâm ──
    type QiRing = {
      cx: number; cy: number; r: number;
      speed: number; angle: number;
      segments: number; gapRatio: number;
      color: string; width: number; alpha: number;
      direction: 1 | -1;
    };
    const qiRings: QiRing[] = [
      // Vòng lớn trung tâm trái
      { cx: 0.18, cy: 0.42, r: 110, speed: 0.0018, angle: 0, segments: 8, gapRatio: 0.38, color: "#4ade80", width: 0.7, alpha: 0.07, direction: 1 },
      { cx: 0.18, cy: 0.42, r: 80,  speed: 0.0028, angle: Math.PI / 8, segments: 6, gapRatio: 0.4, color: "#fbbf24", width: 0.5, alpha: 0.05, direction: -1 },
      { cx: 0.18, cy: 0.42, r: 52,  speed: 0.004,  angle: 0, segments: 4, gapRatio: 0.45, color: "#86efac", width: 0.4, alpha: 0.06, direction: 1 },
      // Vòng góc phải
      { cx: 0.82, cy: 0.58, r: 130, speed: 0.0014, angle: 1, segments: 10, gapRatio: 0.35, color: "#fbbf24", width: 0.8, alpha: 0.055, direction: -1 },
      { cx: 0.82, cy: 0.58, r: 90,  speed: 0.0024, angle: 0.5, segments: 7, gapRatio: 0.4, color: "#4ade80", width: 0.5, alpha: 0.045, direction: 1 },
      { cx: 0.82, cy: 0.58, r: 58,  speed: 0.0038, angle: 0, segments: 5, gapRatio: 0.42, color: "#fde68a", width: 0.4, alpha: 0.05, direction: -1 },
      // Vòng nhỏ rải rác
      { cx: 0.5,  cy: 0.15, r: 65,  speed: 0.003,  angle: 0, segments: 6, gapRatio: 0.4, color: "#34d399", width: 0.5, alpha: 0.045, direction: 1 },
      { cx: 0.5,  cy: 0.85, r: 72,  speed: 0.0022, angle: 1, segments: 8, gapRatio: 0.36, color: "#fbbf24", width: 0.5, alpha: 0.04, direction: -1 },
    ];

    // ── LONG MẠCH — đường khí uốn lượn ngang màn hình ──
    type DragonVein = {
      points: { x: number; y: number }[];
      offsets: number[];
      speeds: number[];
      amplitudes: number[];
      phases: number[];
      color: string;
      alpha: number;
      width: number;
      dashOffset: number;
      dashSpeed: number;
    };

    function makeDragonVein(yRatio: number, color: string, alpha: number, width: number): DragonVein {
      const n = 9;
      return {
        points: Array.from({ length: n }, (_, i) => ({
          x: (i / (n - 1)),
          y: yRatio,
        })),
        offsets: Array.from({ length: n }, () => Math.random() * Math.PI * 2),
        speeds: Array.from({ length: n }, () => 0.004 + Math.random() * 0.006),
        amplitudes: Array.from({ length: n }, (_, i) => {
          const edge = Math.min(i, n - 1 - i) / (n / 2);
          return edge * (18 + Math.random() * 22);
        }),
        phases: Array.from({ length: n }, () => 0),
        color, alpha, width,
        dashOffset: 0,
        dashSpeed: 0.4 + Math.random() * 0.5,
      };
    }

    const dragonVeins: DragonVein[] = [
      makeDragonVein(0.28, "#4ade80", 0.055, 0.7),
      makeDragonVein(0.55, "#fbbf24", 0.04,  0.5),
      makeDragonVein(0.72, "#86efac", 0.045, 0.6),
      makeDragonVein(0.12, "#fde68a", 0.03,  0.4),
      makeDragonVein(0.88, "#34d399", 0.032, 0.4),
    ];

    // ── BÁT QUÁI RUNE — các ký hiệu xoay mờ ──
    type Rune = {
      x: number; y: number; r: number;
      angle: number; speed: number;
      alpha: number; color: string;
      glowPhase: number;
    };
    const runes: Rune[] = [
      { x: 0.18, y: 0.42, r: 34, angle: 0, speed: 0.0006, alpha: 0.1, color: "#fbbf24", glowPhase: 0 },
      { x: 0.82, y: 0.58, r: 40, angle: Math.PI / 4, speed: -0.0005, alpha: 0.08, color: "#4ade80", glowPhase: 1 },
      { x: 0.5,  cy: 0.15, r: 22, angle: 0, speed: 0.001,  alpha: 0.07, color: "#86efac", glowPhase: 2 } as unknown as Rune,
    ];
    // fix cy → y
    (runes[2] as unknown as Record<string, number>).y = 0.15;

    // ── TINH TÚ — các điểm sáng tĩnh nền ──
    type Star = { x: number; y: number; r: number; alpha: number; phase: number; speed: number };
    const stars: Star[] = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 0.8 + 0.2,
      alpha: Math.random() * 0.18 + 0.02,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.015,
    }));

    let animId: number;
    let frame = 0;

    // ── VẼ PHẦN BÁT QUÁI TRIGRAM SYMBOL ──
    function drawBaguaRune(cx: number, cy: number, r: number, angle: number, alpha: number, color: string) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Vòng tròn ngoài
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // 8 vạch trigram xung quanh
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(a) * (r * 0.62);
        const y1 = Math.sin(a) * (r * 0.62);
        const x2 = Math.cos(a) * (r * 0.92);
        const y2 = Math.sin(a) * (r * 0.92);

        // Mỗi quẻ có 3 hào
        for (let h = 0; h < 3; h++) {
          const t = 0.28 + h * 0.24;
          const px = x1 + (x2 - x1) * t;
          const py = y1 + (y2 - y1) * t;
          const perp = { x: -Math.sin(a), y: Math.cos(a) };
          const broken = (i + h) % 3 === 1; // quẻ âm = hào đứt
          if (broken) {
            ctx.beginPath();
            ctx.moveTo(px + perp.x * 2.5, py + perp.y * 2.5);
            ctx.lineTo(px + perp.x * 0.5, py + perp.y * 0.5);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px - perp.x * 0.5, py - perp.y * 0.5);
            ctx.lineTo(px - perp.x * 2.5, py - perp.y * 2.5);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(px + perp.x * 2.5, py + perp.y * 2.5);
            ctx.lineTo(px - perp.x * 2.5, py - perp.y * 2.5);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Chấm thái cực trung tâm
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    // ── VẼ KHÍ CÔNG VÒNG (segmented arc) ──
    function drawQiRing(ring: QiRing, W: number, H: number) {
      const cx = ring.cx * W;
      const cy = ring.cy * H;
      const segAngle = (Math.PI * 2) / ring.segments;
      const arcAngle = segAngle * (1 - ring.gapRatio);

      ctx.save();
      ctx.globalAlpha = ring.alpha;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 6;

      for (let i = 0; i < ring.segments; i++) {
        const startA = ring.angle + i * segAngle;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, startA, startA + arcAngle);
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;

      // ── TINH TÚ nền ──
      for (const s of stars) {
        s.phase += s.speed;
        const a = s.alpha * (0.4 + 0.6 * Math.sin(s.phase));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = Math.sin(s.phase) > 0 ? "#fde68a" : "#86efac";
        ctx.fill();
        ctx.restore();
      }

      // ── LONG MẠCH — đường khí uốn ──
      for (const v of dragonVeins) {
        v.dashOffset += v.dashSpeed;
        for (let i = 0; i < v.phases.length; i++) {
          v.phases[i] += v.speeds[i];
        }

        // Tính toạ độ thực
        const pts = v.points.map((p, i) => ({
          x: p.x * W,
          y: p.y * H + Math.sin(v.phases[i] + v.offsets[i]) * v.amplitudes[i],
        }));

        ctx.save();
        ctx.globalAlpha = v.alpha;
        ctx.strokeStyle = v.color;
        ctx.lineWidth = v.width;
        ctx.setLineDash([8, 18]);
        ctx.lineDashOffset = -v.dashOffset;
        ctx.shadowColor = v.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── KHÍ CÔNG VÒNG TRÒN ──
      for (const ring of qiRings) {
        ring.angle += ring.speed * ring.direction;
        drawQiRing(ring, W, H);
      }

      // ── BÁT QUÁI RUNE ──
      for (const rune of runes) {
        rune.angle += rune.speed;
        rune.glowPhase += 0.018;
        const pulseAlpha = rune.alpha * (0.6 + 0.4 * Math.sin(rune.glowPhase));
        drawBaguaRune(rune.x * W, rune.y * H, rune.r, rune.angle, pulseAlpha, rune.color);
      }

      // ── LINH KHÍ PARTICLES ──
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.pulse += p.pulseSpeed;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        if (p.x < -12) p.x = W + 12;
        if (p.x > W + 12) p.x = -12;
        const a = p.alpha * (0.4 + 0.6 * Math.sin(p.pulse));

        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;

        if (p.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.7);
          ctx.lineTo(p.size * 0.75, 0);
          ctx.lineTo(0, p.size * 1.7);
          ctx.lineTo(-p.size * 0.75, 0);
          ctx.closePath();
          ctx.fillStyle = p.color;
          ctx.fill();
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          // cross
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.4); ctx.lineTo(0, p.size * 1.4); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-p.size * 1.4, 0); ctx.lineTo(p.size * 1.4, 0); ctx.stroke();
        }
        ctx.restore();
      }

      // ── LƯỚI KHÍ — cực mờ ──
      if (frame % 3 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.009;
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 0.4;
        const gs = 90;
        for (let x = 0; x < W; x += gs) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += gs) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();
      }

      // ── THIÊN ĐẠO QUANG LUÂN — tia sáng xuyên tâm cực nhẹ ──
      if (frame % 6 === 0) {
        for (const ring of qiRings.slice(0, 2)) {
          const cx = ring.cx * W;
          const cy = ring.cy * H;
          ctx.save();
          ctx.globalAlpha = 0.012;
          for (let i = 0; i < 6; i++) {
            const a = ring.angle + (i / 6) * Math.PI * 2;
            const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * 160, cy + Math.sin(a) * 160);
            g.addColorStop(0, ring.color);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160);
            ctx.strokeStyle = g;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN LINES overlay
// ─────────────────────────────────────────────────────────────────────────────
function ScanLines() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.018) 2px, rgba(0,0,0,0.018) 4px)",
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORNER ORNAMENT — jade-gold bracket style
// ─────────────────────────────────────────────────────────────────────────────
function CornerDeco({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const sx = pos === "tr" || pos === "br" ? -1 : 1;
  const sy = pos === "bl" || pos === "br" ? -1 : 1;
  const style: React.CSSProperties = {
    position: "fixed", width: 56, height: 56, pointerEvents: "none", zIndex: 8,
    transform: `scaleX(${sx}) scaleY(${sy})`,
    ...(pos === "tl" ? { top: 14, left: 14 } : {}),
    ...(pos === "tr" ? { top: 14, right: 14 } : {}),
    ...(pos === "bl" ? { bottom: 14, left: 14 } : {}),
    ...(pos === "br" ? { bottom: 14, right: 14 } : {}),
  };
  return (
    <div style={style}>
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path d="M0 0 L34 0 L34 2.5 L2.5 2.5 L2.5 34 L0 34 Z" fill="#fbbf24" opacity="0.45" />
        <path d="M0 0 L20 0 L20 1.5 L1.5 1.5 L1.5 20 L0 20 Z" fill="#4ade80" opacity="0.3" />
        <rect x="5" y="5" width="7" height="7" fill="none" stroke="#fbbf24" strokeWidth="0.8" opacity="0.4" />
        <circle cx="6" cy="6" r="1.6" fill="#fbbf24" opacity="0.75" />
        <circle cx="10" cy="1.8" r="1.1" fill="#4ade80" opacity="0.5" />
        <circle cx="1.8" cy="10" r="1.1" fill="#4ade80" opacity="0.5" />
        <line x1="0" y1="50" x2="50" y2="0" stroke="#fbbf24" strokeWidth="0.4" opacity="0.1" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE BADGE — jade seal style
// ─────────────────────────────────────────────────────────────────────────────
function ExchangeBadge({ name }: { name: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 44, height: 44, borderRadius: 6, flexShrink: 0,
      background: "linear-gradient(135deg, rgba(251,191,36,0.14), rgba(74,222,128,0.06))",
      border: "1px solid rgba(251,191,36,0.32)",
      fontSize: 11, fontWeight: 900, color: "#fbbf24",
      letterSpacing: "0.04em", fontFamily: "monospace",
      boxShadow: "inset 0 0 10px rgba(251,191,36,0.06), 0 0 14px rgba(251,191,36,0.08)",
    }}>
      {name.slice(0, 3).toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS helper
// ─────────────────────────────────────────────────────────────────────────────
function getStatus(c: Campaign, now: Date) {
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  if (now < start) return { label: "Sắp tới", color: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.25)" };
  if (now > end)   return { label: "Đã kết thúc", color: "#64748b", bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.2)" };
  return           { label: "Đang chạy", color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.28)" };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD — jade/gold palette
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color, accent, sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  accent: string;
  sublabel?: string;
}) {
  return (
    <div style={{
      position: "relative", flex: "1 1 160px",
      padding: "16px 20px 14px",
      borderRadius: 8,
      background: `linear-gradient(135deg, ${color}0d, rgba(6,9,15,0.88))`,
      border: `1px solid ${color}28`,
      overflow: "hidden",
      boxShadow: `0 4px 22px ${color}0e, inset 0 1px 0 ${color}12`,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
        background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
      }} />
      <div style={{
        position: "absolute", right: -16, top: -16, width: 72, height: 72, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}16 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 8, right: 10,
        fontSize: 10, color: `${color}22`, fontFamily: "serif",
      }}>✦</div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{
            fontSize: 30, fontWeight: 900, lineHeight: 1,
            fontFamily: "monospace", letterSpacing: "-0.02em",
            color, textShadow: `0 0 18px ${color}50`,
          }}>
            {value}
          </div>
          <div style={{
            fontSize: 10, marginTop: 5, letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.28)", textTransform: "uppercase",
          }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontSize: 9.5, marginTop: 3, letterSpacing: "0.06em", color: `${color}75` }}>
              {sublabel}
            </div>
          )}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 6, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}10`, border: `1px solid ${color}28`, color,
        }}>
          {icon}
        </div>
      </div>

      <div style={{
        marginTop: 13, height: 1.5, borderRadius: 1,
        background: `linear-gradient(90deg, ${color}40, ${accent}28, transparent)`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function CampaignDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaign");
      if (res.ok) setCampaigns(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const now = new Date();
  const totalAccounts = campaigns.reduce((s, c) => s + (c.accounts?.length ?? 0), 0);
  const activeCount = campaigns.filter(c => new Date(c.startDate) <= now && new Date(c.endDate) >= now).length;
  const upcomingCount = campaigns.filter(c => new Date(c.startDate) > now).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #04060c 0%, #060a10 45%, #04070e 100%)",
      position: "relative", overflowX: "hidden",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseJade {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
          50%       { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
        }
        .campaign-card-anim { animation: fadeUp 0.42s cubic-bezier(0.16,1,0.3,1) both; }
        .live-dot { animation: pulseJade 2.0s infinite; }
        .btn-primary-xian:hover { filter: brightness(1.18); transform: translateY(-1px); }
        .btn-primary-xian:active { transform: scale(0.97); }
        .stat-card-hover:hover { transform: translateY(-3px); filter: brightness(1.07); }
      `}</style>

      <CelestialBackground />
      <ScanLines />

      {/* ── TOP BORDER ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2.5, zIndex: 10,
        background: "linear-gradient(90deg, transparent, #4ade80 15%, #fbbf24 40%, #86efac 60%, #fbbf24 80%, transparent)",
      }} />

      {/* ── HEADER ── */}
      <div style={{
        position: "relative", zIndex: 5,
        padding: "32px 46px 0",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(-12px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <CornerDeco pos="tl" />
        <CornerDeco pos="tr" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 8,
              background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(74,222,128,0.08))",
              border: "1px solid rgba(251,191,36,0.38)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 26px rgba(251,191,36,0.14), inset 0 0 14px rgba(251,191,36,0.05)",
              flexShrink: 0, position: "relative",
            }}>
              <span style={{ position: "absolute", top: 3, left: 4, fontSize: 7, color: "rgba(251,191,36,0.4)" }}>✦</span>
              <span style={{ position: "absolute", bottom: 3, right: 4, fontSize: 7, color: "rgba(74,222,128,0.4)" }}>✦</span>
              <Swords size={22} color="#fbbf24" />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{
                  fontSize: 25, fontWeight: 900, margin: 0, lineHeight: 1,
                  background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 35%, #86efac 70%, #4ade80 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text", letterSpacing: "0.08em",
                }}>
                  MANAGER
                </h1>
                <span style={{ fontSize: 9, color: "rgba(251,191,36,0.3)", letterSpacing: "0.35em", fontFamily: "serif" }}>
                  ✦ 靈 ✦
                </span>
                <span style={{ fontSize: 9, color: "rgba(74,222,128,0.25)", letterSpacing: "0.25em", fontFamily: "monospace" }}>
                  CAMPAIGN SYS
                </span>
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.05em" }}>
                Theo dõi kèo thưởng · Đa tài khoản · Đa sàn giao dịch
              </p>
            </div>
          </div>

          <button
            className="btn-primary-xian"
            onClick={() => setShowForm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 24px", borderRadius: 6,
              background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(74,222,128,0.08))",
              border: "1px solid rgba(251,191,36,0.42)",
              color: "#fde68a", fontSize: 13, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.06em",
              boxShadow: "0 0 22px rgba(251,191,36,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
              transition: "all 0.2s ease", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            <Plus size={14} color="#fbbf24" />
            <span>NEW</span>
          </button>
        </div>

        {/* ── STAT CARDS ── */}
        {!loading && (
          <div style={{ display: "flex", gap: 13, marginTop: 26, flexWrap: "wrap" }}>
            <div className="stat-card-hover" style={{ flex: "1 1 160px", transition: "all 0.22s ease" }}>
              <StatCard icon={<BarChart2 size={16} />} label="Tổng chiến dịch" value={campaigns.length}
                color="#fbbf24" accent="#fde68a"
                sublabel={campaigns.length > 0 ? `${activeCount + upcomingCount} còn hoạt động` : "chưa có"} />
            </div>
            <div className="stat-card-hover" style={{ flex: "1 1 160px", transition: "all 0.22s ease" }}>
              <StatCard icon={<Zap size={16} />} label="Đang chạy" value={activeCount}
                color="#4ade80" accent="#86efac"
                sublabel={activeCount > 0 ? "live ngay lúc này" : "không có"} />
            </div>
            <div className="stat-card-hover" style={{ flex: "1 1 160px", transition: "all 0.22s ease" }}>
              <StatCard icon={<Clock size={16} />} label="Sắp tới" value={upcomingCount}
                color="#fb923c" accent="#fbbf24"
                sublabel={upcomingCount > 0 ? "đang chờ mở" : "không có"} />
            </div>
            <div className="stat-card-hover" style={{ flex: "1 1 160px", transition: "all 0.22s ease" }}>
              <StatCard icon={<Users size={16} />} label="Tổng tài khoản" value={totalAccounts}
                color="#86efac" accent="#4ade80"
                sublabel={campaigns.length > 0 ? `trên ${campaigns.length} chiến dịch` : undefined} />
            </div>
          </div>
        )}

        {/* ── JADE DIVIDER ── */}
        <div style={{ marginTop: 26, marginBottom: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.2), rgba(74,222,128,0.12))" }} />
          <span style={{ fontSize: 11, color: "rgba(251,191,36,0.3)", letterSpacing: "0.3em", fontFamily: "serif" }}>✦ 陣 ✦</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(74,222,128,0.12), rgba(251,191,36,0.2), transparent)" }} />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        position: "relative", zIndex: 5,
        padding: "26px 46px 58px",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease 0.18s",
      }}>

        {!loading && campaigns.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 4,
              background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "rgba(251,191,36,0.5)", fontFamily: "serif",
            }}>陣</div>
            <span style={{ fontSize: 9.5, color: "rgba(251,191,36,0.3)", letterSpacing: "0.25em", fontFamily: "monospace" }}>
              DANH SÁCH CHIẾN DỊCH
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "110px 0", gap: 18 }}>
            <div style={{
              width: 36, height: 36,
              border: "1.5px solid rgba(251,191,36,0.1)",
              borderTop: "1.5px solid #fbbf24",
              borderRadius: "50%",
              animation: "spin 0.88s linear infinite",
            }} />
            <span style={{ fontSize: 10, color: "rgba(251,191,36,0.3)", letterSpacing: "0.28em", fontFamily: "monospace" }}>
              ĐANG TẢI...
            </span>
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "90px 0", gap: 20, textAlign: "center",
          }}>
            <div style={{
              width: 82, height: 82, borderRadius: 8,
              border: "1px solid rgba(251,191,36,0.2)",
              background: "rgba(251,191,36,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 38px rgba(251,191,36,0.05)", position: "relative",
            }}>
              <span style={{ position: "absolute", top: 6, left: 7, fontSize: 9, color: "rgba(251,191,36,0.25)", fontFamily: "serif" }}>✦</span>
              <span style={{ position: "absolute", bottom: 6, right: 7, fontSize: 9, color: "rgba(74,222,128,0.2)", fontFamily: "serif" }}>✦</span>
              <Swords size={28} color="rgba(251,191,36,0.38)" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", margin: "0 0 7px", fontWeight: 600, letterSpacing: "0.05em" }}>
                Chưa có chiến dịch nào
              </h2>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.15)", margin: 0 }}>
                Nhấn nút bên trên để tạo chiến dịch đầu tiên
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "10px 28px", borderRadius: 6, fontSize: 12,
                background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.28)",
                color: "#fbbf24", cursor: "pointer", letterSpacing: "0.08em",
                fontFamily: "inherit", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 7, transition: "all 0.18s",
              }}
            >
              <Plus size={13} />
              Tạo chiến dịch đầu tiên
            </button>
          </div>
        )}

        {/* ── CAMPAIGN CARDS ── */}
        {!loading && campaigns.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 15,
          }}>
            {campaigns.map((c, idx) => {
              const status = getStatus(c, now);
              const accountCount = c.accounts?.length ?? 0;
              const tierCount = c.tiers?.length ?? 0;
              const isHov = hovered === c.id;
              const isLive = status.label === "Đang chạy";
              const startFmt = new Date(c.startDate).toLocaleDateString("vi-VN");
              const endFmt = new Date(c.endDate).toLocaleDateString("vi-VN");

              return (
                <div
                  key={c.id}
                  className="campaign-card-anim"
                  onClick={() => router.push(`/campaign/${c.id}`)}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                    position: "relative", cursor: "pointer",
                    borderRadius: 8, overflow: "hidden",
                    border: `1px solid ${isHov ? "rgba(251,191,36,0.4)" : "rgba(251,191,36,0.1)"}`,
                    background: isHov
                      ? "linear-gradient(145deg, rgba(251,191,36,0.07), rgba(4,6,12,0.97))"
                      : "linear-gradient(145deg, rgba(251,191,36,0.03), rgba(4,6,12,0.94))",
                    boxShadow: isHov
                      ? "0 10px 38px rgba(251,191,36,0.1), inset 0 0 22px rgba(74,222,128,0.02)"
                      : "0 2px 14px rgba(0,0,0,0.5)",
                    transition: "all 0.24s cubic-bezier(0.16,1,0.3,1)",
                    transform: isHov ? "translateY(-4px)" : "none",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 1.5,
                    background: isHov
                      ? "linear-gradient(90deg, transparent, #4ade80, #fbbf24, #4ade80, transparent)"
                      : "linear-gradient(90deg, transparent, rgba(251,191,36,0.28), transparent)",
                    transition: "all 0.28s",
                  }} />

                  {isHov && (
                    <div style={{
                      position: "absolute", top: -28, right: -28, width: 110, height: 110,
                      borderRadius: "50%", pointerEvents: "none",
                      background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
                    }} />
                  )}

                  <div style={{
                    position: "absolute", top: 9, right: 10,
                    opacity: isHov ? 0.5 : 0.12, transition: "opacity 0.22s",
                    fontSize: 9, color: "#fbbf24", fontFamily: "serif",
                  }}>✦</div>

                  <div style={{ padding: "17px 19px 15px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 13 }}>
                      <ExchangeBadge name={c.exchange} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 9, fontWeight: 800, color: "#fbbf24",
                            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)",
                            padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em", fontFamily: "monospace",
                          }}>
                            {c.exchange.toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: 9, color: status.color,
                            background: status.bg, border: `1px solid ${status.border}`,
                            padding: "2px 7px", borderRadius: 3, letterSpacing: "0.05em",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            {isLive && (
                              <span className="live-dot" style={{
                                display: "inline-block", width: 5, height: 5,
                                borderRadius: "50%", background: "#4ade80", flexShrink: 0,
                              }} />
                            )}
                            {status.label}
                          </span>
                        </div>
                        <h3 style={{
                          fontSize: 14.5, fontWeight: 700, margin: 0, lineHeight: 1.3,
                          color: isHov ? "#fde68a" : "rgba(255,255,255,0.75)",
                          letterSpacing: "0.03em",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          transition: "color 0.2s",
                        }}>
                          {c.name}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(251,191,36,0.09)" }} />
                      <div style={{ width: 5, height: 5, background: "rgba(251,191,36,0.35)", transform: "rotate(45deg)", borderRadius: 1 }} />
                      <div style={{ flex: 1, height: 1, background: "rgba(251,191,36,0.09)" }} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", letterSpacing: "0.03em" }}>
                        {startFmt} → {endFmt}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 3, fontSize: 10,
                          color: "rgba(255,255,255,0.3)",
                          background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)",
                          padding: "2px 7px", borderRadius: 4,
                        }}>
                          <Users size={9} color="rgba(251,191,36,0.55)" />
                          <span>{accountCount}</span>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 3, fontSize: 10,
                          color: "rgba(255,255,255,0.3)",
                          background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)",
                          padding: "2px 7px", borderRadius: 4,
                        }}>
                          <TrendingUp size={9} color="rgba(74,222,128,0.55)" />
                          <span>{tierCount} mốc</span>
                        </div>
                      </div>
                    </div>

                    {c.description && (
                      <p style={{
                        margin: "9px 0 0", fontSize: 10, color: "rgba(255,255,255,0.14)",
                        letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {c.description}
                      </p>
                    )}
                  </div>

                  {isHov && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "flex-end",
                      padding: "6px 15px 11px", gap: 4,
                      fontSize: 10, color: "rgba(251,191,36,0.4)", letterSpacing: "0.07em",
                    }}>
                      <span>Xem chi tiết</span>
                      <ChevronRight size={11} color="rgba(251,191,36,0.4)" />
                    </div>
                  )}

                  {isHov && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, height: 45,
                      background: "linear-gradient(to top, rgba(251,191,36,0.05), transparent)",
                      pointerEvents: "none",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CornerDeco pos="bl" />
      <CornerDeco pos="br" />

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 2, zIndex: 10,
        background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.3), rgba(251,191,36,0.25), rgba(74,222,128,0.3), transparent)",
        pointerEvents: "none",
      }} />

      {showForm && (
        <CampaignForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            const res = await fetch("/api/campaign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                tiers: data.tiers.map((t) => ({
                  ...t,
                  holdTime: t.holdTimeHours * 3600,
                })),
              }),
            });
            if (res.ok) { await fetchCampaigns(); setShowForm(false); }
          }}
        />
      )}
    </div>
  );
}