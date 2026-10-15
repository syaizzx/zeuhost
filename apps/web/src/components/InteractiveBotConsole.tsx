"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Square, AlertTriangle, RefreshCw, Terminal, Cpu, MemoryStick, Activity } from "lucide-react";

interface LogEntry {
  timestamp: string;
  stream: "stdout" | "stderr" | "system";
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { timestamp: "12:00:01", stream: "system", message: "[zeuhost-daemon] Initializing container sandbox (cgroups v2)..." },
  { timestamp: "12:00:02", stream: "system", message: "[zeuhost-daemon] Dropping Linux capabilities: CAP_DROP_ALL applied." },
  { timestamp: "12:00:02", stream: "system", message: "[zeuhost-daemon] Switching user context to UID 1001 (zeubot)." },
  { timestamp: "12:00:03", stream: "stdout", message: "node[1]: starting bot engine index.js..." },
  { timestamp: "12:00:04", stream: "stdout", message: "discord.js: Client logged in as ZeuModerator#4201" },
  { timestamp: "12:00:05", stream: "stdout", message: "discord.js: Shard 0 ready. Listening for 14 guild events." },
];

export function InteractiveBotConsole() {
  const [status, setStatus] = useState<"RUNNING" | "STOPPED" | "STARTING" | "OOM_ENFORCED">("RUNNING");
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [memoryMb, setMemoryMb] = useState<number>(84);
  const [cpuUsage, setCpuUsage] = useState<number>(0.12);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal when new logs appear
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Periodic heartbeat simulation when running
  useEffect(() => {
    if (status !== "RUNNING") return;
    const interval = setInterval(() => {
      const now = new Date().toTimeString().split(" ")[0];
      const randomJitter = Math.floor(Math.random() * 6) - 3;
      setMemoryMb((prev) => Math.min(220, Math.max(78, prev + randomJitter)));
      setCpuUsage(Number((0.08 + Math.random() * 0.15).toFixed(2)));

      if (Math.random() > 0.65) {
        setLogs((prev) => [
          ...prev.slice(-30),
          {
            timestamp: now,
            stream: "stdout",
            message: `[gateway] Heartbeat ACK (latency: ${Math.floor(28 + Math.random() * 15)}ms) - Guilds: 14`,
          },
        ]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [status]);

  const handleStart = () => {
    if (status === "RUNNING") return;
    setStatus("STARTING");
    const now = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [
      ...prev,
      { timestamp: now, stream: "system", message: "[zeuhost-daemon] Command: START received via HMAC channel." },
      { timestamp: now, stream: "system", message: "[zeuhost-daemon] Attaching unprivileged bridge network (zeuhost-bots)..." },
    ]);

    setTimeout(() => {
      setStatus("RUNNING");
      setMemoryMb(82);
      setCpuUsage(0.14);
      setLogs((prev) => [
        ...prev,
        { timestamp: now, stream: "stdout", message: "node[1]: bot re-authenticated to Discord Gateway." },
      ]);
    }, 1200);
  };

  const handleStop = () => {
    if (status === "STOPPED") return;
    const now = new Date().toTimeString().split(" ")[0];
    setStatus("STOPPED");
    setMemoryMb(0);
    setCpuUsage(0.0);
    setLogs((prev) => [
      ...prev,
      { timestamp: now, stream: "system", message: "[zeuhost-daemon] Sending SIGTERM to process group (grace period: 10s)..." },
      { timestamp: now, stream: "stdout", message: "discord.js: Disconnected cleanly from gateway." },
      { timestamp: now, stream: "system", message: "[zeuhost-daemon] Container stopped. Resources released back to VPS pool." },
    ]);
  };

  const handleMemorySpikeTest = () => {
    const now = new Date().toTimeString().split(" ")[0];
    setMemoryMb(256);
    setStatus("OOM_ENFORCED");
    setLogs((prev) => [
      ...prev,
      { timestamp: now, stream: "stderr", message: "FATAL: Process allocated buffer exceeding 256MB quota limit." },
      { timestamp: now, stream: "system", message: "[cgroups v2] memory.max hit (268435456 bytes). Kernel SIGKILL invoked." },
      { timestamp: now, stream: "system", message: "[security-guard] Host VPS & sibling tenant containers unaffected." },
    ]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Console Header */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100">instance-zeu-moderator</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                Node.js 20 / Discord.js
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                role="status"
                aria-atomic="true"
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium ${
                  status === "RUNNING"
                    ? "text-emerald-400"
                    : status === "STARTING"
                    ? "text-blue-400"
                    : status === "OOM_ENFORCED"
                    ? "text-amber-400"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === "RUNNING"
                      ? "bg-emerald-400 animate-pulse"
                      : status === "STARTING"
                      ? "bg-blue-400 animate-pulse"
                      : status === "OOM_ENFORCED"
                      ? "bg-amber-400"
                      : "bg-slate-500"
                  }`}
                />
                {status === "RUNNING" && "RUNNING (PID 1001)"}
                {status === "STARTING" && "BOOTING CONTAINER..."}
                {status === "STOPPED" && "STOPPED"}
                {status === "OOM_ENFORCED" && "QUOTA HALTED (SAFE)"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          {status !== "RUNNING" ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 font-mono text-xs font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={handleMemorySpikeTest}
            title="Simulate container allocating more than 256MB RAM"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-xs font-medium rounded-lg hover:bg-amber-500/20 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Quota Cap</span>
          </button>

          <button
            onClick={handleClearLogs}
            title="Clear Log Viewer"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="bg-slate-950/60 px-5 py-2.5 border-b border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <MemoryStick className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Memory:</span>
          <span className="text-slate-200 font-semibold">{memoryMb} / 256 MB</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">CPU Cap:</span>
          <span className="text-slate-200 font-semibold">{cpuUsage.toFixed(2)} / 0.50 vCPU</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Isolation:</span>
          <span className="text-emerald-400 font-semibold">UID 1001</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Bridge:</span>
          <span className="text-slate-300 font-semibold">172.28.0.4 (Private)</span>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-4 bg-slate-950 min-h-[220px] max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed select-text">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">No output in stdout buffer.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 py-0.5">
              <span className="text-slate-600 select-none">{log.timestamp}</span>
              <span
                className={`select-none text-[10px] uppercase font-bold px-1 rounded ${
                  log.stream === "system"
                    ? "bg-purple-950/60 text-purple-400 border border-purple-900/50"
                    : log.stream === "stderr"
                    ? "bg-rose-950/60 text-rose-400 border border-rose-900/50"
                    : "bg-slate-800/80 text-emerald-400"
                }`}
              >
                {log.stream}
              </span>
              <span
                className={
                  log.stream === "stderr"
                    ? "text-rose-300 font-medium"
                    : log.stream === "system"
                    ? "text-purple-300"
                    : "text-slate-300"
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>stdout/stderr buffered ring (max 100 lines)</span>
        <span>cgroups v2 enforce: ACTIVE</span>
      </div>
    </div>
  );
}
