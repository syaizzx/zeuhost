"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Download, Trash2, ArrowDown, RefreshCw } from "lucide-react";

interface LiveTerminalProps {
  instanceId: string;
  status: "ONLINE" | "OFFLINE";
  onQrDetected?: (qr: string) => void;
  onPairingCodeDetected?: (code: string) => void;
  onStateDetected?: (state: string) => void;
}

export function LiveTerminal({
  instanceId,
  status,
  onQrDetected,
  onPairingCodeDetected,
  onStateDetected,
}: LiveTerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Connect to SSE stream
  useEffect(() => {
    if (!instanceId || status !== "ONLINE") {
      setIsConnected(false);
      return;
    }

    let isMounted = true;
    const eventSource = new EventSource(`/api/instances/${instanceId}/stream?tail=100`);

    eventSource.onopen = () => {
      if (isMounted) setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "log" && typeof payload.line === "string") {
          const line = payload.line;
          setLogs((prev) => [...prev.slice(-500), line]);

          // Parse special platform control tags
          if (line.includes("[ZEUHOST_QR]:")) {
            const qr = line.split("[ZEUHOST_QR]:")[1]?.trim();
            if (qr && onQrDetected) onQrDetected(qr);
          }
          if (line.includes("[ZEUHOST_PAIRING_CODE]:")) {
            const code = line.split("[ZEUHOST_PAIRING_CODE]:")[1]?.trim();
            if (code && onPairingCodeDetected) onPairingCodeDetected(code);
          }
          if (line.includes("[ZEUHOST_STATE]")) {
            const state = line.split("[ZEUHOST_STATE]")[1]?.trim();
            if (state && onStateDetected) onStateDetected(state);
          }
        }
      } catch {
        // Raw line fallback
        if (event.data) {
          setLogs((prev) => [...prev.slice(-500), event.data]);
        }
      }
    };

    eventSource.onerror = () => {
      if (isMounted) setIsConnected(false);
      eventSource.close();
    };

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, [instanceId, status, onQrDetected, onPairingCodeDetected, onStateDetected]);

  // Fallback initial log fetch if SSE is not open yet
  useEffect(() => {
    if (instanceId && status === "ONLINE" && logs.length === 0) {
      fetch(`/api/instances/${instanceId}/logs?tail=50`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.data === "string" && data.data.trim()) {
            const initialLines = data.data.split("\n").filter(Boolean);
            setLogs(initialLines);
          }
        })
        .catch(() => {});
    }
  }, [instanceId, status, logs.length]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleDownload = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeuhost-instance-${instanceId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderColoredLine = (line: string, index: number) => {
    let colorClass = "text-zinc-300";
    if (line.includes("error") || line.includes("ERROR") || line.includes("FAILED") || line.includes("Fatal")) {
      colorClass = "text-rose-400";
    } else if (line.includes("warn") || line.includes("WARN") || line.includes("WAITING")) {
      colorClass = "text-amber-300";
    } else if (line.includes("CONNECTED") || line.includes("ready") || line.includes("berhasil") || line.includes("started")) {
      colorClass = "text-emerald-400";
    } else if (line.includes("[ZEUHOST_")) {
      colorClass = "text-accent font-semibold";
    }

    return (
      <div key={index} className={`font-mono text-[11px] leading-relaxed break-all ${colorClass}`}>
        {line}
      </div>
    );
  };

  return (
    <div className="bg-background border border-border rounded-xl flex flex-col overflow-hidden">
      {/* Terminal Bar */}
      <div className="px-3.5 py-2 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-foreground">Live Terminal Console</span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isConnected ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-accent animate-pulse" : "bg-zinc-500"}`} />
            {isConnected ? "Live Stream" : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoScroll((prev) => !prev)}
            className={`p-1.5 rounded hover:bg-muted text-xs transition-colors ${
              autoScroll ? "text-accent" : "text-muted-foreground"
            }`}
            title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={logs.length === 0}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-40"
            title="Download Logs (.txt)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="p-3.5 font-mono text-xs max-h-72 min-h-48 overflow-y-auto space-y-1 bg-[#050507]"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-500 italic text-[11px] py-4 text-center">
            {status === "ONLINE"
              ? "Menunggu keluaran log container..."
              : "Bot saat ini offline. Nyalakan bot untuk melihat log secara langsung."}
          </div>
        ) : (
          logs.map((line, idx) => renderColoredLine(line, idx))
        )}
      </div>
    </div>
  );
}
