'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  DisasterType,
  VolcanoPreset,
  TsunamiFaultPreset,
  VolcanoScenario,
  TsunamiScenario,
  EvaluatedCity,
} from '@/types/disaster';
import { INDONESIA_VOLCANOES } from '@/data/volcanoes';
import { INDONESIA_TSUNAMI_FAULTS } from '@/data/tsunamiFaults';
import { INDONESIA_CITIES } from '@/data/indonesiaCities';
import { simulateVolcanoEruption } from '@/lib/simulation/volcanoModel';
import { simulateTsunamiImpact } from '@/lib/simulation/tsunamiModel';
import { isOceanCoordinate } from '@/lib/geoUtils';
import ScenarioControls from '@/components/panels/ScenarioControls';
import ImpactSummary from '@/components/panels/ImpactSummary';
import TimelineBar from '@/components/panels/TimelineBar';
import ExportReportModal from '@/components/modals/ExportReportModal';
import {
  Flame,
  Waves,
  FileDown,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sliders,
  BarChart3,
  Shield,
} from 'lucide-react';

// Dynamic import of Leaflet DisasterMap with zero SSR
const DisasterMap = dynamic(() => import('@/components/map/DisasterMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#070B14] text-slate-400 gap-3">
      <div className="w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
        Memuat Peta Spasial Indonesia & Cincin Api Nusantara...
      </span>
    </div>
  ),
});

export default function DisasterSimulatorPage() {
  // Disaster selection state: Default is 'standby' (Clean Slate national overview)
  const [activeDisaster, setActiveDisaster] = useState<DisasterType>('standby');

  // Volcano scenario state: Default to Gunung Merapi (Yogyakarta / Jawa Tengah)
  const defaultVolcano = useMemo(
    () => INDONESIA_VOLCANOES.find((v) => v.id === 'merapi') || INDONESIA_VOLCANOES[0],
    []
  );
  const [selectedVolcano, setSelectedVolcano] = useState<VolcanoPreset>(defaultVolcano);
  const [volcanoScenario, setVolcanoScenario] = useState<VolcanoScenario>({
    volcanoId: defaultVolcano.id,
    isCustom: false,
    vei: defaultVolcano.defaultVEI,
    windDirectionDeg: 225, // SW toward Sleman / Yogyakarta
    windSpeedKmh: 35,
  });

  // Tsunami scenario state
  const [selectedFault, setSelectedFault] = useState<TsunamiFaultPreset>(
    INDONESIA_TSUNAMI_FAULTS[0] // Sunda Megathrust Selatan Jawa
  );
  const [tsunamiScenario, setTsunamiScenario] = useState<TsunamiScenario>({
    faultId: INDONESIA_TSUNAMI_FAULTS[0].id,
    isCustom: false,
    mw: INDONESIA_TSUNAMI_FAULTS[0].defaultMw,
    depthKm: INDONESIA_TSUNAMI_FAULTS[0].defaultDepthKm,
  });

  // Timeline & Playback state: default 0 min in standby
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Floating HUD Panels Visibility
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Modal export state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Compute simulation outputs reactively with zero lag (sub-second memoization)
  const volcanoResult = useMemo(() => {
    return simulateVolcanoEruption(volcanoScenario);
  }, [volcanoScenario]);

  const tsunamiResult = useMemo(() => {
    return simulateTsunamiImpact(tsunamiScenario, currentTimeMinutes);
  }, [tsunamiScenario, currentTimeMinutes]);

  // Neutral city evaluation for Standby Mode (Clean Slate)
  const standbyEvaluatedCities = useMemo<EvaluatedCity[]>(() => {
    return INDONESIA_CITIES.map((c) => ({
      id: c.id,
      cityName: c.name,
      type: c.type,
      province: c.province,
      islandGroup: c.islandGroup,
      lat: c.lat,
      lng: c.lng,
      population: c.population,
      isCoastal: c.isCoastal,
      distanceKm: 0,
      status: 'standby',
      statusLabel: 'Siaga Pantau (Tidak Ada Bencana Aktif)',
      ashFallCategory: 'none',
    }));
  }, []);

  // Aggregate all 514 evaluated cities based on active mode
  const currentEvaluatedCities = useMemo(() => {
    if (activeDisaster === 'volcano') {
      return volcanoResult.allEvaluatedCities || [];
    }
    if (activeDisaster === 'tsunami') {
      return tsunamiResult.allEvaluatedCities || [];
    }
    // Standby mode: return all 514 cities in neutral standby status
    return standbyEvaluatedCities;
  }, [activeDisaster, volcanoResult, tsunamiResult, standbyEvaluatedCities]);

  // Handle map click: Smart Spatial Detection (Ocean -> Tsunami, Land -> Volcano)
  const handleMapClick = (lat: number, lng: number) => {
    const isOcean = isOceanCoordinate(lat, lng);
    if (isOcean) {
      setActiveDisaster('tsunami');
      setTsunamiScenario((prev) => ({
        ...prev,
        isCustom: true,
        customLocation: {
          lat,
          lng,
          name: `Episentrum Lepas Pantai (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
        },
        mw: prev.mw || 8.5,
        depthKm: prev.depthKm || 20,
      }));
      setCurrentTimeMinutes(25);
    } else {
      setActiveDisaster('volcano');
      setVolcanoScenario((prev) => ({
        ...prev,
        isCustom: true,
        customLocation: {
          lat,
          lng,
          name: `Kawah Baru Daratan (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
        },
        vei: prev.vei || 3,
        windDirectionDeg: prev.windDirectionDeg || 225,
        windSpeedKmh: prev.windSpeedKmh || 35,
      }));
      setCurrentTimeMinutes(20);
    }
  };

  const handleResetDefaults = () => {
    setActiveDisaster('standby');
    setVolcanoScenario({
      volcanoId: selectedVolcano.id,
      isCustom: false,
      vei: selectedVolcano.defaultVEI,
      windDirectionDeg: 225,
      windSpeedKmh: 35,
    });
    setTsunamiScenario({
      faultId: selectedFault.id,
      isCustom: false,
      mw: selectedFault.defaultMw,
      depthKm: selectedFault.defaultDepthKm,
    });
    setCurrentTimeMinutes(0);
    setIsPlaying(false);
  };

  const handleSelectVolcano = (volcano: VolcanoPreset) => {
    setSelectedVolcano(volcano);
    setActiveDisaster('volcano');
    setVolcanoScenario((prev) => ({
      ...prev,
      volcanoId: volcano.id,
      isCustom: false,
      customLocation: undefined,
      vei: volcano.defaultVEI > 0 ? volcano.defaultVEI : 1,
    }));
    setCurrentTimeMinutes(20);
  };

  const handleSelectFault = (fault: TsunamiFaultPreset) => {
    setSelectedFault(fault);
    setActiveDisaster('tsunami');
    setTsunamiScenario((prev) => ({
      ...prev,
      faultId: fault.id,
      isCustom: false,
      customLocation: undefined,
      mw: fault.defaultMw,
      depthKm: fault.defaultDepthKm,
    }));
    setCurrentTimeMinutes(25);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070B14] text-slate-100 font-sans select-none">
      {/* ============================================================== */}
      {/* 1. FULL-SCREEN CANVAS MAP (OCCUPIES 100% OF VIEWPORT)          */}
      {/* ============================================================== */}
      <div className="absolute inset-0 w-full h-full z-0">
        <DisasterMap
          activeDisaster={activeDisaster}
          selectedVolcano={selectedVolcano}
          selectedFault={selectedFault}
          volcanoScenario={volcanoScenario}
          tsunamiScenario={tsunamiScenario}
          volcanoResult={volcanoResult}
          tsunamiResult={tsunamiResult}
          currentTimeMinutes={currentTimeMinutes}
          cities={currentEvaluatedCities}
          flyToLocation={flyToLocation}
          onMapClick={handleMapClick}
          onSelectVolcano={handleSelectVolcano}
          onSelectFault={handleSelectFault}
          onSelectCity={(city) => setFlyToLocation({ lat: city.lat, lng: city.lng })}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. FLOATING TOP HUD / COMMAND CENTER HEADER                    */}
      {/* ============================================================== */}
      <header className="absolute top-3 left-3 right-3 h-14 z-20 bg-slate-950/85 border border-slate-800/80 px-4 rounded-xl flex items-center justify-between backdrop-blur-md shadow-2xl">
        {/* Brand Logo & Radar Pulse */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="absolute w-4 h-4 rounded-full bg-rose-500/30 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                NUSANTARA DISASTER SIMULATOR
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800/60 text-rose-400">
                PETA GEOLOGIS INDONESIA
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-400 font-medium">
              SIMULASI EMPIRIS CEPAT LETUSAN GUNUNG BERAPI & TSUNAMI • PVMBG & BMKG
            </p>
          </div>
        </div>

        {/* Center Quick Switcher: Siaga | Gunung Api | Tsunami (Mathematically centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 shadow-inner">
          <button
            onClick={() => {
              setActiveDisaster('standby');
              setCurrentTimeMinutes(0);
              setIsPlaying(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeDisaster === 'standby'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Siaga Pantau</span>
          </button>
          <button
            onClick={() => {
              setActiveDisaster('volcano');
              setCurrentTimeMinutes(20);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeDisaster === 'volcano'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Gunung Berapi</span>
          </button>
          <button
            onClick={() => {
              setActiveDisaster('tsunami');
              setCurrentTimeMinutes(25);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeDisaster === 'tsunami'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-300" />
            <span>Tsunami</span>
          </button>
        </div>

        {/* Right Status & Export Brief Button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>60 FPS • IN-MEMORY</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Unduh Brief (PDF)</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. LEFT FLOATING HUD DRAWER (SCENARIO CONTROLS - 350px)        */}
      {/* ============================================================== */}
      <div
        className={`absolute top-20 bottom-24 left-3 z-30 transition-transform duration-300 flex ${
          showLeftPanel ? 'translate-x-0' : '-translate-x-[calc(100%-28px)]'
        }`}
      >
        <div className="w-[350px] h-full bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl p-3 flex flex-col overflow-hidden">
          <ScenarioControls
            activeDisaster={activeDisaster}
            onDisasterChange={(type) => {
              setActiveDisaster(type);
              setCurrentTimeMinutes(type === 'volcano' ? 20 : 25);
            }}
            selectedVolcano={selectedVolcano}
            onVolcanoChange={setSelectedVolcano}
            volcanoScenario={volcanoScenario}
            onVolcanoScenarioChange={setVolcanoScenario}
            selectedFault={selectedFault}
            onFaultChange={setSelectedFault}
            tsunamiScenario={tsunamiScenario}
            onTsunamiScenarioChange={setTsunamiScenario}
            onTriggerSimulation={() => {
              setCurrentTimeMinutes(60);
              setIsPlaying(false);
            }}
            onResetDefaults={handleResetDefaults}
          />
        </div>

        {/* Toggle Collapse Button for Left Drawer */}
        <button
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          className="self-center -ml-1 w-6 h-12 bg-slate-900/90 border border-slate-700 rounded-r-lg text-slate-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
          title={showLeftPanel ? 'Sembunyikan Panel Kontrol' : 'Buka Panel Kontrol'}
        >
          {showLeftPanel ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. RIGHT FLOATING HUD DRAWER (TACTICAL IMPACT - 350px)         */}
      {/* ============================================================== */}
      <div
        className={`absolute top-20 bottom-24 right-3 z-30 transition-transform duration-300 flex ${
          showRightPanel ? 'translate-x-0' : 'translate-x-[calc(100%-28px)]'
        }`}
      >
        {/* Toggle Collapse Button for Right Drawer */}
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          className="self-center -mr-1 w-6 h-12 bg-slate-900/90 border border-slate-700 rounded-l-lg text-slate-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors z-10"
          title={showRightPanel ? 'Sembunyikan Panel Analisis' : 'Buka Panel Analisis'}
        >
          {showRightPanel ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <div className="w-[350px] h-full bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl p-3 flex flex-col overflow-hidden">
          <ImpactSummary
            activeDisaster={activeDisaster}
            selectedVolcano={selectedVolcano}
            selectedFault={selectedFault}
            volcanoScenario={volcanoScenario}
            tsunamiScenario={tsunamiScenario}
            volcanoResult={volcanoResult}
            tsunamiResult={tsunamiResult}
            currentTimeMinutes={currentTimeMinutes}
            cities={currentEvaluatedCities}
            onFlyToCity={(city) => setFlyToLocation({ lat: city.lat, lng: city.lng })}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. BOTTOM FLOATING TIMELINE HUD DOCK                           */}
      {/* ============================================================== */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-3">
        <TimelineBar
          activeDisaster={activeDisaster}
          currentTimeMinutes={currentTimeMinutes}
          onTimeChange={setCurrentTimeMinutes}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          onJumpToMax={() => {
            setCurrentTimeMinutes(60);
            setIsPlaying(false);
          }}
          onResetTime={() => {
            setCurrentTimeMinutes(0);
            setIsPlaying(false);
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 6. EXPORT BRIEF MODAL                                          */}
      {/* ============================================================== */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeDisaster={activeDisaster}
        selectedVolcano={selectedVolcano}
        selectedFault={selectedFault}
        volcanoScenario={volcanoScenario}
        tsunamiScenario={tsunamiScenario}
        volcanoResult={volcanoResult}
        tsunamiResult={tsunamiResult}
      />
    </div>
  );
}
