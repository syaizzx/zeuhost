"use client";

import React, { useState } from "react";
import { Palette, Check, Sparkles, Sliders, Globe, Shield } from "lucide-react";

interface BrandTheme {
  name: string;
  accent: string;
  label: string;
}

const THEMES: BrandTheme[] = [
  { name: "Emerald Runner", accent: "#22C55E", label: "Default Ops" },
  { name: "Cyber Cyan", accent: "#06B6D4", label: "Hosting Cloud" },
  { name: "Electric Indigo", accent: "#6366F1", label: "Modern SaaS" },
  { name: "Amber Voltage", accent: "#F59E0B", label: "Telemetry & Logs" },
];

export function WhiteLabelBrandPreview() {
  const [productName, setProductName] = useState("ZeuHost");
  const [selectedAccent, setSelectedAccent] = useState("#22C55E");
  const [tagline, setTagline] = useState("Dedicated bot hosting on your own Linux VPS");

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Operator Administration Preview</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight">
            Instant White-Label Brand Engine
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Test the live branding engine. Operators customize product name, theme accents, and copy without rebuilding or touching core Next.js code.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Dynamic CSS Variable Injection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Product Name Input */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
              PLATFORM PRODUCT NAME
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              maxLength={24}
              placeholder="e.g. ApexBots"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Injected into OpenGraph, page titles, and navbar
            </span>
          </div>

          {/* Accent Palette Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
              BRAND ACCENT COLOR TOKEN
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSelectedAccent(theme.accent)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    selectedAccent === theme.accent
                      ? "bg-slate-800 border-slate-500 shadow-md"
                      : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {selectedAccent === theme.accent && (
                      <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                    )}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200">{theme.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{theme.accent}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tagline Input */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
              LANDING SUBHEADLINE
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={64}
              placeholder="Your custom subheadline"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Live Customer Portal Mockup with 3D Depth */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-6 relative overflow-hidden shadow-2xl">
          {/* Background Ambient Glow tailored to selected accent */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-500"
            style={{ backgroundColor: selectedAccent }}
            aria-hidden="true"
          />

          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-slate-950 transition-colors duration-300"
                style={{ backgroundColor: selectedAccent }}
              >
                {productName.charAt(0) || "Z"}
              </div>
              <span className="font-bold text-slate-100 font-mono text-sm">
                {productName || "BrandName"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedAccent }} />
              <span>Customer Portal Mock</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 relative">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Welcome to {productName || "ZeuHost"}
            </div>
            <h4 className="text-base font-bold text-slate-100 leading-snug">
              {tagline || "Your self-hosted bot hosting platform"}
            </h4>

            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">ACTIVE INSTANCES</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">3 / 5 Bots</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">MEMORY ALLOCATED</div>
                <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">768 MB / 2048 MB</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2">
              <button
                className="px-4 py-2 rounded-lg font-mono text-xs font-bold text-slate-950 transition-all duration-300"
                style={{ backgroundColor: selectedAccent }}
              >
                Deploy New Bot
              </button>
              <span className="text-[11px] font-mono text-slate-400">
                CSS Token: <code className="text-slate-300">{selectedAccent}</code>
              </span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Strict hex regex validation prevents arbitrary CSS injection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
