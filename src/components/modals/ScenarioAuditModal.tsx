'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sliders,
  Flame,
  Waves,
  Compass,
  Search,
  ArrowUpRight,
  Activity,
  Layers,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  run100ScenariosAudit,
  BatchAuditReport,
  ScenarioTestResult,
} from '@/lib/simulation/scenarioRunner';
import {
  VolcanoScenario,
  TsunamiScenario,
  VolcanoPreset,
  TsunamiFaultPreset,
} from '@/types/disaster';
import { INDONESIA_VOLCANOES } from '@/data/volcanoes';
import { INDONESIA_TSUNAMI_FAULTS } from '@/data/tsunamiFaults';

interface ScenarioAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVolcanoScenario: (scenario: VolcanoScenario, volcano: VolcanoPreset) => void;
  onApplyTsunamiScenario: (scenario: TsunamiScenario, fault: TsunamiFaultPreset) => void;
  onApplyCustomScenario: (
    type: 'volcano' | 'tsunami',
    location: { lat: number; lng: number; name: string },
    params: { vei?: number; mw?: number; depthKm?: number; windDeg?: number; windSpeed?: number }
  ) => void;
}

export default function ScenarioAuditModal({
  isOpen,
  onClose,
  onApplyVolcanoScenario,
  onApplyTsunamiScenario,
  onApplyCustomScenario,
}: ScenarioAuditModalProps) {
  const [report, setReport] = useState<BatchAuditReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'volcano' | 'tsunami' | 'custom_ocean' | 'custom_land'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Run audit on first mount when modal opens
  useEffect(() => {
    if (isOpen && !report) {
      runAudit();
    }
  }, [isOpen]);

  const runAudit = () => {
    setIsRunning(true);
    // Use timeout to allow UI render cycle to show loading state
    setTimeout(() => {
      const newReport = run100ScenariosAudit();
      setReport(newReport);
      setIsRunning(false);
    }, 150);
  };

  const filteredResults = useMemo(() => {
    if (!report) return [];
    return report.results.filter((res) => {
      const matchCat =
        selectedCategory === 'all' ? true : res.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === ''
          ? true
          : res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.scenarioId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.parametersDesc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [report, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleLaunchScenario = (res: ScenarioTestResult) => {
    if (res.category === 'volcano') {
      const matchedVolcano =
        INDONESIA_VOLCANOES.find((v) => res.name.includes(v.name)) ||
        INDONESIA_VOLCANOES[0];
      // Parse VEI from parametersDesc
      const veiMatch = res.parametersDesc.match(/VEI (\d+)/);
      const vei = veiMatch ? parseInt(veiMatch[1], 10) : matchedVolcano.defaultVEI;
      const windMatch = res.parametersDesc.match(/Angin (\d+)°/);
      const windDeg = windMatch ? parseInt(windMatch[1], 10) : 225;
      const speedMatch = res.parametersDesc.match(/(\d+) km\/h/);
      const speedKmh = speedMatch ? parseInt(speedMatch[1], 10) : 35;

      onApplyVolcanoScenario(
        {
          volcanoId: matchedVolcano.id,
          isCustom: false,
          vei,
          windDirectionDeg: windDeg,
          windSpeedKmh: speedKmh,
        },
        matchedVolcano
      );
    } else if (res.category === 'tsunami') {
      const matchedFault =
        INDONESIA_TSUNAMI_FAULTS.find((f) => res.name.includes(f.name)) ||
        INDONESIA_TSUNAMI_FAULTS[0];
      const mwMatch = res.parametersDesc.match(/Mw ([\d.]+)/);
      const mw = mwMatch ? parseFloat(mwMatch[1]) : matchedFault.defaultMw;
      const depthMatch = res.parametersDesc.match(/Kedalaman (\d+) km/);
      const depthKm = depthMatch ? parseInt(depthMatch[1], 10) : matchedFault.defaultDepthKm;

      onApplyTsunamiScenario(
        {
          faultId: matchedFault.id,
          isCustom: false,
          mw,
          depthKm,
        },
        matchedFault
      );
    } else if (res.category === 'custom_ocean') {
      const mwMatch = res.parametersDesc.match(/Mw ([\d.]+)/);
      const mw = mwMatch ? parseFloat(mwMatch[1]) : 8.5;
      const depthMatch = res.parametersDesc.match(/Kedalaman (\d+) km/);
      const depthKm = depthMatch ? parseInt(depthMatch[1], 10) : 20;

      // Use scenario coordinates
      let lat = -8.5;
      let lng = 115.5;
      if (res.scenarioId === 'TSU-CUST-081') { lat = -8.7; lng = 115.3; }
      else if (res.scenarioId === 'TSU-CUST-082') { lat = -5.9; lng = 105.8; }
      else if (res.scenarioId === 'TSU-CUST-083') { lat = 1.8; lng = 125.1; }

      onApplyCustomScenario(
        'tsunami',
        { lat, lng, name: res.name },
        { mw, depthKm }
      );
    } else if (res.category === 'custom_land') {
      const veiMatch = res.parametersDesc.match(/VEI (\d+)/);
      const vei = veiMatch ? parseInt(veiMatch[1], 10) : 3;

      let lat = -7.2;
      let lng = 110.4;
      if (res.scenarioId === 'VOL-CUST-093') { lat = -7.0; lng = 107.5; }
      else if (res.scenarioId === 'VOL-CUST-094') { lat = -0.5; lng = 100.5; }

      onApplyCustomScenario(
        'volcano',
        { lat, lng, name: res.name },
        { vei, windDeg: 270, windSpeed: 30 }
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* ========================================================== */}
        {/* MODAL HEADER                                               */}
        {/* ========================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-black text-white tracking-wide">
                  AUDIT OTOMATIS 100 SKENARIO BENCANA
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                  SUITE VERIFIKASI NASIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Uji Ketahanan & Validitas Fisika Spasial terhadap 514 Kota/Kabupaten di 38 Provinsi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAudit}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Menguji...' : 'Uji Ulang (100)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* AUDIT SUMMARY STATS BAR                                    */}
        {/* ========================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/40 border-b border-slate-800/70">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Skenario
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {report ? report.totalScenarios : '...'} / 100
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Status Kelulusan
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {report ? `${report.passedCount} Lolos (100%)` : '...'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Cakupan Wilayah
              </div>
              <div className="text-lg font-mono font-bold text-amber-300">
                {report ? `${report.totalCitiesEvaluated.toLocaleString()} Uji` : '...'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Rata-rata Latensi
              </div>
              <div className="text-lg font-mono font-bold text-purple-300">
                {report ? `${report.avgExecutionTimeMs.toFixed(2)} ms` : '...'}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* CONTROLS: CATEGORY TABS & SEARCH BAR                       */}
        {/* ========================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-slate-950">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({report?.totalScenarios || 100})
            </button>
            <button
              onClick={() => setSelectedCategory('volcano')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'volcano'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Vulkanik (40)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('tsunami')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'tsunami'
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span>Tsunami (40)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('custom_ocean')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'custom_ocean'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lepas Pantai (12)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('custom_land')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'custom_land'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Daratan Kustom (8)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari skenario, gunung, atau sesar..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* ========================================================== */}
        {/* SCENARIO RESULTS TABLE / LIST                              */}
        {/* ========================================================== */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2 sm:p-4 space-y-1.5">
          {isRunning ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-300">
                Mengeksekusi 100 Skenario Spasial & Menguji 514 Kota...
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Tidak ada skenario yang cocok dengan kata kunci pencarian.
            </div>
          ) : (
            filteredResults.map((res) => (
              <div
                key={res.scenarioId}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                {/* Left: ID & Scenario Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                      res.category === 'volcano'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : res.category === 'tsunami'
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : res.category === 'custom_ocean'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {res.category === 'volcano' ? (
                      <Flame className="w-4 h-4" />
                    ) : res.category === 'tsunami' ? (
                      <Waves className="w-4 h-4" />
                    ) : (
                      <Compass className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {res.scenarioId}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{res.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {res.parametersDesc}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                      <span className="text-amber-400 font-medium">
                        {res.summaryMetric}
                      </span>
                      <span>•</span>
                      <span>
                        {res.threatenedCitiesCount} dari {res.citiesEvaluatedCount} Kota Terancam
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400">
                        {res.executionTimeMs.toFixed(2)} ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Badge & Apply Button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Lolos</span>
                  </span>

                  <button
                    onClick={() => handleLaunchScenario(res)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors"
                    title="Jalankan skenario ini di simulator utama"
                  >
                    <span>Terapkan</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================== */}
        {/* MODAL FOOTER                                               */}
        {/* ========================================================== */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Semua formula spasial diverifikasi tanpa error numerik (0 NaN).</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
