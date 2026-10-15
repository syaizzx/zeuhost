"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Bot,
  Send,
  Zap,
  ShieldCheck,
  RefreshCw,
  Check,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Server,
  Activity,
  Layers,
} from "lucide-react";
import { LiveBotPreview } from "@/components/LiveBotPreview";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Apakah ponsel atau laptop saya harus menyala terus?",
    answer: "Tidak perlu. Begitu bot tersambung, server ZeuHost yang menjalankan bot kamu selama 24 jam penuh. Ponsel kamu bebas dimatikan atau dipakai aktivitas lain.",
  },
  {
    question: "Apakah saya harus paham coding atau setup server?",
    answer: "Tidak perlu sama sekali. Kamu cukup scan QR code (untuk WhatsApp) atau masukkan token bot (untuk Discord dan Telegram). Semuanya diatur otomatis dari browser.",
  },
  {
    question: "Platform apa saja yang bisa saya host di sini?",
    answer: "ZeuHost mendukung bot WhatsApp (Jadibot), bot Discord, dan bot Telegram. Kamu bisa mengelola beberapa bot sekaligus dalam satu akun.",
  },
  {
    question: "Bagaimana cara pembayarannya?",
    answer: "Kami menerima pembayaran via transfer bank lokal (BCA, Mandiri, BRI, BNI), QRIS instan, serta e-wallet seperti GoPay, OVO, dan DANA.",
  },
  {
    question: "Apakah data dan sesi bot saya aman?",
    answer: "Sangat aman. Setiap bot berjalan di lingkungan container mandiri yang terisolasi. Data sesi dan token tersimpan dengan enkripsi standar industri.",
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-black relative">
      {/* Structural Vertical Guide Lines for Editorial Grounding */}
      <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none border-x border-border/30 -z-10" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent text-black flex items-center justify-center font-bold text-sm shadow-sm">
              Z
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              ZeuHost
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#layanan" className="hover:text-foreground transition-colors">
              Layanan
            </a>
            <a href="#keunggulan" className="hover:text-foreground transition-colors">
              Keunggulan
            </a>
            <a href="#harga" className="hover:text-foreground transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-semibold hover:bg-emerald-400 transition-colors shadow-sm"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground border border-border mb-6">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Hosting Bot Cloud Online 24 Jam</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              Sewa dan jalankan bot kamu 24 jam tanpa perlu menyalakan laptop.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              ZeuHost menyediakan hosting bot untuk WhatsApp, Discord, dan Telegram. Cukup hubungkan sekali dari browser, bot kamu langsung aktif melayani chat pelanggan atau komunitas tanpa henti.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-3 rounded-lg bg-accent text-black text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>Mulai Coba Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#harga"
                className="px-6 py-3 rounded-lg bg-muted text-foreground border border-border text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Lihat Paket Harga
              </a>
            </div>

            {/* Reassurance points */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent" />
                Aktif 24 jam tanpa baterai HP
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent" />
                Sambung otomatis saat sinyal putus
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent" />
                Tanpa kartu kredit
              </span>
            </div>

            {/* Interactive Live Bot Simulator (Fills the visual void) */}
            <div className="mt-14">
              <LiveBotPreview />
            </div>
          </div>
        </section>

        {/* Layanan Bot (Platforms) */}
        <section id="layanan" className="py-20 border-t border-border bg-card/40 scroll-mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mendukung 3 platform bot utama
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Pilih platform yang biasa kamu gunakan. Setiap bot mendapatkan alokasi memori sendiri agar respon chat tetap cepat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* WhatsApp Card */}
              <div className="p-6 rounded-xl card-elevation flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-muted text-accent flex items-center justify-center mb-4">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">WhatsApp (Jadibot)</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Sangat cocok untuk auto-reply toko online, bot pesanan, dan grup WhatsApp. Cukup scan QR lewat menu Perangkat Tertaut di WhatsApp kamu.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                  Cara sambung: <span className="text-foreground font-medium">Scan QR Web</span>
                </div>
              </div>

              {/* Discord Card */}
              <div className="p-6 rounded-xl card-elevation flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center mb-4">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Bot Discord</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Menjaga bot musik, bot sambutan member baru, atau auto-moderasi server Discord kamu tetap online tanpa server rumah.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                  Cara sambung: <span className="text-foreground font-medium">Bot Token</span>
                </div>
              </div>

              {/* Telegram Card */}
              <div className="p-6 rounded-xl card-elevation flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center mb-4">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Bot Telegram</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Bagus untuk bot broadcast channel, bot unduh media otomatis, atau sistem tiket bantuan pengguna Telegram.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                  Cara sambung: <span className="text-foreground font-medium">Token BotFather</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keunggulan (Why ZeuHost) */}
        <section id="keunggulan" className="py-20 border-t border-border scroll-mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Dirancang agar kamu tidak perlu pusing urus server
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Kamu fokus pada isi pesan dan fitur bot, kami yang menjaga bot kamu tetap online di latar belakang.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 p-5 rounded-xl card-elevation">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-accent">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Baterai dan kuota aman</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Semua proses bot berjalan di server kami. Mau laptop mati atau kuota HP kamu habis, bot tetap aktif merespons pesan masuk.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-xl card-elevation">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-accent">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Auto-reconnect otomatis</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kalau server Discord atau WhatsApp sempat maintenance, sistem kami otomatis menyambungkan kembali bot kamu tanpa perlu scan ulang.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-xl card-elevation">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-accent">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Data sesi aman</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Setiap akun memiliki wadah container sendiri yang terisolasi. Data sesi chat dan token kamu tidak akan bercampur dengan milik pengguna lain.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Paket Harga (Pricing) */}
        <section id="harga" className="py-20 border-t border-border bg-card/40 scroll-mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Pilihan paket sewa
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Mulai dari coba gratis tanpa syarat, atau pilih paket bulanan terjangkau.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Plan 1: Free Trial */}
              <div className="p-6 rounded-xl card-elevation flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Trial 7 Hari</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">Rp 0</span>
                    <span className="text-xs text-muted-foreground">/ 7 hari</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Cocok untuk mencoba stabilitas dan performa bot kamu terlebih dahulu.
                  </p>

                  <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>1 bot aktif</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Alokasi memori 256 MB</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Dukungan WhatsApp / Discord / TG</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Auto-restart mandiri</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/register"
                    className="w-full py-2.5 rounded-lg bg-muted hover:bg-zinc-800 text-foreground text-xs font-semibold transition-colors flex items-center justify-center border border-border"
                  >
                    Daftar Coba Gratis
                  </Link>
                </div>
              </div>

              {/* Plan 2: Pro (Recommended) */}
              <div className="p-6 rounded-xl bg-card border-2 border-accent flex flex-col justify-between relative shadow-lg">
                <div>
                  <div className="text-xs font-semibold text-accent">Paling Populer</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">Rp 25.000</span>
                    <span className="text-xs text-muted-foreground">/ bulan</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Paling pas untuk toko online, bot grup aktif, atau bot server Discord komunitas.
                  </p>

                  <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>3 bot aktif sekaligus</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Alokasi memori 512 MB per bot</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Prioritas uptime 99.9%</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Auto-restart instan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Panel kontrol web dan log live</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/register"
                    className="w-full py-2.5 rounded-lg bg-accent hover:bg-emerald-400 text-black text-xs font-semibold transition-colors flex items-center justify-center shadow-sm"
                  >
                    Pilih Paket Pro
                  </Link>
                </div>
              </div>

              {/* Plan 3: Reseller */}
              <div className="p-6 rounded-xl card-elevation flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Paket Reseller</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">Rp 75.000</span>
                    <span className="text-xs text-muted-foreground">/ bulan</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Untuk komunitas besar atau yang ingin menyewakan kembali layanan bot ke orang lain.
                  </p>

                  <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Banyak bot sesuai kebutuhan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Kapasitas memori besar (2 GB)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Bisa disewakan kembali</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Bantuan teknis prioritas</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/register"
                    className="w-full py-2.5 rounded-lg bg-muted hover:bg-zinc-800 text-foreground text-xs font-semibold transition-colors flex items-center justify-center border border-border"
                  >
                    Pilih Paket Reseller
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 border-t border-border scroll-mt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Pertanyaan yang sering ditanyakan
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-lg card-elevation overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="text-sm font-semibold text-foreground">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        openFaq === index ? "rotate-180 text-foreground" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Mulai aktifkan bot kamu sekarang
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Daftar gratis, sambungkan bot dalam hitungan menit, dan biarkan server yang bekerja.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-lg bg-accent text-black text-sm font-semibold hover:bg-emerald-400 transition-colors"
              >
                Daftar Akun Gratis
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-lg bg-muted text-foreground border border-border text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Masuk ke Panel
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent text-black flex items-center justify-center font-bold text-[10px]">
              Z
            </div>
            <span className="text-foreground font-medium">ZeuHost</span>
            <span>Layanan Hosting Bot WhatsApp dan Discord</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#layanan" className="hover:text-foreground transition-colors">
              Layanan
            </a>
            <a href="#harga" className="hover:text-foreground transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <span>Karya Zeuzz</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
