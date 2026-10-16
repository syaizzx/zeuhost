import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = "/app/data/session";
const CONFIG_PATH = "/app/data/config.json";

const logger = pino({ level: "silent" });

function loadConfig() {
  const defaults = {
    botName: process.env.BOT_NAME || "ZeuBot",
    ownerNumber: process.env.OWNER_NUMBER || "",
    prefix: process.env.COMMAND_PREFIX || "!",
    mode: process.env.BOT_MODE || "public",
    pairingNumber: process.env.PAIRING_NUMBER || "",
  };

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const file = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return { ...defaults, ...file };
    } catch {
      console.log("[ZEUHOST_LOG] Failed to parse config.json, using defaults");
    }
  }
  return defaults;
}

function formatJid(number) {
  const cleaned = number.replace(/[^0-9]/g, "");
  return cleaned.includes("@s.whatsapp.net")
    ? cleaned
    : `${cleaned}@s.whatsapp.net`;
}

async function startBot() {
  const config = loadConfig();
  console.log(`[ZEUHOST_LOG] Starting ${config.botName}...`);
  console.log(`[ZEUHOST_LOG] Mode: ${config.mode} | Prefix: ${config.prefix}`);
  console.log(`[ZEUHOST_STATE] WAITING_PAIRING`);

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: !config.pairingNumber,
    browser: [config.botName, "Chrome", "4.0.0"],
    generateHighQualityLinkPreview: false,
  });

  // Pairing code mode: request 8-digit code if number is set and not yet registered
  if (config.pairingNumber && !sock.authState.creds.registered) {
    const cleaned = config.pairingNumber.replace(/[^0-9]/g, "");
    console.log(`[ZEUHOST_LOG] Requesting pairing code for ${cleaned}...`);
    try {
      const code = await sock.requestPairingCode(cleaned);
      console.log(`[ZEUHOST_PAIRING_CODE]:${code}`);
      console.log(`[ZEUHOST_LOG] Pairing code: ${code}`);
      console.log(
        `[ZEUHOST_LOG] Buka WhatsApp > Linked Devices > Link with Phone Number > Masukkan kode di atas`
      );
    } catch (err) {
      console.error(`[ZEUHOST_LOG] Gagal request pairing code: ${err.message}`);
    }
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Emit raw QR string for the platform to detect
      console.log(`[ZEUHOST_QR]:${qr}`);
      console.log(`[ZEUHOST_STATE] WAITING_PAIRING`);
    }

    if (connection === "connecting") {
      console.log(`[ZEUHOST_STATE] CONNECTING`);
      console.log(`[ZEUHOST_LOG] Menghubungkan ke WhatsApp...`);
    }

    if (connection === "open") {
      console.log(`[ZEUHOST_STATE] CONNECTED`);
      console.log(
        `[ZEUHOST_LOG] ${config.botName} berhasil terhubung ke WhatsApp!`
      );
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ??
        lastDisconnect?.error?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`[ZEUHOST_STATE] LOGGED_OUT`);
        console.log(
          `[ZEUHOST_LOG] Bot telah logout dari WhatsApp. Hapus session untuk re-pair.`
        );
        // Clean session files on logout
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      } else {
        console.log(`[ZEUHOST_STATE] DISCONNECTED`);
        console.log(
          `[ZEUHOST_LOG] Koneksi terputus (code: ${statusCode}), reconnecting...`
        );
      }

      if (shouldReconnect) {
        setTimeout(startBot, 3000);
      }
    }
  });

  // Message handler
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const sender = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";
      const isGroup = sender?.endsWith("@g.us");
      const isOwner =
        config.ownerNumber &&
        msg.key.participant === formatJid(config.ownerNumber);

      // Self mode: only respond to owner
      if (config.mode === "self" && !isOwner) continue;

      // Command handling
      if (text.startsWith(config.prefix)) {
        const args = text.slice(config.prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        console.log(
          `[ZEUHOST_LOG] Command: ${config.prefix}${command} from ${sender}${isGroup ? " (group)" : ""}`
        );

        switch (command) {
          case "ping":
            await sock.sendMessage(sender, {
              text: `🏓 Pong! Bot ${config.botName} aktif.`,
            });
            break;

          case "info":
            await sock.sendMessage(sender, {
              text: [
                `╭─「 *${config.botName}* 」`,
                `│ Mode: ${config.mode}`,
                `│ Prefix: ${config.prefix}`,
                `│ Runtime: Node.js ${process.version}`,
                `│ Uptime: ${formatUptime(process.uptime())}`,
                `│ RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
                `╰──────────`,
              ].join("\n"),
            });
            break;

          case "menu":
          case "help":
            await sock.sendMessage(sender, {
              text: [
                `╭─「 *Menu ${config.botName}* 」`,
                `│`,
                `│ ${config.prefix}ping - Cek status bot`,
                `│ ${config.prefix}info - Info bot`,
                `│ ${config.prefix}menu - Tampilkan menu ini`,
                `│ ${config.prefix}sticker - Buat stiker dari gambar`,
                `│`,
                `╰──────────`,
                ``,
                `_Powered by ZeuHost_`,
              ].join("\n"),
            });
            break;

          case "sticker":
          case "s":
            if (
              msg.message.imageMessage ||
              msg.message.extendedTextMessage?.contextInfo?.quotedMessage
                ?.imageMessage
            ) {
              try {
                const imageMsg =
                  msg.message.imageMessage ||
                  msg.message.extendedTextMessage.contextInfo.quotedMessage
                    .imageMessage;
                const buffer = await sock.downloadMediaMessage(
                  { ...msg, message: { imageMessage: imageMsg } },
                  "buffer"
                );
                await sock.sendMessage(sender, {
                  sticker: buffer,
                  mimetype: "image/webp",
                });
              } catch {
                await sock.sendMessage(sender, {
                  text: "Gagal membuat stiker.",
                });
              }
            } else {
              await sock.sendMessage(sender, {
                text: `Kirim/reply gambar dengan caption ${config.prefix}sticker`,
              });
            }
            break;

          default:
            break;
        }
      }
    }
  });
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  parts.push(`${m} menit`);
  return parts.join(" ");
}

startBot().catch((err) => {
  console.error(`[ZEUHOST_LOG] Fatal error: ${err.message}`);
  console.log(`[ZEUHOST_STATE] FAILED`);
  process.exit(1);
});
