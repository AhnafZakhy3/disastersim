'use client';

import React, { useState, useRef, TouchEvent } from 'react';
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
import ScenarioControls from './ScenarioControls';
import ImpactSummary from './ImpactSummary';
import {
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Sliders,
  BarChart3,
  Maximize2,
  Shield,
} from 'lucide-react';

export type BottomSheetHeight = 'peek' | 'half' | 'full';
export type MobileTab = 'controls' | 'impact';

interface MobileBottomSheetProps {
  activeDisaster: DisasterType;
  onDisasterChange: (type: DisasterType) => void;
  selectedVolcano: VolcanoPreset;
  onVolcanoChange: (v: VolcanoPreset) => void;
  volcanoScenario: VolcanoScenario;
  onVolcanoScenarioChange: (s: VolcanoScenario) => void;
  selectedFault: TsunamiFaultPreset;
  onFaultChange: (f: TsunamiFaultPreset) => void;
  tsunamiScenario: TsunamiScenario;
  onTsunamiScenarioChange: (s: TsunamiScenario) => void;
  volcanoResult: VolcanoSimulationResult;
  tsunamiResult: TsunamiSimulationResult;
  currentTimeMinutes: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onResetTime: () => void;
  cities?: EvaluatedCity[];
  onFlyToCity?: (city: EvaluatedCity) => void;
  onOpenExportModal: () => void;
  onTriggerSimulation: () => void;
  onResetDefaults: () => void;
}

export default function MobileBottomSheet({
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
  volcanoResult,
  tsunamiResult,
  currentTimeMinutes,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  onResetTime,
  cities = [],
  onFlyToCity,
  onOpenExportModal,
  onTriggerSimulation,
  onResetDefaults,
}: MobileBottomSheetProps) {
  const [heightState, setHeightState] = useState<BottomSheetHeight>('peek');
  const [activeTab, setActiveTab] = useState<MobileTab>('controls');

  // Touch Drag Gestures for handle
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartYRef.current - touchEndY; // Positive = dragged UP, Negative = dragged DOWN

    if (deltaY > 40) {
      // Swiped UP
      if (heightState === 'peek') setHeightState('half');
      else if (heightState === 'half') setHeightState('full');
    } else if (deltaY < -40) {
      // Swiped DOWN
      if (heightState === 'full') setHeightState('half');
      else if (heightState === 'half') setHeightState('peek');
    }
    touchStartYRef.current = null;
  };

  const toggleHeight = () => {
    if (heightState === 'peek') setHeightState('half');
    else if (heightState === 'half') setHeightState('full');
    else setHeightState('peek');
  };

  const threatenedCitiesCount = cities.filter((c) => c.status !== 'safe' && c.status !== 'standby').length;

  // CSS height class mappings
  const heightClasses = {
    peek: 'h-[68px]',
    half: 'h-[52dvh]',
    full: 'h-[86dvh]',
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 shadow-2xl flex flex-col transition-all duration-300 ease-out pb-safe ${heightClasses[heightState]}`}
    >
      {/* ============================================================== */}
      {/* 1. INTERACTIVE HANDLE & INTEGRATED TIMELINE HEADER BAR          */}
      {/* ============================================================== */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full h-[68px] min-h-[68px] px-3 pt-1.5 pb-2 flex flex-col justify-between select-none cursor-pointer border-b border-slate-800/50 bg-slate-900/60"
      >
        {/* Top Centered Drag Pill Handle */}
        <div onClick={toggleHeight} className="w-full flex justify-center py-0.5">
          <div className="w-12 h-1.5 rounded-full bg-slate-600/70 hover:bg-slate-400 transition-colors"></div>
        </div>

        {/* Row 2: Play/Pause, T+Xm Scrubber, Tab Switchers, and Expand Chevron */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Play/Pause & Time Scrubber */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {activeDisaster !== 'standby' ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-md transition-colors shrink-0 ${
                    isPlaying
                      ? 'bg-amber-600 text-white hover:bg-amber-500'
                      : activeDisaster === 'volcano'
                      ? 'bg-rose-600 text-white hover:bg-rose-500'
                      : 'bg-sky-600 text-white hover:bg-sky-500'
                  }`}
                  title={isPlaying ? 'Jeda Simulasi' : 'Jalankan Simulasi'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Minute Badge */}
                <span className="font-mono text-xs font-black text-rose-400 shrink-0 w-11 text-center bg-slate-900/90 px-1 py-1 rounded border border-slate-800">
                  T+{currentTimeMinutes}m
                </span>

                {/* Mini Time Range Scrubber */}
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={currentTimeMinutes}
                  onChange={(e) => {
                    e.stopPropagation();
                    onTimeChange(Number(e.target.value));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  title="Geser waktu perambatan T+0 s.d T+60m"
                />
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2 py-1 rounded bg-slate-900/80 border border-emerald-900/40">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Siaga Pantau 24/7</span>
              </div>
            )}
          </div>

          {/* Right: Tab Buttons + Expand Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Tab: Skenario Parameter */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('controls');
                if (heightState === 'peek') setHeightState('half');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'controls' && heightState !== 'peek'
                  ? 'bg-slate-800 text-rose-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Parameter</span>
            </button>

            {/* Tab: Dampak & Kota Terancam */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('impact');
                if (heightState === 'peek') setHeightState('half');
              }}
              className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'impact' && heightState !== 'peek'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dampak</span>
              {threatenedCitiesCount > 0 && (
                <span className="ml-0.5 px-1 py-0.2 text-[9px] font-black rounded-full bg-rose-600 text-white">
                  {threatenedCitiesCount}
                </span>
              )}
            </button>

            {/* Height State Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleHeight();
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title={heightState === 'peek' ? 'Perluas Panel' : heightState === 'half' ? 'Layar Penuh' : 'Kecilkan Panel'}
            >
              {heightState === 'peek' ? (
                <ChevronUp className="w-4 h-4 text-emerald-400" />
              ) : heightState === 'half' ? (
                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SCROLLABLE TAB CONTENT (ACTIVE IN HALF OR FULL MODE)         */}
      {/* ============================================================== */}
      {heightState !== 'peek' && (
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 min-h-0">
          {activeTab === 'controls' ? (
            <div className="h-full">
              <ScenarioControls
                activeDisaster={activeDisaster}
                onDisasterChange={onDisasterChange}
                selectedVolcano={selectedVolcano}
                onVolcanoChange={onVolcanoChange}
                volcanoScenario={volcanoScenario}
                onVolcanoScenarioChange={onVolcanoScenarioChange}
                selectedFault={selectedFault}
                onFaultChange={onFaultChange}
                tsunamiScenario={tsunamiScenario}
                onTsunamiScenarioChange={onTsunamiScenarioChange}
                onTriggerSimulation={onTriggerSimulation}
                onResetDefaults={onResetDefaults}
              />
            </div>
          ) : (
            <div className="h-full">
              <ImpactSummary
                activeDisaster={activeDisaster}
                selectedVolcano={selectedVolcano}
                selectedFault={selectedFault}
                volcanoScenario={volcanoScenario}
                tsunamiScenario={tsunamiScenario}
                volcanoResult={volcanoResult}
                tsunamiResult={tsunamiResult}
                currentTimeMinutes={currentTimeMinutes}
                cities={cities}
                onFlyToCity={(city) => {
                  if (heightState === 'full') setHeightState('half');
                  onFlyToCity?.(city);
                }}
                onOpenExportModal={onOpenExportModal}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
