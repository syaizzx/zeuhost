# Model Keamanan & Isolasi ZeuHost (Threat Model)

Dokumen ini menjabarkan prinsip arsitektur keamanan, mitigasi ancaman, dan batas isolasi multi-tenant pada platform ZeuHost.

---

## 1. Tiga Lapisan Isolasi Fisik

1. **Lapisan Ingress Publik (Caddy & Next.js):**
   - Hanya port `80/tcp` dan `443/tcp` yang terbuka ke internet publik.
   - Aplikasi web Next.js berjalan di container independen dan **sama sekali tidak memiliki akses langsung** ke `/var/run/docker.sock` maupun port internal database.
2. **Lapisan Kontrol Terotentikasi (Runtime Manager Daemon):**
   - Daemon privilese terisolasi pada network internal `zeuhost-control`.
   - Seluruh panggilan REST diverifikasi menggunakan tanda tangan HMAC SHA-256 dan perlindungan replay timestamp ($\pm 300$ detik).
3. **Lapisan Sandbox Eksekusi Bot (Docker Unprivileged Containers):**
   - Setiap bot pelanggan berjalan di container terisolasi pada bridge network `zeuhost-bots`.
   - Kode bot tidak memiliki akses ke jaringan lokal host maupun database PostgreSQL internal.

---

## 2. Parameter Hardening Container Bot

Setiap container bot yang dijalankan oleh Runtime Manager menerapkan konfigurasi cgroups v2 dan kapabilitas Linux berikut:

| Parameter Hardening | Konfigurasi | Tujuan Keamanan |
|---|---|---|
| **User Identity** | `1001:1001` (`zeubot:zeubot`) | Mencegah eskalasi hak akses root pada sistem host |
| **Linux Capabilities** | `--cap-drop ALL` | Mencabut seluruh kapabilitas sistem kernel (raw sockets, sys_admin, dll.) |
| **Privilege Escalation** | `no-new-privileges:true` | Mencegah biner SUID menaikkan hak akses |
| **Memory Limit** | Sesuai kuota paket (default 256MB) | Mencegah konsumsi memori berlebih yang dapat memicu Linux OOM Killer |
| **Pids Limit** | `--pids-limit 100` | Mencegah serangan fork bomb dan penipisan alokasi process table |
| **Filesystem** | `--read-only` | Mencegah modifikasi biner aplikasi container oleh bot |
| **Storage /tmp** | `tmpfs 64m` (noexec, nosuid) | Menyediakan temporary storage tanpa izin eksekusi biner |

---

## 3. Enkripsi Token & Kredensial Pelanggan

1. Token bot Discord, Telegram, dan kredensial sesi WhatsApp dienkripsi menggunakan algoritma **AES-256-GCM** sebelum disimpan ke database PostgreSQL.
2. Kunci enkripsi (`INSTANCE_SECRET_KEY`) disimpan di environment server di luar database.
3. Database injection atau kebocoran dump SQL tidak akan membocorkan token bot aktif pelanggan.

---

## 4. Perlindungan Insecure Direct Object References (IDOR)

Setiap endpoint API pelanggan (`/api/instances/...`) memvalidasi kepemilikan instance dengan query ter-scope:

```typescript
where: {
  id: instanceId,
  customerId: session.user.id, // Menjamin batas isolasi data antar-pelanggan
}
```

Pelanggan A tidak dapat melihat, mengubah, menyalakan, mematikan, atau membaca log bot milik Pelanggan B.
