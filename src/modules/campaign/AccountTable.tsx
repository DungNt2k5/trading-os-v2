"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown,
  Search, Download, Upload, CheckSquare, Square,
  Columns, X, ChevronLeft, ChevronRight, AlertTriangle,
  ChevronDown as ChevDown, Check, GitMerge,
} from "lucide-react";
import type { Campaign, CampaignAccount, CampaignTier, AccountRow } from "./types";
import {
  getMatchedTier, getTimeLeft, getVolumeProgress,
  getAccountStatus, formatCountdown, fmtMoney, STATUS_CONFIG,
} from "./campaignLogic";
import AccountForm from "./AccountForm";
import type { AccountFormData, AccountStatus } from "./types";

interface Props {
  campaign: Campaign;
  accounts: CampaignAccount[];
  tiers: CampaignTier[];
  onAccountsChange: () => void;
}

type SortKey = "index" | "email" | "deposit" | "volume" | "volumeProgress" | "status" | "countdown";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

const ALL_COLUMNS = [
  { key: "index",     label: "#" },
  { key: "email",     label: "Email" },
  { key: "uid",       label: "UID" },
  { key: "wallet",    label: "Wallet" },
  { key: "deposit",   label: "Deposit" },
  { key: "tier",      label: "Tier" },
  { key: "volume",    label: "Volume" },
  { key: "progress",  label: "Tiến độ" },
  { key: "countdown", label: "Countdown" },
  { key: "status",    label: "Trạng thái" },
  { key: "crossed",   label: "Chéo" },
  { key: "note",      label: "Ghi chú" },
] as const;

// ── design tokens ──────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  padding: "8px 11px",
  outline: "none",
};

// ── Custom dropdown (fix native select white bg) ───────────────────────────
function CustomSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; color?: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ ...INPUT, display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", cursor: "pointer", minWidth: 155, whiteSpace: "nowrap",
          color: selected && value !== "all" ? (selected.color ?? "#22d3ee") : "rgba(255,255,255,0.45)",
          background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)" }}>
        {selected && value !== "all" && selected.color && (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: selected.color, boxShadow: `0 0 5px ${selected.color}`, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, textAlign: "left" }}>{selected?.label ?? placeholder ?? "Chọn..."}</span>
        <ChevDown size={11} style={{ opacity: 0.4, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 80,
          background: "rgba(7,7,14,0.99)", border: "0.5px solid rgba(255,255,255,0.1)",
          borderTopColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "6px 0",
          minWidth: "100%", boxShadow: "0 16px 50px rgba(0,0,0,0.85), 0 0 20px rgba(34,211,238,0.03)" }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "7px 14px", background: "transparent", border: "none", cursor: "pointer",
                color: value === opt.value ? (opt.color ?? "#22d3ee") : "rgba(255,255,255,0.6)",
                fontSize: 12, textAlign: "left", transition: "background 0.1s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              {opt.color && opt.value !== "all" && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: opt.color, boxShadow: `0 0 4px ${opt.color}`, flexShrink: 0 }} />
              )}
              <span style={{ flex: 1 }}>{opt.label}</span>
              {value === opt.value && <Check size={11} style={{ opacity: 0.7 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bulk status dropdown ───────────────────────────────────────────────────
function BulkStatusPicker({ onPick }: { onPick: (s: AccountStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 7,
          fontSize: 12, background: "rgba(34,211,238,0.08)", border: "0.5px solid rgba(34,211,238,0.25)",
          color: "#22d3ee", cursor: "pointer" }}>
        Đổi trạng thái <ChevDown size={11} style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 5px)", zIndex: 80,
          background: "rgba(7,7,14,0.99)", border: "0.5px solid rgba(255,255,255,0.1)",
          borderTopColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "6px 0",
          minWidth: 170, boxShadow: "0 16px 50px rgba(0,0,0,0.85)" }}>
          {(Object.entries(STATUS_CONFIG) as [AccountStatus, typeof STATUS_CONFIG[AccountStatus]][]).map(([k, cfg]) => (
            <button key={k} onClick={() => { onPick(k); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 14px", background: "transparent", border: "none", cursor: "pointer",
                color: cfg.color, fontSize: 12, textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${cfg.bg}`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 5px ${cfg.color}`, flexShrink: 0 }} />
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline editable number ─────────────────────────────────────────────────
function InlineNum({ value, onCommit, color }: { value: number; onCommit: (v: number) => void; color: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { if (!editing) setVal(String(value)); }, [value, editing]);
  const commit = () => { setEditing(false); const n = parseFloat(val); if (!isNaN(n) && n !== value) onCommit(n); };
  if (editing) return (
    <input ref={ref} type="number" value={val} onChange={e => setVal(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setVal(String(value)); } }}
      onClick={e => e.stopPropagation()}
      style={{ ...INPUT, width: 84, padding: "3px 7px", fontFamily: "var(--font-geist-mono)", fontSize: 12, color }} />
  );
  return (
    <span onDoubleClick={e => { e.stopPropagation(); setEditing(true); }} title="Double-click để sửa"
      style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600, fontSize: 13, color, cursor: "default", userSelect: "none", borderBottom: `1px dashed ${color}35` }}>
      {fmtMoney(value)}
    </span>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}70`, transition: "width 0.45s ease" }} />
      </div>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", minWidth: 28, fontFamily: "var(--font-geist-mono)" }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function Badge({ status }: { status: AccountRow["status"] }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className="badge-crystal" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 5, padding: "3px 9px", whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, boxShadow: `0 0 5px ${c.color}`, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── Crossed bonus toggle ───────────────────────────────────────────────────
// Hiển thị icon GitMerge — click để toggle, neon khi đã chéo
function CrossedToggle({ crossed, onToggle }: { crossed: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} title={crossed ? "Đã chéo bonus ✓ — click để bỏ" : "Chưa chéo — click để đánh dấu"}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 5,
        background: crossed ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)",
        border: `0.5px solid ${crossed ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)"}`,
        color: crossed ? "#34d399" : "rgba(255,255,255,0.2)",
        cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.15s",
        boxShadow: crossed ? "0 0 10px rgba(52,211,153,0.2)" : "none" }}>
      <GitMerge size={11} style={{ opacity: crossed ? 1 : 0.35 }} />
      {crossed ? "Đã chéo" : "—"}
    </button>
  );
}

// ── Countdown ──────────────────────────────────────────────────────────────
function Countdown({ depositTime, holdTime }: { depositTime: string | null; holdTime: number | null }) {
  const [secs, setSecs] = useState(() => (holdTime != null && depositTime) ? getTimeLeft(depositTime, holdTime) : 0);
  useEffect(() => {
    if (holdTime == null || !depositTime) return;
    const tick = () => setSecs(getTimeLeft(depositTime, holdTime!));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [depositTime, holdTime]);
  if (holdTime == null || !depositTime) return <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>—</span>;
  const col = secs <= 0 ? "#f87171" : secs < 3600 ? "#fbbf24" : "#34d399";
  return <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: col }}>{formatCountdown(secs)}</span>;
}

// ── Sort icon ──────────────────────────────────────────────────────────────
function SI({ col, sk, sd }: { col: SortKey; sk: SortKey; sd: SortDir }) {
  if (col !== sk) return <ChevronsUpDown size={10} style={{ opacity: 0.22 }} />;
  return sd === "asc" ? <ChevronUp size={10} style={{ color: "#22d3ee" }} /> : <ChevronDown size={10} style={{ color: "#22d3ee" }} />;
}

// ── CSV helpers ────────────────────────────────────────────────────────────
function toCsv(rows: AccountRow[]) {
  const h = ["#", "Email", "UID", "Wallet", "Deposit", "DepositTime", "Volume", "Status", "CheoBOnus", "Note"];
  const b = rows.map((r, i) => [i+1, r.email, r.uid, r.wallet, r.deposit, r.depositTime ?? "", r.volume, STATUS_CONFIG[r.status].label, r.crossedBonus ? "yes" : "no", r.note ?? ""].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
  return [h.join(","), ...b].join("\n");
}
function parseCsv(csv: string): Partial<AccountFormData>[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const first = lines[0].toLowerCase();
  const data = (first.includes("email") || first.includes("uid")) ? lines.slice(1) : lines;
  return data.map(l => {
    const c = l.split(",").map(x => x.trim().replace(/^"|"$/g, ""));
    return { email: c[0] ?? "", uid: c[1] ?? "", wallet: c[2] ?? "", deposit: parseFloat(c[3]) || 0, depositTime: c[4] ?? "", volume: parseFloat(c[5]) || 0, note: c[6] ?? "" };
  }).filter(a => a.email);
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AccountTable({ campaign, accounts, tiers, onAccountsChange }: Props) {
  const [editTarget, setEditTarget] = useState<CampaignAccount | null>(null);
  const [formOpen, setFormOpen]     = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFStatus]  = useState("all");
  const [filterTier, setFTier]      = useState("all");
  const [sortKey, setSortKey]       = useState<SortKey>("index");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const [page, setPage]             = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`page-${campaign.id}`);
      return saved ? parseInt(saved, 10) : 1;
    } catch { return 1; }
  });
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkCfm]   = useState(false);
  const [hiddenCols, setHidden]     = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`hiddenCols-${campaign.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set(["wallet", "note"]);
    } catch { return new Set(["wallet", "note"]); }
  });
  const [colMenu, setColMenu]       = useState(false);
  const [importOpen, setImport]     = useState(false);
  const [importText, setIText]      = useState("");
  const [importPrev, setIPrev]      = useState<Partial<AccountFormData>[]>([]);
  const [importing, setILoading]    = useState(false);
  const fileRef    = useRef<HTMLInputElement>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
    setSelected(new Set());
  }, [search, filterStatus, filterTier, sortKey, sortDir]);

  useEffect(() => {
    try {
      localStorage.setItem(`page-${campaign.id}`, String(page));
    } catch {}
  }, [page, campaign.id]);

  useEffect(() => {
    if (!colMenu) return;
    const h = (e: MouseEvent) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenu(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [colMenu]);

  // ── computed ─────────────────────────────────────────────────────────────
  const rows: AccountRow[] = useMemo(() => accounts.map(a => {
    const tier = getMatchedTier(a, tiers);
    const timeLeft = (tier && a.depositTime) ? getTimeLeft(a.depositTime, tier.holdTime) : 0;
    const volumeProgress = tier ? getVolumeProgress(a.volume, tier.requiredVolume) : 0;
    const status = getAccountStatus(a, tiers, campaign);
    return { ...a, matchedTier: tier, status, timeLeft, volumeProgress };
  }), [accounts, tiers, campaign]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();

      if (q.startsWith("uid:")) {
        const val = q.slice(4).trim();
        r = r.filter(x => String(x.uid).toLowerCase().includes(val));
      } else if (q.startsWith("email:")) {
        const val = q.slice(6).trim();
        r = r.filter(x => x.email.toLowerCase().includes(val));
      } else if (q.startsWith("wallet:")) {
        const val = q.slice(7).trim();
        r = r.filter(x => x.wallet.toLowerCase().includes(val));
      } else {
        r = r.filter(x =>
          x.email.toLowerCase().includes(q) ||
          (x.note ?? "").toLowerCase().includes(q)
        );
      }
    }
    if (filterStatus !== "all") r = r.filter(x => x.status === filterStatus);
    if (filterTier !== "all") r = r.filter(x => x.matchedTier?.id === filterTier);
    return r;
  }, [rows, search, filterStatus, filterTier]);

  const sorted = useMemo(() => {
    const m = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "email":          return m * a.email.localeCompare(b.email);
        case "deposit":        return m * (a.deposit - b.deposit);
        case "volume":         return m * (a.volume - b.volume);
        case "volumeProgress": return m * (a.volumeProgress - b.volumeProgress);
        case "status":         return m * a.status.localeCompare(b.status);
        case "countdown":      return m * (a.timeLeft - b.timeLeft);
        default:               return m * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  const visibleCols = ALL_COLUMNS.filter(c => !hiddenCols.has(c.key));
  const doSort = (k: SortKey) => { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("asc"); } };

  // ── stats ─────────────────────────────────────────────────────────────────
  const sc = useMemo(() => rows.reduce((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {} as Record<string, number>), [rows]);
  const totalDep   = useMemo(() => accounts.reduce((s, a) => s + a.deposit, 0), [accounts]);
  const totalBonus = useMemo(() => rows.reduce((s, r) => s + (r.matchedTier?.bonus ?? 0), 0), [rows]);
  const crossedCount = useMemo(() => accounts.filter(a => a.crossedBonus).length, [accounts]);

  // ── actions ───────────────────────────────────────────────────────────────
  const patch = useCallback(async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/campaign/${campaign.id}/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    onAccountsChange();
  }, [campaign.id, onAccountsChange]);

  const del = async (id: string) => {
    if (!confirm("Xóa account này?")) return;
    await fetch(`/api/campaign/${campaign.id}/accounts/${id}`, { method: "DELETE" });
    onAccountsChange();
  };
  const edit = async (data: AccountFormData) => {
    if (!editTarget) return;
    await fetch(`/api/campaign/${campaign.id}/accounts/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, depositTime: data.depositTime || null }) });
    onAccountsChange();
  };

  const toggleSel = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === paged.length && paged.length > 0 ? new Set() : new Set(paged.map(r => r.id)));

  const bulkDel = async () => {
    if (!bulkConfirm) { setBulkCfm(true); return; }
    await Promise.all([...selected].map(id => fetch(`/api/campaign/${campaign.id}/accounts/${id}`, { method: "DELETE" })));
    setSelected(new Set()); setBulkCfm(false); onAccountsChange();
  };

  // Bulk status — lưu vào note dạng "__status:XXX" vì DB không có status field (computed)
  // Thực tế: chỉ crossedBonus là persistable; AccountStatus là computed từ deposit/volume/time
  // Nên bulk "đổi trạng thái" ở đây = bulk toggle crossedBonus theo status target
  const bulkSetCrossed = async (crossed: boolean) => {
    await Promise.all([...selected].map(id => patch(id, { crossedBonus: crossed })));
    setSelected(new Set());
  };

  const doExport = () => {
    const data = selected.size > 0 ? sorted.filter(r => selected.has(r.id)) : sorted;
    const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${campaign.name.replace(/\s+/g, "_")}.csv`; a.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => { const t = ev.target?.result as string; setIText(t); setIPrev(parseCsv(t)); }; r.readAsText(f);
  };
  const onPaste = (t: string) => { setIText(t); setIPrev(parseCsv(t)); };
  const doImport = async () => {
    if (importPrev.length === 0) return; setILoading(true);
    try {
      await Promise.all(importPrev.map(a => fetch(`/api/campaign/${campaign.id}/accounts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: a.email ?? "", uid: a.uid ?? "", wallet: a.wallet ?? "", deposit: a.deposit ?? 0, depositTime: a.depositTime || null, volume: a.volume ?? 0, note: a.note ?? "" }) })));
      setImport(false); setIText(""); setIPrev([]); onAccountsChange();
    } finally { setILoading(false); }
  };

  // ── filter options ────────────────────────────────────────────────────────
  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label, color: v.color })),
  ];
  const tierOptions = [
    { value: "all", label: "Tất cả tier" },
    ...tiers.map(t => ({ value: t.id, label: t.label ?? `Tier $${t.minDeposit}` })),
  ];

  // ── th styles ──────────────────────────────────────────────────────────────
  const TH: React.CSSProperties = { padding: "9px 12px", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderBottom: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(6,6,12,0.98)", whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 5 };
  const THs: React.CSSProperties = { ...TH, cursor: "pointer" };
  const SORTABLE_MAP: Record<string, SortKey | null> = { index: "index", email: "email", deposit: "deposit", volume: "volume", progress: "volumeProgress", status: "status", countdown: "countdown" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
        {[
          { label: "Tổng accounts",   value: String(accounts.length), color: "#a855f7" },
          { label: "Đủ điều kiện",    value: String(sc.Eligible ?? 0),  color: "#34d399" },
          { label: "Hoàn thành",      value: String(sc.Completed ?? 0), color: "#60a5fa" },
          { label: "Tổng deposit",    value: "$" + fmtMoney(totalDep),  color: "#22d3ee" },
          { label: "Đã chéo bonus",   value: String(crossedCount),      color: "#34d399" },
        ].map(s => (
          <div key={s.label} style={{ padding: "11px 14px", borderRadius: 10, background: `${s.color}08`, border: `0.5px solid ${s.color}22`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-geist-mono)", color: s.color, textShadow: `0 0 18px ${s.color}55` }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 150 }}>
          <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.22)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm email... hoặc uid:20 / wallet:0x..."
            style={{ ...INPUT, width: "100%", padding: "8px 30px 8px 30px", boxSizing: "border-box" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", display: "flex", padding: 2 }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Custom status filter */}
        <CustomSelect value={filterStatus} onChange={setFStatus} options={statusOptions} />

        {/* Custom tier filter */}
        {tiers.length > 0 && <CustomSelect value={filterTier} onChange={setFTier} options={tierOptions} />}

        {(search || filterStatus !== "all" || filterTier !== "all") && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-geist-mono)", whiteSpace: "nowrap", background: "rgba(34,211,238,0.06)", border: "0.5px solid rgba(34,211,238,0.15)", borderRadius: 6, padding: "4px 9px" }}>
            {filtered.length} / {accounts.length}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Column toggle */}
        <div ref={colMenuRef} style={{ position: "relative" }}>
          <button onClick={() => setColMenu(o => !o)}
            style={{ ...INPUT, display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12, background: colMenu ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)" }}>
            <Columns size={12} /> Cột
          </button>
          {colMenu && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 60, background: "rgba(7,7,14,0.98)", border: "0.5px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "8px 0", minWidth: 155, boxShadow: "0 16px 50px rgba(0,0,0,0.85), 0 0 30px rgba(34,211,238,0.04)" }}>
              {ALL_COLUMNS.filter(c => c.key !== "index").map(col => (
                <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: 12 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <input type="checkbox" checked={!hiddenCols.has(col.key)}
                    onChange={() => setHidden(p => {
                      const n = new Set(p);
                      n.has(col.key) ? n.delete(col.key) : n.add(col.key);
                      localStorage.setItem(`hiddenCols-${campaign.id}`, JSON.stringify([...n]));
                      return n;
                    })}
                    style={{ accentColor: "#22d3ee", width: 13, height: 13 }} />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setImport(true)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, cursor: "pointer", color: "#a855f7", background: "rgba(168,85,247,0.07)", border: "0.5px solid rgba(168,85,247,0.22)", fontSize: 12 }}>
          <Upload size={12} /> Import
        </button>

        <button onClick={doExport} className="btn-neon-cyan"
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
          <Download size={12} /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
      </div>

      {/* ── Bulk bar ──────────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 9, background: "rgba(168,85,247,0.07)", border: "0.5px solid rgba(168,85,247,0.22)" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{selected.size} đã chọn</span>
          <button onClick={() => setSelected(new Set())} style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", padding: "2px 6px" }}>
            Bỏ chọn
          </button>
          <div style={{ flex: 1 }} />

          {/* Bulk crossed bonus actions */}
          <button onClick={() => bulkSetCrossed(true)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 7, fontSize: 12, background: "rgba(52,211,153,0.08)", border: "0.5px solid rgba(52,211,153,0.25)", color: "#34d399", cursor: "pointer" }}>
            <GitMerge size={12} /> Đánh dấu đã chéo
          </button>
          <button onClick={() => bulkSetCrossed(false)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 7, fontSize: 12, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <GitMerge size={12} /> Bỏ chéo
          </button>

          {/* Divider */}
          <div style={{ width: "0.5px", height: 20, background: "rgba(255,255,255,0.1)" }} />

          {/* Bulk delete */}
          {bulkConfirm ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} /> Xác nhận xóa {selected.size} acc?
              </span>
              <button onClick={bulkDel} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 12, background: "rgba(248,113,113,0.12)", border: "0.5px solid rgba(248,113,113,0.35)", color: "#f87171", cursor: "pointer", fontWeight: 600 }}>Xóa ngay</button>
              <button onClick={() => setBulkCfm(false)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Huỷ</button>
            </div>
          ) : (
            <button onClick={bulkDel} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 12, background: "rgba(248,113,113,0.07)", border: "0.5px solid rgba(248,113,113,0.22)", color: "#f87171", cursor: "pointer" }}>
              <Trash2 size={12} /> Xóa đã chọn
            </button>
          )}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.07)", overflow: "auto", maxHeight: "55vh" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 880 }}>
          <thead>
            <tr>
              <th style={TH}>
                <button onClick={toggleAll} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 0 }}>
                  {selected.size === paged.length && paged.length > 0 ? <CheckSquare size={13} color="#a855f7" /> : <Square size={13} />}
                </button>
              </th>
              {visibleCols.map(col => {
                const sk = SORTABLE_MAP[col.key];
                return (
                  <th key={col.key} style={sk ? THs : TH} onClick={sk ? () => doSort(sk) : undefined}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {col.key === "crossed" ? <GitMerge size={11} style={{ opacity: 0.5 }} /> : null}
                      {col.label}
                      {sk && <SI col={sk} sk={sortKey} sd={sortDir} />}
                    </div>
                  </th>
                );
              })}
              <th style={TH} />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 2} style={{ textAlign: "center", padding: 52, color: "rgba(255,255,255,0.14)", fontSize: 13 }}>
                  {accounts.length === 0 ? 'Chưa có account nào. Nhấn "Thêm tài khoản" để bắt đầu!' : "Không tìm thấy account nào"}
                </td>
              </tr>
            )}
            {paged.map((row, i) => {
              const gi = (page - 1) * PAGE_SIZE + i + 1;
              const isSel = selected.has(row.id);
              // crossed row gets subtle green tint
              const rowBg = isSel ? "rgba(168,85,247,0.06)" : row.crossedBonus ? "rgba(52,211,153,0.03)" : "transparent";
              return (
                <tr key={row.id}
                  style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)", transition: "background 0.12s", background: rowBg }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; }}>

                  <td style={{ padding: "9px 12px" }}>
                    <button onClick={() => toggleSel(row.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 0 }}>
                      {isSel ? <CheckSquare size={13} color="#a855f7" /> : <Square size={13} />}
                    </button>
                  </td>

                  {visibleCols.map(col => {
                    switch (col.key) {
                      case "index":    return <td key="index" style={{ padding: "9px 12px", color: "rgba(255,255,255,0.22)", fontSize: 11, textAlign: "center", fontFamily: "var(--font-geist-mono)" }}>{gi}</td>;
                      case "email":    return <td key="email" style={{ padding: "9px 12px", color: "rgba(255,255,255,0.8)", maxWidth: 175, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span title={row.email}>{row.email}</span></td>;
                      case "uid":      return <td key="uid" style={{ padding: "9px 12px", color: "rgba(255,255,255,0.42)", fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>{row.uid || "—"}</td>;
                      case "wallet":   return <td key="wallet" style={{ padding: "9px 12px", color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-geist-mono)", fontSize: 11, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis" }}>{row.wallet || "—"}</td>;
                      case "deposit":  return <td key="deposit" style={{ padding: "9px 12px" }}><InlineNum value={row.deposit} color="#22d3ee" onCommit={v => patch(row.id, { deposit: v })} /></td>;
                      case "tier":     return <td key="tier" style={{ padding: "9px 12px" }}>{row.matchedTier ? <span className="badge-crystal" style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "0.5px solid rgba(251,191,36,0.28)", borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>{row.matchedTier.label ?? `$${fmtMoney(row.matchedTier.bonus)} Bonus`}</span> : <span style={{ color: "rgba(255,255,255,0.18)" }}>—</span>}</td>;
                      case "volume":   return <td key="volume" style={{ padding: "9px 12px" }}><InlineNum value={row.volume} color="#a855f7" onCommit={v => patch(row.id, { volume: v })} />{row.matchedTier && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>/ {fmtMoney(row.matchedTier.requiredVolume)}</div>}</td>;
                      case "progress": return <td key="progress" style={{ padding: "9px 12px", minWidth: 110 }}>{row.matchedTier ? <Bar pct={row.volumeProgress} color={row.volumeProgress >= 100 ? "#34d399" : row.volumeProgress >= 50 ? "#fbbf24" : "#f87171"} /> : <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>—</span>}</td>;
                      case "countdown": return <td key="countdown" style={{ padding: "9px 12px" }}><Countdown depositTime={row.depositTime} holdTime={row.matchedTier?.holdTime ?? null} /></td>;
                      case "status":   return <td key="status" style={{ padding: "9px 12px" }}><Badge status={row.status} /></td>;
                      case "crossed":  return <td key="crossed" style={{ padding: "9px 10px" }}><CrossedToggle crossed={row.crossedBonus} onToggle={() => patch(row.id, { crossedBonus: !row.crossedBonus })} /></td>;
                      case "note":     return <td key="note" style={{ padding: "9px 12px", color: "rgba(255,255,255,0.28)", fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.note || "—"}</td>;
                      default: return null;
                    }
                  })}

                  <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 4, opacity: 0 }} className="row-acts">
                      <button onClick={() => { setEditTarget(row); setFormOpen(true); }}
                        style={{ background: "rgba(34,211,238,0.07)", border: "0.5px solid rgba(34,211,238,0.2)", borderRadius: 6, color: "#22d3ee", cursor: "pointer", padding: "4px 9px", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Pencil size={10} /> Sửa
                      </button>
                      <button onClick={() => del(row.id)}
                        style={{ background: "rgba(248,113,113,0.07)", border: "0.5px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", fontSize: 11 }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-geist-mono)" }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} / {sorted.length}
          </span>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.09)", color: page === 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)", cursor: page === 1 ? "not-allowed" : "pointer" }}>«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.09)", color: page === 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}><ChevronLeft size={12} /></button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, idx) => {
              let p: number;
              if (totalPages <= 7) p = idx + 1;
              else if (page <= 4) p = idx + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + idx;
              else p = page - 3 + idx;
              return <button key={p} onClick={() => setPage(p)} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 12, minWidth: 32, background: page === p ? "rgba(34,211,238,0.12)" : "transparent", border: `0.5px solid ${page === p ? "rgba(34,211,238,0.38)" : "rgba(255,255,255,0.09)"}`, color: page === p ? "#22d3ee" : "rgba(255,255,255,0.45)", cursor: "pointer", fontWeight: page === p ? 700 : 400, fontFamily: "var(--font-geist-mono)" }}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.09)", color: page === totalPages ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)", cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}><ChevronRight size={12} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.09)", color: page === totalPages ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)", cursor: page === totalPages ? "not-allowed" : "pointer" }}>»</button>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono)" }}>trang {page}/{totalPages}</span>
        </div>
      )}

      <style>{`tr:hover .row-acts { opacity: 1 !important; }`}</style>
      <AccountForm open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} onSubmit={edit} initial={editTarget} />

      {/* ── Import Modal ───────────────────────────────────────────────────── */}
      {importOpen && (
        <div className="dialog-backdrop" style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => e.target === e.currentTarget && setImport(false)}>
          <div className="dialog-panel animate-dialog-rift" style={{ width: "100%", maxWidth: 640, borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 18, maxHeight: "85vh", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: 0 }}>Import accounts từ CSV</h2>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "5px 0 0" }}>Format: <code style={{ color: "#22d3ee", fontSize: 10 }}>email, uid, wallet, deposit, depositTime, volume, note</code></p>
              </div>
              <button onClick={() => setImport(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={15} /></button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={onFile} />
            <button onClick={() => fileRef.current?.click()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", cursor: "pointer", color: "#a855f7", background: "rgba(168,85,247,0.08)", border: "0.5px solid rgba(168,85,247,0.28)", width: "fit-content", borderRadius: 8, fontSize: 13 }}>
              <Upload size={12} /> Chọn file CSV
            </button>
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 11 }}>— hoặc paste CSV —</div>
            <textarea value={importText} onChange={e => onPaste(e.target.value)}
              placeholder={"email,uid,wallet,deposit,depositTime,volume,note\nuser@example.com,123,0xabc,500,,0,"}
              style={{ width: "100%", height: 110, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(255,255,255,0.75)", fontSize: 11, padding: 12, outline: "none", resize: "vertical", fontFamily: "var(--font-geist-mono)", boxSizing: "border-box" }} />
            {importPrev.length > 0 && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Preview: <span style={{ color: "#34d399", fontWeight: 700 }}>{importPrev.length} accounts</span></div>
                <div style={{ borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.07)", overflow: "hidden", maxHeight: 180, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr style={{ background: "rgba(0,0,0,0.4)" }}>{["Email","UID","Deposit","Volume"].map(h=><th key={h} style={{ padding:"6px 10px",textAlign:"left",color:"rgba(255,255,255,0.28)",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</th>)}</tr></thead>
                    <tbody>{importPrev.slice(0,50).map((r,i)=><tr key={i} style={{ borderTop:"0.5px solid rgba(255,255,255,0.04)" }}><td style={{ padding:"5px 10px",color:"rgba(255,255,255,0.72)" }}>{r.email}</td><td style={{ padding:"5px 10px",color:"rgba(255,255,255,0.38)",fontFamily:"var(--font-geist-mono)" }}>{r.uid||"—"}</td><td style={{ padding:"5px 10px",color:"#22d3ee",fontFamily:"var(--font-geist-mono)" }}>{r.deposit||0}</td><td style={{ padding:"5px 10px",color:"#a855f7",fontFamily:"var(--font-geist-mono)" }}>{r.volume||0}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setImport(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 9, background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Huỷ</button>
              <button onClick={doImport} disabled={importPrev.length === 0 || importing}
                style={{ flex: 2, padding: "10px 0", borderRadius: 9, background: importPrev.length > 0 ? "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(34,211,238,0.1))" : "rgba(255,255,255,0.03)", border: `0.5px solid ${importPrev.length > 0 ? "rgba(168,85,247,0.38)" : "rgba(255,255,255,0.08)"}`, color: importPrev.length > 0 ? "#a855f7" : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 600, cursor: importPrev.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Upload size={12} />{importing ? "Đang import..." : `Import ${importPrev.length} accounts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}