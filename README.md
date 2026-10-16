# ZeuHost

Open-source, self-hosted, white-label bot hosting platform created by **Zeuzz**.

ZeuHost allows operators to deploy a complete bot hosting infrastructure on their own Linux Virtual Private Server (VPS), configure custom branding, subscription tiers, and payment workflows, and host customer bots (WhatsApp, Discord, Telegram) with isolated container sandboxing.

---

## Instalasi Otomatis 1 Perintah di VPS (Turnkey Setup)

Di server VPS baru Anda (Ubuntu 22.04 LTS / Debian 12), cukup jalankan satu baris perintah berikut sebagai root:

```bash
curl -sSL https://raw.githubusercontent.com/syaizzx/zeuhost/main/install.sh | sudo bash
```

Skrip ini akan secara otomatis:
1. Memeriksa dan menginstall **Docker CE** dan **Docker Compose v2** jika belum ada.
2. Mengunduh source code ZeuHost ke `/opt/zeuhost`.
3. Mengonfigurasi domain dan menerbitkan sertifikat **SSL/TLS otomatis** via Caddy.
4. Mengenerate seluruh kunci keamanan (`AES-256-GCM`, `HMAC SHA-256`, `Better Auth Secret`).
5. Membangun dan menjalankan seluruh container (`web`, `runtime-manager`, `postgres`, `caddy`).
6. Menerapkan migrasi database dan membuat akun **Owner Admin** utama.

---

## Fitur Utama

- **Layanan Jadibot & Bot Hosting 24 Jam:** Memungkinkan pelanggan menyambungkan bot WhatsApp via scan QR Web, bot Discord via token, atau bot Telegram tanpa perlu laptop atau ponsel menyala terus-menerus.
- **Isolasi Sandbox Hardened:** Setiap bot berjalan di container unprivileged (UID 1001), dropped capabilities (`--cap-drop ALL`), batasan cgroups memori/CPU, dan 100 PIDs limit.
- **Daemon Orkestrasi Terpisah:** Aplikasi web tidak pernah mengakses Docker socket secara langsung; seluruh perintah container berjalan melalui Runtime Manager berotentikasi HMAC SHA-256.
- **Kustomisasi Merek Penuh (White-Label):** Operator dapat mengubah nama platform, logo, palet warna, dan teks landing page secara instan melalui dashboard `/admin`.
- **Sistem Billing & Kuota Mandiri:** Alur upload bukti bayar pelanggan (Transfer Bank/QRIS) dan konfirmasi 1-klik oleh operator yang otomatis memperpanjang masa aktif langganan.
- **Autentikasi Modern:** Didukung oleh Better Auth (Email/Password & Google Login OAuth).
- **Otomatisasi HTTPS:** Integrasi Caddy v2 dengan penerbitan dan pembaruan sertifikat SSL otomatis (Let's Encrypt / ZeroSSL).

---

## Struktur Direktori Repositori

```
zeuhost/
├── apps/
│   └── web/                      # Next.js 15 Web Application & Dashboards
│       ├── src/app/              # App Router (Landing, Customer, Operator, API)
│       ├── src/components/       # UI Components (Modern Minimalist Aesthetic)
│       └── src/services/         # Business logic, tenant scoping & encryption
├── packages/
│   ├── db/                       # Prisma ORM schema & client
│   ├── runtime-manager/          # Privileged container orchestration daemon
│   └── shared/                   # Zod schemas, constants & TypeScript types
├── templates/
│   ├── nodejs-discord/           # Official Node.js Discord starter template
│   └── python-telegram/          # Official Python Telegram starter template
├── deploy/
│   ├── docker-compose.yml        # Multi-container production layout
│   ├── reverse-proxy/Caddyfile   # Ingress & automated TLS configuration
│   └── .env.example              # Environment configuration template
├── docs/
│   ├── operator-guide.md         # Panduan instalasi dan operasional VPS
│   ├── template-guide.md         # Panduan membuat template bot baru
│   └── security-model.md         # Model keamanan dan isolasi multi-tenant
├── scripts/
│   ├── preflight.sh              # Pemeriksaan kelayakan spesifikasi sistem
│   ├── setup.sh                  # Skrip instalasi otomatis satu langkah
│   ├── test-api.sh               # Uji integrasi API otomatis
│   ├── create-owner.sh           # Bootstrap akun Owner pertama kali
│   └── backup.sh                 # Backup database terkompresi otomatis
├── install.sh                    # Skrip installer otomatis 1 perintah
├── Makefile                      # Perintah praktis: make dev, make build, make test
├── plan.md                       # Master implementation plan
├── ROADMAP.md                    # Cloud Hosting Specification & Gap Analysis
├── package.json                  # Workspace definition
└── LICENSE                       # Apache-2.0 License
```

---

## Panduan Development Lokal

Pastikan Node.js 20+ atau Bun telah terpasang di komputer Anda:

```bash
# 1. Install seluruh dependensi
make install       # atau: bun install

# 2. Jalankan server development
make dev           # Server aktif di http://localhost:3000

# 3. Jalankan uji otomatis API
make test          # Menjalankan 7 skenario uji API secara mandiri
```

---

## Dokumentasi Lengkap

- [Panduan Operator VPS](./docs/operator-guide.md)
- [Panduan Template Bot](./docs/template-guide.md)
- [Model Keamanan & Isolasi](./docs/security-model.md)
- [Master Architecture Plan](./plan.md)

---

## Lisensi

ZeuHost adalah perangkat lunak sumber terbuka (open-source) berlisensi [Apache License 2.0](./LICENSE).
Dibuat oleh **syaizzx**.
