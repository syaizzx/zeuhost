"use client";

import React, { useState, useRef, useCallback } from "react";
import { Shield, Server, Box, Lock, CheckCircle2, Cpu, HardDrive } from "lucide-react";

interface LayerData {
  id: string;
  title: string;
  tag: string;
  badgeColor: string;
  description: string;
  invariants: string[];
  metrics: { label: string; value: string }[];
}

const LAYERS: LayerData[] = [
  {
    id: "sandbox",
    title: "Layer 3: Hardened Bot Sandboxes",
    tag: "Untrusted Code Execution",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Multi-tenant containers running Discord and Telegram bots with strictly enforced isolation boundaries.",
    invariants: [
      "Non-root execution as UID/GID 1001:1001 (zeubot)",
      "All Linux capabilities dropped (--cap-drop ALL)",
      "Strict cgroups limit: 256MB RAM cap, 0.5 CPU, 100 PIDs",
      "Root filesystem mounted read-only (tmpfs /tmp)",
      "Outbound-only bridge network; host LAN traffic blocked",
    ],
    metrics: [
      { label: "Privileges", value: "UID 1001 (Unprivileged)" },
      { label: "Memory Cap", value: "256 MB Hard Cap" },
      { label: "PID Limit", value: "100 PIDs max" },
    ],
  },
  {
    id: "control",
    title: "Layer 2: Decoupled Runtime Daemon",
    tag: "Privileged Orchestration",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "An isolated background daemon managing Docker container lifecycles without exposing the Docker socket to the public web app.",
    invariants: [
      "Zero direct Docker socket exposure to Next.js web tier",
      "Private unix domain socket or HMAC-signed HTTP RPC channel",
      "Tenant boundary verification on all start/stop requests",
      "Real-time stdout/stderr multiplexing and buffered log ring",
      "Automatic OOM and memory violation containment",
    ],
    metrics: [
      { label: "Channel", value: "HMAC Signed RPC" },
      { label: "Socket Path", value: "Private Daemon Only" },
      { label: "Isolation", value: "Process Decoupled" },
    ],
  },
  {
    id: "host",
    title: "Layer 1: Host VPS & Ingress Tier",
    tag: "Infrastructure Foundation",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Standard Linux VPS running Caddy automated reverse proxy with ZeroSSL/Let's Encrypt and isolated internal PostgreSQL.",
    invariants: [
      "Public ports restricted to 80/tcp, 443/tcp, and operator SSH",
      "Caddy automated TLS certificate generation and renewal",
      "Next.js 15 App Router web app with dynamic branding injection",
      "Isolated database container on private zeuhost-internal network",
      "Turnkey setup on any Linux VPS (Ubuntu 22.04+ or Debian 12)",
    ],
    metrics: [
      { label: "Public Ports", value: "80, 443, 22 only" },
      { label: "Ingress", value: "Caddy HTTPS" },
      { label: "Footprint", value: "1 vCPU / 1GB RAM Min" },
    ],
  },
];

export function InteractiveArchitecture3D() {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("sandbox");
  const [tilt, setTilt] = useState({ x: 12, y: -15 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = 14 - ((y - centerY) / centerY) * 10;
    const rotY = -18 + ((x - centerX) / centerX) * 12;

    setTilt({ x: rotX, y: rotY });
  }, []);

  const selectedLayer = LAYERS.find((l) => l.id === selectedLayerId) || LAYERS[0];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Interactive 3D Security Topology</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight">
            Rigorous Three-Layer VPS Sandboxing
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Move your cursor to inspect the 3D perspective stack. Untrusted bot code is physically decoupled from the host operating system and web application.
          </p>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800 self-start md:self-auto">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-150 ${
                selectedLayerId === layer.id
                  ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {layer.id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
        {/* 3D Isometric Viewport */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setTilt({ x: 14, y: -18 });
          }}
          className="lg:col-span-7 h-[380px] sm:h-[440px] relative flex items-center justify-center perspective-1200 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Spatial 3D Stack */}
          <div
            className="relative w-[280px] sm:w-[340px] h-[300px] sm:h-[340px] transform-style-3d transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            {/* Layer 3: Bot Sandboxes (Top Elevation) */}
            <div
              onClick={() => setSelectedLayerId("sandbox")}
              className={`absolute inset-x-0 top-0 h-24 rounded-xl border p-4 cursor-pointer transition-all duration-300 transform-style-3d ${
                selectedLayerId === "sandbox"
                  ? "bg-emerald-950/70 border-emerald-500 shadow-2xl shadow-emerald-950/50"
                  : "bg-slate-850/80 border-slate-700 hover:border-slate-500 bg-slate-900/90"
              }`}
              style={{
                transform: selectedLayerId === "sandbox" ? "translateZ(80px)" : "translateZ(50px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-semibold text-slate-100">Layer 3: Bot Sandboxes</div>
                    <div className="text-[11px] text-slate-400 font-mono">UID 1001:1001 / Read-only rootfs</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 font-medium">ISOLATED</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Discord.js</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Telegram Py</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">cgroups 256MB</span>
              </div>
            </div>

            {/* Connecting Vertical Data Stream 1 */}
            <div
              className="absolute left-1/2 top-20 w-0.5 h-16 -translate-x-1/2 border-l border-dashed border-emerald-500/40 pointer-events-none"
              style={{ transform: "translateZ(30px)" }}
            />

            {/* Layer 2: Runtime Manager Daemon (Middle Elevation) */}
            <div
              onClick={() => setSelectedLayerId("control")}
              className={`absolute inset-x-0 top-28 h-24 rounded-xl border p-4 cursor-pointer transition-all duration-300 transform-style-3d ${
                selectedLayerId === "control"
                  ? "bg-blue-950/70 border-blue-500 shadow-2xl shadow-blue-950/50"
                  : "bg-slate-900/90 border-slate-700 hover:border-slate-500"
              }`}
              style={{
                transform: selectedLayerId === "control" ? "translateZ(30px)" : "translateZ(0px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-semibold text-slate-100">Layer 2: Runtime Daemon</div>
                    <div className="text-[11px] text-slate-400 font-mono">HMAC Authenticated Channel</div>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Private Socket</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Docker API Shield</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Log Ring</span>
              </div>
            </div>

            {/* Connecting Vertical Data Stream 2 */}
            <div
              className="absolute left-1/2 top-48 w-0.5 h-16 -translate-x-1/2 border-l border-dashed border-blue-500/40 pointer-events-none"
              style={{ transform: "translateZ(-20px)" }}
            />

            {/* Layer 1: Host VPS & Ingress (Base Elevation) */}
            <div
              onClick={() => setSelectedLayerId("host")}
              className={`absolute inset-x-0 top-56 h-24 rounded-xl border p-4 cursor-pointer transition-all duration-300 transform-style-3d ${
                selectedLayerId === "host"
                  ? "bg-purple-950/70 border-purple-500 shadow-2xl shadow-purple-950/50"
                  : "bg-slate-900/90 border-slate-700 hover:border-slate-500"
              }`}
              style={{
                transform: selectedLayerId === "host" ? "translateZ(-10px)" : "translateZ(-40px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-semibold text-slate-100">Layer 1: Host VPS & Caddy</div>
                    <div className="text-[11px] text-slate-400 font-mono">Linux Kernel 6.x + Caddy TLS</div>
                  </div>
                </div>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Port 443/80</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">PostgreSQL</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Next.js 15</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-500 pointer-events-none">
            [tilt: {Math.round(tilt.x)}°, {Math.round(tilt.y)}°]
          </div>
        </div>

        {/* Selected Layer Technical Inspector */}
        <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border ${selectedLayer.badgeColor}`}>
                {selectedLayer.tag}
              </span>
              <span className="text-xs font-mono text-slate-400">Security Audit Specs</span>
            </div>

            <h4 className="text-lg font-bold text-slate-100">{selectedLayer.title}</h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{selectedLayer.description}</p>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="text-xs font-mono text-slate-400 font-semibold mb-2.5">
                ENFORCED SECURITY INVARIANTS
              </div>
              <ul className="space-y-2">
                {selectedLayer.invariants.map((invariant, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{invariant}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2">
            {selectedLayer.metrics.map((m, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">{m.label}</div>
                <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5 truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
