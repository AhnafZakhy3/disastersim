'use client';

import React, { useRef, useState } from 'react';
import {
  DisasterType,
  VolcanoPreset,
  TsunamiFaultPreset,
  VolcanoScenario,
  TsunamiScenario,
  VolcanoSimulationResult,
  TsunamiSimulationResult,
} from '@/types/disaster';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldAlert,
  Calendar,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { sanitizeFilename } from '@/lib/sanitize';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDisaster: DisasterType;
  selectedVolcano: VolcanoPreset;
  selectedFault: TsunamiFaultPreset;
  volcanoScenario: VolcanoScenario;
  tsunamiScenario: TsunamiScenario;
  volcanoResult: VolcanoSimulationResult;
  tsunamiResult: TsunamiSimulationResult;
}

export default function ExportReportModal({
  isOpen,
  onClose,
  activeDisaster,
  selectedVolcano,
  selectedFault,
  volcanoScenario,
  tsunamiScenario,
  volcanoResult,
  tsunamiResult,
}: ExportReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<'volcano' | 'tsunami'>(
    activeDisaster === 'tsunami' ? 'tsunami' : 'volcano'
  );

  if (!isOpen) return null;

  const isVolcano = reportType === 'volcano';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hazardName = isVolcano
    ? volcanoScenario.isCustom
      ? 'Kawah Vulkanik Kustom'
      : selectedVolcano.name
    : tsunamiScenario.isCustom
    ? 'Episentrum Laut Kustom'
    : selectedFault.name;

  const regionName = isVolcano
    ? selectedVolcano.province
    : selectedFault.region;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(reportRef.current, { quality: 0.95 });
      const safeHazardName = sanitizeFilename(hazardName, 'Disaster-Brief');
      const link = document.createElement('a');
      link.download = `Disaster-Brief-${safeHazardName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3 text-slate-100 font-bold text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Disaster Impact Brief</span>
            </div>
            {/* Quick Type Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setReportType('volcano')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  reportType === 'volcano'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gunung Api
              </button>
              <button
                type="button"
                onClick={() => setReportType('tsunami')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  reportType === 'tsunami'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tsunami
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Brief Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]" id="printable-brief">
          <div
            ref={reportRef}
            className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-slate-100 space-y-5"
          >
            {/* Header Document */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span className="text-[11px] font-black tracking-widest text-rose-500 uppercase">
                    NUSANTARA DISASTER SIMULATOR
                  </span>
                </div>
                <h1 className="text-xl font-black text-slate-100">
                  DISASTER IMPACT BRIEF
                </h1>
                <p className="text-xs text-slate-400">
                  Ringkasan Eksekutif Simulasi Bahaya Geologis PVMBG & BMKG
                </p>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono space-y-0.5">
                <div className="flex items-center justify-end gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentDate}</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  STATUS: FINAL REPORT
                </div>
              </div>
            </div>

            {/* Target & Parameter Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                  Objek Bencana
                </span>
                <span className="font-extrabold text-slate-100 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {hazardName}
                </span>
                <span className="text-[11px] text-slate-400">{regionName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                  Parameter Skenario
                </span>
                <span className="text-xs text-slate-200 font-mono">
                  {isVolcano
                    ? `VEI: ${volcanoScenario.vei} • Angin: ${volcanoScenario.windSpeedKmh} km/h (${volcanoScenario.windDirectionDeg}°)`
                    : `Gempa: M ${tsunamiScenario.mw.toFixed(1)} Mw • Kedalaman: ${tsunamiScenario.depthKm} km`}
                </span>
              </div>
            </div>

            {/* Tactical Metrics Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Rekapitulasi Parameter Dampak
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">
                    Status Peringatan
                  </span>
                  <span
                    className="text-sm font-black mt-1 block"
                    style={{
                      color: isVolcano
                        ? volcanoResult.alertColor
                        : tsunamiResult.bmkgColor,
                    }}
                  >
                    {isVolcano
                      ? volcanoResult.alertLevel
                      : tsunamiResult.bmkgStatus}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">
                    Golden Time (ETA)
                  </span>
                  <span className="text-sm font-black text-orange-400 mt-1 block font-mono">
                    {isVolcano
                      ? `${volcanoResult.etaPyroclasticMinutes} Menit`
                      : `${tsunamiResult.etaCoastMinutes} Menit`}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">
                    Populasi Terpapar
                  </span>
                  <span className="text-sm font-black text-rose-400 mt-1 block font-mono">
                    ~
                    {isVolcano
                      ? volcanoResult.affectedPopulation.toLocaleString('id-ID')
                      : tsunamiResult.affectedPopulation.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">
                  {isVolcano ? 'Radius Bahaya Utama (KRB III)' : 'Estimasi Tinggi Gelombang Pantai'}
                </span>
                <span className="font-bold text-slate-100 font-mono">
                  {isVolcano
                    ? `${volcanoResult.krb3RadiusKm} km`
                    : `${tsunamiResult.coastWaveHeightM} meter`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">
                  {isVolcano ? 'Jangkauan Sebaran Abu Vulkanik' : 'Jarak Penetrasi Rendaman Daratan'}
                </span>
                <span className="font-bold text-slate-100 font-mono">
                  {isVolcano
                    ? `${volcanoResult.ashPlumeLengthKm} km`
                    : `${tsunamiResult.inundationDistanceM} meter`}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">
                  {isVolcano ? 'Fasilitas Kesehatan Terancam' : 'Akses Pesisir / Pelabuhan'}
                </span>
                <span className="font-bold text-slate-100 font-mono">
                  {isVolcano
                    ? `${volcanoResult.affectedFacilities.health} Unit Puskesmas/RS`
                    : `${tsunamiResult.affectedFacilities.ports} Pelabuhan / ${tsunamiResult.affectedFacilities.coastalRoadsKm} km Jalan`}
                </span>
              </div>
            </div>

            {/* Impacted Cities Summary */}
            {((isVolcano ? volcanoResult.impactedCities : tsunamiResult.impactedCities)?.length ?? 0) > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Wilayah / Daerah Kota-Kabupaten Terdampak Utama
                </span>
                <span className="text-slate-200 font-medium">
                  {(isVolcano ? volcanoResult.impactedCities : tsunamiResult.impactedCities)
                    .slice(0, 6)
                    .map((c) => c.cityName)
                    .join(' • ')}
                </span>
              </div>
            )}

            {/* Official Safety Protocols */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Instruksi Evakuasi & Keselamatan (BNPB)
              </h4>
              <ul className="space-y-1 text-xs text-slate-300">
                {(isVolcano
                  ? volcanoResult.bnpbInstructions
                  : tsunamiResult.bnpbInstructions
                ).map((ins, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Disclaimer */}
            <div className="pt-3 border-t border-slate-800 text-[9px] text-slate-500 text-center font-mono leading-relaxed">
              NUSANTARA DISASTER SIMULATOR • SIMULASI EDUKASI & KAJIAN RISIKO EMPIRIS • BUKAN PERINGATAN RESMI OPERASIONAL BMKG/PVMBG/BNPB
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-900/40 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Memproses...' : 'Unduh Gambar (PNG)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
