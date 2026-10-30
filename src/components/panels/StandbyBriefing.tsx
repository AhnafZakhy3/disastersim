'use client';

import React from 'react';
import {
  Activity,
  Compass,
  AlertTriangle,
  Waves,
  Flame,
  MousePointerClick,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  SummitPeakIcon,
  SeismicEpicenterIcon,
  NonVolcanicRidgeIcon,
} from '@/components/ui/TacticalSymbols';

interface StandbyBriefingProps {
  onStartVolcano: () => void;
  onStartTsunami: () => void;
}

export default function StandbyBriefing({
  onStartVolcano,
  onStartTsunami,
}: StandbyBriefingProps) {
  return (
    <div className="space-y-4 text-slate-200">
      {/* 1. Header Taktis Siaga Nasional */}
      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Status Siaga Nasional
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">24/7 IN-MEMORY</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Pusat pemodelan interaktif dampak bahaya geologis kepulauan Indonesia. Belum ada skenario bencana aktif yang dijalankan.
        </p>
      </div>

      {/* 2. Tombol Aksi Cepat Simulasi */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Inisialisasi Cepat Skenario</span>
        </div>

        {/* Erupsi Gunung Api Button */}
        <button
          onClick={onStartVolcano}
          className="w-full text-left p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-orange-500/30 hover:border-orange-500/60 transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-orange-950/80 border border-orange-500/50 text-orange-400">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-orange-300 group-hover:text-orange-200">
                Simulasi Erupsi Vulkanik
              </span>
            </div>
            <span className="text-[10px] font-mono text-orange-400">VEI 1 - 8</span>
          </div>
          <p className="text-[11px] text-slate-400 pl-8">
            Pilih dari katalog gunung api aktif PVMBG untuk memodelkan radius KRB I/II/III, awan panas, dan dispersi abu.
          </p>
        </button>

        {/* Tsunami Megathrust Button */}
        <button
          onClick={onStartTsunami}
          className="w-full text-left p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500/60 transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-sky-950/80 border border-sky-500/50 text-sky-400">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-sky-300 group-hover:text-sky-200">
                Simulasi Tsunami Megathrust
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-400">Mw 6.5 - 9.2</span>
          </div>
          <p className="text-[11px] text-slate-400 pl-8">
            Pilih zona subduksi aktif untuk menghitung perambatan gelombang laut dalam, amplifikasi pantai, dan status BMKG.
          </p>
        </button>
      </div>

      {/* 3. Panduan Interaktif Spasial (Smart Detection) */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
          <span>Eksplorasi Spasial Langsung</span>
        </div>
        <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 leading-normal">
          <li>
            <strong className="text-slate-200">Klik Pin Gunung</strong> di peta untuk melihat profil elevasi dan memulai simulasi di kawah tersebut.
          </li>
          <li>
            <strong className="text-slate-200">Klik Bebas di Laut</strong>: Sistem otomatis mendeteksi perairan dan menginisialisasi skenario Tsunami.
          </li>
          <li>
            <strong className="text-slate-200">Klik Bebas di Daratan</strong>: Sistem otomatis menginisialisasi skenario Kawah Vulkanik Kustom.
          </li>
        </ul>
      </div>

      {/* 4. Simbologi Standar Kartografi */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Simbologi Peta Resmi</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950 border border-slate-800/80">
            <SummitPeakIcon size={16} color="#F97316" />
            <span className="text-slate-300">Gunung Api Aktif</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950 border border-slate-800/80">
            <NonVolcanicRidgeIcon size={16} color="#10B981" />
            <span className="text-slate-300">Puncak Non-Vulkanik</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950 border border-slate-800/80">
            <SeismicEpicenterIcon size={16} color="#38BDF8" />
            <span className="text-slate-300">Patahan Megathrust</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-slate-950 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Shelter Evakuasi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
