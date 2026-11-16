# Pemetaan Struktur & Audit Produksi VPS
**Server Hostname:** `srv2073301`  
**Waktu Audit:** 16 November 2026  
**Status Target:** Siap Deploy (Zero Downtime & Zero Collision Verified)

---

## 1. Spesifikasi Hardware & Sistem Operasi
* **Alamat IP Publik VPS:** `156.67.218.9`
* **Sistem Operasi:** Ubuntu 24.04.5 LTS (Noble Numbat)
* **Kapasitas RAM:** 15 GiB Total
  * Digunakan (*Used*): 3.1 GiB (Aman, stabil)
  * Bebas (*Available*): **12 GiB**
* **Penyimpanan Disk (/dev/sda1):** 193 GiB Total
  * Terpakai (*Used*): 23 GiB (12%)
  * Sisa Ruang (*Available*): **171 GiB (88%)**
* **Status Resource:** **Sangat Prima & Memenuhi Syarat Produksi**.

---

## 2. Akun Pengguna & Isolasi User
* **User Non-Root yang Ditemukan:**
  * `web-deploy` (Eksternal / E-commerce Raja Brukat)
  * `erp-admin`
  * `internal-deploy` &rarr; **User Khusus Proyek Internal Document Control (ISO 9001)**.
* **Prinsip Keamanan:** Aplikasi Document Control akan dijalankan dan dimiliki oleh user `internal-deploy` dengan izin akses grup `docker` & `www-data` (Nginx), bukan `root`.

---

## 3. Container Docker & Port yang Sedang Digunakan (Audit Tabrakan)
Pada server telah aktif beberapa proyek:
* **Proyek Raja Brukat:**
  * `rajabrukat-frontend`: terikat pada `127.0.0.1:3001`
  * `rajabrukat-backend`: terikat pada `127.0.0.1:5001`
  * `rajabrukat-postgres`: internal 5432
* **Proyek Lain / Supabase Stack:**
  * Port `127.0.0.1:3003` & `127.0.0.1:5003` aktif.
  * Port `8000`, `5432`, `6543`, `8080`, `3000` aktif untuk Supabase pooler/envoy/studio.
* **Port Terikat di Host:**
  * `3000`, `3001`, `3003` (Terpakai)
  * `5001`, `5003` (Terpakai)
  * `5432` host (Terpakai oleh Supabase pooler)

---

## 4. Alokasi Port Aman Document Control (Zero Collision)
Berdasarkan audit di atas, rancangan port proyek ini **100% AMAN & TIDAK BERTABRAKAN**:

| Service | Port Host Alokasi | Status Keamanan |
| :--- | :--- | :--- |
| **Frontend Document Control** | `127.0.0.1:3005` | **KOSONG & AMAN** (tidak bentrok dengan 3001/3003) |
| **Backend API Document Control** | `127.0.0.1:5005` | **KOSONG & AMAN** (tidak bentrok dengan 5001/5003) |
| **Database PostgreSQL 16** | *Internal virtual bridge (`doccontrol-net`)* | **100% TERISOLASI** (tidak binding ke host 5432) |
| **Web Server Reverse Proxy** | Port `80` (HTTP) & `443` (HTTPS) | Nginx Host mengarahkan domain Document Control |

---

## 5. Konfigurasi Nginx Sites yang Ditemukan
* `grosir.rajabrukat.com.conf` (Raja Brukat Grosir)
* `rajabrukat-bdg.conf` (Raja Brukat Bandung)
* `dji` &rarr; Mengarah ke domain `djiprod.tech` dan `api.djiprod.tech` (Port 3000 & 8000).
* **Kesimpulan:** Konfigurasi `dji` tidak berhubungan dengan domain baru `dentellejayainfinitex.io`. Sistem baru akan berdiri sendiri di file baru: `/etc/nginx/sites-available/dc.dentellejayainfinitex.io.conf`.

---

## 6. Target Deployment Document Control
* **Domain / Subdomain Resmi:** `dc.dentellejayainfinitex.io`
* **Registrar / DNS:** Hostinger (`athena.dns-parking.com`, `apollo.dns-parking.com`)
* **Subdomain DNS A-Record:** `dc` &rarr; `<IP_VPS>`
* **Direktori Proyek di VPS:** `/var/www/document-control`
* **Pemilik Direktori (Owner):** `internal-deploy:internal-deploy`
* **Port Frontend:** `127.0.0.1:3005`
* **Port Backend:** `127.0.0.1:5005`
* **Port PostgreSQL:** Internal Virtual Network `doccontrol-net` (Zero exposure to public)
