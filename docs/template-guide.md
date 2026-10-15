# Panduan Pengembangan Template Bot ZeuHost

ZeuHost mendukung pembuatan dan publikasi template bot kustom (Node.js, Python, Go, Rust) dengan spesifikasi deklaratif `template.json`.

---

## 1. Struktur Direktori Template

Setiap template bot ditempatkan dalam direktori terpisah dengan struktur berikut:

```
templates/my-custom-bot/
├── template.json         # Spesifikasi metadata, skema variabel, dan kuota
├── Dockerfile            # Container build dengan user non-root 1001
├── package.json          # Dependensi bot (untuk Node.js) atau requirements.txt (Python)
└── src/
    └── index.js          # Entrypoint script aplikasi bot
```

---

## 2. Format Spesifikasi `template.json`

```json
{
  "$schema": "https://zeuhost.org/schemas/template-v1.json",
  "name": "Discord Bot TypeScript",
  "slug": "discord-ts-starter",
  "version": "1.0.0",
  "runtime": "NODEJS",
  "description": "Template bot Discord berbasis TypeScript dengan slash commands.",
  "dockerImage": "zeuhost/template-discord-ts:1.0.0",
  "resourceDefaults": {
    "memoryMb": 256,
    "cpuCores": 0.5,
    "storageMb": 512
  },
  "envVariables": [
    {
      "key": "DISCORD_BOT_TOKEN",
      "label": "Token Bot Discord",
      "description": "Token dari Discord Developer Portal",
      "type": "secret",
      "required": true
    },
    {
      "key": "GUILD_ID",
      "label": "ID Server Komunitas",
      "description": "ID Server Discord untuk deployment cepat",
      "type": "string",
      "required": false
    }
  ],
  "healthCheck": {
    "type": "process",
    "timeoutSeconds": 30
  }
}
```

---

## 3. Standar Hardening Dockerfile

Demi menjaga keamanan host VPS dan mengisolasi antar-pelanggan, setiap Dockerfile template **wajib memenuhi ketentuan berikut**:

1. **User Non-Root:** Wajib berjalan dengan UID/GID `1001:1001` (`zeubot:zeubot`).
2. **Tidak Ada Sudo / Root SUID:** Jangan sertakan paket `sudo` atau biner berprivilese root.
3. **Penyimpanan Terisolasi:** Direktori kerja utama berada di `/app`, data permanen disimpan di `/app/data` (volume terisolasi).
4. **Signal Handling:** Wajib menangani sinyal `SIGTERM` dan `SIGINT` agar container dapat dimatikan secara bersih dalam batas waktu 10 detik.

Contoh Dockerfile Node.js standar:

```dockerfile
FROM node:20-alpine AS runner

RUN addgroup -g 1001 zeubot && \
    adduser -D -u 1001 -G zeubot -h /app zeubot

WORKDIR /app

COPY package.json ./
RUN npm install --production --no-audit

COPY src/ ./src/
RUN chown -R zeubot:zeubot /app

USER 1001:1001
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
```
