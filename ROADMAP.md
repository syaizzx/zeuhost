# ZeuHost Cloud Bot & App Hosting Platform - Master Roadmap & Architectural Specification

Dokumen ini mendokumentasikan spesifikasi arsitektur, daftar gap sistem saat ini (audit temuan mock & celah keamanan), serta roadmap teknis untuk mentransformasi ZeuHost dari web dasar menjadi **PaaS Cloud Bot, Web, & Database Hosting Engine** kelas produksi sekelas Pterodactyl/Railway. Mencakup pilar-pilar inti (Terminal, File Manager, Billing, dll.) hingga pilar lanjutan (Multi-Node Wings, Scheduled Tasks, Backup, 2FA, Subuser, API Keys, Audit Log).

---

## 1. Audit Kritis & Gap Sistem Saat Ini

| Area | Status Saat Ini | Detail Temuan Teknis | Target Solusi |
| :--- | :--- | :--- | :--- |
| **API Auth & Tenant Guard** | **CRITICAL VULN** | `/api/instances/*` dan `/api/payments/*` membaca `req.headers.get("x-customer-id") \|\| "demo-customer-id"`. | Hapus header spoofing; validasi session cookie Better-Auth murni (`auth.api.getSession`). |
| **Admin Route Guard** | **CRITICAL VULN** | Halaman `/admin` dan API `/api/admin/*` tidak memiliki pengecekan role `OWNER`/`STAFF`. | Pasang middleware auth guard di level Next.js edge & handler API. |
| **Customer Dashboard** | **FAKED / MOCK** | `INITIAL_INSTANCES` di-hardcode ("Toko WhatsApp Utama", RAM `92 MB / 256 MB`, log statis). | Hapus mock array; render empty-state murni dan data riil dari Docker Engine. |
| **Auth Login Flow** | **FAKED** | `login/page.tsx` memiliki `catch { window.location.href = "/dashboard"; }`. | Hapus fake fallback; tolak redirect jika session belum terbentuk di DB. |
| **Template Docker Image** | **MISSING** | `seed.ts` mereferensikan `zeuhost/template-whatsapp-baileys:1.0.0` yang belum memiliki Dockerfile. | Sediakan source code template & Dockerfile Baileys resmi di `templates/whatsapp-baileys/`. |
| **Billing & Payments** | **MANUAL ONLY** | Hanya upload struk transfer manual. Tidak ada auto-activation atau webhook provider. | Integrasikan Payment Gateway Driver (Tripay, Midtrans, Xendit, QRIS) + webhook otomatis. |
| **File Management** | **MISSING** | Belum ada File Manager untuk mengedit kode, config, atau upload file zip pelanggan. | Sediakan Web File Manager interaktif dengan in-browser Code Editor. |

---

## 2. Spesifikasi Teknis 18 Pilar Cloud Hosting

### Pilar 1: Live Interactive Web Terminal & Real-Time Console
Platform cloud hosting wajib menyediakan antarmuka terminal langsung untuk melihat log proses dan debugging:
1. **Streaming Pipeline**:
   - Docker container `stdout`/`stderr` dialirkan melalui `dockerode.logs({ follow: true, stdout: true, stderr: true })`.
   - Runtime Manager daemon mengekspos endpoint streaming dengan autentikasi HMAC.
   - Next.js menyediakan route handler SSE (Server-Sent Events) atau WebSocket `/api/instances/[id]/stream`.
2. **Terminal Frontend UI**:
   - Menggunakan renderer ANSI terminal (Xterm.js atau custom ANSI parser).
   - Mendukung warna syntax (`chalk`, log error merah, warning kuning, timestamp abu-abu).
   - Fitur utilitas: **Auto-Scroll Toggle**, **Clear Terminal**, **Download Full Log (.txt)**, dan **Line Counter**.

---

### Pilar 2: Sistem Khusus WhatsApp Bot (Baileys v6 Engine)
WhatsApp bot adalah use-case utama Jadibot yang memerlukan perlakuan khusus pada mekanisme login:
1. **Template Resmi `templates/whatsapp-baileys/`**:
   - Base image: `node:20-alpine` non-root user (`zeubot:1001`).
   - Library: `@whiskeysockets/baileys` v6.x.
   - Persistent Auth: Folder sesi multi-device dimount ke volume Docker `/app/data/session`. Restart container **tidak akan menyebabkan logout**.
2. **Dukungan Dua Metode Pairing**:
   - **Mode Scan QR Code**:
     - Bot memancarkan format standar `[ZEUHOST_QR]:<raw_qr_string>` ke stdout.
     - Backend mendeteksi format ini dan mengeksposnya ke API `/api/instances/[id]/qr`.
     - Frontend merender QR code SVG/Canvas beresolusi tinggi yang langsung bisa di-scan via menu *Linked Devices* WhatsApp.
   - **Mode 8-Digit Pairing Code**:
     - Pengguna memasukkan nomor telepon bot di web dashboard.
     - Bot meminta pairing code ke server WhatsApp dan mencetak kode 8 digit (misal: `ABCD-1234`).
     - Tampil di UI dashboard dengan tombol *Copy to Clipboard* tanpa perlu scan kamera.
3. **Connection State Observer**:
   - Deteksi otomatis status koneksi: `WAITING_PAIRING` -> `CONNECTING` -> `CONNECTED` -> `DISCONNECTED` -> `LOGGED_OUT`.

---

### Pilar 3: No-Code / Managed Bot Hosting (Jadibot Otomatis Tanpa Koding)
Pelanggan bot (WhatsApp / Telegram / Discord) **tidak perlu mengunggah atau menulis kode bot sendiri**. Logika bot sudah tertanam paten di template paket, pelanggan cukup mengisi konfigurasi melalui GUI:
1. **Formulir Konfigurasi Web GUI (Zero-Code Experience)**:
   - **Identitas Bot**: Nama Bot, Bio/Status, URL Logo/Avatar Bot.
   - **Owner Info**: Nomor HP Owner WhatsApp (format internasional), ID Discord Owner, ID Telegram Owner.
   - **Command Behavior**: Prefix karakter (`!`, `.`, `/`, `#`, atau multi-prefix), Mode Public vs Self/Private.
   - **Toko Online & Auto-Reply**: Pesan Welcome member grup baru, Pesan Auto-Responder pesan pribadi, Watermark footer/tagline pesan.
   - **Modul Fitur (Toggle Switch)**:
     - Auto-Sticker (foto langsung jadi stiker).
     - Anti-Link Grup (auto-kick atau hapus pesan link).
     - Downloader TikTok / YouTube / Instagram.
     - Integrasi AI Chatbot (input API Key OpenAI / Gemini).
2. **Dynamic Configuration Injection**:
   - Seluruh nilai konfigurasi GUI disimpan di database PostgreSQL (terenkripsi AES-256).
   - Saat container dijalankan, konfigurasi di-inject sebagai file konfigurasi JSON `/app/data/config.json` dan environment variables.
   - Pengguna mengubah settingan di dashboard -> Klik "Simpan & Terapkan" -> Bot otomatis restart menerapkan settingan baru.

---

### Pilar 4: In-Browser Web File Manager (Pterodactyl Style)
Untuk pelanggan yang menggunakan paket Custom Hosting (Web, Node.js, atau ingin kustomisasi file bot):
1. **Interactive File Explorer**:
   - Pohon direktori (File Tree), navigasi breadcrumb folder, dan pencarian file.
   - Tampilan ukuran file (KB/MB), tanggal modifikasi, dan ekstensi file.
2. **In-Browser Code Editor**:
   - Editor kode interaktif (Monaco Editor / Ace) dengan syntax highlighting (JavaScript, TypeScript, Python, JSON, HTML, CSS, YAML, Shell).
   - Fitur editor: Penomoran baris (line numbers), Search & Replace (`Ctrl+F`), dan shortcut simpan (`Ctrl+S`).
3. **Operasi Berkas Lengkap**:
   - **Create File / Folder**: Buat file `.js`, `.json`, `.env` baru.
   - **Upload File**: Drag-and-drop berkas langsung dari browser.
   - **Archive & Extract**: Kompres folder menjadi `.zip` atau ekstrak file `.zip`/`.tar.gz` yang diunggah langsung di dalam server.
   - **Download & Rename & Delete**: Unduh backup file atau hapus file yang tidak dibutuhkan.
4. **Keamanan Sandboxing Berkas**:
   - *Path Traversal Protection*: Memblokir eksploitasi `../` agar pelanggan tidak bisa mengakses direktori sistem host.
   - Izin berkas terkunci pada UID non-root `1001:1001`.

---

### Pilar 5: Web & Node.js Application Hosting (Custom PaaS)
Memungkinkan pengguna menjalankan web statis, REST API, atau aplikasi backend kustom:
1. **Runtime Selector**:
   - Node.js (v18, v20, v22).
   - Python (3.10, 3.11, 3.12).
   - Static HTML/Web Server.
2. **Custom Startup Command & Port Mapping**:
   - Kolom perintah startup yang dapat diubah (misal: `npm start`, `node index.js`, `python app.py`).
   - Alokasi port internal container yang otomatis dipetakan ke reverse proxy Caddy dengan subdomain otomatis:
     `https://<nama-aplikasi>.zeuhost.com`.
3. **NPM / Pip Dependency Auto-Install**:
   - Opsi tombol 1-klik "Install Dependencies" di dashboard yang menjalankan `npm install` atau `pip install -r requirements.txt` di dalam container terisolasi.

---

### Pilar 6: Managed Database Hosting (1-Click Databases)
Layanan database terkelola untuk bot atau web pengguna:
1. **Provisioning Instan**:
   - 1-Klik buat database: **PostgreSQL**, **MySQL**, atau **Redis**.
2. **Isolasi Database & Kredensial**:
   - Setiap pengguna mendapatkan nama database, username, dan password acak yang unik.
   - Akses dibatasi hanya untuk database miliknya sendiri.
3. **Connection Strings**:
   - Menyediakan internal connection URL (untuk bot yang berada di jaringan Docker yang sama).
   - Menyediakan external connection URL (untuk remote management via DBeaver / TablePlus).
4. **Web Database Manager Terintegrasi**:
   - Tombol 1-klik login ke antarmuka web database (Adminer / CloudBeaver) langsung dari dashboard pelanggan.

---

### Pilar 7: Real Telemetry & Container Lifecycle Engine
Menghilangkan semua data tiruan di dashboard dan menggantikannya dengan metrik kernel:
1. **Live Resource Monitoring**:
   - Tarik metrik riil dari Docker Engine API (`GET /instances/:id/stats`):
     - **RAM**: Penggunaan riil dalam MB dan persentase terhadap limit paket (misal: `142 MB / 512 MB (27%)`).
     - **CPU**: Utilisasi CPU delta terhadap system clock (`cpuDelta / systemDelta * 100`).
     - **PIDs**: Jumlah thread/proses aktif (mitigasi fork-bomb).
     - **Uptime**: Dihitung dari `container.State.StartedAt` riil.
2. **Lifecycle Controls**:
   - **Start**: Menyalakan container yang berstatus stopped.
   - **Stop**: Mengirim signal `SIGTERM` (graceful shutdown 10 detik) sebelum `SIGKILL`.
   - **Restart**: Melakukan cold/warm reboot container.
   - **Rebuild**: Menghapus container dan membuat ulang dari image fresh tanpa menghapus volume data `/app/data`.
   - **Terminate**: Menghapus instance, memutus database record, dan membersihkan volume data.

---

### Pilar 8: Multi-Provider Payment Gateway & Auto Billing
Transformasi dari transfer manual ke gateway pembayaran otomatis:
1. **Supported Gateway Drivers**:
   - **Tripay / Duitku**: Biaya transaksi termurah untuk ekosistem lokal (QRIS Real-Time, Virtual Account BCA/BRI/BNI/Mandiri, E-Wallet ShopeePay/OVO/DANA/GoPay, Gerai Alfamart/Indomaret).
   - **Midtrans**: Snap & Core API (QRIS Gopay, VA multi-bank).
   - **Xendit**: Checkout Invoice API.
   - **Stripe**: Pembayaran kartu kredit/debit global.
   - **Manual Transfer**: Fallback transfer langsung dengan verifikasi staff.
2. **Webhook Verification & Idempotency**:
   - Verifikasi cryptographic signature (HMAC-SHA512 / SHA256) per provider.
   - Mencegah double-activation jika webhook diterima berulang kali.
3. **Automated Subscription Lifecycle & Cron Engine**:
   - **H-3 Jatuh Tempo**: Buat invoice perpanjangan dan kirim notifikasi via Email/WA.
   - **H+0**: Masa aktif habis, status menjadi `PAST_DUE`.
   - **H+3**: Grace period berakhir, status menjadi `SUSPENDED` -> Container bot otomatis di-stop via Runtime Manager.
   - **H+7**: Status menjadi `TERMINATED` -> Container dan volume data dihapus permanen jika tagihan diabaikan.

---

### Pilar 9: Operator Admin Control Center
Menjadikan panel `/admin` sebagai pusat kendali platform hosting lengkap:
1. **Payment Gateway Management**:
   - Konfigurasi Merchant ID, API Key, dan Private Key langsung dari Web Admin tanpa perlu SSH/edit `.env` di server.
   - Switch mode Sandbox / Production secara instan.
2. **Plan & Resource Quota CRUD**:
   - Buat paket baru (misal: *Starter Jadibot 256MB*, *Pro Bot 1GB*, *Node.js Web App 2GB*, *Managed PostgreSQL*).
   - Tentukan harga bulanan, maksimal bot/instance, limit RAM per container, limit CPU cores, dan kuota disk.
3. **User Management**:
   - Daftar seluruh akun terdaftar beserta jumlah bot, database, dan status langganan.
   - Tombol operasional: Ubah Role (`CUSTOMER` -> `STAFF` -> `OWNER`), Suspend Akun, Hapus Akun, Reset Password.
4. **Host Node Health Monitoring**:
   - Monitor utilisasi VPS utama: Total RAM VPS terpakai, Core CPU Host, Sisa Harddisk/SSD, Uptime OS, dan jumlah container Docker yang sedang berjalan.
5. **SMTP & System Notification Config**:
   - Form setting server email (Host, Port, User, Password, TLS) untuk verifikasi pendaftaran dan tagihan otomatis.

---

### Pilar 10: Zero-Trust Security Hardening
1. **Session-Bound Identity**:
   - Menghapus total fallback `x-customer-id`. Seluruh permintaan diverifikasi via signed session Better-Auth.
2. **Strict Container Sandboxing**:
   - `CapDrop: ["ALL"]`: Melarang semua Linux capabilities berbahaya.
   - `SecurityOpt: ["no-new-privileges:true"]`: Mencegah eskalasi privilege (misal: `sudo` atau exploit SUID).
   - `ReadonlyRootfs: true`: Sistem file container bot read-only, hanya volume `/app/data` dan `/tmp` yang dapat ditulis.
   - `PidsLimit: 100`: Mencegah fork-bomb yang dapat melumpuhkan VPS.
3. **Isolated Network Bridge (`zeuhost-bots`)**:
   - Container bot customer dilarang berkomunikasi satu sama lain (`icc=false`).
   - Bot customer dilarang mengakses jaringan internal database PostgreSQL (port 5432) atau daemon Runtime Manager (port 4001).
4. **Rate Limiting**:
   - Batasi percobaan login gagal (maksimal 5 kali / 15 menit per IP).
   - Batasi pemanggilan aksi container bot (maksimal 30 request / menit per customer).

---

### Pilar 11: Multi-Node Architecture (Wings-Style Remote Daemon)
Pterodactyl menyebar beban ke banyak VPS via daemon "Wings". ZeuHost perlu mekanisme serupa:
1. **Node Registry & Discovery**:
   - Admin mendaftarkan node baru (hostname, IP, port daemon, RAM total, disk total, CPU cores) dari panel Admin.
   - Setiap node menjalankan instance `runtime-manager` daemon yang independen.
   - Panel pusat berkomunikasi ke setiap node via authenticated REST/gRPC + HMAC token.
2. **Allocation Pool (IP:Port Bindings)**:
   - Setiap node memiliki blok port yang dialokasikan (misal: `25565-25600`, `8080-8100`).
   - Saat instance baru dibuat, sistem otomatis memilih node dengan resource tersedia dan port yang belum terpakai.
   - Port mapping ditampilkan di dashboard pelanggan: `Primary: 103.xx.xx.xx:25567`.
3. **Node Health & Auto-Failover**:
   - Heartbeat setiap 30 detik dari daemon ke panel pusat.
   - Jika node tidak merespons 3x berturut-turut → status `OFFLINE`, notifikasi ke admin, instance ditandai degraded.
   - Migrasi manual instance antar node (copy volume + re-deploy di node target).
4. **Resource Overcommit Settings**:
   - Admin bisa set overcommit ratio per node (misal: RAM 1.2x, CPU 1.5x) untuk memaksimalkan density.
   - Dashboard node menampilkan: allocated vs actual usage vs overcommit ceiling.

---

### Pilar 12: Scheduled Tasks (User-Level Cron Jobs)
Pengguna perlu menjalankan perintah terjadwal di dalam container mereka:
1. **Task Scheduler UI**:
   - CRUD jadwal dari dashboard: pilih interval (setiap X menit, jam, hari, cron expression kustom).
   - Jenis aksi: **Command** (jalankan perintah di dalam container), **Power Action** (restart/stop/start), **Backup** (trigger backup otomatis).
2. **Execution Engine**:
   - Cron runner berjalan di `runtime-manager` daemon per node.
   - Hasil eksekusi (stdout/stderr, exit code, durasi) dicatat dan ditampilkan di log history task.
   - Limit: maksimal 5 scheduled task per instance (configurable per plan).
3. **Timezone Support**:
   - User memilih timezone dari dropdown (Asia/Jakarta, UTC, dll.).
   - Semua jadwal disimpan dan dieksekusi berdasarkan timezone user, bukan server.

---

### Pilar 13: Instance Backup & Snapshot System
Fitur backup/restore per instance yang bisa dilakukan pelanggan sendiri:
1. **Manual & Scheduled Backups**:
   - Tombol "Create Backup" di dashboard → mengarsipkan seluruh volume `/app/data` menjadi `.tar.gz`.
   - Backup terjadwal via Pilar 12 Scheduled Tasks.
   - Limit backup per instance (misal: 3 backup untuk plan Starter, 10 untuk plan Pro).
2. **Backup Storage Drivers**:
   - **Local**: Disimpan di direktori node (default).
   - **S3-Compatible**: Upload ke MinIO, Cloudflare R2, AWS S3, atau Backblaze B2.
   - Admin mengonfigurasi driver dan kredensial dari panel Admin.
3. **Restore & Download**:
   - Restore: pilih backup → container di-stop → volume di-replace → container di-start.
   - Download: pelanggan bisa mengunduh file backup `.tar.gz` langsung dari browser.
   - Lock: hanya 1 operasi backup/restore aktif per instance pada satu waktu.
4. **Retention Policy**:
   - Auto-delete backup terlama saat melebihi limit kuota.
   - Admin bisa set TTL global (misal: backup otomatis dihapus setelah 30 hari).

---

### Pilar 14: Subuser & Permission System
Memungkinkan kolaborasi multi-user pada satu instance (mirip Pterodactyl subuser):
1. **Subuser Invitation**:
   - Owner instance mengundang user lain via email.
   - User yang diundang mendapat akses terbatas sesuai permission yang diberikan.
2. **Granular Permission Matrix**:
   - **Console**: Lihat log, kirim command.
   - **Power**: Start, Stop, Restart, Kill.
   - **File Manager**: Read-only, Read-Write, Upload, Delete.
   - **Backup**: Create, Read, Delete, Download, Restore.
   - **Settings**: Lihat info instance, Edit startup command, Edit environment variables.
   - **Scheduled Tasks**: Create, Read, Update, Delete.
   - **Database**: View credentials, Create, Delete, Reset password.
3. **Audit Trail per Subuser**:
   - Setiap aksi subuser dicatat (siapa, kapan, aksi apa) dan terlihat oleh owner instance.

---

### Pilar 15: API Key System (Application & Client API)
Akses programatik ke platform untuk automasi dan integrasi pihak ketiga:
1. **Client API Key (Per-User)**:
   - User membuat API key dari halaman Account Settings.
   - Scoped ke resource milik user tersebut (instances, databases, backups).
   - Mendukung permission granular per key (read-only, full access, custom scope).
2. **Application API Key (Admin-Level)**:
   - Admin membuat API key dengan akses penuh ke seluruh resource platform.
   - Digunakan untuk integrasi WHMCS, billing external, atau custom automation script.
3. **API Specification**:
   - RESTful API dengan response format JSON konsisten (`{ data, meta, errors }`).
   - Rate limit per key: 60 req/menit (client), 240 req/menit (application).
   - Dokumentasi OpenAPI/Swagger auto-generated dan diakses di `/api/docs`.

---

### Pilar 16: Two-Factor Authentication (2FA / TOTP)
Lapisan keamanan tambahan untuk akun user dan admin:
1. **TOTP Setup Flow**:
   - User mengaktifkan 2FA dari Account Settings → generate secret → tampilkan QR code untuk Google Authenticator / Authy.
   - Verifikasi kode 6-digit sebelum 2FA aktif secara permanen.
2. **Login Enforcement**:
   - Jika 2FA aktif, setelah email+password valid → halaman input kode TOTP sebelum session dibuat.
   - Admin bisa memaksa 2FA wajib untuk role `STAFF` dan `OWNER` (configurable).
3. **Recovery Codes**:
   - Generate 10 recovery codes saat setup 2FA (hashed di DB, ditampilkan sekali).
   - Setiap recovery code hanya bisa dipakai 1 kali.
   - Admin bisa reset 2FA user jika kehilangan akses (dengan audit log).

---

### Pilar 17: Audit Log & Activity Tracking
Jejak aktivitas lengkap untuk keamanan dan debugging:
1. **Event Categories**:
   - **Auth Events**: Login, logout, failed login, 2FA verified, password changed, API key created/revoked.
   - **Instance Events**: Created, started, stopped, restarted, rebuilt, terminated, config changed.
   - **File Events**: File created, edited, deleted, uploaded, downloaded, archived.
   - **Billing Events**: Invoice created, payment received, subscription renewed, suspended, terminated.
   - **Admin Events**: User role changed, plan modified, node added/removed, gateway config changed.
2. **Storage & Retention**:
   - Disimpan di tabel PostgreSQL `audit_logs` dengan index pada `userId`, `action`, `createdAt`.
   - Retention: 90 hari default (configurable oleh admin).
   - Ekspor CSV/JSON dari panel admin.
3. **Dashboard Views**:
   - **Customer**: Melihat activity log instance miliknya sendiri.
   - **Admin**: Global activity feed, filter by user/event type/date range, search keyword.
   - Notifikasi real-time ke admin untuk event kritis (failed login brute-force, mass termination).

---

### Pilar 18: Server Transfer & Egg/Nest Template Registry
Sistem template yang lebih fleksibel dan kemampuan transfer instance:
1. **Nest & Egg Architecture** (terinspirasi Pterodactyl):
   - **Nest** = kategori template (misal: "Bot Hosting", "Web Hosting", "Game Servers", "Database").
   - **Egg** = definisi template spesifik di dalam nest (misal: nest "Bot Hosting" berisi egg "WhatsApp Baileys", "Discord.js v14", "Telegram Pyrogram").
   - Setiap Egg mendefinisikan: Docker image, startup command, config variables (schema JSON), port bindings, dan install script.
2. **Egg Import/Export**:
   - Export egg sebagai file `.json` untuk dibagikan ke operator ZeuHost lain.
   - Import egg dari file → validasi schema → register di database.
   - Community egg repository (opsional, fase lanjutan).
3. **Server Transfer**:
   - Owner instance bisa mentransfer kepemilikan instance ke user lain di platform yang sama.
   - Transfer memerlukan konfirmasi dari kedua pihak (sender & receiver).
   - Seluruh subuser permission di-reset setelah transfer berhasil.
   - Billing tanggung jawab berpindah ke owner baru sejak transfer dikonfirmasi.
---
## 3. Tahapan Rencana Eksekusi (Phase Plan)

```
[Phase 1: Real Baileys Engine, No-Code Config, & Live Terminal]
  ├── Buat templates/whatsapp-baileys/ (Baileys v6, persistent session, QR & Pairing code)
  ├── Tambahkan tab konfigurasi No-Code GUI bot (Nama, Owner WA, Prefix, Modul Fitur)
  ├── Bangun Dockerfile template resmi dan build image lokal
  ├── Hapus INITIAL_INSTANCES dummy di dashboard customer
  └── Implementasi Live Web Terminal (ANSI Color Stream) & Visual QR Scanner

[Phase 2: In-Browser Web File Manager & Custom Web/Node Hosting]
  ├── Bangun API File System (List, Read, Write, Delete, Rename, Upload, Zip/Unzip)
  ├── Integrasikan In-Browser Code Editor (Monaco / Ace) di dashboard
  └── Buat template kustom untuk Node.js Web App & Express dengan port mapping Caddy

[Phase 3: Security Hardening, 2FA, & Real Session Guard]
  ├── Pasang Next.js middleware.ts untuk proteksi /admin & /dashboard
  ├── Migrasi seluruh API customer agar membaca session murni (hapus x-customer-id)
  ├── Integrasikan Google OAuth callback flow
  ├── Implementasi Two-Factor Authentication (TOTP + Recovery Codes)
  └── Enforce 2FA wajib untuk role STAFF & OWNER

[Phase 4: Multi-Provider Payment Gateway & Auto Billing]
  ├── Buat adapter Payment Gateway (Tripay, Midtrans, QRIS)
  ├── Endpoint webhook handler dengan validasi signature
  └── Cron engine otomatisasi suspensi bot kadaluarsa

[Phase 5: Managed Database & Admin Control Center]
  ├── Provisioning 1-klik database PostgreSQL/MySQL/Redis terisolasi
  ├── UI Pengaturan Payment Gateway & SMTP di Admin
  ├── CRUD Paket Hosting & Kuota Resource
  └── Dashboard Monitoring Utilisasi Node VPS

[Phase 6: Backup, Scheduled Tasks, & Subuser System]
  ├── Instance Backup & Snapshot (manual + scheduled, local + S3 driver)
  ├── Backup restore & download dari dashboard pelanggan
  ├── Scheduled Tasks engine (cron per instance, command/power/backup actions)
  ├── Subuser invitation & granular permission matrix
  └── Audit trail per subuser action

[Phase 7: API Key System & Audit Log]
  ├── Client API Key (per-user, scoped, granular permission)
  ├── Application API Key (admin-level, full access)
  ├── Auto-generated OpenAPI/Swagger docs di /api/docs
  ├── Audit Log engine (auth, instance, file, billing, admin events)
  └── Admin global activity feed + customer instance activity view

[Phase 8: Multi-Node Architecture & Server Transfer]
  ├── Node registry & daemon discovery (runtime-manager per node)
  ├── Allocation pool (IP:Port bindings per node)
  ├── Node heartbeat, health monitoring, & overcommit settings
  ├── Migrasi instance antar node (volume copy + re-deploy)
  ├── Nest & Egg template registry (import/export JSON)
  └── Server transfer antar user (dual confirmation + billing handoff)
```
