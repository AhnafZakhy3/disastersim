'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { isOceanCoordinate, createCirclePolygon } from '@/lib/geoUtils';
import { EvacuationRouteResult, RouteOrigin } from '@/lib/routing/routingTypes';
import { calculateOptimalEvacuationRoute } from '@/lib/routing/routingClient';
import { HazardZonePolygon } from '@/lib/routing/hazardCheck';
import ScenarioControls from '@/components/panels/ScenarioControls';
import ImpactSummary from '@/components/panels/ImpactSummary';
import TimelineBar from '@/components/panels/TimelineBar';
import ExportReportModal from '@/components/modals/ExportReportModal';
import MobileBottomSheet from '@/components/panels/MobileBottomSheet';
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

  // Centralized playback timer (Single Source of Truth - prevents double ticks)
  const currentTimeRef = useRef(currentTimeMinutes);
  useEffect(() => {
    currentTimeRef.current = currentTimeMinutes;
  }, [currentTimeMinutes]);

  useEffect(() => {
    if (!isPlaying || activeDisaster === 'standby') return;

    const intervalMs = Math.round(500 / playbackSpeed);
    const interval = setInterval(() => {
      const nextTime = currentTimeRef.current >= 60 ? 60 : currentTimeRef.current + 1;
      setCurrentTimeMinutes(nextTime);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activeDisaster]);

  // Floating HUD Panels Visibility
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Modal export state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Evacuation routing state
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isPickingOrigin, setIsPickingOrigin] = useState<boolean>(false);
  const [customOriginCoord, setCustomOriginCoord] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);

  const handlePickOrigin = (lat: number, lng: number) => {
    setCustomOriginCoord({
      lat,
      lng,
      name: `Titik Warga (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
    });
    setIsPickingOrigin(false);
  };

  const handleTogglePickOrigin = () => {
    setIsPickingOrigin((prev) => !prev);
  };

  const handleResetOrigin = () => {
    setCustomOriginCoord(null);
    setIsPickingOrigin(false);
  };

  // Automatically clear stale evacuation route when scenario, preset, or active disaster changes (ROUTE-07)
  useEffect(() => {
    setEvacuationRoute(null);
    setRouteError(null);
  }, [
    activeDisaster,
    selectedVolcano.id,
    selectedFault.id,
    volcanoScenario.isCustom,
    volcanoScenario.customLocation?.lat,
    volcanoScenario.customLocation?.lng,
    tsunamiScenario.isCustom,
    tsunamiScenario.customLocation?.lat,
    tsunamiScenario.customLocation?.lng,
  ]);

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

  // Calculate Pedestrian Evacuation Route to Verified TES (ROUTE-01 to ROUTE-06)
  const handleCalculateEvacuationRoute = async () => {
    if (activeDisaster === 'standby') {
      setRouteError('Pilih jenis bencana (Gunung Api atau Tsunami) terlebih dahulu sebelum menghitung rute evakuasi.');
      return;
    }

    setIsCalculatingRoute(true);
    setRouteError(null);

    try {
      let origin: RouteOrigin;
      const hazardZones: HazardZonePolygon[] = [];

      // Priority 1: User's personal pinned origin coordinate
      if (customOriginCoord) {
        origin = {
          name: customOriginCoord.name || `Titik Warga (${customOriginCoord.lat.toFixed(4)}°, ${customOriginCoord.lng.toFixed(4)}°)`,
          lat: customOriginCoord.lat,
          lng: customOriginCoord.lng,
          type: 'point',
        };
      } else if (activeDisaster === 'volcano') {
        const vLat = volcanoScenario.isCustom && volcanoScenario.customLocation
          ? volcanoScenario.customLocation.lat
          : selectedVolcano.lat;
        const vLng = volcanoScenario.isCustom && volcanoScenario.customLocation
          ? volcanoScenario.customLocation.lng
          : selectedVolcano.lng;

        // Origin represents residential area / settlement, NOT the volcanic crater
        if (!volcanoScenario.isCustom && selectedVolcano.id === 'merapi') {
          origin = {
            name: 'Pemukiman Kaliurang, Sleman (Lereng Selatan Merapi)',
            lat: -7.595,
            lng: 110.428,
            type: 'point',
          };
        } else {
          origin = {
            name: `Zona Pemukiman Kaki ${volcanoScenario.isCustom ? 'Gunung Kustom' : selectedVolcano.name}`,
            lat: vLat - 0.04,
            lng: vLng,
            type: 'point',
          };
        }
      } else {
        // Tsunami disaster: origin represents coastal resident community
        if (!tsunamiScenario.isCustom && selectedFault.id === 'megathrust_mentawai') {
          origin = {
            name: 'Zona Pemukiman Pantai Purus, Padang Barat',
            lat: -0.938,
            lng: 100.354,
            type: 'coast',
          };
        } else if (!tsunamiScenario.isCustom && selectedFault.id === 'palu_koro') {
          origin = {
            name: 'Pemukiman Terdampak Kelurahan Lere, Palu Barat',
            lat: -0.887,
            lng: 119.852,
            type: 'coast',
          };
        } else if (!tsunamiScenario.isCustom && selectedFault.id === 'megathrust_central_java') {
          origin = {
            name: 'Pemukiman Pesisir Parangtritis, Bantul (DIY)',
            lat: -8.020,
            lng: 110.330,
            type: 'coast',
          };
        } else {
          // Custom scenario or other fault: check for evaluated affected city
          const affectedCity = currentEvaluatedCities.find(
            (c) => c.status === 'danger' || c.status === 'warning'
          );
          if (affectedCity) {
            origin = {
              name: `Zona Pesisir Terdampak ${affectedCity.cityName}`,
              lat: affectedCity.lat,
              lng: affectedCity.lng,
              type: 'city',
            };
          } else {
            origin = {
              name: 'Pemukiman Pesisir Parangtritis, Bantul (DIY)',
              lat: -8.020,
              lng: 110.330,
              type: 'coast',
            };
          }
        }
      }

      // Populate multi-tier hazard zones for realistic avoidance & evaluation
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
      } else {
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

      const affectedPopulation = activeDisaster === 'volcano'
        ? volcanoResult.affectedPopulation
        : tsunamiResult.affectedPopulation;

      const result = await calculateOptimalEvacuationRoute({
        origin,
        disasterType: activeDisaster,
        hazardZones,
        affectedPopulation,
        allowDetour: true,
      });

      if (result.success) {
        setEvacuationRoute(result);
        setRouteError(null);
      } else {
        setEvacuationRoute(null);
        setRouteError(result.error || 'Gagal menghitung rute evakuasi. Silakan periksa jaringan internet Anda.');
      }
    } catch (err: any) {
      setEvacuationRoute(null);
      setRouteError(err?.message || 'Terjadi kesalahan sistem saat menghubungi layanan rute.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleClearRoute = () => {
    setEvacuationRoute(null);
    setRouteError(null);
  };

  return (
    <div className="relative w-screen h-screen h-[100dvh] overflow-hidden bg-[#070B14] text-slate-100 font-sans select-none">
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
          evacuationRoute={evacuationRoute}
          isPickingOrigin={isPickingOrigin}
          customOriginCoord={customOriginCoord}
          onPickOrigin={handlePickOrigin}
          onMapClick={handleMapClick}
          onSelectVolcano={handleSelectVolcano}
          onSelectFault={handleSelectFault}
          onSelectCity={(city) => setFlyToLocation({ lat: city.lat, lng: city.lng })}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. FLOATING TOP HUD / COMMAND CENTER HEADER                    */}
      {/* ============================================================== */}
      <header className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 h-12 sm:h-14 z-20 bg-slate-950/85 border border-slate-800/80 px-2.5 sm:px-4 rounded-xl flex items-center justify-between backdrop-blur-md shadow-2xl">
        {/* Brand Logo & Radar Pulse */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-800 shadow-inner">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-500/30 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-[11px] sm:text-xs md:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="hidden sm:inline">NUSANTARA DISASTER SIMULATOR</span>
                <span className="inline sm:hidden">DISASTER SIM</span>
              </h1>
              <span className="hidden md:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800/60 text-rose-400">
                PETA GEOLOGIS INDONESIA
              </span>
            </div>
            <p className="hidden lg:block text-[10px] text-slate-400 font-medium">
              PROTOTIPE SIMULASI RISIKO GEOLOGIS • PROSEDUR EDUKATIF & DEMONSTRASI RUTE
            </p>
          </div>
        </div>

        {/* Center Quick Switcher: Siaga | Gunung Api | Tsunami (Mathematically centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-slate-900/90 p-0.5 sm:p-1 rounded-lg border border-slate-800 shadow-inner">
          <button
            onClick={() => {
              setActiveDisaster('standby');
              setCurrentTimeMinutes(0);
              setIsPlaying(false);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
              activeDisaster === 'standby'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mode Siaga Pantau Nasional"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Siaga Pantau</span>
            <span className="inline sm:hidden">Siaga</span>
          </button>
          <button
            onClick={() => {
              setActiveDisaster('volcano');
              setCurrentTimeMinutes(20);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
              activeDisaster === 'volcano'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Simulasi Erupsi Gunung Berapi"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Gunung Berapi</span>
            <span className="inline sm:hidden">Gunung</span>
          </button>
          <button
            onClick={() => {
              setActiveDisaster('tsunami');
              setCurrentTimeMinutes(25);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
              activeDisaster === 'tsunami'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Simulasi Tsunami Megathrust"
          >
            <Waves className="w-3.5 h-3.5 text-cyan-300" />
            <span>Tsunami</span>
          </button>
        </div>

        {/* Right Status & Export Brief Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>KOMPUTASI IN-MEMORY</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors shadow-sm"
            title="Unduh Disaster Impact Brief (PDF)"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Unduh Brief (PDF)</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. LEFT FLOATING HUD DRAWER (SCENARIO CONTROLS - DESKTOP ONLY) */}
      {/* ============================================================== */}
      <div
        className={`hidden md:flex absolute top-20 bottom-24 left-3 z-30 transition-transform duration-300 ${
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
      {/* 4. RIGHT FLOATING HUD DRAWER (TACTICAL IMPACT - DESKTOP ONLY)  */}
      {/* ============================================================== */}
      <div
        className={`hidden md:flex absolute top-20 bottom-24 right-3 z-30 transition-transform duration-300 flex-row-reverse ${
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
            evacuationRoute={evacuationRoute}
            isCalculatingRoute={isCalculatingRoute}
            routeError={routeError}
            isPickingOrigin={isPickingOrigin}
            customOriginCoord={customOriginCoord}
            onTogglePickOrigin={handleTogglePickOrigin}
            onResetOrigin={handleResetOrigin}
            onCalculateRoute={handleCalculateEvacuationRoute}
            onClearRoute={handleClearRoute}
            onFlyToCity={(city) => setFlyToLocation({ lat: city.lat, lng: city.lng })}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. BOTTOM FLOATING TIMELINE HUD DOCK (DESKTOP ONLY)            */}
      {/* ============================================================== */}
      <div className="hidden md:block absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-3">
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
      {/* 6. MOBILE INTERACTIVE BOTTOM SHEET (MOBILE & TABLET COMPACT)   */}
      {/* ============================================================== */}
      <div className="block md:hidden">
        <MobileBottomSheet
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
          volcanoResult={volcanoResult}
          tsunamiResult={tsunamiResult}
          currentTimeMinutes={currentTimeMinutes}
          onTimeChange={setCurrentTimeMinutes}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          onResetTime={() => {
            setCurrentTimeMinutes(0);
            setIsPlaying(false);
          }}
          cities={currentEvaluatedCities}
          evacuationRoute={evacuationRoute}
          isCalculatingRoute={isCalculatingRoute}
          routeError={routeError}
          isPickingOrigin={isPickingOrigin}
          customOriginCoord={customOriginCoord}
          onTogglePickOrigin={handleTogglePickOrigin}
          onResetOrigin={handleResetOrigin}
          onCalculateRoute={handleCalculateEvacuationRoute}
          onClearRoute={handleClearRoute}
          onFlyToCity={(city) => setFlyToLocation({ lat: city.lat, lng: city.lng })}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onTriggerSimulation={() => {
            setCurrentTimeMinutes(60);
            setIsPlaying(false);
          }}
          onResetDefaults={handleResetDefaults}
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
        evacuationRoute={evacuationRoute}
      />
    </div>
  );
}
