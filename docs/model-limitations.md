# Dokumentasi Ilmiah, Asumsi Fisik, dan Batasan Model Simulasi

Dokumen ini mendokumentasikan landasan teori, formulasi matematis, koefisien empiris, asumsi fisis, dan batasan operasional dari model simulasi yang digunakan dalam **Nusantara Disaster Simulator**.

Aplikasi ini dirancang sebagai **prototipe kompetisi edukatif dan demonstrator mitigasi spasial**, bukan sebagai instrumen navigasi operasional darurat atau sistem peramalan numerik waktu-nyata resmi.

---

## 1. Model Simulasi Tsunami

### 1.1 Formulasi Kecepatan Propagasi Gelombang (Shallow Water Wave Theory)
Kecepatan rambat gelombang tsunami di laut lepas dihitung menggunakan aproksimasi gelombang air dangkal (*shallow-water wave approximation*):

$$v = \sqrt{g \cdot d}$$

Dimana:
- $v$: Kecepatan rambat gelombang ($\text{m/s}$).
- $g$: Percepatan gravitasi bumi ($9.81\text{ m/s}^2$).
- $d$: Kedalaman rata-rata laut ($\text{meter}$).

Kecepatan dalam kilometer per jam dihitung dengan:
$$v_{\text{km/j}} = v \times 3.6$$

*Contoh:* Untuk kedalaman rata-rata Palung Jawa sebesar $4.000\text{ meter}$, kecepatan gelombang mencapai $\approx 713\text{ km/jam}$.

### 1.2 Estimasi Tinggi Gelombang Awal (Source Wave Height)
Tinggi gelombang di area sumber (*epicentral wave height*) diestimasi berdasarkan Magnitudo Momen ($M_w$) dan kedalaman hiposenter ($h_{\text{km}}$):

$$H_0 = 10^{(0.5 \cdot M_w - 3.3)} \times \left(1 - \frac{h_{\text{km}}}{100}\right)$$

Jika $h \ge 100\text{ km}$, deformasi dasar laut dianggap tidak signifikan memicu tsunami tektonik vertikal ($H_0 \approx 0$).

### 1.3 Amplifikasi Pantai (Hukum Green / Green's Law)
Saat gelombang tsunami mendekati perairan dangkal pantai ($d_c \approx 5\text{–}10\text{ m}$), kecepatannya melambat sementara energi gelombang terkonsentrasi, menyebabkan amplifikasi ketinggian gelombang pantai ($H_c$):

$$H_c = H_0 \cdot \left(\frac{d_0}{d_c}\right)^{0.25}$$

Dimana:
- $d_0$: Kedalaman laut di episentrum ($m$).
- $d_c$: Kedalaman efektif perairan pantai ($m$).

### 1.4 Jarak Inundasi Pesisir (Empirical Inundation Distance)
Penetrasi air laut ke daratan pesisir diestimasi melalui formula empiris inundasi pesisir datar:

$$X_{\text{inundasi}} = H_c^{1.35} \times 110\text{ meter}$$

### 1.5 Cincin Isokron Waktu Tiba (Isochrone Propagation)
Jarak jangkauan gelombang pada waktu $T$ menit dihitung secara radial teredam:
$$R(T) = v \times \left(\frac{T}{60}\right)\text{ km}$$

### 1.6 Batasan Model Tsunami
1. **Kedalaman Rata-rata vs Batimetri Grid**: Model menggunakan kedalaman rata-rata regional segmen patahan, bukan model batimetri kisi resolusi tinggi (GEBCO / BATNAS).
2. **Topografi 2D Sederhana**: Inundasi dihitung secara planar-empiris dan tidak memperhitungkan penghalang mikro (bangunan bertingkat, tanggul laut, atau tutupan mangrove secara hidrodinamik 2D).
3. **Mekanisme Pemicu**: Mengasumsikan mekanisme pemicu berupa sesar naik (*megathrust/thrust fault*) vertikal. Tsunami akibat longsoran bawah laut (*submarine landslide*) dimodelkan secara heuristik pada segmen Palu-Koro.

---

## 2. Model Simulasi Erupsi Vulkanik

### 2.1 Indeks Letusan Vulkanik (VEI / Volcanic Explosivity Index)
Model mengadopsi klasifikasi Newhall & Self (1982) dengan rentang VEI 1 hingga 8. Parameter letusan diskalakan secara eksponensial berdasarkan VEI:

- **Volume Tefra ($V$)**: $V \approx 10^{(\text{VEI} - 1)} \times 10^{-3}\text{ km}^3$
- **Tinggi Kolom Erupsi ($H$)**: Mengikuti relasi empiris erupsi eksplosif Mastin et al. (2009):
  $$H \approx 2.0 \cdot V^{0.241}\text{ km}$$ (disesuaikan dengan batas atas stratosfer per level VEI).

### 2.2 Kawasan Rawan Bencana (KRB)
Radius KRB mengacu pada pedoman standar Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG):
- **KRB III (Zona Bahaya Tinggi)**: Kawasan yang terancam langsung oleh awan panas guguran, lontaran batu pijar, aliran lava, dan gas beracun.
  $$R_{\text{KRB3}} = \text{baseRadius} \times \left(1 + \frac{\text{VEI} - \text{defaultVEI}}{3}\right)$$
- **KRB II (Zona Bahaya Sedang)**: Terancam lontaran batu pijar dan hujan abu lebat.
- **KRB I (Zona Bahaya Rendah)**: Kawasan yang berpotensi terlanda lahar hujan/lahar dingin bila terjadi presipitasi tinggi.

### 2.3 Sebaran Abu Vulkanik (Ash Plume & Isopach Dispersion)
Sebaran abu vulkanik dimodelkan menggunakan elips dispersi terarah (*directional Gaussian dispersion envelope*):
- **Panjang Sebaran ($L_{\text{plume}}$)**:
  $$L_{\text{plume}} = (H \times 2.8) + (v_{\text{angin}} \times 0.6)\text{ km}$$
- **Arah Sebaran**: Mengikuti azimut arah angin ($0\text{–}360^\circ$).
- **Tingkat Ketebalan Isopach**:
  - Abu Lebat ($>5\text{ cm}$): Radius $0.35 \times L_{\text{plume}}$
  - Abu Sedang ($1\text{–}5\text{ cm}$): Radius $0.70 \times L_{\text{plume}}$
  - Abu Ringan ($<1\text{ cm}$): Radius $1.00 \times L_{\text{plume}}$

### 2.4 Batasan Model Vulkanik
1. **Model Angin Seragam**: Angin dimodelkan sebagai vektor arah dan kecepatan seragam, bukan model profil angin multi-lapisan atmosfer (troposfer/stratosfer) dinamis NOAA GFS/ECMWF.
2. **Karakteristik Magma Spesifik**: Skenario kustom menggunakan model fisik umum. Gunung api dengan sifat magma sangat kental (dasitik/riolisis) versus encer (basaltik) memerlukan studi petrologi spesifik di luar jangkauan prototipe ini.

---

## 3. Tingkat Bahaya dan Klaim Keselamatan

1. **Label Bahaya Simulasi**: Seluruh status peringatan tsunami (AWAS, SIAGA, WASPADA) dan erupsi (AWAS, SIAGA, WASPADA, NORMAL) adalah **hasil komputasi algoritma internal model**, bukan rilis resmi BMKG atau PVMBG.
2. **Bebas Klaim Mutlak**: Tidak ada lokasi yang dilabeli "100% aman". Status kota yang tidak terdampak dinyatakan sebagai:
   > *"Di luar proyeksi zona bahaya simulasi skenario aktif saat ini."*
3. **Validitas Prototipe**: Seluruh hasil simulasi ditujukan untuk perbandingan skenario dampak, edukasi kebencanaan, dan demonstrasi perutean evakuasi rintisan.
