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
} from "lucide-react";
import { LiveTerminal } from "@/components/LiveTerminal";
import { QrCodeRenderer } from "@/components/QrCodeRenderer";
import { FileManager } from "@/components/FileManager";

interface BotInstance {
  id: string;
  name: string;
  platform: "whatsapp" | "discord" | "telegram";
  status: "ONLINE" | "OFFLINE";
  memory: string;
  uptime: string;
  containerId?: string | null;
}

interface TemplateVersion {
  id: string;
  versionTag: string;
  dockerImage: string;
}

interface TemplateOption {
  id: string;
  name: string;
  slug: string;
  runtime: string;
  description: string;
  versions?: TemplateVersion[];
}

interface ApiInstanceItem {
  id: string;
  name: string;
  memoryLimitMb: number;
  status: string;
  containerId?: string | null;
  lastStartedAt?: string | null;
  templateVersion?: {
    template?: {
      runtime?: string;
      slug?: string;
    };
  };
}

interface LiveStats {
  memoryUsageMb: number;
  memoryLimitMb: number;
  cpuPercentage: number;
  pidsCount: number;
}

export default function CustomerDashboardPage() {
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  // Telemetry stats
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"terminal" | "files">("terminal");

  // WhatsApp Pairing State
  const [detectedQr, setDetectedQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copiedPairingCode, setCopiedPairingCode] = useState<boolean>(false);

  // Deploy Form State
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotPlatform, setNewBotPlatform] = useState<"whatsapp" | "discord" | "telegram">("whatsapp");
  const [botToken, setBotToken] = useState("");
  const [pairingNumber, setPairingNumber] = useState("");
  const [ownerNumber, setOwnerNumber] = useState("");
  const [deployError, setDeployError] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // Upgrade / Billing Form State
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/instances");
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: BotInstance[] = data.data.map((item: ApiInstanceItem) => {
          let platform: "whatsapp" | "discord" | "telegram" = "whatsapp";
          const runtime = item.templateVersion?.template?.runtime;
          const slug = item.templateVersion?.template?.slug || "";
          if (runtime === "PYTHON" || slug.includes("telegram")) {
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
  }, [selectedBotId]);

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

    // Optimistic UI update
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
      if (!res.ok) {
        await fetchInstances();
      }
    } catch {
      await fetchInstances();
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (!confirm("Yakin ingin menghapus bot ini? Seluruh data sesi akan dibersihkan.")) {
      return;
    }

    try {
      const res = await fetch(`/api/instances/${id}`, {
        method: "DELETE",
      });
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

    // Resolve templateVersionId from fetched templates
    let targetTemplate = templates.find((t) => {
      if (newBotPlatform === "whatsapp") return t.slug.includes("whatsapp");
      if (newBotPlatform === "discord") return t.slug.includes("discord");
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
      envVars.BOT_TOKEN = botToken;
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
        setDeployError(data.error || "Gagal membuat instance bot.");
        return;
      }

      await fetchInstances();
      if (data.data?.id) {
        setSelectedBotId(data.data.id);
      }
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

  const handleUpgradePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayment(true);
    setPaymentSuccessMsg("");

    const amount = selectedPlan === "pro" ? 25000 : 75000;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan === "pro" ? "plan-pro" : "plan-reseller",
          amount,
          currency: "IDR",
          method: "MANUAL_TRANSFER",
          providerReference: paymentReference || `REF-${Date.now().toString().slice(-6)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccessMsg("Bukti pembayaran berhasil dikirim! Menunggu konfirmasi operator.");
        setTimeout(() => {
          setShowUpgradeModal(false);
          setPaymentSuccessMsg("");
          setPaymentReference("");
        }, 2000);
      }
    } catch {
      setPaymentSuccessMsg("Gagal mengirim bukti pembayaran. Periksa koneksi.");
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
  const onlineBotsCount = instances.filter((i) => i.status === "ONLINE").length;

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
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span>Upgrade Paket</span>
            </button>

            <button
              onClick={() => {
                setDeployError("");
                setShowDeployModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Bot Baru</span>
            </button>

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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Bot Aktif</span>
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {onlineBotsCount} <span className="text-sm font-normal text-muted-foreground">/ {instances.length} Bot</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status container Docker runtime</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>RAM Container Terpilih</span>
              <MemoryStick className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats ? `${stats.memoryUsageMb} MB` : selectedBot?.status === "ONLINE" ? "Mengambil..." : "0 MB"}
              {stats && stats.memoryLimitMb > 0 && (
                <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                  / {stats.memoryLimitMb} MB ({Math.round((stats.memoryUsageMb / stats.memoryLimitMb) * 100)}%)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cgroups v2 hard limit memory</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>CPU &amp; Thread Aktif</span>
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
            <p className="text-xs text-muted-foreground mt-1">Delta kernel CPU throttling</p>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto" />
            <p className="text-xs text-muted-foreground">Memuat instansi bot dari Docker daemon...</p>
          </div>
        ) : instances.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center bg-card border border-border rounded-2xl max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Belum Ada Bot Dibuat</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Kamu belum memiliki bot yang berjalan. Buat bot pertamamu untuk WhatsApp (Jadibot Baileys),
                Discord, atau Telegram sekarang.
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
              <span>Deploy Bot Sekarang</span>
            </button>
          </div>
        ) : (
          /* Instances List & Inspector */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Bot List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm font-semibold text-foreground">Daftar Bot Kamu</h2>
                <span className="text-xs text-muted-foreground">{instances.length} bot terdaftar</span>
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
                        title={bot.status === "ONLINE" ? "Hentikan bot" : "Nyalakan bot"}
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

            {/* Bot Detail & Live Console */}
            {selectedBot && (
              <div className="lg:col-span-7 space-y-5">
                {/* Header Detail */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">Detail Bot Terpilih</span>
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
                        title="Hapus Bot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Pairing Code / QR Notification Banner */}
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

                  {/* Resource Badges */}
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
                      <div className="text-muted-foreground text-[11px]">Batas RAM</div>
                      <div className="font-semibold text-foreground mt-0.5">{selectedBot.memory}</div>
                    </div>
                    <div className="p-2.5 bg-background rounded-lg border border-border">
                      <div className="text-muted-foreground text-[11px]">Auto-Restart</div>
                      <div className="font-semibold text-accent mt-0.5">on-failure (5x)</div>
                    </div>
                  </div>
                </div>

                {/* Tabs Bar: Console vs Files */}
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

                {/* Tab Content */}
                {activeInspectorTab === "terminal" ? (
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
      </main>

      {/* Deploy Bot Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Tambah Bot Baru</h3>
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
                  Nama Bot
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
                </div>
              </div>

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
                  {isDeploying ? "Deploying Container..." : "Deploy Bot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade / Billing Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Upgrade Paket Sewa Bot</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-accent mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Bukti Pembayaran Terkirim</h4>
                <p className="text-xs text-muted-foreground">{paymentSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleUpgradePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Pilih Paket
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("pro")}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedPlan === "pro"
                          ? "bg-accent/10 border-accent"
                          : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-semibold text-foreground">Pro Jadibot</div>
                      <div className="text-xs text-accent mt-0.5 font-bold">Rp 25.000 / bln</div>
                      <div className="text-[11px] text-muted-foreground mt-1">3 Bot, 512MB RAM</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan("reseller")}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedPlan === "reseller"
                          ? "bg-accent/10 border-accent"
                          : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-semibold text-foreground">Reseller</div>
                      <div className="text-xs text-accent mt-0.5 font-bold">Rp 75.000 / bln</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Unlimited Bot, 2GB</div>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg text-xs space-y-2 border border-border">
                  <div className="font-semibold text-foreground">Instruksi Pembayaran Manual:</div>
                  <div className="text-muted-foreground">
                    Transfer ke <span className="text-foreground font-semibold">BCA 842-019-XXXX</span> a/n ZeuHost Operator atau scan QRIS di meja kasir.
                  </div>
                </div>

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

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingPayment ? "Mengirim..." : "Kirim Bukti Pembayaran"}
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
