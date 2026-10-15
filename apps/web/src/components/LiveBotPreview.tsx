"use client";

import React, { useState } from "react";
import { Check, Send, CheckCheck, Smartphone, Sparkles, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "customer" | "bot";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "customer",
    text: "Halo kak, bot WhatsApp toko saya bisa tetap aktif kalau HP saya matikan?",
    time: "10:14",
  },
  {
    id: "2",
    sender: "bot",
    text: "Halo! Tentu bisa kak. Bot berjalan di server cloud ZeuHost 24 jam nonstop, jadi HP kamu bebas dimatikan kapan saja tanpa mengganggu chat pelanggan.",
    time: "10:14",
  },
];

export function LiveBotPreview() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const sendPreset = (text: string, reply: string) => {
    if (isTyping) return;
    const now = new Date().toTimeString().slice(0, 5);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text,
      time: now,
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: "bot",
        text: reply,
        time: new Date().toTimeString().slice(0, 5),
      };
      setMessages((prev) => [...prev, replyMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setIsTyping(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-card border border-border shadow-2xl overflow-hidden text-left relative">
      {/* Top Window Chrome */}
      <div className="p-4 bg-muted/60 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-card absolute bottom-0 right-0" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Bot Toko WhatsApp</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/10 text-accent font-medium">
                Aktif 24 Jam
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Respon otomatis • Server cloud ZeuHost
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          title="Reset percakapan"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="p-5 space-y-3.5 min-h-[220px] max-h-[320px] overflow-y-auto bg-gradient-to-b from-card to-background/50 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "customer" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                msg.sender === "customer"
                  ? "bg-accent text-black rounded-tr-xs font-medium"
                  : "bg-muted text-foreground border border-border rounded-tl-xs"
              }`}
            >
              {msg.text}
              <div
                className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
                  msg.sender === "customer" ? "text-black/70" : "text-muted-foreground"
                }`}
              >
                <span>{msg.time}</span>
                {msg.sender === "customer" && <CheckCheck className="w-3 h-3" />}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] ml-1">Bot sedang mengetik balasan...</span>
          </div>
        )}
      </div>

      {/* Preset Action Buttons (Interactive Playground) */}
      <div className="p-3 bg-muted/40 border-t border-border">
        <div className="text-[11px] text-muted-foreground mb-2 flex items-center justify-between">
          <span>Coba klik pertanyaan di bawah ini untuk tes respon bot:</span>
          <span className="text-accent text-[10px]">Waktu respon ~0.2 detik</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              sendPreset(
                "Bisa bantu kirim katalog produk?",
                "Tentu kak! Berikut katalog lengkap kami. Kamu bisa pilih produk dan langsung checkout otomatis lewat chat ini."
              )
            }
            disabled={isTyping}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-zinc-800 text-foreground border border-border text-xs transition-colors disabled:opacity-50"
          >
            Cek katalog produk
          </button>

          <button
            onClick={() =>
              sendPreset(
                "Gimana cara hubungkan bot ke ZeuHost?",
                "Mudah sekali! Tinggal buka WhatsApp di ponsel kamu, pilih Perangkat Tertaut, lalu scan QR code di dashboard ZeuHost. Bot langsung aktif dalam 60 detik."
              )
            }
            disabled={isTyping}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-zinc-800 text-foreground border border-border text-xs transition-colors disabled:opacity-50"
          >
            Cara hubungkan bot
          </button>

          <button
            onClick={() =>
              sendPreset(
                "Berapa harga paket sewanya?",
                "Ada paket Trial gratis 7 hari untuk coba, paket Pro Rp 25.000/bulan untuk 3 bot, dan paket Reseller Rp 75.000/bulan."
              )
            }
            disabled={isTyping}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-zinc-800 text-foreground border border-border text-xs transition-colors disabled:opacity-50"
          >
            Harga sewa bot
          </button>
        </div>
      </div>
    </div>
  );
}
