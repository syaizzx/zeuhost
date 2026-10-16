"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Globe,
  Code2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  CreditCard,
  Check,
  RefreshCw,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { QrCodeRenderer } from "@/components/QrCodeRenderer";

interface PlanItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "BOT_HOSTING" | "WEB_NODEJS" | "PYTHON_APP";
  hasFileManager: boolean;
  priceMonthly: number;
  currency: string;
  maxInstances: number;
  maxMemoryPerInstanceMb: number;
  maxCpuPerInstance: number;
  maxStorageMb: number;
}

interface PaymentConfigData {
  provider: "MANUAL" | "TRIPAY" | "MIDTRANS";
  manual: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface CheckoutData {
  reference: string;
  paymentUrl?: string;
  qrString?: string;
  instructions: string;
}

export default function BuyPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "BOT_HOSTING" | "WEB_NODEJS" | "PYTHON_APP">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [planToBuy, setPlanToBuy] = useState<PlanItem | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigData | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [paymentErrorMsg, setPaymentErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    fetch("/api/payments/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPaymentConfig(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartCheckout = (plan: PlanItem) => {
    setPlanToBuy(plan);
    setCheckoutData(null);
    setPaymentSuccessMsg("");
    setPaymentErrorMsg("");
    setPaymentReference("");
    setShowCheckoutModal(true);
  };

  const handleExecuteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToBuy) return;
    setIsSubmitting(true);
    setPaymentSuccessMsg("");
    setPaymentErrorMsg("");

    // Automated Gateway Checkout (Tripay / Midtrans)
    if (paymentConfig?.provider === "TRIPAY" || paymentConfig?.provider === "MIDTRANS") {
      try {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: planToBuy.id }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setCheckoutData(data.data);
          if (data.data.paymentUrl) {
            window.open(data.data.paymentUrl, "_blank");
          }
        } else {
          setPaymentErrorMsg(data.error || "Gagal menghubungi gateway pembayaran.");
        }
      } catch (err) {
        setPaymentErrorMsg(err instanceof Error ? err.message : "Gagal menghubungi server.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Manual Payment Submission
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planToBuy.id,
          amount: planToBuy.priceMonthly,
          currency: planToBuy.currency,
          method: "MANUAL_TRANSFER",
          providerReference: paymentReference.trim() || `REF-${Date.now().toString().slice(-6)}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentSuccessMsg("Bukti pembayaran berhasil dikirim! Menunggu konfirmasi operator.");
      } else {
        setPaymentErrorMsg(data.error || "Gagal mengirim tagihan pembayaran.");
      }
    } catch (err) {
      setPaymentErrorMsg(err instanceof Error ? err.message : "Gagal terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-black flex items-center justify-center font-bold text-sm shadow-xs">
                Z
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                ZeuHost
              </span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-muted-foreground font-medium">
              Katalog Paket Hosting
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
              <span>Dashboard Saya</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Resmi Paket Cloud Hosting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Pilih Paket Hosting Sesuai Kebutuhan Anda
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pilih paket sewa bot otomatis tanpa koding, atau paket Web &amp; Node.js dengan akses Web File Manager lengkap.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === "ALL"
                ? "bg-accent text-black shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            Semua Paket
          </button>
          <button
            onClick={() => setSelectedCategory("BOT_HOSTING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              selectedCategory === "BOT_HOSTING"
                ? "bg-accent text-black shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Khusus Bot (Kode Tertanam)</span>
          </button>
          <button
            onClick={() => setSelectedCategory("WEB_NODEJS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              selectedCategory === "WEB_NODEJS"
                ? "bg-accent text-black shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web &amp; Node.js PaaS</span>
          </button>
          <button
            onClick={() => setSelectedCategory("PYTHON_APP")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              selectedCategory === "PYTHON_APP"
                ? "bg-accent text-black shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-card border border-border"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Cloud</span>
          </button>
        </div>

        {/* Plan Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto" />
            <p className="text-xs text-muted-foreground">Memuat daftar paket...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md relative group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {plan.category === "BOT_HOSTING" ? "🤖 Bot Managed" : "⚡ Cloud PaaS"}
                    </span>
                    {plan.category === "BOT_HOSTING" && (
                      <span className="text-[10px] text-accent font-semibold">Zero-Code</span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                      {plan.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed min-h-10">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <div className="text-2xl font-black text-foreground">
                      Rp {plan.priceMonthly.toLocaleString("id-ID")}
                      <span className="text-xs font-normal text-muted-foreground"> / bulan</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-zinc-300">
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Alokasi RAM</span>
                      <span className="font-semibold text-foreground">{plan.maxMemoryPerInstanceMb} MB / bot</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Batas CPU</span>
                      <span className="font-semibold text-foreground">{plan.maxCpuPerInstance} vCPU Core</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Kapasitas Instance</span>
                      <span className="font-semibold text-foreground">Maksimal {plan.maxInstances} Instance</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Akses File Manager</span>
                      <span className={`font-semibold ${plan.hasFileManager ? "text-accent" : "text-zinc-500"}`}>
                        {plan.hasFileManager ? "Aktif (Monaco Editor)" : "Tertanam (Cukup Terminal)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleStartCheckout(plan)}
                    className="w-full py-2.5 rounded-xl bg-accent text-black text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Pilih &amp; Beli Paket Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {showCheckoutModal && planToBuy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Beli Paket {planToBuy.name}</h3>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutData(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutData ? (
              <div className="py-4 text-center space-y-4">
                <div className="text-xs font-semibold text-accent">Tagihan Berhasil Dibuat</div>
                <div className="text-xs text-muted-foreground font-mono">Ref: {checkoutData.reference}</div>

                {checkoutData.qrString && (
                  <div className="flex justify-center">
                    <QrCodeRenderer qrString={checkoutData.qrString} size={200} />
                  </div>
                )}

                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {checkoutData.instructions}
                </p>

                {checkoutData.paymentUrl && (
                  <a
                    href={checkoutData.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Buka Halaman Pembayaran</span>
                  </a>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="flex-1 py-2 rounded-lg bg-accent text-black font-semibold text-xs text-center hover:bg-emerald-400 transition-colors"
                  >
                    Buka Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setCheckoutData(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs hover:bg-zinc-800 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : paymentSuccessMsg ? (
              <div className="py-6 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto" />
                <h4 className="text-sm font-bold text-foreground">Bukti Pembayaran Terkirim!</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {paymentSuccessMsg}
                </p>
                <div className="pt-3 flex items-center justify-center gap-2">
                  <Link
                    href="/dashboard"
                    className="px-5 py-2 rounded-lg bg-accent text-black font-semibold text-xs hover:bg-emerald-400 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Ke Dashboard Saya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteCheckout} className="space-y-4">
                {paymentErrorMsg && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-xs">
                    {paymentErrorMsg}
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg text-xs space-y-2 border border-border">
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>{planToBuy.name}</span>
                    <span className="text-accent">Rp {planToBuy.priceMonthly.toLocaleString("id-ID")} / bln</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {planToBuy.description}
                  </p>
                </div>

                {paymentConfig?.provider === "TRIPAY" ? (
                  <div className="p-3 bg-accent/10 rounded-lg text-xs space-y-1 border border-accent/30">
                    <div className="font-semibold text-accent">Metode Pembayaran: Tripay Gateway</div>
                    <div className="text-muted-foreground">
                      QRIS Real-Time (GoPay, OVO, Dana, ShopeePay) &amp; Virtual Account Bank otomatis.
                    </div>
                  </div>
                ) : paymentConfig?.provider === "MIDTRANS" ? (
                  <div className="p-3 bg-accent/10 rounded-lg text-xs space-y-1 border border-accent/30">
                    <div className="font-semibold text-accent">Metode Pembayaran: Midtrans Instant</div>
                    <div className="text-muted-foreground">
                      Pembayaran instan via GoPay, QRIS, dan Transfer Bank Virtual Account.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg text-xs space-y-2 border border-border">
                    <div className="font-semibold text-foreground">Instruksi Transfer Bank Manual:</div>
                    <div className="text-muted-foreground leading-relaxed">
                      Silakan transfer ke rekening:
                      <div className="mt-1 font-mono font-bold text-foreground text-sm">
                        {paymentConfig?.manual.bankName || "BCA"} {paymentConfig?.manual.accountNumber || "842-019-XXXX"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        a/n {paymentConfig?.manual.accountName || "ZeuHost Operator"}
                      </div>
                    </div>
                  </div>
                )}

                {paymentConfig?.provider === "MANUAL" && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Nomor Referensi Transfer / Nama Pengirim
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Contoh: Transfer BCA a/n Budi Santoso"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>
                        {paymentConfig?.provider === "MANUAL"
                          ? "Kirim Bukti Pembayaran"
                          : "Bayar Sekarang (QRIS / Instant)"}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
