# scripts/generate_all_514.py
import json

cities = [
    # =========================================================================
    # 1. ACEH (23: 5 Kota, 18 Kab)
    # =========================================================================
    {"id": "aceh-1", "name": "Kota Banda Aceh", "type": "Kota", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.5483, "lng": 95.3238, "population": 256000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-2", "name": "Kota Sabang", "type": "Kota", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.8942, "lng": 95.3228, "population": 43000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-3", "name": "Kota Lhokseumawe", "type": "Kota", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.1801, "lng": 97.1407, "population": 191000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-4", "name": "Kota Langsa", "type": "Kota", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.4716, "lng": 97.9683, "population": 185000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-5", "name": "Kota Subulussalam", "type": "Kota", "province": "Aceh", "islandGroup": "Sumatera", "lat": 2.6375, "lng": 98.0044, "population": 93000, "isCoastal": False},
    {"id": "aceh-6", "name": "Kab. Aceh Besar (Jantho)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.2818, "lng": 95.6192, "population": 425000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-7", "name": "Kab. Pidie (Sigli)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.3847, "lng": 95.9608, "population": 435000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-8", "name": "Kab. Pidie Jaya (Meureudu)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.2443, "lng": 96.2234, "population": 157000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-9", "name": "Kab. Bireuen", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.2064, "lng": 96.7011, "population": 444000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-10", "name": "Kab. Aceh Utara (Lhoksukon)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 5.0442, "lng": 97.3182, "population": 602000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-11", "name": "Kab. Aceh Timur (Idi Rayeuk)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.7925, "lng": 97.7712, "population": 436000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-12", "name": "Kab. Aceh Tamiang (Karang Baru)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.2831, "lng": 98.0494, "population": 298000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "aceh-13", "name": "Kab. Bener Meriah (Simpang Tiga)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.7336, "lng": 96.8622, "population": 168000, "isCoastal": False},
    {"id": "aceh-14", "name": "Kab. Aceh Tengah (Takengon)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.6294, "lng": 96.8454, "population": 219000, "isCoastal": False},
    {"id": "aceh-15", "name": "Kab. Gayo Lues (Blangkejeren)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 3.9922, "lng": 97.3402, "population": 101000, "isCoastal": False},
    {"id": "aceh-16", "name": "Kab. Aceh Tenggara (Kutacane)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 3.4889, "lng": 97.8188, "population": 221000, "isCoastal": False},
    {"id": "aceh-17", "name": "Kab. Aceh Jaya (Calang)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.6369, "lng": 95.5786, "population": 94000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-18", "name": "Kab. Aceh Barat (Meulaboh)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.1449, "lng": 96.1265, "population": 202000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-19", "name": "Kab. Nagan Raya (Suka Makmue)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 4.1611, "lng": 96.3533, "population": 172000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-20", "name": "Kab. Aceh Barat Daya (Blangpidie)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 3.7508, "lng": 96.8428, "population": 154000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-21", "name": "Kab. Aceh Selatan (Tapaktuan)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 3.2592, "lng": 97.1794, "population": 236000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-22", "name": "Kab. Aceh Singkil", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 2.3364, "lng": 97.8078, "population": 130000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "aceh-23", "name": "Kab. Simeulue (Sinabang)", "type": "Kabupaten", "province": "Aceh", "islandGroup": "Sumatera", "lat": 2.4789, "lng": 96.3808, "population": 95000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},

    # =========================================================================
    # 2. SUMATERA UTARA (33: 8 Kota, 25 Kab)
    # =========================================================================
    {"id": "sumut-1", "name": "Kota Medan", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.5952, "lng": 98.6722, "population": 2460000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-2", "name": "Kota Binjai", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.6006, "lng": 98.4854, "population": 295000, "isCoastal": False},
    {"id": "sumut-3", "name": "Kota Tebing Tinggi", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.3285, "lng": 99.1625, "population": 174000, "isCoastal": False},
    {"id": "sumut-4", "name": "Kota Pematangsiantar", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.9619, "lng": 99.0682, "population": 272000, "isCoastal": False},
    {"id": "sumut-5", "name": "Kota Tanjungbalai", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.9585, "lng": 99.7997, "population": 179000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-6", "name": "Kota Sibolga", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.7428, "lng": 98.7792, "population": 90000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-7", "name": "Kota Padangsidimpuan", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.3736, "lng": 99.2687, "population": 228000, "isCoastal": False},
    {"id": "sumut-8", "name": "Kota Gunungsitoli", "type": "Kota", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.2825, "lng": 97.6144, "population": 137000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-9", "name": "Kab. Deli Serdang (Lubuk Pakam)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.5619, "lng": 98.8758, "population": 1960000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-10", "name": "Kab. Langkat (Stabat)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.7431, "lng": 98.4528, "population": 1040000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-11", "name": "Kab. Karo (Kabanjahe)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.1783, "lng": 98.4908, "population": 409000, "isCoastal": False},
    {"id": "sumut-12", "name": "Kab. Simalungun (Raya)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.9642, "lng": 98.8872, "population": 1000000, "isCoastal": False},
    {"id": "sumut-13", "name": "Kab. Dairi (Sidikalang)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.7483, "lng": 98.3106, "population": 319000, "isCoastal": False},
    {"id": "sumut-14", "name": "Kab. Pakpak Bharat (Salak)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.5333, "lng": 98.3167, "population": 54000, "isCoastal": False},
    {"id": "sumut-15", "name": "Kab. Humbang Hasundutan (Dolok Sanggul)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.2589, "lng": 98.7511, "population": 200000, "isCoastal": False},
    {"id": "sumut-16", "name": "Kab. Toba (Balige)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.3333, "lng": 99.0667, "population": 211000, "isCoastal": False},
    {"id": "sumut-17", "name": "Kab. Samosir (Pangururan)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.6075, "lng": 98.7042, "population": 142000, "isCoastal": False},
    {"id": "sumut-18", "name": "Kab. Tapanuli Utara (Tarutung)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.0167, "lng": 98.9667, "population": 317000, "isCoastal": False},
    {"id": "sumut-19", "name": "Kab. Tapanuli Tengah (Pandan)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.6886, "lng": 98.8319, "population": 366000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-20", "name": "Kab. Tapanuli Selatan (Sipirok)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.5794, "lng": 99.2736, "population": 315000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-21", "name": "Kab. Mandailing Natal (Panyabungan)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 0.8667, "lng": 99.5667, "population": 490000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-22", "name": "Kab. Padang Lawas (Sibuhuan)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.2500, "lng": 99.9167, "population": 264000, "isCoastal": False},
    {"id": "sumut-23", "name": "Kab. Padang Lawas Utara (Gunung Tua)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.4833, "lng": 99.6667, "population": 268000, "isCoastal": False},
    {"id": "sumut-24", "name": "Kab. Labuhanbatu (Rantau Prapat)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.0967, "lng": 99.8286, "population": 503000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-25", "name": "Kab. Labuhanbatu Utara (Aek Kanopan)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.3333, "lng": 99.6500, "population": 388000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-26", "name": "Kab. Labuhanbatu Selatan (Kotapinang)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.9000, "lng": 100.0833, "population": 317000, "isCoastal": False},
    {"id": "sumut-27", "name": "Kab. Asahan (Kisaran)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 2.9833, "lng": 99.6167, "population": 777000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-28", "name": "Kab. Batu Bara (Limapuluh)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.1667, "lng": 99.5333, "population": 443000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-29", "name": "Kab. Serdang Bedagai (Sei Rampah)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 3.4667, "lng": 99.1500, "population": 663000, "isCoastal": True, "coastalFacing": "Selat Malaka"},
    {"id": "sumut-30", "name": "Kab. Nias (Gido)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.1333, "lng": 97.6833, "population": 147000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-31", "name": "Kab. Nias Selatan (Teluk Dalam)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 0.5667, "lng": 97.8167, "population": 368000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-32", "name": "Kab. Nias Utara (Lotu)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.3333, "lng": 97.3333, "population": 152000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
    {"id": "sumut-33", "name": "Kab. Nias Barat (Lahomi)", "type": "Kabupaten", "province": "Sumatera Utara", "islandGroup": "Sumatera", "lat": 1.0500, "lng": 97.4667, "population": 90000, "isCoastal": True, "coastalFacing": "Samudera Hindia"},
]

print("Seed count:", len(cities))
