'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DisasterType,
  VolcanoPreset,
  TsunamiFaultPreset,
  VolcanoScenario,
  TsunamiScenario,
  VolcanoSimulationResult,
  TsunamiSimulationResult,
  EvaluatedCity,
} from '@/types/disaster';
import {
  Clock,
  Users,
  ShieldCheck,
  Building2,
  FileDown,
  Navigation,
  Compass,
  CheckCircle2,
  Waves,
  Flame,
  Shield,
  Search,
  MapPin,
  ExternalLink,
  Crosshair,
} from 'lucide-react';
import {
  HazardDiamond,
} from '@/components/ui/TacticalSymbols';

interface ImpactSummaryProps {
  activeDisaster: DisasterType;
  selectedVolcano: VolcanoPreset;
  selectedFault: TsunamiFaultPreset;
  volcanoScenario: VolcanoScenario;
  tsunamiScenario: TsunamiScenario;
  volcanoResult: VolcanoSimulationResult;
  tsunamiResult: TsunamiSimulationResult;
  currentTimeMinutes?: number;
  cities?: EvaluatedCity[];
  onFlyToCity?: (city: EvaluatedCity) => void;
  onOpenExportModal: () => void;
}

export default function ImpactSummary({
  activeDisaster,
  selectedVolcano,
  selectedFault,
  volcanoScenario,
  tsunamiScenario,
  volcanoResult,
  tsunamiResult,
  currentTimeMinutes = 0,
  cities = [],
  onFlyToCity,
  onOpenExportModal,
}: ImpactSummaryProps) {
  const [citySearch, setCitySearch] = useState('');
  const [cityTab, setCityTab] = useState<'threatened' | 'all' | 'safe'>(
    activeDisaster === 'standby' ? 'all' : 'threatened'
  );
  const [cityIsland, setCityIsland] = useState('all');

  // Auto-switch to 'all' in standby mode, and 'threatened' during active disaster
  useEffect(() => {
    if (activeDisaster === 'standby') {
      setCityTab('all');
    } else {
      setCityTab('threatened');
    }
  }, [activeDisaster]);

  const evaluatedList = useMemo(() => {
    if (activeDisaster === 'volcano') {
      return volcanoResult.allEvaluatedCities || cities;
    }
    if (activeDisaster === 'tsunami') {
      return tsunamiResult.allEvaluatedCities || cities;
    }
    return cities;
  }, [activeDisaster, volcanoResult, tsunamiResult, cities]);

  const threatenedCount = useMemo(() => {
    return evaluatedList.filter(c => c.status !== 'safe' && c.status !== 'standby').length;
  }, [evaluatedList]);

  const safeCount = useMemo(() => {
    return evaluatedList.filter(c => c.status === 'safe' || c.status === 'standby').length;
  }, [evaluatedList]);

  const filteredCities = useMemo(() => {
    return evaluatedList.filter(city => {
      // Tab filter (applies when not searching, or user can explicitly filter)
      if (!citySearch.trim()) {
        if (cityTab === 'threatened' && (city.status === 'safe' || city.status === 'standby')) return false;
        if (cityTab === 'safe' && city.status !== 'safe' && city.status !== 'standby') return false;
      }

      // Island filter
      if (cityIsland !== 'all' && city.islandGroup !== cityIsland) return false;

      // Search query
      if (citySearch.trim()) {
        const query = citySearch.toLowerCase();
        const matchName = city.cityName.toLowerCase().includes(query);
        const matchProv = city.province.toLowerCase().includes(query);
        if (!matchName && !matchProv) return false;
      }
      return true;
    });
  }, [evaluatedList, cityTab, cityIsland, citySearch]);

  const renderCitiesDirectory = () => (
    <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
            Direktori 514 Kota Se-Indonesia
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
          {filteredCities.length} dari {evaluatedList.length}
        </span>
      </div>

      {/* Threat / Safety Status Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800/80 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setCityTab('threatened')}
          className={`py-1 rounded text-center transition-all ${
            cityTab === 'threatened'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Terancam ({threatenedCount})
        </button>
        <button
          type="button"
          onClick={() => setCityTab('all')}
          className={`py-1 rounded text-center transition-all ${
            cityTab === 'all'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Semua (514)
        </button>
        <button
          type="button"
          onClick={() => setCityTab('safe')}
          className={`py-1 rounded text-center transition-all ${
            cityTab === 'safe'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Aman ({safeCount})
        </button>
      </div>

      {/* Island Filter Pills */}
      <div className="flex flex-wrap gap-1">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'Jawa', label: 'Jawa' },
          { id: 'Sumatera', label: 'Sumatera' },
          { id: 'Bali-NusaTenggara', label: 'Bali-NT' },
          { id: 'Sulawesi', label: 'Sulawesi' },
          { id: 'Kalimantan', label: 'Kalimantan' },
          { id: 'Maluku', label: 'Maluku' },
          { id: 'Papua', label: 'Papua' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCityIsland(tab.id)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
              cityIsland === tab.id
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Search Box */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="city-filter-search"
          name="city-filter-search"
          aria-label="Cari nama kota atau kabupaten se-Indonesia"
          type="text"
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          placeholder="Cari kota, kabupaten, atau provinsi..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        {citySearch && (
          <button
            type="button"
            onClick={() => setCitySearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Scrollable City List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {filteredCities.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            Tidak ada kota yang cocok dengan filter.
          </div>
        ) : (
          filteredCities.slice(0, 30).map((city) => {
            const isHit = city.status === 'impacted';
            const isDanger = city.status === 'danger';
            const isWarning = city.status === 'warning';
            const isAdvisory = city.status === 'advisory';

            const badgeColor = isHit || isDanger
              ? 'bg-red-950 text-red-300 border-red-500/50'
              : isWarning
              ? 'bg-orange-950 text-orange-300 border-orange-500/50'
              : isAdvisory
              ? 'bg-yellow-950 text-yellow-300 border-yellow-500/50'
              : city.status === 'standby'
              ? 'bg-slate-900 text-slate-400 border-slate-700/60'
              : 'bg-emerald-950 text-emerald-300 border-emerald-500/50';

            return (
              <div
                key={city.id}
                className={`p-2 rounded border text-xs transition-colors ${
                  isHit || isDanger
                    ? 'bg-red-950/30 border-red-900/60'
                    : isWarning
                    ? 'bg-orange-950/30 border-orange-900/60'
                    : isAdvisory
                    ? 'bg-yellow-950/20 border-yellow-900/40'
                    : 'bg-slate-900/90 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span className="truncate">{city.cityName}</span>
                    {isHit && (
                      <span className="text-[9px] px-1 rounded bg-red-900 text-red-100 font-bold shrink-0 animate-pulse">
                        TERDAMPAK
                      </span>
                    )}
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border shrink-0 ${badgeColor}`}>
                    {city.statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>{city.province}{city.status !== 'standby' ? ` • ${city.distanceKm} km` : ''}</span>
                  <span>~{city.population.toLocaleString('id-ID')} jiwa</span>
                </div>

                {city.etaMinutes !== undefined && (
                  <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                    ETA: {city.etaMinutes}m • Tinggi Gelombang: ~{city.waveHeightM}m
                  </div>
                )}

                <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onFlyToCity && onFlyToCity(city)}
                    className="px-2 py-0.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 rounded flex items-center gap-1 transition-colors"
                  >
                    <Crosshair className="w-2.5 h-2.5" />
                    <span>Fokuskan Peta</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
        {filteredCities.length > 30 && (
          <div className="text-center py-1 text-[10px] text-slate-500">
            Menampilkan 30 dari {filteredCities.length} kota. Gunakan pencarian untuk menyaring lebih spesifik.
          </div>
        )}
      </div>
    </div>
  );

  if (activeDisaster === 'standby') {
    return (
      <div className="w-full h-full flex flex-col space-y-4 text-slate-200 overflow-y-auto pr-1">
        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200">Pemantauan Siaga Nasional</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Data telemetri vulkanologi dan seismologi siap pakai. Seluruh 514 Kota & Kabupaten se-Indonesia terpantau 24/7.
          </p>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Cakupan Pemodelan Geologis Nasional
          </span>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Kota & Kabupaten</span>
              <span className="text-emerald-400 font-bold">514 Daerah (38 Provinsi)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Gunung Api Aktif</span>
              <span className="text-orange-400 font-bold">69 Gunung Tipe A/B</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Puncak Non-Vulkanik</span>
              <span className="text-emerald-400 font-bold">9 Puncak Tektonik</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Megathrust & Sesar</span>
              <span className="text-sky-400 font-bold">6 Zona Subduksi</span>
            </div>
          </div>
        </div>

        {renderCitiesDirectory()}

        <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[10px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-400 block mb-0.5">Disclaimer Edukasi & Pemodelan:</span>
          DisasterSim adalah simulasi edukasi berbasis formula empiris (InaTEWS BMKG / PVMBG). Hasil pemodelan bukan peringatan dini resmi dan tidak menggantikan arahan evakuasi otoritas pemerintah (BMKG, PVMBG, BNPB, atau BPBD).
        </div>
      </div>
    );
  }

  const isVolcano = activeDisaster === 'volcano';

  const alertBadge = isVolcano
    ? volcanoResult.alertLevel
    : `STATUS BMKG: ${tsunamiResult.bmkgStatus}`;

  const alertColor = isVolcano
    ? volcanoResult.alertColor
    : tsunamiResult.bmkgColor;

  const etaMinutes = isVolcano
    ? volcanoResult.etaPyroclasticMinutes
    : tsunamiResult.etaCoastMinutes;

  const etaSeconds = Math.round((etaMinutes % 1) * 60);
  const etaMinutesWhole = Math.floor(etaMinutes);

  return (
    <div className="w-full h-full flex flex-col space-y-3.5 text-slate-200">
      {/* 1. Main Alert Status Banner */}
      <div
        className="p-3 rounded-lg border relative transition-all"
        style={{
          borderColor: alertColor,
          backgroundColor: `${alertColor}15`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: alertColor }}
          />
          <h3
            className="text-xs font-black tracking-wide"
            style={{ color: alertColor }}
          >
            {alertBadge}
          </h3>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
          {isVolcano
            ? `Radius KRB III: ${volcanoResult.krb3RadiusKm} km. Seluruh warga di zona bahaya mutlak wajib evakuasi segera.`
            : tsunamiResult.bmkgDescription}
        </p>
      </div>

      {/* 2. Golden Time Countdown Box */}
      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>{isVolcano ? 'Estimasi Golden Time Awan Panas' : 'Waktu Tiba Gelombang (Golden Time)'}</span>
          </span>
          <span className="text-[10px] text-orange-400 font-mono font-bold">KRITIS</span>
        </div>
        <div className="text-xl font-black text-orange-400 font-mono tabular-nums tracking-tight">
          {etaMinutesWhole} Menit {etaSeconds > 0 ? `${etaSeconds} Detik` : ''}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {isVolcano
            ? `Kecepatan luncur awan panas ~${volcanoResult.pyroclasticSpeedKmh} km/jam menuruni lereng kawah.`
            : `Kecepatan perambatan laut dalam mencapai ~${tsunamiResult.deepWaterSpeedKmh} km/jam.`}
        </p>
      </div>

      {/* 3. 2x2 Tactical Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-rose-400" />
            Populasi Terpapar
          </span>
          <span className="text-base font-extrabold text-rose-400 font-mono tabular-nums">
            ~{isVolcano
              ? volcanoResult.affectedPopulation.toLocaleString('id-ID')
              : tsunamiResult.affectedPopulation.toLocaleString('id-ID')}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {isVolcano ? 'Jiwa di zona KRB III & II' : 'Warga di pesisir inundasi'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-amber-400" />
            {isVolcano ? 'Radius KRB III' : 'Rendaman Daratan'}
          </span>
          <span className="text-base font-extrabold text-amber-400 font-mono tabular-nums">
            {isVolcano
              ? `${volcanoResult.krb3RadiusKm} KM`
              : `${tsunamiResult.inundationDistanceM} M`}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {isVolcano ? 'Batas bahaya mutlak' : 'Jarak air masuk darat'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-cyan-400" />
            {isVolcano ? 'Faskes Terancam' : 'Pelabuhan'}
          </span>
          <span className="text-base font-extrabold text-cyan-400 font-mono tabular-nums">
            {isVolcano
              ? `${volcanoResult.affectedFacilities.health} Unit`
              : `${tsunamiResult.affectedFacilities.ports} Titik`}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {isVolcano ? 'Puskesmas & RS' : 'Dermaga & Pelabuhan'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
            <Compass className="w-3 h-3 text-emerald-400" />
            {isVolcano ? 'Rute Terputus' : 'Akses Pesisir'}
          </span>
          <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
            {isVolcano
              ? `${volcanoResult.affectedFacilities.roads} Rute`
              : `${tsunamiResult.affectedFacilities.coastalRoadsKm} KM`}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {isVolcano ? 'Jalur transportasi' : 'Jalan tepi pantai'}
          </span>
        </div>
      </div>

      {/* 4. Direktori Komprehensif Seluruh 514 Kota & Kabupaten Se-Indonesia */}
      {renderCitiesDirectory()}

      {/* 5. Skenario Khusus Gunung Api: Lembah Rawan Lahar Hujan */}
      {isVolcano && volcanoResult.laharValleys.length > 0 && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Lembah Sungai Bahaya Lahar Dingin
          </span>
          <div className="space-y-1 text-xs">
            {volcanoResult.laharValleys.map((valley, idx) => (
              <div key={idx} className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>{valley.name}</span>
                  <span className="text-[10px] text-amber-400 font-mono">{valley.compassDirection}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{valley.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Rekomendasi Titik Evakuasi Aman (TES) */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tempat Evakuasi Sementara (TES)</span>
        </span>
        <div className="space-y-1.5 text-xs">
          {(isVolcano ? volcanoResult.recommendedShelters : tsunamiResult.recommendedShelters)
            .slice(0, 3)
            .map((shelter) => (
              <div
                key={shelter.id}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80"
              >
                <span className="text-slate-200 font-medium truncate max-w-[190px]">
                  {shelter.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
                  {shelter.distanceKm ? `+${shelter.distanceKm} km` : `${shelter.elevationM ?? 0} mdpl`}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* 7. Checklist BNPB */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
          Protokoler Darurat BNPB & BPBD
        </span>
        <div className="space-y-1.5 text-[11px] text-slate-300">
          {(isVolcano
            ? volcanoResult.bnpbInstructions
            : tsunamiResult.bnpbInstructions
          ).map((instruction, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{instruction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Export Brief Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenExportModal}
          className="w-full py-2.5 px-4 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
        >
          <FileDown className="w-4 h-4" />
          <span>Unduh Disaster Impact Brief (PDF)</span>
        </button>
      </div>

      {/* 9. Scientific & Official Authority Disclaimer */}
      <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[10px] text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-400 block mb-0.5">Disclaimer Edukasi & Pemodelan:</span>
        DisasterSim adalah simulasi edukasi berbasis formula empiris (InaTEWS BMKG / PVMBG). Hasil pemodelan bukan peringatan dini resmi dan tidak menggantikan arahan evakuasi otoritas pemerintah (BMKG, PVMBG, BNPB, atau BPBD).
      </div>
    </div>
  );
}
