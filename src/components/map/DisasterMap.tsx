'use client';

import { useEffect, useRef, useState } from 'react';
import type * as L from 'leaflet';
import {
  DisasterType,
  VolcanoPreset,
  TsunamiFaultPreset,
  VolcanoScenario,
  TsunamiScenario,
  VolcanoSimulationResult,
  TsunamiSimulationResult,
} from '@/types/disaster';
import VolcanoLayers from './VolcanoLayers';
import TsunamiLayers from './TsunamiLayers';
import {
  Globe,
  LocateFixed,
  ZoomIn,
  ZoomOut,
  Layers,
  Crosshair,
  Map as MapIcon,
  Check,
} from 'lucide-react';
import {
  SummitPeakIcon,
  NonVolcanicRidgeIcon,
  SeismicEpicenterIcon,
} from '@/components/ui/TacticalSymbols';
import CityMarkersLayer from '@/components/map/CityMarkersLayer';
import { EvaluatedCity } from '@/types/disaster';

type BasemapStyle = 'dark' | 'satellite' | 'streets';

interface DisasterMapProps {
  activeDisaster: DisasterType;
  selectedVolcano: VolcanoPreset;
  selectedFault: TsunamiFaultPreset;
  volcanoScenario: VolcanoScenario;
  tsunamiScenario: TsunamiScenario;
  volcanoResult: VolcanoSimulationResult;
  tsunamiResult: TsunamiSimulationResult;
  currentTimeMinutes: number;
  cities?: EvaluatedCity[];
  flyToLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  onSelectVolcano?: (volcano: VolcanoPreset) => void;
  onSelectFault?: (fault: TsunamiFaultPreset) => void;
  onSelectCity?: (city: EvaluatedCity) => void;
}

export default function DisasterMap({
  activeDisaster,
  selectedVolcano,
  selectedFault,
  volcanoScenario,
  tsunamiScenario,
  volcanoResult,
  tsunamiResult,
  currentTimeMinutes,
  cities,
  flyToLocation,
  onMapClick,
  onSelectVolcano,
  onSelectFault,
  onSelectCity,
}: DisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const refTileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [showLayerFilter, setShowLayerFilter] = useState(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>('dark');

  // Layer filters
  const [showActiveVolcanoes, setShowActiveVolcanoes] = useState(true);
  const [showNonVolcanoes, setShowNonVolcanoes] = useState(true);
  const [showTsunamiFaults, setShowTsunamiFaults] = useState(true);
  const [showCitiesLayer, setShowCitiesLayer] = useState(true);

  // Smooth flyTo triggered externally
  useEffect(() => {
    if (flyToLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([flyToLocation.lat, flyToLocation.lng], 9, { duration: 1.2 });
    }
  }, [flyToLocation]);

  // Prevent automatic zoom-in on initial mount so users see the entire Indonesia map
  const isInitialMount = useRef(true);

  // Update Tile Layers when basemapStyle changes
  const applyBasemap = (style: BasemapStyle, map: L.Map, LModule: typeof L) => {
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (refTileLayerRef.current) {
      map.removeLayer(refTileLayerRef.current);
      refTileLayerRef.current = null;
    }

    if (style === 'dark') {
      // Esri Dark Gray Base + Reference Labels (Zero API Key, High Contrast, Dark Aesthetic)
      baseTileLayerRef.current = LModule.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: 'Esri, HERE, Garmin',
        }
      ).addTo(map);

      refTileLayerRef.current = LModule.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          opacity: 0.9,
        }
      ).addTo(map);
    } else if (style === 'satellite') {
      // Esri World Imagery (Satellite)
      baseTileLayerRef.current = LModule.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Esri, Maxar, Earthstar Geographics',
        }
      ).addTo(map);

      refTileLayerRef.current = LModule.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          opacity: 0.85,
        }
      ).addTo(map);
    } else {
      // OpenStreetMap Standard
      baseTileLayerRef.current = LModule.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }
      ).addTo(map);
    }
  };

  // Initialize Leaflet map instance on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isCancelled = false;

    import('leaflet').then((LModule) => {
      if (isCancelled || !mapContainerRef.current || mapInstanceRef.current) return;

      // Start centered on the Indonesian Archipelago (Sabang to Merauke panoramic view)
      const map = LModule.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      // Apply initial basemap (Dark Gray Canvas)
      applyBasemap('dark', map, LModule);

      // Handle custom coordinate click
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick(parseFloat(e.latlng.lat.toFixed(4)), parseFloat(e.latlng.lng.toFixed(4)));
        }
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch basemap on user toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((LModule) => {
      if (mapInstanceRef.current) {
        applyBasemap(basemapStyle, mapInstanceRef.current, LModule);
      }
    });
  }, [basemapStyle]);

  // Robust ResizeObserver to guarantee Leaflet recalculates canvas size immediately
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Smoothly fly to target coordinates ONLY when user changes volcano/fault AFTER initial mount
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (activeDisaster === 'standby') {
      return;
    }

    let targetLat = -7.5407;
    let targetLng = 110.4457;
    let targetZoom = 9;

    if (activeDisaster === 'volcano') {
      targetLat = volcanoScenario.isCustom && volcanoScenario.customLocation
        ? volcanoScenario.customLocation.lat
        : selectedVolcano.lat;
      targetLng = volcanoScenario.isCustom && volcanoScenario.customLocation
        ? volcanoScenario.customLocation.lng
        : selectedVolcano.lng;
      targetZoom = selectedVolcano.category === 'non_volcano' ? 8 : 9;
    } else {
      targetLat = tsunamiScenario.isCustom && tsunamiScenario.customLocation
        ? tsunamiScenario.customLocation.lat
        : selectedFault.lat;
      targetLng = tsunamiScenario.isCustom && tsunamiScenario.customLocation
        ? tsunamiScenario.customLocation.lng
        : selectedFault.lng;
      targetZoom = 7;
    }

    mapInstanceRef.current.flyTo([targetLat, targetLng], targetZoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [
    activeDisaster,
    selectedVolcano.id,
    selectedFault.id,
    volcanoScenario.isCustom,
    volcanoScenario.customLocation,
    tsunamiScenario.isCustom,
    tsunamiScenario.customLocation,
  ]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleViewAllIndonesia = () => {
    mapInstanceRef.current?.flyTo([-2.5, 118.0], 5, { duration: 1.2 });
  };

  const handleRecenterHazard = () => {
    if (!mapInstanceRef.current) return;
    if (activeDisaster === 'standby') {
      handleViewAllIndonesia();
      return;
    }

    const targetLat = activeDisaster === 'volcano'
      ? (volcanoScenario.isCustom ? volcanoScenario.customLocation?.lat ?? -7.54 : selectedVolcano.lat)
      : (tsunamiScenario.isCustom ? tsunamiScenario.customLocation?.lat ?? -9.25 : selectedFault.lat);
    const targetLng = activeDisaster === 'volcano'
      ? (volcanoScenario.isCustom ? volcanoScenario.customLocation?.lng ?? 110.44 : selectedVolcano.lng)
      : (tsunamiScenario.isCustom ? tsunamiScenario.customLocation?.lng ?? 110.50 : selectedFault.lng);

    mapInstanceRef.current.flyTo([targetLat, targetLng], activeDisaster === 'volcano' ? 9 : 7, {
      duration: 1.2,
    });
  };

  const isCustomModeActive =
    (activeDisaster === 'volcano' && volcanoScenario.isCustom) ||
    (activeDisaster === 'tsunami' && tsunamiScenario.isCustom);

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#070B14] ${
        isCustomModeActive ? 'cursor-crosshair' : ''
      }`}
    >
      {/* 1. NATIVE LEAFLET CONTAINER (100% FULL-SCREEN VIEWPORT) */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. FLOATING HUD TOOLBAR (TOP CENTER - NEVER BLOCKED BY DRAWERS) */}
      <div className="absolute top-[58px] sm:top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-2xl max-w-[calc(100vw-16px)]">
        {/* View Entire Indonesia */}
        <button
          onClick={handleViewAllIndonesia}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 shadow-sm transition-all shrink-0"
          title="Tampilkan Seluruh Kepulauan Indonesia"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Seluruh Indonesia</span>
        </button>

        {/* Focus to Active Hazard Target (Only active when in volcano/tsunami mode) */}
        {activeDisaster !== 'standby' && (
          <button
            onClick={handleRecenterHazard}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm transition-all shrink-0"
            title="Fokuskan Kamera ke Lokasi Bencana Terpilih"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fokus Target</span>
          </button>
        )}

        <div className="w-[1px] h-3.5 sm:h-4 bg-slate-800 mx-0.5 sm:mx-1 shrink-0" />

        {/* Zoom Controls */}
        <button
          onClick={handleZoomIn}
          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors shrink-0"
          title="Perbesar Peta (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors shrink-0"
          title="Perkecil Peta (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 sm:h-4 bg-slate-800 mx-0.5 sm:mx-1 shrink-0" />

        {/* Basemap Switcher */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setShowBasemapMenu(!showBasemapMenu);
              setShowLayerFilter(false);
            }}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              showBasemapMenu
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
            title="Ganti Lapisan Peta Dasar"
          >
            <MapIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline capitalize">{basemapStyle === 'dark' ? 'Gelap' : basemapStyle === 'satellite' ? 'Satelit' : 'Jalan'}</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute top-10 right-0 w-36 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 text-xs flex flex-col gap-1">
              <button
                onClick={() => {
                  setBasemapStyle('dark');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  basemapStyle === 'dark' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span>Dark Canvas</span>
                {basemapStyle === 'dark' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button
                onClick={() => {
                  setBasemapStyle('satellite');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  basemapStyle === 'satellite' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span>Citra Satelit</span>
                {basemapStyle === 'satellite' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button
                onClick={() => {
                  setBasemapStyle('streets');
                  setShowBasemapMenu(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  basemapStyle === 'streets' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span>OpenStreetMap</span>
                {basemapStyle === 'streets' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Layer Filter Toggle */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setShowLayerFilter(!showLayerFilter);
              setShowBasemapMenu(false);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              showLayerFilter
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
            title="Filter Lapisan Bencana"
          >
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Lapisan</span>
          </button>

          {/* Layer Filter Popover */}
          {showLayerFilter && (
            <div className="absolute top-10 right-0 w-64 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl z-50 text-xs">
              <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Filter Objek Peta</span>
                <button
                  onClick={() => setShowLayerFilter(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showActiveVolcanoes}
                    onChange={(e) => setShowActiveVolcanoes(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <SummitPeakIcon size={14} color="#F97316" />
                    <span>Gunung Berapi Aktif</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showNonVolcanoes}
                    onChange={(e) => setShowNonVolcanoes(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <NonVolcanicRidgeIcon size={14} color="#10B981" />
                    <span>Gunung Non-Vulkanik</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTsunamiFaults}
                    onChange={(e) => setShowTsunamiFaults(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <SeismicEpicenterIcon size={14} color="#38BDF8" />
                    <span>Zona Megathrust / Sesar</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCitiesLayer}
                    onChange={(e) => setShowCitiesLayer(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Kota & Kabupaten (514 Wilayah)</span>
                  </span>
                </label>
              </div>

              {/* Legend guide */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                {activeDisaster === 'volcano' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-rose-400">Awan Panas Luncuran Dinamis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-rose-500 border-dashed"></div>
                      <span className="text-slate-300">Radius KRB III PVMBG (Bahaya)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-yellow-500 border-dashed"></div>
                      <span className="text-yellow-400">Radius KRB I PVMBG (Waspada)</span>
                    </div>
                  </>
                ) : activeDisaster === 'tsunami' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
                      <span className="text-sky-400">Puncak Gelombang Tsunami</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-rose-500"></div>
                      <span className="text-rose-400">Garis Pantai BMKG AWAS</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-slate-400">
                    Mode Siaga Nasional: Klik sembarang objek untuk melihat parameter bahaya.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. CUSTOM CLICK MODE BANNER */}
      {isCustomModeActive && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 border border-rose-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-pulse backdrop-blur-md">
          <Crosshair className="w-4 h-4 text-rose-300" />
          <span>Mode Kustom: Klik sembarang titik di peta Indonesia untuk memindahkan episentrum/kawah!</span>
        </div>
      )}

      {/* 4. VOLCANO & TSUNAMI VECTOR OVERLAYS */}
      {/* In Standby mode, render volcano pins & fault pins with 0 impact radiuses */}
      {mapReady && (activeDisaster === 'volcano' || activeDisaster === 'standby') && (
        <VolcanoLayers
          map={mapInstanceRef.current}
          selectedVolcano={selectedVolcano}
          scenario={volcanoScenario}
          result={
            activeDisaster === 'standby'
              ? {
                  ...volcanoResult,
                  krb3RadiusKm: 0,
                  krb2RadiusKm: 0,
                  krb1RadiusKm: 0,
                  ashPlumePolygon: [],
                  ashIsopachTiers: [],
                }
              : volcanoResult
          }
          currentTimeMinutes={activeDisaster === 'standby' ? 0 : currentTimeMinutes}
          showActiveVolcanoes={showActiveVolcanoes}
          showNonVolcanoes={showNonVolcanoes}
          onSelectVolcano={onSelectVolcano}
        />
      )}

      {mapReady && (activeDisaster === 'tsunami' || activeDisaster === 'standby') && (
        <TsunamiLayers
          map={mapInstanceRef.current}
          selectedFault={selectedFault}
          scenario={tsunamiScenario}
          result={
            activeDisaster === 'standby'
              ? {
                  ...tsunamiResult,
                  isochroneRings: [],
                  districtImpacts: [],
                }
              : tsunamiResult
          }
          currentTimeMinutes={activeDisaster === 'standby' ? 0 : currentTimeMinutes}
          showTsunamiFaults={showTsunamiFaults}
          onSelectFault={onSelectFault}
        />
      )}

      {/* 514 Kota & Kabupaten Nationwide Layer */}
      {mapReady && cities && cities.length > 0 && (
        <CityMarkersLayer
          map={mapInstanceRef.current}
          cities={cities}
          showCities={showCitiesLayer}
          onSelectCity={onSelectCity}
        />
      )}
    </div>
  );
}
