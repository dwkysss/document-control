# Catatan Rencana Pengembangan: Fungsionalitas Hierarki Mutu Dokumen (Level ISO)

**Status:** Backlog / Menunggu Hasil Diskusi Internal  
**Tanggal Dicatat:** 24 September 2026  
**Referensi Terkait:** ISO 9001:2015 Clause 7.5 (Documented Information)

---

## 1. Konteks Saat Ini
Di aplikasi Document Control PT DJI saat ini:
- Atribut `level` (Level 1 s/d Level 4, serta Dokumen Eksternal) sudah tersimpan di Master Data Jenis Dokumen (`documentTypes`).
- Ditampilkan sebagai badge visual di:
  - Master Jenis Dokumen (`#master-type` / `DocumentTypeMasterView.jsx`)
  - Laporan Distribusi Jenis Dokumen (`#report-type` / `DocumentTypeReportView.jsx`)
  - Analitik Dashboard (`DashboardAnalytics.jsx`)
- **Status fungsi saat ini:** Masih murni berupa **Metadata Klasifikasi & Pelaporan**, belum mengontrol logika alur kerja (*workflow*) secara dinamis.

---

## 2. Usulan Pengembangan Lanjutan (*Proposed Enhancements*)

### A. Alur Persetujuan Bertingkat (*Dynamic / Conditional Approval Workflow*)
Menyesuaikan siapa yang wajib menandatangani/mengesahkan dokumen berdasarkan tingkat risikonya:
- **Level 1 (Kebijakan / Policy):**
  - Alur: Pemohon ➔ Atasan Dept ➔ Document Control ➔ **Direktur Utama / General Manager**
- **Level 2 (SOP / Standar Operasional Prosedur):**
  - Alur: Pemohon ➔ Atasan Dept ➔ Document Control ➔ **Management Representative (MR)**
- **Level 3 (Instruksi Kerja / Work Instruction / WI):**
  - Alur: Pemohon ➔ Atasan Dept ➔ **Document Control** (Pengesahan teknis cukup sampai Kepala Departemen)
- **Level 4 (Formulir & Rekaman Mutu / FORM):**
  - Alur cepat: Pemohon ➔ Atasan Dept ➔ **Document Control** (tanpa membebani GM/MR dengan form isian operasional)
- **Dokumen Eksternal (EXT):**
  - Alur: Registrasi langsung oleh Document Control Officer (DCO) dengan verifikasi relevansi oleh MR/Departemen terkait.

---

### B. Widget Piramida Mutu Interaktif di Dashboard Utama
- Menampilkan grafik piramida ISO 9001 segitiga di halaman Dashboard:
  - Puncak: Jumlah Dokumen Level 1
  - Tengah Atas: Jumlah Dokumen Level 2
  - Tengah Bawah: Jumlah Dokumen Level 3
  - Dasar: Jumlah Dokumen Level 4
- Dilengkapi indikator kepatuhan piramida mutu (*rasio kesehatan dokumentasi perusahaan*).

---

### C. Siklus Tinjau Ulang Berkala (*Periodic Review Automation*)
- Menyesuaikan batas waktu *review* dokumen otomatis berdasarkan levelnya:
  - **Level 1 & Level 2:** Wajib ditinjau ulang setiap **12 bulan** (tahunan).
  - **Level 3 & Level 4:** Dapat ditinjau setiap **24 bulan** atau saat terjadi perubahan mesin/proses.
- Notifikasi / alert otomatis di dashboard jika dokumen mendekati masa kadaluarsa tinjauan.

---

## 3. Catatan Tindak Lanjut
- [ ] Diskusi dengan tim Quality Management / MR mengenai pembagian wewenang pengesahan (apakah L3 dan L4 boleh selesai di level DCO & Atasan Dept).
- [ ] Penentuan apakah masa retensi dokumen ingin dibedakan per level dokumen.
