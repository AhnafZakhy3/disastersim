'use client';

import React from 'react';
import { DisasterType } from '@/types/disaster';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface TimelineBarProps {
  activeDisaster: DisasterType;
  currentTimeMinutes: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onJumpToMax: () => void;
  onResetTime: () => void;
  onStartVolcano?: () => void;
  onStartTsunami?: () => void;
}

export default function TimelineBar({
  activeDisaster,
  currentTimeMinutes,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  onJumpToMax,
  onResetTime,
  onStartVolcano,
  onStartTsunami,
}: TimelineBarProps) {
  const isVolcano = activeDisaster === 'volcano';
  const isStandby = activeDisaster === 'standby';
  const accentColor = isVolcano ? '#EF4444' : '#06B6D4';
  const progressPercent = (currentTimeMinutes / 60) * 100;

  // Phase labels based on time
  const getEventPhase = (minutes: number) => {
    if (isVolcano) {
      if (minutes <= 5) return 'Fase 1: Erupsi Eksplosif Awal';
      if (minutes <= 25) return 'Fase 2: Luncuran Awan Panas Guguran (PDC)';
      return 'Fase 3: Sebaran Abu Vulkanik & Banjir Lahar';
    } else {
      if (minutes <= 10) return 'Fase 1: Propagasi Gelombang Laut Dalam';
      if (minutes <= 25) return 'Fase 2: Deformasi & Paparan Dangkal';
      return 'Fase 3: Inundasi & Hempasan Garis Pantai';
    }
  };

  if (isStandby) {
    return (
      <div className="w-full bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-300">
            Pusat Komando Siaga Nasional: Pilih gunung atau zona gempa untuk memulai perambatan waktu T+0 s.d T+60m
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onStartVolcano && (
            <button
              onClick={onStartVolcano}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition-colors"
            >
              Uji Erupsi
            </button>
          )}
          {onStartTsunami && (
            <button
              onClick={onStartTsunami}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/40 transition-colors"
            >
              Uji Tsunami
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex flex-col md:flex-row items-center gap-4">
      {/* Playback Controls & Time Display */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onTogglePlay}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
              : isVolcano
              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
              : 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/40'
          }`}
          title={isPlaying ? 'Jeda Simulasi' : 'Jalankan Perambatan Waktu'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onResetTime}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Reset Waktu ke T+0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed selector */}
        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-1 rounded transition-colors ${
                playbackSpeed === spd
                  ? 'bg-slate-800 text-cyan-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Timecode Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 tabular-nums">
            T + {currentTimeMinutes.toString().padStart(2, '0')}:00
          </span>
          <span className="text-[10px] text-slate-500">/ 60:00 m</span>
        </div>
      </div>

      {/* Main Timeline Scrubber Track */}
      <div className="flex-1 w-full flex items-center gap-3">
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">{getEventPhase(currentTimeMinutes)}</span>
            <span className="text-slate-500">{currentTimeMinutes}m dari 60m</span>
          </div>

          <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full transition-all duration-150 rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: accentColor,
                boxShadow: `0 0 12px ${accentColor}`,
              }}
            />
          </div>

          <input
            id="timeline-time-scrubber"
            name="timeline-time"
            aria-label="Pengatur Waktu Perambatan Simulasi Bencana"
            type="range"
            min="0"
            max="60"
            step="1"
            value={currentTimeMinutes}
            onChange={(e) => onTimeChange(parseInt(e.target.value))}
            className="absolute z-10 w-full h-6 opacity-0 cursor-pointer"
          />

          {/* Time markers across the track */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1 pointer-events-none">
            <span>T+0m</span>
            <span>T+15m</span>
            <span>T+30m</span>
            <span>T+45m</span>
            <span>T+60m (Maks)</span>
          </div>
        </div>

        {/* Quick Button: Jump to Max Impact */}
        <button
          type="button"
          onClick={onJumpToMax}
          className="shrink-0 flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all"
        >
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          <span>Dampak Maksimal</span>
        </button>
      </div>
    </div>
  );
}
