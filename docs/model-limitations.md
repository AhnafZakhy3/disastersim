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
Tinggi gelombang di area sumber (*epicentral wave height*) diestimasi berdasarkan formula empiris Papazachos et al. yang mempertimbangkan Magnitudo Momen ($M_w$) dan kedalaman hiposenter ($h_{\text{km}}$):

$$\log_{10}(H_0) = 0.55 \cdot M_w - 0.005 \cdot h_{\text{km}} - 3.85$$

$$H_0 = \max\left(0.2, 10^{\log_{10}(H_0)}\right)\text{ meter}$$

Gempa bumi dengan hiposenter dangkal ($h < 30\text{ km}$) memiliki efisiensi dislokasi vertikal dasar laut tertinggi, sedangkan gempa dengan hiposenter dalam ($h \ge 70\text{–}100\text{ km}$) menghasilkan deformasi dasar laut yang jauh teredam.

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
Radius KRB mengacu pada prinsip zonasi bahaya Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) yang diskalakan terhadap indeks magnitudo letusan (tabel pengali $M_{\text{radius}}$ dari $0.45\times$ pada VEI 1 hingga $7.5\times$ pada VEI 8):
- **KRB III (Zona Bahaya Mutlak / Sangat Tinggi)**: Kawasan yang terancam langsung oleh awan panas guguran, lontaran batu pijar, aliran lava, dan gas beracun.
  $$R_{\text{KRB3}} = R_{\text{base3}} \times M_{\text{radius}}(\text{VEI})$$
- **KRB II (Zona Bahaya Sedang)**: Terancam lontaran batu pijar dan hujan abu lebat.
  $$R_{\text{KRB2}} = R_{\text{KRB3}} \times 1.7$$
- **KRB I (Zona Bahaya Rendah / Sekunder)**: Kawasan perluasan banjir lahar dingin di lembah sungai dan sebaran abu vulkanik.
  $$R_{\text{KRB1}} = R_{\text{KRB3}} \times 2.6$$

### 2.3 Sebaran Abu Vulkanik (Ash Plume & Isopach Dispersion)
Sebaran abu vulkanik dimodelkan menggunakan sektor kerucut dispersi terarah (*directional wedge sector envelope*):
- **Panjang Sebaran Inti ($L_{\text{plume}}$)**:
  $$L_{\text{plume}} = (H_{\text{kolom}} \times 1.3) + (v_{\text{angin}} \times 0.9)\text{ km}$$
- **Arah Sebaran**: Mengikuti azimut arah angin ($0\text{–}360^\circ$).
- **Sudut Kerucut Sebaran ($\alpha$)**: Menyesuaikan kecepatan angin (semakin kencang angin, sebaran semakin memanjang dan meruncing):
  $$\alpha = \max\left(30^\circ, \min\left(65^\circ, 75^\circ - v_{\text{angin}} \times 0.4\right)\right)$$
- **Tingkat Ketebalan Isopach (Standar PVMBG VONA & USGS)**:
  - **Abu Lebat ($> 5\text{ cm}$)**: Jangkauan radius $0.55 \times L_{\text{plume}}$ (risiko atap runtuh & kelumpuhan jalan).
  - **Abu Sedang ($1\text{–}5\text{ cm}$)**: Jangkauan radius $1.00 \times L_{\text{plume}}$ (iritasi pernapasan/ISPA & mesin transportasi).
  - **Abu Ringan ($< 1\text{ cm}$)**: Jangkauan radius $1.60 \times L_{\text{plume}}$ (sebaran partikel debu halus di udara).

### 2.4 Batasan Model Vulkanik
1. **Model Angin Atmosfer Multi-Lapisan (Dual-Layer Atmospheric Wind Shear)**:
   Aplikasi mendukung pemodelan dua vektor arah dan kecepatan angin independen secara simultan (Lapisan Troposfer Permukaan $0–3\text{ km}$ untuk partikel abu berat/pasir vulkanik, dan Lapisan Stratosfer $>3\text{ km}$ untuk aerosol abu halus yang terkena *wind shear*). Namun parameter angin diatur secara manual melalui slider skenario pengguna dan belum mengonsumsi kisi meteorologi real-time (NOAA GFS / ECMWF).
2. **Karakteristik Magma Spesifik**: Skenario kustom menggunakan model fisik umum. Gunung api dengan sifat magma sangat kental (dasitik/riolisis) versus encer (basaltik) memerlukan studi petrologi spesifik di luar jangkauan prototipe ini.

---

## 3. Tingkat Bahaya dan Klaim Keselamatan

1. **Label Bahaya Simulasi**: Seluruh status peringatan tsunami (AWAS, SIAGA, WASPADA) dan erupsi (AWAS, SIAGA, WASPADA, NORMAL) adalah **hasil komputasi algoritma internal model**, bukan rilis resmi BMKG atau PVMBG.
2. **Bebas Klaim Mutlak**: Tidak ada lokasi yang dilabeli "100% aman". Status kota yang tidak terdampak dinyatakan sebagai:
   > *"Di luar proyeksi zona bahaya simulasi skenario aktif saat ini."*
3. **Validitas Prototipe**: Seluruh hasil simulasi ditujukan untuk perbandingan skenario dampak, edukasi kebencanaan, dan demonstrasi perutean evakuasi rintisan.
