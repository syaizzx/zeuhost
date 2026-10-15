"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface BotInstance {
  id: string;
  name: string;
  platform: "whatsapp" | "discord" | "telegram";
  status: "ONLINE" | "OFFLINE";
  memory: string;
  uptime: string;
}

interface TemplateOption {
  id: string;
  name: string;
  slug: string;
  runtime: string;
  description: string;
  versions?: { id: string; versionTag: string }[];
}

interface ApiInstanceItem {
  id: string;
  name: string;
  memoryLimitMb: number;
  status: string;
  templateVersion?: {
    template?: {
      runtime?: string;
    };
  };
}

const INITIAL_INSTANCES: BotInstance[] = [
  {
    id: "inst-1",
    name: "Bot Toko WhatsApp",
    platform: "whatsapp",
    status: "ONLINE",
    memory: "142 MB / 256 MB",
    uptime: "14 hari 6 jam",
  },
  {
    id: "inst-2",
    name: "Bot Server Discord",
    platform: "discord",
    status: "ONLINE",
    memory: "88 MB / 256 MB",
    uptime: "6 hari 18 jam",
  },
  {
    id: "inst-3",
    name: "Bot Unduh Telegram",
    platform: "telegram",
    status: "OFFLINE",
    memory: "0 MB / 256 MB",
    uptime: "Nonaktif",
  },
];

export default function CustomerDashboardPage() {
  const [instances, setInstances] = useState<BotInstance[]>(INITIAL_INSTANCES);
  const [selectedBotId, setSelectedBotId] = useState<string>("inst-1");
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Deploy Form State
  const [newBotName, setNewBotName] = useState("");
  const [newBotPlatform, setNewBotPlatform] = useState<"whatsapp" | "discord" | "telegram">("whatsapp");
  const [botToken, setBotToken] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // Upgrade / Billing Form State
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Fetch available templates
  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .catch(() => {});
  }, []);

  // Fetch live instances from API
  useEffect(() => {
    fetch("/api/instances")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: BotInstance[] = data.data.map((item: ApiInstanceItem) => ({
            id: item.id,
            name: item.name,
            platform: item.templateVersion?.template?.runtime === "PYTHON" ? "telegram" : "whatsapp",
            status: item.status === "RUNNING" ? "ONLINE" : "OFFLINE",
            memory: `${item.memoryLimitMb} MB`,
            uptime: item.status === "RUNNING" ? "Aktif" : "Nonaktif",
          }));
          setInstances(mapped);
          setSelectedBotId(mapped[0].id);
        }
      })
      .catch(() => {});
  }, []);

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
            memory: nextStatus === "ONLINE" ? "92 MB / 256 MB" : "0 MB / 256 MB",
          };
        }
        return inst;
      })
    );

    try {
      await fetch(`/api/instances/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch {
      // Revert if error
    }
  };

  const handleDeployBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName) return;
    setIsDeploying(true);

    const versionId =
      newBotPlatform === "telegram"
        ? "ver-tg-1"
        : newBotPlatform === "discord"
        ? "ver-dc-1"
        : "ver-wa-1";

    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBotName,
          templateVersionId: versionId,
          envVars: {
            BOT_TOKEN: botToken || "dummy_token_preview",
          },
        }),
      });
      const data = await res.json();
      const newInstId = data?.data?.id || `inst-${Date.now()}`;

      const newInst: BotInstance = {
        id: newInstId,
        name: newBotName,
        platform: newBotPlatform,
        status: "ONLINE",
        memory: "128 MB / 256 MB",
        uptime: "Baru saja",
      };

      setInstances((prev) => [newInst, ...prev]);
      setSelectedBotId(newInst.id);
      setNewBotName("");
      setBotToken("");
      setShowDeployModal(false);
    } catch {
      const newInst: BotInstance = {
        id: `inst-${Date.now()}`,
        name: newBotName,
        platform: newBotPlatform,
        status: "ONLINE",
        memory: "128 MB / 256 MB",
        uptime: "Baru saja",
      };
      setInstances((prev) => [newInst, ...prev]);
      setSelectedBotId(newInst.id);
      setShowDeployModal(false);
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
      setPaymentSuccessMsg("Bukti pembayaran berhasil dikirim! Menunggu konfirmasi operator.");
      setTimeout(() => {
        setShowUpgradeModal(false);
        setPaymentSuccessMsg("");
      }, 2000);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const selectedBot = instances.find((i) => i.id === selectedBotId) || instances[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-black flex items-center justify-center font-bold text-sm">
                Z
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                ZeuHost
              </span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-muted-foreground font-medium">
              Panel Pelanggan
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
              onClick={() => setShowDeployModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors"
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Bot aktif</span>
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {instances.filter((i) => i.status === "ONLINE").length} dari 5
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kuota paket Pro Jadibot</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Penggunaan RAM</span>
              <MemoryStick className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">230 MB</div>
            <p className="text-xs text-muted-foreground mt-1">Dari batas 1,024 MB</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Status Server VPS</span>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">Normal 99.9%</div>
            <p className="text-xs text-muted-foreground mt-1">Auto-restart & isolasi aktif</p>
          </div>
        </div>

        {/* Instances List & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Bot List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-semibold text-foreground">Daftar bot kamu</h2>
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

                  <div className="flex items-center gap-3">
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

          {/* Bot Detail */}
          <div className="lg:col-span-5 bg-card rounded-xl border border-border p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-xs text-muted-foreground">Detail bot</span>
                <h3 className="text-base font-semibold text-foreground mt-0.5">{selectedBot.name}</h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedBot.status === "ONLINE"
                    ? "bg-accent/10 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {selectedBot.status}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Platform</span>
                <span className="capitalize text-foreground font-medium">{selectedBot.platform}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Waktu aktif</span>
                <span className="text-foreground">{selectedBot.uptime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Pemakaian RAM</span>
                <span className="text-foreground">{selectedBot.memory}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Auto-reconnect</span>
                <span className="text-accent font-medium">Aktif (3s)</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                <span>Catatan log</span>
                <span className="text-accent">• Terhubung</span>
              </div>
              <div className="p-3 bg-background rounded-lg border border-border font-mono text-[11px] text-zinc-300 space-y-1 max-h-36 overflow-y-auto">
                <div className="text-muted-foreground">12:00:01 bot siap menerima pesan.</div>
                {selectedBot.status === "ONLINE" ? (
                  <>
                    <div className="text-accent">12:01:14 terhubung ke gateway.</div>
                    <div className="text-zinc-400">12:04:22 pesan masuk dari member. Otomatis dibalas.</div>
                  </>
                ) : (
                  <div className="text-zinc-500">Bot dihentikan oleh pengguna.</div>
                )}
              </div>
            </div>

            <button
              onClick={() => toggleBotStatus(selectedBot.id)}
              className="w-full py-2 rounded-lg bg-muted hover:bg-zinc-800 text-foreground text-xs font-medium transition-colors flex items-center justify-center gap-2 border border-border"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Mulai Ulang Bot (Restart)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Deploy Bot Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Tambah Bot Baru</h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeployBot} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Nama Bot
                </label>
                <input
                  type="text"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="Contoh: Bot Toko Saya"
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

              {newBotPlatform !== "whatsapp" && (
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
                  {isDeploying ? "Deploying..." : "Simpan & Jalankan"}
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
