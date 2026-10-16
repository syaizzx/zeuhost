# ZeuHost Operator Manual

Panduan lengkap instalasi, konfigurasi, dan pengoperasian platform bot hosting ZeuHost pada Virtual Private Server (VPS) mandiri.

---

## 1. Persyaratan Sistem VPS

Sebelum menjalankan instalasi, pastikan VPS Anda memenuhi kriteria minimum berikut:

| Komponen | Spesifikasi Minimum | Rekomendasi Produksi |
|---|---|---|
| **Sistem Operasi** | Ubuntu 22.04 LTS / Debian 12 | Ubuntu 24.04 LTS |
| **Arsitektur CPU** | 1 vCPU (x86_64 atau ARM64) | 2 vCPU atau lebih |
| **Memori RAM** | 1 GB RAM (bebas swap) | 2 GB hingga 4 GB RAM |
| **Penyimpanan Disk** | 10 GB SSD / NVMe | 25 GB SSD |
| **Port Publik** | 80/tcp (HTTP) & 443/tcp (HTTPS) | 80/tcp, 443/tcp, 22/tcp (SSH) |

---

## 2. Instalasi Otomatis 1 Perintah (Direkomendasikan)

Pada server VPS yang masih bersih (fresh install), cukup jalankan satu baris perintah berikut sebagai root:

```bash
curl -sSL https://raw.githubusercontent.com/syaizzx/zeuhost/main/install.sh | sudo bash
```

### Apa yang Dilakukan oleh Skrip Installer Otomatis:
1. Mendeteksi sistem operasi dan memeriksa paket `curl`, `git`, `openssl`, `jq`.
2. Menginstall **Docker CE** dan **Docker Compose v2** resmi secara otomatis jika belum ada di VPS Anda.
3. Mengunduh source code ZeuHost ke direktori `/opt/zeuhost`.
4. Menanyakan domain Anda (atau otomatis menggunakan IP publik VPS jika belum ada domain).
5. Mengenerate seluruh kunci enkripsi acak (`AES-256-GCM`, `HMAC SHA-256`, `Better Auth Secret`).
6. Membuka port 80 dan 443 pada UFW Firewall.
7. Membangun dan menjalankan seluruh container (`web`, `runtime-manager`, `postgres`, `caddy`).
8. Menerapkan migrasi database PostgreSQL dan membuat akun **Owner Admin**.

---

## 3. Instalasi Manual dari Git Clone

Jika Anda ingin mengclone repositori secara manual:

```bash
git clone https://github.com/syaizzx/zeuhost.git /opt/zeuhost
cd /opt/zeuhost
sudo ./install.sh
```

---

## 4. Konfigurasi Domain & Sertifikat SSL Otomatis

ZeuHost menggunakan Caddy v2 sebagai reverse proxy otomatis:

1. Arahkan DNS Record domain Anda:
   - Tipe `A`: `@` mengarah ke IP publik IPv4 VPS Anda.
   - Tipe `A`: `*` (wildcard) mengarah ke IP publik IPv4 VPS Anda (opsional).
2. Edit file `deploy/.env`:
   ```env
   HOST_DOMAIN=bot.domainanda.com
   PUBLIC_URL=https://bot.domainanda.com
   ACME_EMAIL=admin@domainanda.com
   ```
3. Restart Caddy:
   ```bash
   cd /opt/zeuhost && make docker-up
   ```
Caddy akan secara otomatis menerbitkan sertifikat TLS resmi dari Let's Encrypt atau ZeroSSL tanpa konfigurasi tambahan.

---

## 5. Pengaturan White-Label Merek

Masuk ke panel admin di `/admin`:
- **Nama Layanan:** Ubah `ZeuHost` menjadi nama brand Anda sendiri.
- **Warna Aksen:** Masukkan kode hex brand Anda (misal `#10B981` atau `#2563EB`).
- **Teks Landing Page:** Sesuaikan headline dan pesan promosi untuk pelanggan Anda.
Perubahan ini tersimpan langsung di database dan diinjeksi secara instan ke seluruh antarmuka web.

---

## 6. Prosedur Backup & Restore Database

### Menjalankan Backup Otomatis
```bash
cd /opt/zeuhost && ./scripts/backup.sh
```
File snapshot database terkompresi disimpan di `/var/backups/zeuhost/zeuhost_db_YYYYMMDD_HHMMSS.sql.gz`. Backup otomatis menghapus arsip yang lebih tua dari 14 hari.

### Restore Database dari Snapshot
```bash
gunzip -c /var/backups/zeuhost/zeuhost_db_YYYYMMDD_HHMMSS.sql.gz | docker exec -i zeuhost-postgres psql -U zeuhost -d zeuhost
```

---

## 7. Cara Memperbarui Platform (Update Zero-Downtime)

Saat ada pembaruan fitur atau perbaikan sistem, **JANGAN menjalankan `install.sh` kembali**. Cukup jalankan perintah pembaruan otomatis berikut:

```bash
cd /opt/zeuhost && ./update.sh
# atau
make update
```

### Apa yang Dilakukan oleh Skrip Updater Otomatis:
1. Mengambil kode terbaru via `git pull`.
2. Membuat backup snapshot database otomatis sebelum pembaruan diterapkan.
3. Mendeteksi variabel konfigurasi baru di `.env.example` dan menyinkronkannya ke `.env` Anda tanpa mengubah password atau domain yang sudah ada.
4. Menerapkan migrasi database Prisma (`prisma migrate deploy` atau `db push`) dan seeding template bot baru (misal: Baileys v6).
5. Membangun ulang container `web` dan `runtime-manager` secara aman dengan zero-downtime tanpa me-restart database PostgreSQL atau memutus bot pelanggan.
6. Membersihkan cache build Docker lama untuk menghemat kapasitas harddisk VPS.
