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
  AlertTriangle,
  RotateCcw,
  Loader2,
  Download,
} from 'lucide-react';
import {
  HazardDiamond,
} from '@/components/ui/TacticalSymbols';
import { EvacuationRouteResult } from '@/lib/routing/routingTypes';
import { createCirclePolygon } from '@/lib/geoUtils';
import { HazardZonePolygon } from '@/lib/routing/hazardCheck';
import { exportRouteToGeoJSONFile } from '@/lib/routing/geojsonExport';

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
  evacuationRoute?: EvacuationRouteResult | null;
  isCalculatingRoute?: boolean;
  routeError?: string | null;
  isPickingOrigin?: boolean;
  customOriginCoord?: { lat: number; lng: number; name?: string } | null;
  onTogglePickOrigin?: () => void;
  onResetOrigin?: () => void;
  onCalculateRoute?: () => void;
  onClearRoute?: () => void;
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
  evacuationRoute,
  isCalculatingRoute = false,
  routeError,
  isPickingOrigin = false,
  customOriginCoord = null,
  onTogglePickOrigin,
  onResetOrigin,
  onCalculateRoute,
  onClearRoute,
  onFlyToCity,
  onOpenExportModal,
}: ImpactSummaryProps) {
  const [citySearch, setCitySearch] = useState('');
  const [showTurnByTurn, setShowTurnByTurn] = useState(false);

  const handleExportGeoJSON = () => {
    if (!evacuationRoute) return;

    const hazardZones: HazardZonePolygon[] = [];
    if (activeDisaster === 'volcano') {
      const vLat = volcanoScenario.isCustom && volcanoScenario.customLocation
        ? volcanoScenario.customLocation.lat
        : selectedVolcano.lat;
      const vLng = volcanoScenario.isCustom && volcanoScenario.customLocation
        ? volcanoScenario.customLocation.lng
        : selectedVolcano.lng;

      if (volcanoResult.krb3RadiusKm > 0) {
        hazardZones.push({
          name: `Zona Bahaya Mutlak KRB III (${volcanoResult.krb3RadiusKm} km)`,
          severity: 'critical',
          polygon: createCirclePolygon(vLat, vLng, volcanoResult.krb3RadiusKm, 24),
        });
      }
      if (volcanoResult.krb2RadiusKm > 0) {
        hazardZones.push({
          name: `Zona Waspada KRB II (${volcanoResult.krb2RadiusKm} km)`,
          severity: 'high',
          polygon: createCirclePolygon(vLat, vLng, volcanoResult.krb2RadiusKm, 24),
        });
      }
      if (volcanoResult.krb1RadiusKm > 0) {
        hazardZones.push({
          name: `Zona Siaga KRB I (${volcanoResult.krb1RadiusKm} km)`,
          severity: 'medium',
          polygon: createCirclePolygon(vLat, vLng, volcanoResult.krb1RadiusKm, 24),
        });
      }
      if (volcanoResult.ashIsopachTiers && volcanoResult.ashIsopachTiers.length > 0) {
        volcanoResult.ashIsopachTiers.forEach((tier) => {
          if (tier.polygon.length > 2) {
            hazardZones.push({
              name: `Sebaran Abu: ${tier.label}`,
              severity: tier.id === 'tier_heavy' ? 'high' : tier.id === 'tier_medium' ? 'medium' : 'low',
              polygon: tier.polygon,
            });
          }
        });
      }
      if (
        volcanoScenario.enableWindShear &&
        volcanoResult.upperAshPlumePolygon &&
        volcanoResult.upperAshPlumePolygon.length > 2
      ) {
        hazardZones.push({
          name: 'Sebaran Abu Stratosfer (Wind Shear)',
          severity: 'medium',
          polygon: volcanoResult.upperAshPlumePolygon,
        });
      }
    } else if (activeDisaster === 'tsunami') {
      const epicLat = tsunamiScenario.isCustom && tsunamiScenario.customLocation
        ? tsunamiScenario.customLocation.lat
        : selectedFault.lat;
      const epicLng = tsunamiScenario.isCustom && tsunamiScenario.customLocation
        ? tsunamiScenario.customLocation.lng
        : selectedFault.lng;

      const maxWaveRadiusKm = tsunamiResult.isochroneRings?.length
        ? Math.max(...tsunamiResult.isochroneRings.map((r) => r.radiusKm))
        : 50;

      if (maxWaveRadiusKm > 0) {
        hazardZones.push({
          name: `Zona Propagasi Gelombang Tsunami (${Math.round(maxWaveRadiusKm)} km)`,
          severity: 'critical',
          polygon: createCirclePolygon(epicLat, epicLng, Math.min(maxWaveRadiusKm, 80), 24),
        });
      }
    }

    exportRouteToGeoJSONFile(evacuationRoute, hazardZones);
  };
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
          <span className="font-semibold text-slate-400 block mb-0.5">Disclaimer Prototipe & Batasan Model:</span>
          DisasterSim adalah prototipe kompetisi untuk kajian edukasi dan demonstrasi rute berbasis data simulasi. Hasil pemodelan bukan peringatan dini resmi dan tidak menggantikan arahan evakuasi otoritas pemerintah (BMKG, PVMBG, BNPB, atau BPBD).
        </div>
      </div>
    );
  }

  const isVolcano = activeDisaster === 'volcano';

  const alertBadge = isVolcano
    ? volcanoResult.alertLevel
    : `BAHAYA SIMULASI: ${tsunamiResult.simulatedWarningLevel || tsunamiResult.bmkgStatus}`;

  const alertColor = isVolcano
    ? volcanoResult.alertColor
    : (tsunamiResult.warningColor || tsunamiResult.bmkgColor);

  const etaMinutes = isVolcano
    ? volcanoResult.etaPyroclasticMinutes
    : tsunamiResult.etaCoastMinutes;

  const etaSeconds = Math.round((etaMinutes % 1) * 60);
  const etaMinutesWhole = Math.floor(etaMinutes);

  return (
    <div className="w-full h-full flex flex-col space-y-3.5 text-slate-200 overflow-y-auto pr-1 min-h-0">
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
            : (tsunamiResult.warningDescription || tsunamiResult.bmkgDescription)}
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

      {/* 5.1 Simulasi Jalur Evakuasi Otomatis (OSRM Pedestrian Network) */}
      <div className="p-3 bg-slate-950/90 border border-cyan-800/60 rounded-lg space-y-2.5 shadow-md shadow-cyan-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>Simulasi Rute Evakuasi</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
            JARINGAN JALAN
          </span>
        </div>

        {/* Pemilihan Titik Awal (Custom Waypoint Origin Picker) */}
        <div className="p-2 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span>Titik Awal Warga:</span>
            </span>
            <span className="text-[10px] font-mono text-sky-300 font-bold truncate max-w-[130px]">
              {customOriginCoord ? 'Kustom Peta' : 'Preset Wilayah'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTogglePickOrigin}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                isPickingOrigin
                  ? 'bg-sky-500 text-white animate-pulse shadow-md shadow-sky-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>{isPickingOrigin ? 'Klik di Peta Sekarang...' : 'Pilih Titik di Peta'}</span>
            </button>

            {customOriginCoord && onResetOrigin && (
              <button
                type="button"
                onClick={onResetOrigin}
                title="Kembalikan ke titik preset pemukiman"
                className="py-1.5 px-2 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          {customOriginCoord && (
            <div className="text-[9px] text-slate-400 leading-tight">
              Koordinat: {customOriginCoord.lat.toFixed(4)}°, {customOriginCoord.lng.toFixed(4)}° (Pin dapat digeser di peta)
            </div>
          )}
        </div>

        {!evacuationRoute ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onCalculateRoute}
              disabled={isCalculatingRoute}
              className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white flex items-center justify-center gap-2 shadow-md shadow-cyan-900/30 transition-all active:scale-95"
            >
              {isCalculatingRoute ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menganalisis Jaringan Jalan OSRM...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Hitung Rute Jalan Kaki ke TES</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 leading-tight">
              Mengevaluasi jalur pejalan kaki terdekat dari titik awal menuju TES terverifikasi dengan dynamic avoidance & kapasitas.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-700/80 space-y-1.5">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-1.5">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tujuan Terpilih:</span>
                  <span className="font-bold text-emerald-400 text-xs block leading-snug">
                    {evacuationRoute.destination.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {evacuationRoute.destination.districtName}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 shrink-0">
                  VERIFIED TES
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-center">
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Jarak Jaringan:</span>
                  <span className="text-xs font-mono font-bold text-slate-100">
                    {(evacuationRoute.distanceMeters / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Est. Waktu Jalan:</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    ~{Math.max(1, Math.round(evacuationRoute.durationSeconds / 60))} Menit
                  </span>
                </div>
              </div>

              {evacuationRoute.impedanceMultiplier && evacuationRoute.impedanceMultiplier > 1.0 && (
                <div className="text-[10px] text-amber-300/90 bg-amber-950/30 p-1.5 rounded border border-amber-800/40">
                  ⏱ Faktor Hambatan: <strong>{evacuationRoute.impedanceMultiplier}x</strong> durasi normal (memperhitungkan kepanikan & kepadatan arus pengungsi).
                </div>
              )}

              {/* Status Bahaya Berjenjang */}
              <div
                className={`p-1.5 rounded text-[10px] font-bold leading-tight flex items-start gap-1.5 ${
                  evacuationRoute.hazardSeverity === 'critical' || evacuationRoute.hazardSeverity === 'high'
                    ? 'bg-rose-950/50 border border-rose-800/70 text-rose-300'
                    : evacuationRoute.hazardSeverity === 'medium'
                    ? 'bg-orange-950/50 border border-orange-800/70 text-orange-300'
                    : evacuationRoute.hazardSeverity === 'low'
                    ? 'bg-amber-950/50 border border-amber-800/70 text-amber-300'
                    : 'bg-emerald-950/50 border border-emerald-800/70 text-emerald-300'
                }`}
              >
                {evacuationRoute.hazardSeverity === 'critical' || evacuationRoute.hazardSeverity === 'high' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : evacuationRoute.hazardSeverity === 'medium' || evacuationRoute.hazardSeverity === 'low' ? (
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div>{evacuationRoute.hazardCheckNote}</div>
                  {evacuationRoute.hazardDetails && evacuationRoute.hazardDetails.length > 0 && (
                    <div className="text-[9px] font-normal opacity-90">
                      Bahaya terdeteksi: {evacuationRoute.hazardDetails.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Alokasi Kapasitas TES & Limpasan (Spillover) */}
              {evacuationRoute.capacityAllocation && (
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Okupansi TES 1:</span>
                    <span className={`font-mono font-bold ${evacuationRoute.capacityAllocation.isOverCapacity ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {evacuationRoute.capacityAllocation.occupancyPercentage}% ({evacuationRoute.capacityAllocation.allocatedCount.toLocaleString('id-ID')} / {evacuationRoute.capacityAllocation.primaryCapacity.toLocaleString('id-ID')} jiwa)
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${evacuationRoute.capacityAllocation.isOverCapacity ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, evacuationRoute.capacityAllocation.occupancyPercentage)}%` }}
                    />
                  </div>

                  {evacuationRoute.capacityAllocation.isOverCapacity && evacuationRoute.capacityAllocation.secondaryDestination && (
                    <div className="text-rose-300 bg-rose-950/40 p-1.5 rounded border border-rose-800/50 mt-1">
                      ⚠️ Kuota TES 1 penuh! Limpasan <strong>{evacuationRoute.capacityAllocation.secondaryAllocatedCount.toLocaleString('id-ID')} jiwa</strong> dialihkan ke TES 2: <strong>{evacuationRoute.capacityAllocation.secondaryDestination.name}</strong>.
                    </div>
                  )}
                </div>
              )}

              {/* Detour & Offline Badges */}
              {evacuationRoute.isDetourRoute && (
                <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/60 text-[10px] text-amber-300">
                  🛡 <strong>Rute Penghindaran Bahaya (Detour):</strong> {evacuationRoute.detourReason || 'Jalan memutar dipilih untuk menjauhi zona bahaya simulasi.'}
                </div>
              )}

              {evacuationRoute.offlineMode && (
                <div className="p-1.5 rounded bg-sky-950/40 border border-sky-800/60 text-[10px] text-sky-300 flex items-center gap-1">
                  <span>📶 <strong>Mode Offline Aktif:</strong> Menggunakan fixture rute lokal in-memory (resilience fallback).</span>
                </div>
              )}

              {/* Turn-by-Turn Guidance Accordion */}
              {evacuationRoute.turnByTurnSteps && evacuationRoute.turnByTurnSteps.length > 0 && (
                <div className="pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowTurnByTurn(!showTurnByTurn)}
                    className="w-full py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700/80 text-[10px] font-semibold text-cyan-300 flex items-center justify-between transition-colors"
                  >
                    <span>Petunjuk Belokan ({evacuationRoute.turnByTurnSteps.length} Langkah)</span>
                    <span>{showTurnByTurn ? '▲' : '▼'}</span>
                  </button>

                  {showTurnByTurn && (
                    <div className="mt-1.5 max-h-36 overflow-y-auto space-y-1 pr-1 text-[10px]">
                      {evacuationRoute.turnByTurnSteps.map((step, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-1">
                          <span className="text-slate-300 leading-tight">
                            <strong className="text-cyan-400 mr-1">{idx + 1}.</strong>
                            {step.instruction}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
                            {step.distanceMeters} m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 gap-2">
                <span className="text-[9px] text-slate-500 font-mono truncate max-w-[110px]">
                  {evacuationRoute.provider}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportGeoJSON}
                    className="py-1 px-2 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-[10px] text-cyan-300 font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                    title="Unduh berkas GeoJSON standar untuk analisis spasial di QGIS/ArcGIS"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>Ekspor GeoJSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClearRoute}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {routeError && (
          <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-[10px] text-rose-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold block">Pencarian Rute Tidak Berhasil:</span>
              <span>{routeError}</span>
            </div>
          </div>
        )}
      </div>

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
          Panduan Prosedur Evakuasi Edukatif
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
        <span className="font-semibold text-slate-400 block mb-0.5">Disclaimer Prototipe & Batasan Model:</span>
        DisasterSim adalah prototipe kompetisi untuk kajian edukasi dan demonstrasi rute berbasis data simulasi. Hasil pemodelan bukan peringatan dini resmi dan tidak menggantikan arahan evakuasi otoritas pemerintah (BMKG, PVMBG, BNPB, atau BPBD).
      </div>
    </div>
  );
}
