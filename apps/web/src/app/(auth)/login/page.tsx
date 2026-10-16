"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res?.error) {
        setErrorMsg(res.error.message || "Email atau password salah.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch {
      setErrorMsg("Gagal terhubung ke server. Periksa koneksi internet.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setErrorMsg("Gagal login dengan Google. Coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 selection:bg-accent selection:text-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-black flex items-center justify-center font-bold text-base shadow-sm">
              Z
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              ZeuHost
            </span>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Masuk ke Panel Bot</h1>
          <p className="text-xs text-muted-foreground mt-1">Kelola bot WhatsApp, Discord, dan Telegram milikmu</p>
        </div>

        <div className="p-7 rounded-2xl bg-card border border-border shadow-xl">
          {success ? (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Login Berhasil</h2>
              <p className="text-xs text-muted-foreground mt-1">Mengalihkan ke dashboard bot kamu...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                  <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <a href="#forgot" className="text-[11px] text-accent hover:underline">
                    Lupa password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-accent text-black text-xs font-semibold hover:bg-emerald-400 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi Akun...</span>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card text-muted-foreground text-[11px]">
                    Atau Masuk Dengan
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-background border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Google Account</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="text-accent hover:underline font-semibold">
              Daftar Sekarang
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Sesi Login Terenkripsi & Aman</span>
        </div>
      </div>
    </div>
  );
}
