# Dokumentasi Asal-Usul Data & Status Verifikasi (Data Provenance)
**Nusantara Disaster Simulator (DisasterSim)**  
**Versi:** 2.4  
**Tanggal:** 11 November 2026  

Dokumen ini mencatat inventarisasi sumber data, metode pengumpulan, tahun referensi, dan status verifikasi seluruh pangkalan data yang digunakan dalam prototipe kompetisi Nusantara Disaster Simulator.

---

## 1. Klasifikasi Status Verifikasi Data

Sesuai kebijakan kejujuran data pada aturan operasional `GEMINI.md`:
- **`verified`**: Data telah diperiksa dan dicocokkan secara manual terhadap dokumen primer atau publikasi resmi instansi pemerintah (PUPR / BNPB / BPBD / PVMBG) untuk kebutuhan demonstrasi prototipe. *Catatan: Status ini bukan jaminan operasional keselamatan darurat lapangan.*
- **`unverified`**: Data dikumpulkan atau ditelusuri dengan bantuan AI (Gemini) namun belum diperiksa secara individual terhadap sumber resmi primer. Data ini hanya digunakan untuk visualisasi umum dan **dilarang dijadikan tujuan utama rute evakuasi**.
- **`illustrative`**: Data buatan atau representatif yang ditujukan untuk pengujian antarmuka dan visualisasi konsep.
- **`disputed`**: Data yang memiliki perbedaan signifikan antar-sumber rujukan.

---

## 2. Inventarisasi Pangkalan Data Repository

### 2.1 Tempat Evakuasi Sementara (TES) Nasional Terverifikasi (`src/data/evacuationDestinations.ts`)
- **Status Verifikasi:** `verified`
- **Metode Pengumpulan:** Kurasi dokumen teknis resmi instansi kebencanaan (PUPR, BNPB, BPBD, dan PVMBG).
- **Jumlah Rekor:** 232 lokasi Tempat Evakuasi Sementara (TES) di seluruh kepulauan Indonesia.
- **Cakupan Wilayah:**
  - **8 Lokasi Area Pilot Utama**:
    1. **Shelter Glagah Kulon Progo (-7.9050, 110.0750)**: Kementerian PUPR Balai Besar Wilayah Sungai Serayu Opak (BBWSO) & BPBD DIY. Bangunan vertikal 3 lantai tahan gempa & tsunami.
    2. **Bukit Paralayang Watugupit Bantul (-8.0280, 110.3450)**: Dokumen Peta Rawan Bencana & Titik Evakuasi BPBD Kabupaten Bantul. Dataran tinggi elevasi 85 mdpl.
    3. **Shelter Evakuasi Vertikal Gaung Padang (-0.9500, 100.3500)**: BNPB & BPBD Kota Padang. Gedung evakuasi vertikal kapasitas 3.000 jiwa.
    4. **Dataran Tinggi Indarung Padang (-0.9450, 100.4450)**: Peta Jalur Evakuasi Zona Hijau Tsunami Kota Padang (BPBD Sumbar).
    5. **Barak Pengungsian Glagaharjo Cangkringan (-7.5850, 110.4550)**: Rencana Kontinjensi Erupsi Merapi BPBD Kabupaten Sleman. Berada di luar batas KRB III (>10 km).
    6. **Barak Pengungsian Purwobinangun Pakem (-7.6320, 110.4050)**: SOP Kesiapsiagaan Merapi BPBD Sleman & Pemda DIY.
    7. **Kawasan Evakuasi Mamboro Palu Utara (-0.8450, 119.8650)**: Master Plan Rekonstruksi Pasca Bencana Palu (Kementerian PUPR & BPBD Sulteng).
    8. **Kawasan Relokasi Duyu Palu Barat (-0.9050, 119.8350)**: Master Plan Rehabilitasi & Rekonstruksi Pascabencana Bappenas & Kementerian PUPR.
  - **224 Lokasi Nasional Tersebar**: Menjamin setiap kawah dari 69 gunung api aktif Tipe A/B memiliki minimal 3 titik evakuasi terdekat di luar lereng bahaya KRB, serta mencakup kawasan pesisir rawan tsunami di Sumatera, Jawa, Bali-Nusa Tenggara, Sulawesi, dan Maluku-Papua.
- **Rincian Atribut:** Setiap entri memuat koordinat presisi, elevasi (mdpl), kapasitas daya tampung (jiwa), jenis bencana relevan (`volcano`/`tsunami`), rujukan instansi pengelola, serta catatan audit keselamatan.

---

### 2.2 Direktori 514 Kota & Kabupaten (`src/data/indonesiaCities.ts`)
- **Status Verifikasi:** `unverified`
- **Metode Pengumpulan:** `AI-assisted discovery` (Gemini).
- **Jumlah Rekor:** 514 entitas (416 Kabupaten + 98 Kota di 38 Provinsi).
- **Cakupan Data:** Nama daerah, klasifikasi kabupaten/kota, provinsi, gugus kepulauan, koordinat lat/lng, estimasi populasi, dan flag pesisir.
- **Batasan:** Angka populasi merupakan estimasi agregat yang belum divalidasi baris demi baris terhadap rilis resmi Sensus Penduduk BPS terbaru. Koordinat merupakan representasi titik pusat pemerintahan/ibukota kabupaten.
- **Penggunaan di Aplikasi:** Direktori pencarian, kartu telemetri dampak umum, dan filter pulau. Tidak digunakan sebagai titik evakuasi akhir.

---

### 2.3 Katalog Gunung Berapi & Pegunungan (`src/data/volcanoes.ts`)
- **Status Verifikasi:** `unverified`
- **Metode Pengumpulan:** `AI-assisted discovery` (Gemini).
- **Jumlah Rekor:** 79 entitas (70 gunung api aktif Tipe A/B + 9 puncak pegunungan tektonik non-vulkanik).
- **Cakupan Data:** Nama gunung, koordinat kawah, elevasi, VEI tipikal, radius dasar KRB, dan analogi historis.
- **Batasan:** Radius KRB III/II/I dasar dan daftar lembah lahar merupakan pendekatan empiris yang disederhanakan, bukan peta Kawasan Rawan Bencana resmi dari PVMBG (Badan Geologi).

---

### 2.4 Katalog Sesar Tsunami & Hub Pesisir (`src/data/tsunamiFaults.ts`)
- **Status Verifikasi:** `unverified`
- **Metode Pengumpulan:** `AI-assisted discovery` (Gemini).
- **Jumlah Rekor:** 6 segmen sesar/megathrust prasetel + 46 coastal reference hubs.
- **Cakupan Data:** Magnitudo default (Mw), kedalaman hiposenter, sudut jurus (*strike angle*), panjang rekahan, dan garis pantai terdampak.
- **Batasan:** Parameter gempa dan perambatan gelombang laut dalam menggunakan formula analitik Papazachos & Green's Law yang disederhanakan. Koordinat shelter bawaan pada preset pracetak berstatus ilustratif, kecuali yang telah dimasukkan ke dalam `evacuationDestinations.ts`.

---

## 3. Ketentuan Penggunaan Data di Masa Depan

1. Jangan menambahkan atau mengklaim data sebagai "Data Resmi BMKG/BPS/PVMBG" sebelum dilakukan verifikasi tautan dokumen primer.
2. Setiap penambahan lokasi Tempat Evakuasi Sementara (TES) baru wajib menyertakan atribut `sourceName`, `sourceUrl`, dan `verifiedAt`.
3. Titik shelter dengan koordinat buatan (offset sintetis) dilarang dimasukkan ke dalam sistem.
