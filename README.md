# Nusantara Disaster Simulator (Disastersim)

Platform web simulasi dampak bahaya bencana geologis Indonesia (**Letusan Gunung Berapi** & **Tsunami Megathrust**) berbasis pemodelan empiris interaktif, komputasi *100% client-side in-memory* berkecepatan tinggi, serta antarmuka taktis berstandar ruang kendali darurat (*Emergency Command Center*).

Aplikasi ini mengadopsi standar ilmiah dari **PVMBG** (Pusat Vulkanologi dan Mitigasi Bencana Geologi), sistem peringatan dini **BMKG InaTEWS**, serta rujukan kartografi geospasial **USGS**.

---

## Tech Stack

- **Framework & Runtime**: [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Pemetaan Geospasial**: [Leaflet.js](https://leafletjs.com/) + Ubin Peta Esri Dark Canvas, Esri World Imagery (Satelit), dan OpenStreetMap
- **Styling & Desain Sistem**: [Tailwind CSS](https://tailwindcss.com/) (Tema gelap taktis *Command Center*, palet kontras tinggi), [Lucide React](https://lucide.dev/), dan simbol kartografi vektor SVG kustom
- **Generator Dokumen Taktis**: `html-to-image` & `jspdf` untuk ekspor *Disaster Impact Brief* (PDF & PNG)
- **Engine Komputasi Spasial**: Formula matematis empiris *pure client-side* (tanpa dependensi database eksternal maupun API GIS berbayar)

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

   *(Opsional) Menguji hasil kompilasi produksi secara lokal:*
   ```bash
   npm run build
   npm run start
   ```

4. **Buka aplikasi di peramban (Browser)**:
   Buka alamat [http://localhost:3000](http://localhost:3000) pada browser.


## Progres Saat Ini

Proyek saat ini berada dalam tahap pengujian mendalam (*testing & debugging*), yang mencakup validasi akurasi formula simulasi (letusan gunung berapi dan dinamika gelombang tsunami), penyempurnaan interaktivitas visual peta, serta pengujian performa komputasi spasial di sisi klien (*client-side*) agar tetap stabil saat menjalankan berbagai skenario bencana.

### Fitur Utama:

1. **Rombak Total Perambatan Gelombang Tsunami (*Dynamic Wave Train*)**:
   - Muka gelombang kini merambat secara dinamis sebagai rentetan gelombang nyata (*wave train*) multi-lapisan:
     - **Puncak Gelombang Primer** (`#38BDF8`): Gelombang depan berkekuatan penuh.
     - **Puncak Gelombang Sekunder** (`#0EA5E9`): Gelombang pantulan susulan di belakangnya.
     - **Riak Tersier** (`#0284C7`): Dispersi energi di air dangkal.
     - **Palung Hisap Garis Putus-putus** (`#0369A1`): Fenomena surutnya air laut sesaat sebelum gelombang menerjang bibir pantai.
   - Dilengkapi pemotongan Boolean geometris Turf.js (`@turf/difference`) terhadap batas daratan kepulauan Indonesia sehingga gelombang laut berhenti di pantai dan tidak menembus ke sisi seberang daratan.

2. **Deteksi Benturan Pesisir & Pertumbuhan Inundasi (*Shoreline Impact Beacons*)**:
   - Saat muka gelombang menyentuh garis pantai pada waktu kedatangan ($T \ge \text{ETA}$), sistem menyalakan suar benturan (*impact beacons*) berdenyut merah-oranye di sepanjang bibir pantai yang tertabrak.
   - Poligon koridor rendaman daratan tumbuh melebar secara bertahap seiring berjalannya waktu pasca-benturan, menggambarkan intrusi air laut ke wilayah pemukiman pesisir.

3. **Visualisasi Interaktif Seluruh 514 Kota & Kabupaten Se-Indonesia**:
   - Pangkalan data `indonesiaCities.ts` kini mencakup seluruh **514 Kota dan Kabupaten di 38 Provinsi** (416 Kabupaten + 98 Kota) sesuai sensus BPS & Kemendagri terbaru.
   - Seluruh 514 kota ditampilkan langsung di atas peta interaktif dengan marker lingkaran berkode warna status ancaman:
     - 🟢 **Aman**: Di luar jangkauan bahaya letusan maupun tsunami.
     - 🟡 **Waspada**: Peringatan awal BMKG / hujan abu vulkanik ringan.
     - 🟠 **Siaga**: Gelombang 0.5 - 3m / KRB II / abu vulkanik sedang.
     - 🔴 **Bahaya / Terdampak**: Gelombang >3m / KRB III / luncuran awan panas.
   - Dilengkapi lapisan toggle layer checkbox *"Kota & Kabupaten (514 Wilayah)"* pada kontrol peta.

4. **Direktori 514 Kota di Panel Samping & Navigasi *Fly-To***:
   - Panel kanan menyediakan direktori lengkap 514 wilayah dengan:
     - Tab filter status (*Terancam, Semua, Aman*).
     - Filter cepat 7 gugus pulau (*Jawa, Sumatera, Bali-NT, Kalimantan, Sulawesi, Maluku, Papua*).
     - Kotak pencarian instan responsif (misal: mencari "Banda Aceh" atau "Sleman").
     - Tombol *"Fokuskan Peta"* yang mengarahkan kamera Leaflet (*fly-to*) secara mulus ke koordinat kota terpilih lengkap dengan popup telemetri demografi.

5. **Clean Slate Standby Mode (Kondisi Awal Bersih)**:
   - Pengguna disambut dengan pemandangan tenang seluruh kepulauan nusantara (Sabang sampai Merauke pada level Zoom 5) tanpa simulasi bencana berjalan paksa.
   - Panel pengarah (*Standby Briefing*) memberikan instruksi cepat dan pengenalan legenda simbol kartografi resmi.

6. **Smart Spatial Detection (Deteksi Spasial Cerdas)**:
   - **Klik perairan / samudera**: Sistem otomatis menginisialisasi skenario *Tsunami Megathrust* di koordinat tersebut.
   - **Klik daratan**: Sistem otomatis menginisialisasi skenario *Kawah Vulkanik Kustom*.
   - **Klik langsung pada pin**: Langsung memfokuskan kamera dan memuat data detail gunung atau zona sesar yang dipilih.

7. **Katalog Geologis Nasional Diperluas (78 Titik Gunung & Pegunungan)**:
   - **69 Gunung Berapi Aktif** tipe A/B mencakup seluruh busur vulkanik Indonesia:
     - **Jawa (24 Puncak)**: Merapi, Semeru, Bromo, Kelud, Raung, Ijen, Slamet, Lawu, Sindoro, Sumbing, Ciremai, Papandayan, Gede-Pangrango, Salak, Krakatau, dll.
     - **Sumatera (13 Puncak)**: Kaldera Toba (Supervulkan), Marapi, Kerinci, Sinabung, Dempo, Talang, Tandikat, Kaba, Sorik Marapi, Seulawah Agam, Bur ni Telong, Peuet Sague, Sibayak.
     - **Bali & Nusa Tenggara (14 Puncak)**: Agung, Batur, Rinjani, Tambora, Sangeang Api, Lewotobi Laki-laki & Perempuan, Egon, Rokatenda, Iya, Kelimutu, Sirung, Inielika.
     - **Sulawesi & Sangihe (9 Puncak)**: Lokon, Soputan, Karangetang, Awu, Ruang, Mahawu, Tangkoko, Ambang, Colo.
     - **Maluku & Halmahera (10 Puncak)**: Gamalama, Dukono, Ibu, Gamkonora, Kie Besi, Banda Api, Teon, Nila, Serua, Wurlali.
   - **9 Puncak Tektonik Non-Vulkanik**: Puncak Jaya (Carstensz), Puncak Mandala, Puncak Trikora, Latimojong, Bukit Raya, Binaiya, Mutis, Pesagi, Saran.
   - **Filter Kepulauan & Pencarian Cepat**: Filter navigasi instan (*Semua, Jawa, Sumatera, Bali-NT, Sulawesi, Maluku-Papua, Non-Vulkanik*) dan input pencarian teks reaktif.

8. **Simulasi Tsunami Tektonik Otentik (NOAA MOST & BMKG InaTEWS Standard)**:
   - **Muka Gelombang Elips Tektonik**: Mengikuti sudut jurus patahan (*Fault Strike Angle*) secara fisik, bukan lingkaran artifisial, lengkap dengan puncak gelombang (*leading crest*) dan palung hisap (*depression trough*).
   - **Garis Pantai Otentik & Inundasi**: Garis pantai riil berubah warna dinamis menjadi merah menyala saat waktu simulasi mencapai ETA gelombang ($T \ge \text{ETA}$), disertai koridor buffer rendaman darat.
   - **Pangkalan Data 40+ Hub Pesisir Riil**: Saat pengguna mengklik sembarang koordinat laut lepas, sistem memetakan kabupaten pesisir riil terdekat dan tempat evakuasi sementara (TES) dari pangkalan data kurasi nasional.
   - **Hitung Mundur Kedatangan Waktu-Nyata**: Tabel distrik menampilkan countdown sisa waktu, estimasi tinggi gelombang pantai (*Green's Law*), dan status dinamis `MENUNGGU` $\to$ `EVAKUASI` $\to$ `TERDAMPAK`.

9. **Simulasi Erupsi Gunung Berapi Terintegrasi**:
   - Pengaturan indeks daya ledak letusan (VEI 1 hingga 8 termasuk Supervulkan).
   - Penyesuaian arah dan kecepatan angin troposfer untuk pemodelan dispersi abu vulkanik.
   - Estimasi ketinggian kolom erupsi (formula Wilson & Mastin).
   - Pemodelan sebaran abu bertingkat (*multi-tier isopach plume*): Tebal (>5 cm), Sedang (1–5 cm), Tipis (<1 cm).
   - Zona Kawasan Rawan Bencana (KRB III bahaya tinggi, KRB II sedang, KRB I rendah) sesuai regulasi PVMBG.
   - Perhitungan *Golden Time* luncuran awan panas guguran (PDC) dan proyeksi jalur banjir lahar dingin per lembah sungai nyata.

10. **Interactive Timeline HUD Dock**:
   - *Scrubber* perambatan waktu dinamis dari menit T+0 hingga T+60.
   - Kontrol pemutaran *Play/Pause*, percepatan simulasi (1x, 2x, 5x), dan tombol instan "Dampak Maksimal".

11. **Multi-Basemap & Layer Filter**:
   - Pilihan lapisan peta dasar: **Esri Dark Gray Canvas**, **Citra Satelit Esri**, dan **OpenStreetMap**.
   - Filter visibilitas lapisan untuk menyembunyikan/menampilkan gunung aktif, non-vulkanik, zona megathrust, dan shelter evakuasi sementara (TES).

12. **Ekspor Laporan Taktis (Disaster Impact Brief)**:
   - Generator dokumen ringkasan dampak darurat berstandar BNPB dengan opsi cetak ke PDF dan unduh gambar PNG resolusi tinggi.
