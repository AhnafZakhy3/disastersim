# Nusantara Disaster Simulator (Disastersim)

Platform web simulasi dampak bahaya bencana geologis Indonesia (**Letusan Gunung Berapi** & **Tsunami Megathrust**) berbasis pemodelan empiris interaktif, komputasi *100% client-side in-memory* berkecepatan tinggi, perutean evakuasi otomatis dinamis ke Tempat Evakuasi Sementara (TES) terverifikasi di seluruh Nusantara, pemodelan *Atmospheric Wind Shear*, serta antarmuka taktis berstandar ruang kendali darurat (*Emergency Command Center*).

> **PENTING — BATASAN DAN STATUS PROTOTIPE KOMPETISI:**  
> Nusantara Disaster Simulator adalah **prototipe kompetisi edukatif dan demonstrator inovasi mitigasi kebencanaan**, bukan sistem operasional resmi atau instrumen peringatan dini darurat BMKG / PVMBG / BNPB.  
> Seluruh hasil kalkulasi tinggi gelombang, waktu tiba (ETA), radius bahaya KRB, sebaran abu vulkanik, alokasi kapasitas TES, dan rute evakuasi merupakan **estimasi hasil simulasi matematis/empiris** dengan keterbatasan pemodelan tertentu. Aplikasi ini beroperasi 100% di sisi peramban (*client-side in-memory*), **tanpa koneksi feed real-time BMKG**, dan **tanpa database backend**. Rute evakuasi didasarkan pada jaringan jalan pejalan kaki publik dan pemodelan hambatan heuristik; rute ini belum memvalidasi kondisi lapangan seketika seperti jembatan putus, pohon tumbang, longsor mendadak, atau instruksi aparat di lokasi. Selalu ikuti arahan resmi otoritas yang berwenang saat kondisi darurat.

---

## Tech Stack & Layanan Terintegrasi

- **Framework & Runtime**: [Next.js 15](https://nextjs.org/) (App Router, Client-Side Hydration) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Pemetaan Geospasial**: [Leaflet.js](https://leafletjs.com/) (Self-hosted CSS lokal) + Ubin Peta Esri Dark Canvas, Esri World Imagery (Satelit), dan OpenStreetMap
- **Optimasi Kluster Spasial Mobile**: [Supercluster](https://github.com/mapbox/supercluster) (Mapbox k-d tree in-memory clustering untuk 514 kota di perangkat seluler)
- **Mesin Perutean Evakuasi**: [OSRM (Open Source Routing Machine)](https://project-osrm.org/) API via peramban langsung (Profil Pejalan Kaki / *Foot Profile*) + Mirror Fallback + Pre-computed In-Memory Cache
- **Analisis Geometri Spasial**: Formula Haversine, trigonometri bola bumi, poligon keterpaparan darat, ray-casting point-in-polygon, dan Turf.js (`@turf/difference`)
- **Styling & Desain Sistem**: [Tailwind CSS](https://tailwindcss.com/) (Tema gelap taktis *Command Center*, palet kontras tinggi), [Lucide React](https://lucide.dev/), dan simbol kartografi vektor SVG kustom
- **Generator Dokumen Taktis**: `html-to-image` & `jspdf` untuk ekspor *Disaster Impact Brief* (PDF & PNG)
- **Deployment**: Static Single Page Application pada Vercel Edge Network (Biaya operasional Rp 0, tanpa backend serverless dinamis)

---

## Evaluasi Library Pihak Ketiga: `supercluster`

Sesuai persetujuan pengguna untuk optimasi perangkat seluler dan berspesifikasi rendah, library `supercluster` ditambahkan ke dalam arsitektur:
- **Keunggulan**:
  1. *Ukuran Sangat Ringan*: Hanya berukuran ~6 kB (gzipped) tanpa dependensi eksternal berat.
  2. *Komputasi Instan*: Menggunakan struktur data spasial *2D k-d tree* dengan waktu pengindeksan <3 milidetik untuk 514 kota.
  3. *Drastis Mengurangi Beban DOM*: Mengelompokkan 514 titik koordinat menjadi hanya 15–30 elemen kluster terlihat pada viewport mobile, mencegah *frame drop* dan *browser crash* pada ponsel berspesifikasi rendah.
  4. *Headless & Modular*: Bekerja langsung di atas objek data murni tanpa memaksakan manipulasi DOM internal Leaflet.
- **Kelemahan & Mitigasi**:
  1. *Perhitungan Zoom Kaku*: Memerlukan sinkronisasi manual bounding box `[west, south, east, north]` terhadap event Leaflet `moveend` dan `zoomend`.
  2. *Kluster Leaf Tunggal*: Saat pengguna melakukan *zoom in* mendalam, marker individu baru dipecah, sehingga dibutuhkan toleransi radius kueri agar kota terdekat tidak hilang dari pandangan.

---

## Cara Menjalankan Project

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.18 atau lebih baru (disarankan Node.js LTS 20+)
- Package manager: `npm`, `pnpm`, atau `yarn`

### Langkah-langkah
1. **Clone atau buka direktori proyek**:
   ```bash
   cd disastersim
   ```

2. **Instal seluruh dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan (Development)**:
   ```bash
   npm run dev
   ```

4. **Jalankan rangkaian pengujian otomatis (Quality Gate)**:
   ```bash
   npm run test
   ```
   Rangkaian uji mencakup verifikasi tipe TypeScript (`tsc --noEmit`), uji pertahanan keamanan sanitasi XSS/path traversal (`test:security`), uji integritas data spasial 514 kota (`test:integrity`), uji modul perutean evakuasi OSRM, 232 TES, wind shear, dan hazard check (`test:routing`), serta audit 100 skenario simulasi ekstrem (`audit`).

5. **Kompilasi produksi (Build)**:
   ```bash
   npm run build
   npm run start
   ```

6. **Buka aplikasi di peramban (Browser)**:
   Buka alamat [http://localhost:3000](http://localhost:3000) pada browser.

---

## 9 Peningkatan Fitur Utama (Revisi Lanjutan)

### 1. Deteksi Paparan Bahaya Tempat Evakuasi Sementara (Shelter Hazard Exposure Check)
- **Masalah Terselesaikan**: Sebelumnya, TES di luar radius KRB I tetap dianggap hijau/aman meskipun berada tepat di jalur aliran hujan abu lebat atau awan panas.
- **Solusi**: Diterapkan evaluasi poligonal spasial `checkShelterHazardExposure()` yang menguji koordinat setiap TES terhadap poligon sebaran abu bertingkat (*Isopach Tiers*) dan radius KRB.
- **Hasil**: TES yang terpapar abu atau KRB otomatis ditandai merah/oranye dengan peringatan tegas di peta dan kartu rekomendasi dilarang merekomendasikan TES yang terancam.

### 2. Penilaian Bahaya Rute Berjenjang (*Multi-Tier Hazard Evaluation*)
- **Masalah Terselesaikan**: Peringatan rute sebelumnya hanya muncul saat memotong KRB III, sementara KRB II, KRB I, atau hujan abu dianggap bebas bahaya.
- **Solusi**: Sistem mengevaluasi 5 tingkat keparahan bahaya berjenjang:
  - 🚨 `critical`: Memotong zona bahaya mutlak KRB III atau zona rendaman inundasi tsunami.
  - ⚠️ `high`: Memotong zona KRB II atau zona hujan abu vulkanik lebat (>5 cm).
  - ⚡ `medium`: Memotong zona KRB I atau zona hujan abu sedang (1–5 cm).
  - ℹ️ `low`: Memotong sebaran abu tipis (<1 cm).
  - 🟢 `none`: Rute sepenuhnya berada di luar zona bahaya model.

### 3. Perluasan Titik TES ke Seluruh Indonesia (232 Titik Terverifikasi)
- **Cakupan Nasional**: Pangkalan data `evacuationDestinations.ts` diperluas dari 8 titik menjadi **232 titik TES terverifikasi**, menjamin setiap 69 gunung api aktif memiliki minimal 3 opsi titik evakuasi di lereng sekitarnya, serta mencakup kawasan pesisir rawan tsunami di berbagai kepulauan Indonesia.
- **Transparansi Provenance**: Setiap record memuat rujukan instansi pengelola (PUPR, BNPB, BPBD, PVMBG), daya tampung (kapasitas jiwa), elevasi, dan koordinat audit.

### 4. Optimasi Kinerja Perangkat Seluler (Supercluster k-d Tree)
- Lapisan 514 kota di seluruh kepulauan Indonesia kini diolah menggunakan `Supercluster`.
- Saat tampilan peta diperkecil (*zoom out*), marker kota otomatis dikelompokkan menjadi lencana kluster numerik dinamis yang diberi warna sesuai status bahaya tertinggi wilayah di dalamnya.
- Saat pengguna memperbesar peta (*zoom in*), kluster terurai menjadi marker kota taktis berukuran presisi. DOM footprint berkurang hingga 95% pada layar ponsel pintar.

### 5. Dinamika Hambatan Jalan (*Road Impedance*) & Penghindaran Bahaya Otomatis (*Hazard Avoidance Detour*)
- **Faktor Hambatan Jalan**: Durasi tempuh jalan kaki otomatis dikalikan faktor impedansi lapangan ($1.5\times\text{–}1.75\times$) saat skenario bencana aktif untuk merefleksikan kepanikan massa, perlambatan arus pengungsi, dan potensi puing-puing di jalan.
- **Detour Bypass Otomatis**: Jika rute utama memotong zona bahaya model, routing engine secara cerdas mengevaluasi rute alternatif OSRM atau menghitung *via-point* memutar ke arah luar busur bahaya untuk memandu pengungsi ke jalur yang lebih aman.

### 6. Alokasi Kapasitas TES & Rute Limpasan (*Spillover to TES 2*)
- Sistem membandingkan estimasi populasi terdampak terhadap daya tampung kapasitas gedung TES utama.
- Menampilkan persentase okupansi secara visual (*progress bar*).
- **Limpasan Kuota**: Jika populasi melebihi 100% daya tampung TES 1, sistem secara otomatis mengaktifkan rute cabang sekunder (garis putus-putus merah) untuk mengalihkan kelebihan pengungsi menuju TES cadangan terdekat (TES 2).

### 7. Pemilihan Titik Asal Fleksibel (*Custom Waypoint Origin*) & Ergonomi Mobile Sheet
- Selain titik asal preset pemukiman, pengguna kini dapat menekan tombol **"Pilih Titik di Peta"**.
- Pengguna dapat mengklik sembarang titik di atas peta untuk menaruh pin titik awal evakuasi personal warga (misal: di depan rumah atau gang pemukiman).
- Pin titik awal dapat digeser secara bebas (*draggable*) dengan pembaruan rute seketika.
- **Ergonomi Mobile Sheet**: Pada perangkat ponsel, menekan tombol "Pilih Titik di Peta" otomatis mengecilkan *Bottom Sheet* ke mode `peek`, membuka pandangan peta seketika agar pengguna leluasa mengetuk lokasi di peta.

### 8. Profil Angin Atmosfer Multi-Lapisan (*Atmospheric Wind Shear*)
- Kolom letusan gunung api tinggi kini dapat dimodelkan menembus lapisan stratosfer.
- Menyediakan kontrol slider independen untuk:
  - **Lapisan Troposfer Permukaan (0–3 km)**: Membawa partikel abu berat dan pasir vulkanik.
  - **Lapisan Stratosfer (>3 km)**: Membawa aerosol abu halus ke arah yang berlawanan atau berbeda sudut akibat *wind shear / jet stream*.
- Peta merender dua poligon sebaran abu multi-vektor secara simultan.

### 9. Ketahanan Offline Multi-Tier (*Offline Resilience & Cache*)
- Panggilan rute tidak lagi rapuh terhadap kegagalan jaringan atau pembatasan kuota (*rate limit*) server demo publik OSRM.
- **Hierarki Fail-Safe**:
  1. *OSRM Server Primer* (`router.project-osrm.org`)
  2. *OSRM Server Sekunder* (`routing.openstreetmap.de`)
  3. *Pre-Computed Fixture Cache*: Rute jalan kaki GeoJSON lokal in-memory untuk skenario pilot utama.
  4. *In-Browser Corridor Synthesizer*: Sintesis koridor jalur evakuasi kurva halus di sisi browser jika perangkat kehilangan sinyal internet total.

### 10. Ekspor Data Spasial Standar GIS (.geojson untuk QGIS / ArcGIS)
- Menyediakan tombol instan **"Ekspor GeoJSON"** pada panel hasil rute evakuasi.
- Menghasilkan berkas GeoJSON FeatureCollection berstandar RFC 7946 yang mencakup:
  - Garis rute utama pejalan kaki beserta jarak, durasi jalan, dan status bahaya model.
  - Jalur limpasan kapasitas sekunder (jika terjadi pengalihan ke TES 2).
  - Titik asal dan titik Tempat Evakuasi Sementara (TES) terverifikasi beserta daya tampung.
  - Seluruh poligon zona bahaya aktif (KRB III/II/I, sebaran abu, atau gelombang tsunami).
- Berkas dapat langsung di-*drag-and-drop* ke software GIS profesional seperti QGIS, ArcGIS, Google Earth, atau platform InaRISK BNPB.

---

## Atribusi & Lisensi Data Pihak Ketiga

- **Data Kartografi & Ubin Peta**:
  - [OpenStreetMap](https://www.openstreetmap.org/copyright): © OpenStreetMap contributors (ODbL / CC-BY-SA).
  - [Esri](https://www.esri.com/): Esri Dark Gray Canvas, World Imagery, DeLorme, NAVTEQ.
- **Mesin Rute**:
  - [Project OSRM](https://project-osrm.org/): Data jaringan jalan pejalan kaki didukung oleh OpenStreetMap.
- **Rujukan Kebijakan & Teknis Bencana**:
  - Badan Nasional Penanggulangan Bencana (BNPB)
  - Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)
  - Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG - Badan Geologi)
  - Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR)
