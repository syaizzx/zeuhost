"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  Play,
  Square,
  RefreshCw,
  Plus,
  Activity,
  MemoryStick,
  LogOut,
  Smartphone,
  Send,
  X,
  CreditCard,
  CheckCircle2,
  Trash2,
  Cpu,
  Layers,
  Copy,
  Check,
  Folder,
  Terminal,
  Server,
  Code2,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Globe,
} from "lucide-react";
import { LiveTerminal } from "@/components/LiveTerminal";
import { QrCodeRenderer } from "@/components/QrCodeRenderer";
import { FileManager } from "@/components/FileManager";

interface BotInstance {
  id: string;
  name: string;
  platform: "whatsapp" | "discord" | "telegram" | "web" | "python";
  status: "ONLINE" | "OFFLINE";
  memory: string;
  uptime: string;
  containerId?: string | null;
  instanceType?: string;
}
interface ApiInstanceItem {
  id: string;
  name: string;
  memoryLimitMb: number;
  status: string;
  containerId?: string | null;
  instanceType?: string;
  templateVersion?: {
    template?: {
      runtime?: string;
      slug?: string;
    };
  };
}

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

interface ActiveSubscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  plan: PlanItem;
}

interface TemplateOption {
  id: string;
  name: string;
  slug: string;
  runtime: string;
  description: string;
  versions?: Array<{ id: string; versionTag: string }>;
}

interface LiveStats {
  memoryUsageMb: number;
  memoryLimitMb: number;
  cpuPercentage: number;
  pidsCount: number;
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

export default function CustomerDashboardPage() {
  // Subscription state
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanItem[]>([]);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<"ALL" | "BOT_HOSTING" | "WEB_NODEJS" | "PYTHON_APP">("ALL");

  // Instances & Navigation
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"terminal" | "files">("terminal");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [stats, setStats] = useState<LiveStats | null>(null);

  // WhatsApp Pairing State
  const [detectedQr, setDetectedQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copiedPairingCode, setCopiedPairingCode] = useState<boolean>(false);

  // Deploy Form State
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotPlatform, setNewBotPlatform] = useState<"whatsapp" | "discord" | "telegram" | "web" | "python">("whatsapp");
  const [botToken, setBotToken] = useState("");
  const [pairingNumber, setPairingNumber] = useState("");
  const [ownerNumber, setOwnerNumber] = useState("");
  const [customPort, setCustomPort] = useState<number>(3000);
  const [customMemory, setCustomMemory] = useState<number>(256);
  const [deployError, setDeployError] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // Upgrade / Billing Form State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [planToBuy, setPlanToBuy] = useState<PlanItem | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigData | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // 1. Fetch Subscription Status
  const checkSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/subscription");
      const data = await res.json();
      if (res.ok && data.success) {
        setHasActiveSubscription(data.hasActiveSubscription);
        setActiveSub(data.subscription || null);
      } else {
        setHasActiveSubscription(false);
      }
    } catch {
      setHasActiveSubscription(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // 2. Fetch Available Plans (for plan catalog when no active plan or upgrading)
  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAvailablePlans(data.data);
        }
      })
      .catch(() => {});

    fetch("/api/payments/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPaymentConfig(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // 3. Fetch Instances only if active subscription exists
  const fetchInstances = useCallback(async () => {
    if (hasActiveSubscription === false) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/instances");
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: BotInstance[] = data.data.map((item: ApiInstanceItem) => {
          let platform: "whatsapp" | "discord" | "telegram" | "web" | "python" = "whatsapp";
          const runtime = item.templateVersion?.template?.runtime;
          const slug = item.templateVersion?.template?.slug || "";
          if (slug.includes("web") || slug.includes("node")) {
            platform = "web";
          } else if (runtime === "PYTHON" || slug.includes("telegram")) {
            platform = "telegram";
          } else if (slug.includes("discord")) {
            platform = "discord";
          }

          return {
            id: item.id,
            name: item.name,
            platform,
            status: item.status === "RUNNING" ? "ONLINE" : "OFFLINE",
            memory: `${item.memoryLimitMb} MB`,
            uptime: item.status === "RUNNING" ? "Aktif" : "Nonaktif",
            containerId: item.containerId,
            instanceType: item.instanceType,
          };
        });

        setInstances(mapped);
        if (mapped.length > 0 && !selectedBotId) {
          setSelectedBotId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load instances:", err);
    } finally {
      setIsLoading(false);
    }
  }, [hasActiveSubscription, selectedBotId]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Fetch templates for deploy modal
  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTemplates(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Poll live telemetry stats for selected bot
  useEffect(() => {
    if (!selectedBotId) {
      setStats(null);
      return;
    }

    const currentBot = instances.find((i) => i.id === selectedBotId);
    if (!currentBot || currentBot.status !== "ONLINE") {
      setStats(null);
      return;
    }

    const fetchStats = () => {
      fetch(`/api/instances/${selectedBotId}/stats`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setStats(data.data);
          }
        })
        .catch(() => {});
    };

    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [selectedBotId, instances]);

  const toggleBotStatus = async (id: string) => {
    const current = instances.find((i) => i.id === id);
    if (!current) return;
    const action = current.status === "ONLINE" ? "STOP" : "START";

    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id === id) {
          const nextStatus = inst.status === "ONLINE" ? "OFFLINE" : "ONLINE";
          return {
            ...inst,
            status: nextStatus,
            uptime: nextStatus === "ONLINE" ? "Baru saja" : "Nonaktif",
          };
        }
        return inst;
      })
    );

    try {
      const res = await fetch(`/api/instances/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) await fetchInstances();
    } catch {
      await fetchInstances();
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (!confirm("Yakin ingin menghapus instance ini? Seluruh data sesi dan berkas akan dibersihkan.")) {
      return;
    }

    try {
      const res = await fetch(`/api/instances/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstances((prev) => prev.filter((i) => i.id !== id));
        if (selectedBotId === id) {
          const remaining = instances.filter((i) => i.id !== id);
          setSelectedBotId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error("Failed to delete instance:", err);
    }
  };

  const handleDeployBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    setIsDeploying(true);
    setDeployError("");

    let targetTemplate = templates.find((t) => {
      if (newBotPlatform === "whatsapp") return t.slug.includes("whatsapp");
      if (newBotPlatform === "discord") return t.slug.includes("discord");
      if (newBotPlatform === "web") return t.slug.includes("web") || t.slug.includes("discord");
      return t.slug.includes("telegram");
    });

    const versionId = targetTemplate?.versions?.[0]?.id || "ver-wa-1";

    const envVars: Record<string, string> = {
      BOT_NAME: newBotName,
    };

    if (newBotPlatform === "whatsapp") {
      if (ownerNumber) envVars.OWNER_NUMBER = ownerNumber;
      if (pairingNumber) envVars.PAIRING_NUMBER = pairingNumber;
    } else {
      if (botToken) envVars.BOT_TOKEN = botToken;
      if (newBotPlatform === "web") envVars.PORT = customPort.toString();
    }

    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBotName,
          templateVersionId: versionId,
          envVars,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeployError(data.error || "Gagal membuat instance.");
        return;
      }

      await fetchInstances();
      if (data.data?.id) setSelectedBotId(data.data.id);
      setNewBotName("");
      setBotToken("");
      setPairingNumber("");
      setOwnerNumber("");
      setShowDeployModal(false);
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Gagal terhubung ke server.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleStartCheckout = (plan: PlanItem) => {
    setPlanToBuy(plan);
    setCheckoutData(null);
    setPaymentSuccessMsg("");
    setPaymentReference("");
    setShowCheckoutModal(true);
  };

  const handleExecuteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToBuy) return;
    setIsSubmittingPayment(true);
    setPaymentSuccessMsg("");

    if (paymentConfig?.provider === "TRIPAY" || paymentConfig?.provider === "MIDTRANS") {
      try {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: planToBuy.id }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCheckoutData(data.data);
          if (data.data.paymentUrl) {
            window.open(data.data.paymentUrl, "_blank");
          }
        } else {
          setPaymentSuccessMsg(data.error || "Gagal menghubungi gateway.");
        }
      } catch {
        setPaymentSuccessMsg("Gagal menghubungi gateway pembayaran.");
      } finally {
        setIsSubmittingPayment(false);
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
          providerReference: paymentReference || `REF-${Date.now().toString().slice(-6)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccessMsg("Bukti pembayaran berhasil dikirim! Operator akan mengaktifkan paket Anda.");
        setTimeout(() => {
          setShowCheckoutModal(false);
          checkSubscription();
        }, 2000);
      }
    } catch {
      setPaymentSuccessMsg("Gagal mengirim bukti pembayaran.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const copyPairingCodeToClipboard = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopiedPairingCode(true);
      setTimeout(() => setCopiedPairingCode(false), 2000);
    }
  };

  const selectedBot = instances.find((i) => i.id === selectedBotId) || null;
  const isBotHostingPlan = activeSub?.plan?.category === "BOT_HOSTING" || !activeSub?.plan?.hasFileManager;

  // Render Plan Catalog Filters
  const filteredPlans = availablePlans.filter((p) => {
    if (selectedCatalogCategory === "ALL") return true;
    return p.category === selectedCatalogCategory;
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
              Panel Cloud Pelanggan
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveSubscription && activeSub?.plan && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paket: {activeSub.plan.name}</span>
              </span>
            )}

            <Link
              href="/buy"
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span>{hasActiveSubscription ? "Ubah Paket" : "Beli Paket"}</span>
            </Link>

            {hasActiveSubscription && (
              <button
                onClick={() => {
                  setDeployError("");
                  setShowDeployModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isBotHostingPlan ? "Tambah Bot Baru" : "Tambah App Baru"}</span>
              </button>
            )}

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

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Loading Subscription */}
        {hasActiveSubscription === null ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto" />
            <p className="text-xs text-muted-foreground">Memverifikasi lisensi paket hosting Anda...</p>
          </div>
        ) : !hasActiveSubscription ? (
          /* ========================================================================= */
          /* VIEW 1: NO ACTIVE SUBSCRIPTION -> PLAN CATALOG & BUY SELECTION ONLY        */
          /* TIDAK MENAMPILKAN APAPUN TENTANG SERVER / BOT KARENA BELUM MEMILIKI PAKET */
          /* ========================================================================= */
          <div className="py-20 px-6 max-w-md mx-auto text-center bg-card border border-border rounded-2xl space-y-4 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Paket Hosting Belum Aktif</h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Anda belum memiliki paket sewa bot atau web hosting yang aktif. Pilih paket terlebih dahulu di halaman pembelian untuk mulai membuat bot atau mengunggah aplikasi.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/buy"
                className="w-full py-2.5 rounded-xl bg-accent text-black text-xs font-bold hover:bg-emerald-400 transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Pilih Paket di Halaman /buy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: ACTIVE SUBSCRIPTION -> SERVER & BOT MANAGEMENT INTERFACE          */
          /* Hanya muncul jika user sudah memiliki paket aktif                         */
          /* ========================================================================= */
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Instance Aktif</span>
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="text-2xl font-bold text-foreground mt-2">
                  {instances.filter((i) => i.status === "ONLINE").length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {activeSub?.plan?.maxInstances || 1} Kuota
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Paket {activeSub?.plan?.name}</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>RAM Terpakai</span>
                  <MemoryStick className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-foreground mt-2">
                  {stats ? `${stats.memoryUsageMb} MB` : selectedBot?.status === "ONLINE" ? "Mengambil..." : "0 MB"}
                  {stats && stats.memoryLimitMb > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                      / {stats.memoryLimitMb} MB
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Hard limit cgroups kernel</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>CPU &amp; Proses Thread</span>
                  <Cpu className="w-4 h-4 text-accent" />
                </div>
                <div className="text-2xl font-bold text-foreground mt-2">
                  {stats ? `${stats.cpuPercentage}%` : "0.0%"}
                  {stats && (
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                      • {stats.pidsCount} PIDs
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Delta throttling kernel</p>
              </div>
            </div>

            {/* Instance List & Live Inspector */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto" />
                <p className="text-xs text-muted-foreground">Memuat instansi bot dari Docker daemon...</p>
              </div>
            ) : instances.length === 0 ? (
              <div className="py-16 px-6 text-center bg-card border border-border rounded-2xl max-w-lg mx-auto space-y-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
                  {isBotHostingPlan ? <Bot className="w-6 h-6" /> : <Server className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isBotHostingPlan ? "Belum Ada Bot Dibuat" : "Belum Ada Aplikasi Dibuat"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Paket Anda ({activeSub?.plan?.name}) sudah aktif! Silakan buat instance pertama Anda.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeployError("");
                    setShowDeployModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isBotHostingPlan ? "Deploy Bot Pertama" : "Deploy App Pertama"}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Instance List */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h2 className="text-sm font-semibold text-foreground">Daftar Instance</h2>
                    <span className="text-xs text-muted-foreground">{instances.length} aktif</span>
                  </div>

                  {instances.map((bot) => (
                    <div
                      key={bot.id}
                      onClick={() => setSelectedBotId(bot.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                        selectedBotId === bot.id
                          ? "bg-muted border-zinc-700"
                          : "bg-card border-border hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-foreground">
                            {bot.platform === "whatsapp" ? (
                              <Smartphone className="w-4 h-4 text-accent" />
                            ) : bot.platform === "discord" ? (
                              <Bot className="w-4 h-4" />
                            ) : bot.platform === "web" ? (
                              <Globe className="w-4 h-4 text-sky-400" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{bot.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {bot.platform} • {bot.memory}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                              bot.status === "ONLINE"
                                ? "bg-accent/10 text-accent"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                bot.status === "ONLINE" ? "bg-accent" : "bg-zinc-500"
                              }`}
                            />
                            {bot.status}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBotStatus(bot.id);
                            }}
                            className="p-2 rounded-lg bg-background hover:bg-zinc-800 text-foreground border border-border transition-colors"
                            title={bot.status === "ONLINE" ? "Hentikan" : "Nyalakan"}
                          >
                            {bot.status === "ONLINE" ? (
                              <Square className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current text-accent" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Console Inspector & Conditional File Manager */}
                {selectedBot && (
                  <div className="lg:col-span-7 space-y-5">
                    {/* Bot Controls Header */}
                    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div>
                          <span className="text-xs text-muted-foreground">Instance Terpilih</span>
                          <h3 className="text-base font-semibold text-foreground mt-0.5">{selectedBot.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBotStatus(selectedBot.id)}
                            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-zinc-800 text-foreground text-xs font-medium transition-colors flex items-center gap-1.5 border border-border"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Restart</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBot(selectedBot.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/40 transition-colors"
                            title="Hapus Instance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* WhatsApp Pairing Code / QR Banner (Khusus Bot WhatsApp) */}
                      {selectedBot.platform === "whatsapp" && selectedBot.status === "ONLINE" && (
                        <div className="space-y-3">
                          {pairingCode && (
                            <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-between">
                              <div>
                                <div className="text-xs font-semibold text-accent">8-Digit Pairing Code WhatsApp</div>
                                <div className="font-mono text-base font-bold text-foreground tracking-widest mt-0.5">
                                  {pairingCode}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Buka WA &gt; Linked Devices &gt; Link with phone number &gt; masukkan kode.
                                </p>
                              </div>
                              <button
                                onClick={copyPairingCodeToClipboard}
                                className="px-3 py-1.5 bg-accent text-black text-xs font-semibold rounded-lg hover:bg-emerald-400 flex items-center gap-1.5"
                              >
                                {copiedPairingCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedPairingCode ? "Tersalin" : "Salin"}</span>
                              </button>
                            </div>
                          )}

                          {detectedQr && !pairingCode && (
                            <QrCodeRenderer qrString={detectedQr} />
                          )}
                        </div>
                      )}

                      {/* Resource Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-background rounded-lg border border-border">
                          <div className="text-muted-foreground text-[11px]">Platform</div>
                          <div className="font-semibold capitalize text-foreground mt-0.5">{selectedBot.platform}</div>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border border-border">
                          <div className="text-muted-foreground text-[11px]">Uptime</div>
                          <div className="font-semibold text-foreground mt-0.5">{selectedBot.uptime}</div>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border border-border">
                          <div className="text-muted-foreground text-[11px]">Limit RAM</div>
                          <div className="font-semibold text-foreground mt-0.5">{selectedBot.memory}</div>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border border-border">
                          <div className="text-muted-foreground text-[11px]">Kode Bot</div>
                          <div className="font-semibold text-accent mt-0.5">
                            {isBotHostingPlan ? "Tertanam Paten" : "Custom Source"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs: Jika BOT HOSTING, HANYA ADA TERMINAL! File Manager disembunyikan. */}
                    {!isBotHostingPlan && (
                      <div className="flex items-center gap-2 border-b border-border pb-1">
                        <button
                          onClick={() => setActiveInspectorTab("terminal")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            activeInspectorTab === "terminal"
                              ? "bg-accent/10 text-accent border border-accent/20"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Live Console</span>
                        </button>

                        <button
                          onClick={() => setActiveInspectorTab("files")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            activeInspectorTab === "files"
                              ? "bg-accent/10 text-accent border border-accent/20"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>File Manager</span>
                        </button>
                      </div>
                    )}

                    {/* Content: Terminal Console atau File Manager */}
                    {isBotHostingPlan || activeInspectorTab === "terminal" ? (
                      <LiveTerminal
                        instanceId={selectedBot.id}
                        status={selectedBot.status}
                        onQrDetected={(qr) => setDetectedQr(qr)}
                        onPairingCodeDetected={(code) => setPairingCode(code)}
                      />
                    ) : (
                      <FileManager
                        instanceId={selectedBot.id}
                        botStatus={selectedBot.status}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Deploy Modal (Adaptif sesuai jenis paket aktif) */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">
                {isBotHostingPlan ? "Deploy Bot Baru (Kode Tertanam)" : "Deploy Aplikasi Web / Custom"}
              </h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deployError && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-xs">
                {deployError}
              </div>
            )}

            <form onSubmit={handleDeployBot} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Nama Instance / Bot
                </label>
                <input
                  type="text"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="Contoh: Toko Online WhatsApp"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:outline-none"
                  required
                />
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Pilih Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBotPlatform("whatsapp")}
                    className={`p-2.5 rounded-lg border text-center transition-colors ${
                      newBotPlatform === "whatsapp"
                        ? "bg-accent/10 border-accent text-accent font-medium"
                        : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs">WhatsApp</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewBotPlatform("discord")}
                    className={`p-2.5 rounded-lg border text-center transition-colors ${
                      newBotPlatform === "discord"
                        ? "bg-accent/10 border-accent text-accent font-medium"
                        : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                    }`}
                  >
                    <Bot className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs">Discord</div>
                  </button>

                  {!isBotHostingPlan ? (
                    <button
                      type="button"
                      onClick={() => setNewBotPlatform("web")}
                      className={`p-2.5 rounded-lg border text-center transition-colors ${
                        newBotPlatform === "web"
                          ? "bg-accent/10 border-accent text-accent font-medium"
                          : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                      }`}
                    >
                      <Globe className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-xs">Web Node.js</div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNewBotPlatform("telegram")}
                      className={`p-2.5 rounded-lg border text-center transition-colors ${
                        newBotPlatform === "telegram"
                          ? "bg-accent/10 border-accent text-accent font-medium"
                          : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                      }`}
                    >
                      <Send className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-xs">Telegram</div>
                    </button>
                  )}
                </div>
              </div>

              {/* Bot Specific Inputs */}
              {newBotPlatform === "whatsapp" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Nomor WhatsApp Owner (Wajib)
                    </label>
                    <input
                      type="text"
                      value={ownerNumber}
                      onChange={(e) => setOwnerNumber(e.target.value)}
                      placeholder="6281234567890"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:outline-none"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Format internasional dengan kode negara (contoh: 628...).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Nomor Bot untuk 8-Digit Pairing Code (Opsional)
                    </label>
                    <input
                      type="text"
                      value={pairingNumber}
                      onChange={(e) => setPairingNumber(e.target.value)}
                      placeholder="6289876543210 (kosongkan jika ingin mode Scan QR)"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </>
              ) : newBotPlatform === "web" ? (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Port Aplikasi Internal (Contoh: 3000, 8080)
                  </label>
                  <input
                    type="number"
                    value={customPort}
                    onChange={(e) => setCustomPort(parseInt(e.target.value, 10) || 3000)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Masukkan token bot kamu"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isDeploying ? "Deploying..." : "Deploy Instance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout & Upgrade Modal */}
      {showCheckoutModal && planToBuy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Aktifkan Paket {planToBuy.name}</h3>
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

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setCheckoutData(null);
                    checkSubscription();
                  }}
                  className="w-full py-2 rounded-lg bg-muted text-foreground text-xs hover:bg-zinc-800 transition-colors"
                >
                  Selesai / Cek Status
                </button>
              </div>
            ) : paymentSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-accent mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Status Pembayaran</h4>
                <p className="text-xs text-muted-foreground">{paymentSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteCheckout} className="space-y-4">
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
                    <div className="font-semibold text-accent">Metode: Tripay Gateway (Otomatis)</div>
                    <div className="text-muted-foreground">
                      QRIS Real-Time (GoPay, OVO, Dana, ShopeePay) &amp; Virtual Account Bank.
                    </div>
                  </div>
                ) : paymentConfig?.provider === "MIDTRANS" ? (
                  <div className="p-3 bg-accent/10 rounded-lg text-xs space-y-1 border border-accent/30">
                    <div className="font-semibold text-accent">Metode: Midtrans Snap (Instan)</div>
                    <div className="text-muted-foreground">
                      Pembayaran via GoPay, QRIS, dan Transfer Bank Virtual Account.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg text-xs space-y-2 border border-border">
                    <div className="font-semibold text-foreground">Instruksi Transfer Bank Manual:</div>
                    <div className="text-muted-foreground">
                      Transfer ke <span className="text-foreground font-semibold">{paymentConfig?.manual.bankName || "BCA"} {paymentConfig?.manual.accountNumber || "842-019-XXXX"}</span> a/n {paymentConfig?.manual.accountName || "ZeuHost Operator"}.
                    </div>
                  </div>
                )}

                {paymentConfig?.provider === "MANUAL" && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Nomor Referensi / Nama Pengirim
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
                    disabled={isSubmittingPayment}
                    className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingPayment
                      ? "Memproses..."
                      : paymentConfig?.provider === "MANUAL"
                      ? "Kirim Bukti Pembayaran"
                      : "Bayar Sekarang (QRIS / Instant)"}
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
