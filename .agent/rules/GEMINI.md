# Aturan Operasional & Panduan Rekayasa Agen (`GEMINI.md`)

Dokumen ini berisi aturan kerja wajib (*mandatory rules*) bagi agen AI saat berinteraksi, memodifikasi, dan mengembangkan repositori **Nusantara Disaster Simulator (`disastersim`)**. Branch `main` dari repositori ini telah terintegrasi secara langsung dengan Vercel Production (`https://disastersim-eta.vercel.app/`). Semua instruksi di bawah ini memiliki prioritas tertinggi dan wajib dipatuhi tanpa pengecualian.

---

## 1. Sinkronisasi Berkas Konfigurasi pada `vercel-ignore-build`
* **Prinsip**: Proyek ini menggunakan skrip custom `"vercel-ignore-build"` pada `package.json` untuk mencegah Vercel membuang waktu dan kuota build jika perubahan yang di-push hanyalah berkas dokumentasi atau berkas non-kode.
* **Kewajiban**: Setiap kali menambahkan berkas konfigurasi penting baru di *root* proyek (misalnya `*.config.*`, berkas skema `*.json`, berkas linter, berkas TypeScript, maupun direktori statis baru seperti `public/`), path berkas tersebut **WAJIB** ditambahkan ke dalam daftar pantau perintah `git diff` pada skrip `"vercel-ignore-build"` di `package.json`.
* **Daftar Berkas yang Wajib Dipantau Saat Ini**:
  ```bash
  ./src ./next.config.ts ./package.json ./tailwind.config.ts ./tsconfig.json ./postcss.config.mjs ./vercel.json
  ```
* **Konsekuensi Jika Dilanggar**: Vercel akan mengembalikan kode keluar `0` (tidak mendeteksi perubahan penting) sehingga proses build diabaikan (*missed/skipped build*), menyebabkan konfigurasi terbaru gagal diterapkan di production.

---

## 2. Disiplin Git Branching, Pull Request & Proteksi Branch `main`
* **Prinsip Proteksi Produksi**: Branch `main` adalah branch produksi aktif. Dilarang keras melakukan `git push origin main` secara langsung untuk setiap perubahan yang memengaruhi kode aplikasi, dependensi, maupun konfigurasi build.
* **Alur Perubahan Kode (Build-Affecting Code)**:
  1. Buat branch baru dari `main` dengan konvensi penamaan:
     * Fitur baru: `feat/<nama-fitur-singkat>`
     * Perbaikan bug: `fix/<nama-perbaikan>`
     * Konfigurasi / pemeliharaan: `chore/<nama-tugas>`
     * Refactoring: `refactor/<nama-tugas>`
  2. Lakukan perubahan kode dan pastikan seluruh pengujian lokal lolos (lihat Rule 3).
  3. Lakukan commit pada branch baru tersebut.
  4. Push branch baru ke remote GitHub: `git push -u origin <nama-branch>`.
  5. Buat Pull Request (PR) di GitHub. Hak review, persetujuan (*approval*), dan penggabungan (*merge*) sepenuhnya dipegang oleh pengguna (*repository owner*).
* **Pengecualian Berkas Dokumentasi & Teks Murni**:
  * Jika perubahan yang dilakukan **100% murni** hanya menyentuh berkas markdown (`.md`) atau berkas teks (`.txt`) tanpa ada satu pun berkas kode/konfigurasi yang berubah, agen diperbolehkan melakukan commit di branch `main`.
  * **Syarat Wajib**: Agen **WAJIB meminta konfirmasi eksplisit kepada pengguna** sebelum mengeksekusi perintah `git push origin main`. Jangan pernah melakukan push otomatis tanpa persetujuan.

---

## 3. Gerbang Pengujian Pre-PR & Pre-Commit (Quality Gate)
* **Verifikasi Wajib Sebelum Membuat Branch / PR**:
  Sebelum menganggap tugas selesai dan sebelum membuat branch atau PR, agen wajib mengeksekusi dua perintah verifikasi berikut secara lokal:
  1. `npm run test`
     * Memverifikasi validitas tipe TypeScript (`tsc --noEmit`).
     * Memverifikasi sanitasi keamanan DOM XSS & path traversal (`test:security`).
     * Memverifikasi integritas koordinat spasial 514 kota/kabupaten BPS (`test:integrity`).
     * Menjalankan audit 100 skenario simulasi ekstrem (`audit`).
     * Seluruh pengujian **wajib lulus 100% (0 error, 0 NaN)**.
  2. `npm run build`
     * Memastikan Next.js 15 berhasil membuat bundel produksi tanpa kegagalan linting maupun kompilasi halaman statis (`○ Static`).

---

## 4. Zero-Cost Serverless & Edge Compute Lock
* **Prinsip Arsitektur**: Nusantara Disaster Simulator dirancang berjalan murni **100% Client-Side In-Memory** pada Anycast Edge CDN Vercel.
* **Ketentuan**:
  * Dilarang menambahkan API routes dinamis (`src/app/api/...`), Server Actions, atau database serverless eksternal tanpa instruksi tertulis dari pengguna.
  * Halaman utama harus selalu berstatus `○ (Static) prerendered as static content`.
  * Hal ini menjamin biaya operasional hosting Vercel tetap **Rp 0** dan aplikasi kebal terhadap lonjakan beban trafik jutaan kunjungan.

---

## 5. Kebijakan Dependensi & Proteksi Keamanan (CVE Defense)
* **Zero Unrequested Dependencies**: Dilarang menambahkan package npm baru ke dalam `package.json` tanpa persetujuan eksplisit.
* **Vulnerability Guard**: Pertahankan versi Next.js (minimal `15.5.28` atau patch rilis resmi non-vulnerable) dan seluruh dependensi bebas dari laporan *security advisory* (CVE / GHSA).
* **Self-Hosted Assets**: Aset penting seperti CSS Leaflet harus selalu di-load dari instalasi lokal (`import 'leaflet/dist/leaflet.css'`), bukan melalui tautan CDN publik eksternal yang rentan terhadap downtime pihak ketiga.

---

## 6. Isolasi Rahasia & Credential Guard
* **Prinsip**: Jangan pernah melakukan *hardcode* token API, service key, atau credential sensitif ke dalam source code.
* **Penyimpanan**: Segala konfigurasi privat hanya boleh disimpan dalam berkas lokal `.env` atau `.env.local` yang sudah terdaftar dalam `.gitignore`.

---

## 7. Standar Pesan Commit & Semantic Git
* Gunakan konvensi *Semantic Commit Messages* yang jelas dan berbahasa Inggris teknis baku:
  * `feat: ...` (fitur baru bagi pengguna)
  * `fix: ...` (perbaikan bug atau kesalahan kalkulasi)
  * `chore: ...` (pemeliharaan dependensi, skrip, atau konfigurasi build)
  * `docs: ...` (pembaruan dokumentasi, panduan, atau berkas .md)
  * `perf: ...` (optimasi kinerja komputasi spasial atau rendering DOM)
  * `test: ...` (penambahan atau perbaikan rangkaian uji otomatis)
