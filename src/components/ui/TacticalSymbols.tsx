import React from 'react';

interface SymbolProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Belah Ketupat Bahaya PVMBG Resmi (Hazard Diamond)
 * Standar internasional USGS & PVMBG untuk identifikasi status bahaya gunung api.
 */
export function HazardDiamond({ size = 24, level = 3 }: { size?: number; level?: 1 | 2 | 3 | 4 }) {
  const levelColors = {
    1: { bg: '#064E3B', stroke: '#10B981', text: '#A7F3D0', label: 'I' },    // Normal
    2: { bg: '#713F12', stroke: '#EAB308', text: '#FEF08A', label: 'II' },   // Waspada
    3: { bg: '#7C2D12', stroke: '#F97316', text: '#FFEDD5', label: 'III' },  // Siaga
    4: { bg: '#881337', stroke: '#EF4444', text: '#FFE4E6', label: 'IV' },   // Awas
  };

  const current = levelColors[level] || levelColors[3];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Glow Path */}
      <polygon
        points="12,2 22,12 12,22 2,12"
        fill={current.bg}
        stroke={current.stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Center Hazard Level Text */}
      <text
        x="12"
        y="14.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="800"
        fontFamily="ui-monospace, monospace"
        fill={current.text}
      >
        {current.label}
      </text>
    </svg>
  );
}

/**
 * Simbol Puncak Gunung Api Kartografis (Summit Peak)
 */
export function SummitPeakIcon({ size = 20, color = '#F97316' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3L2 20H22L12 3Z"
        fill="#0F172A"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Kawah Puncak & Kolom Asap */}
      <path
        d="M9 14.5L12 9.5L15 14.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="1.5" fill={color} />
    </svg>
  );
}

/**
 * Simbol Puncak Pegunungan Tektonik Non-Vulkanik (Stable Ridge)
 */
export function NonVolcanicRidgeIcon({ size = 20, color = '#10B981' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Puncak Utama */}
      <path
        d="M8 6L1 19H15L8 6Z"
        fill="#022C22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Puncak Pendamping */}
      <path
        d="M16 10L10.5 19H21.5L16 10Z"
        fill="#064E3B"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Lapisan Batuan Tektonik Terlipat */}
      <path
        d="M5 16L8 11L11 16"
        stroke="#34D399"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Simbol Episentrum & Patahan Megathrust Seismik (Seismic Rupture Axis)
 */
export function SeismicEpicenterIcon({ size = 22, color = '#38BDF8' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lingkaran Luar Gelombang */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" opacity="0.85" />
      {/* Titik Pusat Episentrum */}
      <circle cx="12" cy="12" r="2.5" fill={color} />
      {/* Salib Garis Bidik Sumbu Patahan */}
      <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Simbol Tempat Evakuasi Sementara / Akhir (TES / TEV) Mitigasi BNPB
 */
export function ShelterShieldIcon({ size = 18, color = '#10B981' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 6V12C3 17.5 6.8 21.7 12 23C17.2 21.7 21 17.5 21 12V6L12 2Z"
        fill="#064E3B"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="#A7F3D0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
