'use client';

import React, { useState, useMemo } from 'react';
import {
  DisasterType,
  VolcanoPreset,
  TsunamiFaultPreset,
  VolcanoScenario,
  TsunamiScenario,
} from '@/types/disaster';
import { INDONESIA_VOLCANOES } from '@/data/volcanoes';
import { INDONESIA_TSUNAMI_FAULTS } from '@/data/tsunamiFaults';
import { degreeToCompassIndonesian } from '@/lib/geoUtils';
import {
  Flame,
  Waves,
  Wind,
  Compass,
  RotateCcw,
  Play,
  Crosshair,
  Shield,
  Search,
} from 'lucide-react';
import {
  HazardDiamond,
  SummitPeakIcon,
  SeismicEpicenterIcon,
} from '@/components/ui/TacticalSymbols';
import StandbyBriefing from './StandbyBriefing';

interface ScenarioControlsProps {
  activeDisaster: DisasterType;
  onDisasterChange: (type: DisasterType) => void;
  selectedVolcano: VolcanoPreset;
  onVolcanoChange: (volcano: VolcanoPreset) => void;
  volcanoScenario: VolcanoScenario;
  onVolcanoScenarioChange: (scenario: VolcanoScenario) => void;
  selectedFault: TsunamiFaultPreset;
  onFaultChange: (fault: TsunamiFaultPreset) => void;
  tsunamiScenario: TsunamiScenario;
  onTsunamiScenarioChange: (scenario: TsunamiScenario) => void;
  onTriggerSimulation: () => void;
  onResetDefaults: () => void;
}

export default function ScenarioControls({
  activeDisaster,
  onDisasterChange,
  selectedVolcano,
  onVolcanoChange,
  volcanoScenario,
  onVolcanoScenarioChange,
  selectedFault,
  onFaultChange,
  tsunamiScenario,
  onTsunamiScenarioChange,
  onTriggerSimulation,
  onResetDefaults,
}: ScenarioControlsProps) {
  const [islandFilter, setIslandFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredVolcanoes = useMemo(() => {
    return INDONESIA_VOLCANOES.filter((v) => {
      if (islandFilter === 'non_volcano') {
        if (v.category !== 'non_volcano') return false;
      } else if (islandFilter !== 'all') {
        if (islandFilter === 'Maluku-Papua') {
          if (v.islandGroup !== 'Maluku' && v.islandGroup !== 'Papua' && v.islandGroup !== 'Maluku-Papua') {
            return false;
          }
        } else if (v.islandGroup !== islandFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.province.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [islandFilter, searchQuery]);

  const getVEILabel = (vei: number) => {
    switch (vei) {
      case 1:
        return 'VEI 1 — Efusif / Letusan Ringan';
      case 2:
        return 'VEI 2 — Eksplosif Sedang (Strombolian)';
      case 3:
        return 'VEI 3 — Eksplosif Kuat (Vulkanian)';
      case 4:
        return 'VEI 4 — Paroksismal (Sub-Plinian / Merapi 2010)';
      case 5:
        return 'VEI 5 — Dahsyat (Plinian / Agung 1963)';
      case 6:
        return 'VEI 6 — Kolosal (Krakatau 1883)';
      case 7:
        return 'VEI 7 — Super-Erupsi (Tambora 1815)';
      case 8:
        return 'VEI 8 — Mega-Kolosal / Supervulkan (Toba ~74.000 BP)';
      default:
        return `VEI ${vei}`;
    }
  };

  const getVEILevel = (vei: number): 1 | 2 | 3 | 4 => {
    if (vei <= 1) return 1;
    if (vei === 2) return 2;
    if (vei <= 4) return 3;
    return 4;
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 text-slate-200">
      {/* 1. Mode Selector Tabs: Siaga | Gunung Api | Tsunami */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onDisasterChange('standby')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
            activeDisaster === 'standby'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Siaga</span>
        </button>

        <button
          type="button"
          onClick={() => onDisasterChange('volcano')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
            activeDisaster === 'volcano'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Gunung Api</span>
        </button>

        <button
          type="button"
          onClick={() => onDisasterChange('tsunami')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
            activeDisaster === 'tsunami'
              ? 'bg-sky-950/80 text-sky-300 border border-sky-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-sky-400" />
          <span>Tsunami</span>
        </button>
      </div>

      {/* 2. Mode Siaga Standby Briefing */}
      {activeDisaster === 'standby' && (
        <StandbyBriefing
          onStartVolcano={() => onDisasterChange('volcano')}
          onStartTsunami={() => onDisasterChange('tsunami')}
        />
      )}

      {/* 3. Skenario Gunung Berapi Form */}
      {activeDisaster === 'volcano' && (
        <div className="space-y-4">
          {/* Target Volcano Selection & Filters */}
          <div className="space-y-2">
            <label htmlFor="volcano-select" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SummitPeakIcon size={14} color="#F97316" />
                <span>Pilihan Gunung (Katalog PVMBG — 78 Puncak)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedVolcano.elevationM} mdpl
              </span>
            </label>

            {/* Island Group Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Semua (78)' },
                { id: 'Jawa', label: 'Jawa (24)' },
                { id: 'Sumatera', label: 'Sumatera (12)' },
                { id: 'Bali-NusaTenggara', label: 'Bali-NT (14)' },
                { id: 'Sulawesi', label: 'Sulawesi (9)' },
                { id: 'Maluku-Papua', label: 'Maluku-Papua (10)' },
                { id: 'non_volcano', label: 'Non-Vulkanik (9)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setIslandFilter(tab.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    islandFilter === tab.id
                      ? 'bg-rose-600 text-white font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
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
                id="volcano-search-input"
                name="volcano-search"
                aria-label="Cari nama gunung atau provinsi"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama gunung / provinsi (misal: Slamet, Marapi, Ijen)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Custom Location Indicator Banner if active */}
            {volcanoScenario.isCustom && (
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-amber-200 truncate font-mono text-[11px]">
                    {volcanoScenario.customLocation?.name || 'Kawah Baru Daratan Kustom'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onVolcanoScenarioChange({
                      ...volcanoScenario,
                      isCustom: false,
                      customLocation: undefined,
                      volcanoId: selectedVolcano.id,
                    });
                  }}
                  className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded text-[10px] font-semibold shrink-0 transition-colors"
                >
                  Reset ke Katalog
                </button>
              </div>
            )}

            {/* Select Dropdown */}
            <select
              id="volcano-select"
              name="volcano-select"
              aria-label="Pilih Target Gunung Api"
              value={volcanoScenario.isCustom ? 'custom' : selectedVolcano.id}
              onChange={(e) => {
                const found = INDONESIA_VOLCANOES.find((v) => v.id === e.target.value);
                if (found) {
                  onVolcanoChange(found);
                  onVolcanoScenarioChange({
                    ...volcanoScenario,
                    isCustom: false,
                    customLocation: undefined,
                    volcanoId: found.id,
                    vei: found.defaultVEI > 0 ? found.defaultVEI : 1,
                  });
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
            >
              {volcanoScenario.isCustom && (
                <option value="custom" disabled>
                  📍 {volcanoScenario.customLocation?.name || 'Titik Kustom Aktif'}
                </option>
              )}
              {filteredVolcanoes.length === 0 ? (
                <option disabled>Tidak ditemukan gunung yang cocok</option>
              ) : (
                filteredVolcanoes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.category === 'non_volcano' ? '⛰ ' : '▲ '}
                    {v.name} ({v.province} — {v.elevationM} m)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* VEI Slider & PVMBG Alert Indicator */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <HazardDiamond size={16} level={getVEILevel(volcanoScenario.vei)} />
                <span>Indeks Daya Letusan (VEI)</span>
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-950 text-rose-300 border border-rose-500/40 tabular-nums">
                VEI {volcanoScenario.vei}
              </span>
            </div>

            <input
              id="vei-slider"
              name="vei-slider"
              aria-label="Volcanic Explosivity Index"
              type="range"
              min={1}
              max={8}
              step={1}
              value={volcanoScenario.vei}
              onChange={(e) =>
                onVolcanoScenarioChange({
                  ...volcanoScenario,
                  vei: parseInt(e.target.value),
                })
              }
              className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/80">
              {getVEILabel(volcanoScenario.vei)}
            </div>
          </div>

          {/* Wind Direction & Wind Speed */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Arah Angin Troposfer</span>
                </span>
                <span className="font-mono text-cyan-300 font-bold tabular-nums">
                  {volcanoScenario.windDirectionDeg}°
                </span>
              </div>
              <input
                id="wind-direction-slider"
                name="wind-direction-slider"
                aria-label="Arah Angin Troposfer"
                type="range"
                min={0}
                max={360}
                step={5}
                value={volcanoScenario.windDirectionDeg}
                onChange={(e) =>
                  onVolcanoScenarioChange({
                    ...volcanoScenario,
                    windDirectionDeg: parseInt(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-cyan-300/80 text-right font-medium">
                Menuju ke: {degreeToCompassIndonesian(volcanoScenario.windDirectionDeg)}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kecepatan Angin</span>
                </span>
                <span className="font-mono text-slate-200 tabular-nums font-bold">
                  {volcanoScenario.windSpeedKmh} km/jam
                </span>
              </div>
              <input
                id="wind-speed-slider"
                name="wind-speed-slider"
                aria-label="Kecepatan Angin"
                type="range"
                min={5}
                max={90}
                step={5}
                value={volcanoScenario.windSpeedKmh}
                onChange={(e) =>
                  onVolcanoScenarioChange({
                    ...volcanoScenario,
                    windSpeedKmh: parseInt(e.target.value),
                  })
                }
                className="w-full accent-slate-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Skenario Tsunami Form */}
      {activeDisaster === 'tsunami' && (
        <div className="space-y-4">
          {/* Target Fault Selection */}
          <div className="space-y-1.5">
            <label htmlFor="fault-select" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SeismicEpicenterIcon size={14} color="#38BDF8" />
                <span>Pusat Gempa / Patahan Subduksi</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Kedalaman {selectedFault.avgOceanDepthM} m
              </span>
            </label>

            {/* Custom Epicenter Indicator Banner if active */}
            {tsunamiScenario.isCustom && (
              <div className="p-2.5 bg-sky-950/40 border border-sky-500/40 rounded-lg flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                  <span className="text-sky-200 truncate font-mono text-[11px]">
                    {tsunamiScenario.customLocation?.name || 'Episentrum Lepas Pantai Kustom'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onTsunamiScenarioChange({
                      ...tsunamiScenario,
                      isCustom: false,
                      customLocation: undefined,
                      faultId: selectedFault.id,
                      mw: selectedFault.defaultMw,
                      depthKm: selectedFault.defaultDepthKm,
                    });
                  }}
                  className="px-2 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 rounded text-[10px] font-semibold shrink-0 transition-colors"
                >
                  Reset ke Katalog
                </button>
              </div>
            )}

            <select
              id="fault-select"
              name="fault-select"
              aria-label="Pilih Patahan Megathrust"
              value={tsunamiScenario.isCustom ? 'custom' : selectedFault.id}
              onChange={(e) => {
                const found = INDONESIA_TSUNAMI_FAULTS.find((f) => f.id === e.target.value);
                if (found) {
                  onFaultChange(found);
                  onTsunamiScenarioChange({
                    ...tsunamiScenario,
                    isCustom: false,
                    customLocation: undefined,
                    faultId: found.id,
                    mw: found.defaultMw,
                    depthKm: found.defaultDepthKm,
                  });
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
            >
              {tsunamiScenario.isCustom && (
                <option value="custom" disabled>
                  🌊 {tsunamiScenario.customLocation?.name || 'Episentrum Kustom Aktif'}
                </option>
              )}
              {INDONESIA_TSUNAMI_FAULTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Mw {f.defaultMw})
                </option>
              ))}
            </select>
          </div>

          {/* Mw Slider */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Magnitudo Gempa (Mw)</span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-950 text-sky-300 border border-sky-500/40 tabular-nums">
                M {tsunamiScenario.mw.toFixed(1)}
              </span>
            </div>
            <input
              id="mw-slider"
              name="mw-slider"
              aria-label="Magnitudo Gempa Mw"
              type="range"
              min={6.5}
              max={9.2}
              step={0.1}
              value={tsunamiScenario.mw}
              onChange={(e) =>
                onTsunamiScenarioChange({
                  ...tsunamiScenario,
                  mw: parseFloat(e.target.value),
                })
              }
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>M 6.5 (Kecil)</span>
              <span>M 7.8 (Besar)</span>
              <span>M 9.2 (Mega)</span>
            </div>
          </div>

          {/* Focal Depth Slider */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Kedalaman Hiposenter</span>
              <span className="font-mono text-slate-200 tabular-nums font-bold text-xs">
                {tsunamiScenario.depthKm} km {tsunamiScenario.depthKm <= 30 ? '(Dangkal)' : '(Menengah)'}
              </span>
            </div>
            <input
              id="depth-slider"
              name="depth-slider"
              aria-label="Kedalaman Pusat Gempa"
              type="range"
              min={10}
              max={70}
              step={5}
              value={tsunamiScenario.depthKm}
              onChange={(e) =>
                onTsunamiScenarioChange({
                  ...tsunamiScenario,
                  depthKm: parseInt(e.target.value),
                })
              }
              className="w-full accent-slate-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              *Gempa dangkal (&lt;30 km) memiliki daya angkat dasar laut jauh lebih besar terhadap potensi tsunami destruktif.
            </p>
          </div>
        </div>
      )}

      {/* 4. Action Buttons (Only for active disaster simulation) */}
      {activeDisaster !== 'standby' && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={onTriggerSimulation}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Jalankan Simulasi Taktis</span>
          </button>

          <button
            type="button"
            onClick={onResetDefaults}
            className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ke Siaga Nasional</span>
          </button>
        </div>
      )}
    </div>
  );
}
