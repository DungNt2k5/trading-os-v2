"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, UserPlus, RefreshCw, Pencil, BarChart2, Users, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Campaign, CampaignAccount, AccountFormData, CampaignFormData } from "./types";
import { getExchangeColor, fmtMoney } from "./campaignLogic";
import AccountTable from "./AccountTable";
import AccountForm from "./AccountForm";
import CampaignForm from "./CampaignForm";
import CampaignCharts from "./CampaignCharts";

interface Props {
  campaignId: string;
}

type Tab = "accounts" | "charts";

export default function CampaignDetail({ campaignId }: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [accounts, setAccounts] = useState<CampaignAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaign/${campaignId}`);
      const data = await res.json();
      setCampaign(data);
      setAccounts(data.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch(`/api/campaign/${campaignId}/accounts`);
    const data = await res.json();
    setAccounts(data);
  }, [campaignId]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign, refreshKey]);

  const handleAddAccount = async (data: AccountFormData) => {
    await fetch(`/api/campaign/${campaignId}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, depositTime: data.depositTime || null }),
    });
    fetchAccounts();
  };

  const handleEditCampaign = async (data: CampaignFormData) => {
    await fetch(`/api/campaign/${campaignId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        tiers: data.tiers.map(t => ({ ...t, holdTime: Math.round(t.holdTimeHours * 3600) })),
      }),
    });
    setRefreshKey(k => k + 1);
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
      Đang tải...
    </div>
  );

  if (!campaign) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, height: "100%" }}>
      <div style={{ fontSize: 36, opacity: 0.1 }}>🎯</div>
      <p style={{ color: "rgba(255,255,255,0.2)" }}>Không tìm thấy campaign</p>
      <button onClick={() => router.push("/campaign")} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(34,211,238,0.1)", border: "0.5px solid rgba(34,211,238,0.3)", color: "#22d3ee", cursor: "pointer", fontSize: 13 }}>
        ← Quay lại
      </button>
    </div>
  );

  const exColor = getExchangeColor(campaign.exchange);
  const now = new Date();
  const endDate = new Date(campaign.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400_000);

  const campaignFormInitial: CampaignFormData = {
    name: campaign.name,
    exchange: campaign.exchange,
    description: campaign.description ?? "",
    startDate: campaign.startDate.slice(0, 10),
    endDate: campaign.endDate.slice(0, 10),
    tiers: campaign.tiers.map(t => ({
      label: t.label ?? "",
      minDeposit: t.minDeposit,
      requiredVolume: t.requiredVolume,
      holdTimeHours: t.holdTime / 3600,
      bonus: t.bonus,
      maxSlots: t.maxSlots,
    })),
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "accounts", label: `Tài khoản (${campaign.accounts.length})`, icon: <Users size={13} /> },
    { key: "charts",   label: "Biểu đồ", icon: <BarChart2 size={13} /> },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 0", borderBottom: "0.5px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>

        {/* Back + collapse button */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.push("/campaign")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "4px 8px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, borderRadius: 6 }}>
            <ArrowLeft size={13} /> Kèo
          </button>

          <button onClick={() => setHeaderCollapsed(v => !v)}
            style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "3px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 11, borderRadius: 6, transition: "all 0.15s" }}>
            {headerCollapsed ? <><ChevronDown size={11} /> Mở rộng</> : <><ChevronUp size={11} /> Thu gọn</>}
          </button>
        </div>

        {/* Collapsible section */}
        {!headerCollapsed && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: exColor, background: `${exColor}18`, border: `0.5px solid ${exColor}40`, borderRadius: 6, padding: "3px 10px" }}>
                    {campaign.exchange}
                  </span>
                  <span style={{ fontSize: 11, color: daysLeft > 0 ? "#34d399" : "#f87171", background: daysLeft > 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `0.5px solid ${daysLeft > 0 ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 5, padding: "2px 8px" }}>
                    {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã kết thúc"}
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.92)", margin: "0 0 4px", background: `linear-gradient(135deg,#fff,${exColor})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {campaign.name}
                </h1>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  {new Date(campaign.startDate).toLocaleDateString("vi-VN")} → {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
                  {campaign.description && ` · ${campaign.description}`}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                  <Pencil size={12} /> Sửa kèo
                </button>
                <button onClick={() => setAddOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: `linear-gradient(135deg,${exColor}25,rgba(168,85,247,0.15))`, border: `0.5px solid ${exColor}50`, color: exColor, cursor: "pointer" }}>
                  <UserPlus size={13} /> Thêm tài khoản
                </button>
                <button onClick={() => setRefreshKey(k => k + 1)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {/* ── Tier summary table ───────────────────────────────────────────── */}
            {campaign.tiers.length > 0 && (
              <div style={{ marginBottom: 16, borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                      {["Label", "Min Deposit", "Volume yêu cầu", "Giữ (giờ)", "Bonus", "Max slots"].map(h => (
                        <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.tiers.slice().sort((a, b) => a.minDeposit - b.minDeposit).map((tier, i) => (
                      <tr key={tier.id} style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "7px 12px", color: "#fbbf24", fontWeight: 600 }}>{tier.label ?? `Tier ${i + 1}`}</td>
                        <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "#22d3ee" }}>${fmtMoney(tier.minDeposit)}</td>
                        <td style={{ padding: "7px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>${fmtMoney(tier.requiredVolume)}</td>
                        <td style={{ padding: "7px 12px", color: "rgba(255,255,255,0.5)" }}>{tier.holdTime / 3600}h</td>
                        <td style={{ padding: "7px 12px", fontFamily: "monospace", fontWeight: 700, color: "#34d399" }}>+${tier.bonus}</td>
                        <td style={{ padding: "7px 12px", color: "rgba(255,255,255,0.3)" }}>{tier.maxSlots ?? "∞"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Collapsed summary bar */}
        {headerCollapsed && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: exColor, background: `${exColor}18`, border: `0.5px solid ${exColor}40`, borderRadius: 6, padding: "3px 10px" }}>
                {campaign.exchange}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                {campaign.name}
              </span>
              <span style={{ fontSize: 11, color: daysLeft > 0 ? "#34d399" : "#f87171", opacity: 0.7 }}>
                {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã kết thúc"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setEditOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                <Pencil size={12} /> Sửa kèo
              </button>
              <button onClick={() => setAddOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: `linear-gradient(135deg,${exColor}25,rgba(168,85,247,0.15))`, border: `0.5px solid ${exColor}50`, color: exColor, cursor: "pointer" }}>
                <UserPlus size={13} /> Thêm tài khoản
              </button>
              <button onClick={() => setRefreshKey(k => k + 1)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, fontSize: 12, background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 0, borderBottom: "none" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                background: activeTab === tab.key ? "rgba(255,255,255,0.04)" : "transparent",
                border: activeTab === tab.key ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid transparent",
                borderBottom: activeTab === tab.key ? "0.5px solid rgba(8,8,14,1)" : "0.5px solid transparent",
                color: activeTab === tab.key ? exColor : "rgba(255,255,255,0.3)",
                cursor: "pointer", transition: "all 0.15s", marginBottom: -1, position: "relative", zIndex: 1,
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {activeTab === "accounts" && (
          <AccountTable
            campaign={campaign}
            accounts={accounts}
            tiers={campaign.tiers}
            onAccountsChange={fetchAccounts}
          />
        )}
        {activeTab === "charts" && (
          <CampaignCharts
            campaign={campaign}
            accounts={campaign.accounts}
            tiers={campaign.tiers}
          />
        )}
      </div>

      <AccountForm open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddAccount} />
      <CampaignForm open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleEditCampaign} initial={campaignFormInitial} />
    </div>
  );
}