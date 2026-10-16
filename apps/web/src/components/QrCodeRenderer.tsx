"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode as QrIcon } from "lucide-react";

interface QrCodeRendererProps {
  qrString: string;
  size?: number;
}

export function QrCodeRenderer({ qrString, size = 220 }: QrCodeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && qrString) {
      QRCode.toCanvas(canvasRef.current, qrString, {
        width: size,
        margin: 2,
        color: {
          dark: "#09090B",
          light: "#FAFAFA",
        },
      }).catch((err) => {
        console.error("Failed to generate QR code canvas:", err);
      });
    }
  }, [qrString, size]);

  const copyRawQr = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-background border border-border rounded-xl space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <QrIcon className="w-4 h-4 text-accent" />
        <span>Scan QR via WhatsApp</span>
      </div>
      <div className="p-2 bg-white rounded-lg shadow-inner">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-[11px] text-muted-foreground text-center max-w-xs">
        Buka WhatsApp &gt; Tiga Titik / Pengaturan &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
      </p>
      <button
        onClick={copyRawQr}
        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded border border-border transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? "Tersalin!" : "Salin Raw QR String"}</span>
      </button>
    </div>
  );
}
