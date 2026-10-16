"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Palette,
  Users,
  CreditCard,
  Server,
  Check,
  RefreshCw,
  Sliders,
  Activity,
  ArrowRight,
  LogOut,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SessionUser } from "@/lib/session";

interface BrandingData {
  productName: string;
  companyName: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  footerText: string;
  landingHeadline: string;
  landingSubheadline: string;
}

interface PendingPayment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  createdAt: string;
  providerReference?: string | null;
  customer?: {
    name: string | null;
    email: string;
  };
  subscription?: {
    plan?: {
      name: string;
    };
  };
}

interface OperatorAdminClientProps {
  user: SessionUser;
}

export function OperatorAdminClient({ user }: OperatorAdminClientProps) {
  const [activeTab, setActiveTab] = useState<"branding" | "payments" | "overview">("branding");
  const [branding, setBranding] = useState<BrandingData>({
    productName: "ZeuHost",
    companyName: "Zeuzz",
    primaryColor: "#09090B",
    accentColor: "#10B981",
    supportEmail: "support@zeuhost.org",
    footerText: "Layanan Hosting Bot WhatsApp dan Discord",
    landingHeadline: "Sewa dan jalankan bot kamu 24 jam tanpa perlu menyalakan laptop.",
    landingSubheadline: "ZeuHost menyediakan hosting bot untuk WhatsApp, Discord, dan Telegram. Cukup hubungkan sekali dari browser, bot kamu langsung aktif melayani chat pelanggan atau komunitas.",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Payments State
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setBranding((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});
  }, []);

  const fetchPayments = () => {
    setLoadingPayments(true);
    fetch("/api/admin/payments")
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/dashboard";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setPendingPayments(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPayments(false));
  };

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    }
  }, [activeTab]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Gagal menyimpan branding.");
      }
    } catch {
      alert("Gagal terhubung ke server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorNotes: "Dikonfirmasi langsung oleh Owner via Web Admin" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg("Pembayaran berhasil dikonfirmasi! Paket hosting pelanggan telah diaktifkan.");
        setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setTimeout(() => setActionSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Gagal konfirmasi pembayaran.");
      }
    } catch {
      alert("Gagal menghubungi server.");
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt("Masukkan alasan penolakan tagihan:");
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorNotes: reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg("Pembayaran berhasil ditolak.");
        setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId));
        setTimeout(() => setActionSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Gagal menolak pembayaran.");
      }
    } catch {
      alert("Gagal menghubungi server.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-black">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                A
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                ZeuHost
              </span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/60">
              Panel Kontrol Owner ({user.email})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Ke Dashboard Pelanggan</span>
            </Link>

            <Link
              href="/login"
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border bg-card transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("branding")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "branding"
                ? "bg-accent text-black"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Kustomisasi Branding</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "payments"
                ? "bg-accent text-black"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Konfirmasi Pembayaran</span>
            {pendingPayments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "overview"
                ? "bg-accent text-black"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Status Node VPS</span>
          </button>
        </div>

        {/* Tab 1: Branding Config */}
        {activeTab === "branding" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pengaturan Identitas Brand Platform</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ubah nama layanan, headline landing page, dan warna aksen secara instan tanpa menyentuh source code.
              </p>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Nama Layanan / Aplikasi
                  </label>
                  <input
                    type="text"
                    value={branding.productName}
                    onChange={(e) => setBranding({ ...branding, productName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Nama Perusahaan / Operator
                  </label>
                  <input
                    type="text"
                    value={branding.companyName}
                    onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Warna Aksen Brand (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground font-mono focus:border-accent focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email Bantuan / CS
                  </label>
                  <input
                    type="email"
                    value={branding.supportEmail}
                    onChange={(e) => setBranding({ ...branding, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Judul Utama Landing Page
                </label>
                <input
                  type="text"
                  value={branding.landingHeadline}
                  onChange={(e) => setBranding({ ...branding, landingHeadline: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Sub-judul Landing Page
                </label>
                <textarea
                  rows={3}
                  value={branding.landingSubheadline}
                  onChange={(e) => setBranding({ ...branding, landingSubheadline: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {saveSuccess && (
                    <span className="text-accent flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      Perubahan branding berhasil disimpan!
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Server Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-xs text-muted-foreground">Total Bot Hosting</div>
                <div className="text-2xl font-bold text-foreground mt-2">Aktif</div>
                <p className="text-xs text-accent mt-1">Docker Engine Sandbox</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-xs text-muted-foreground">Host RAM Terpakai</div>
                <div className="text-2xl font-bold text-foreground mt-2">Cgroups v2</div>
                <p className="text-xs text-muted-foreground mt-1">Hard Limit Per Container</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-xs text-muted-foreground">Runtime Manager Daemon</div>
                <div className="text-2xl font-bold text-accent mt-2">Connected</div>
                <p className="text-xs text-muted-foreground mt-1">Port 4001 • HMAC Active</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border text-xs space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Status Isolasi Keamanan Host</h3>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Hak Akses Bot Container:</span>
                <span className="text-foreground font-mono">UID/GID 1001:1001 (zeubot)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Linux Capabilities:</span>
                <span className="text-accent font-mono">CAP_DROP_ALL (Aktif)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Pids Limit Quota:</span>
                <span className="text-foreground font-mono">100 PIDs max / container</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Reverse Proxy Ingress:</span>
                <span className="text-foreground font-mono">Caddy v2.8 (Auto TLS)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payments */}
        {activeTab === "payments" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Daftar Konfirmasi Pembayaran</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verifikasi bukti transfer pelanggan untuk mengaktifkan atau memperpanjang paket sewa bot.
                </p>
              </div>
              <button
                onClick={fetchPayments}
                disabled={loadingPayments}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                title="Refresh tagihan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? "animate-spin" : ""}`} />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {pendingPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                Semua pembayaran sewa telah diverifikasi. Tidak ada tagihan tertunda saat ini.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {payment.customer?.name || payment.customer?.email || "Pelanggan"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Paket: {payment.subscription?.plan?.name || "Bot Hosting"} • Nominal: {payment.currency} {payment.amount.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                        Ref: {payment.providerReference || payment.id} • Metode: {payment.method}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectPayment(payment.id)}
                        className="px-3 py-1.5 rounded-lg bg-background hover:bg-zinc-800 text-zinc-300 border border-border text-xs font-medium transition-colors"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprovePayment(payment.id)}
                        className="px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors shadow-xs"
                      >
                        Konfirmasi Pembayaran
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
