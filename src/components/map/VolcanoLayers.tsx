'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import {
  VolcanoPreset,
  VolcanoScenario,
  VolcanoSimulationResult,
} from '@/types/disaster';
import { INDONESIA_VOLCANOES } from '@/data/volcanoes';
import { escapeHtml } from '@/lib/sanitize';

interface VolcanoLayersProps {
  map: L.Map | null;
  selectedVolcano: VolcanoPreset;
  scenario: VolcanoScenario;
  result: VolcanoSimulationResult;
  currentTimeMinutes: number;
  showActiveVolcanoes?: boolean;
  showNonVolcanoes?: boolean;
  onSelectVolcano?: (volcano: VolcanoPreset) => void;
}

export default function VolcanoLayers({
  map,
  selectedVolcano,
  scenario,
  result,
  currentTimeMinutes,
  showActiveVolcanoes = true,
  showNonVolcanoes = true,
  onSelectVolcano,
}: VolcanoLayersProps) {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    let isCancelled = false;
    import('leaflet').then((LModule) => {
      if (isCancelled || !map) return;

      if (!layerGroupRef.current) {
        layerGroupRef.current = LModule.layerGroup().addTo(map);
      } else {
        layerGroupRef.current.clearLayers();
      }

      const layerGroup = layerGroupRef.current;

      const isNonVolcano = selectedVolcano.category === 'non_volcano';
      const centerLat = scenario.isCustom && scenario.customLocation
        ? scenario.customLocation.lat
        : selectedVolcano.lat;
      const centerLng = scenario.isCustom && scenario.customLocation
        ? scenario.customLocation.lng
        : selectedVolcano.lng;

      // ==============================================================
      // 1. RENDER ALL INDONESIAN MOUNTAINS WITH BESPOKE VECTOR SYMBOLS
      // ==============================================================
      INDONESIA_VOLCANOES.forEach((volcano) => {
        const isCurrent = !scenario.isCustom && volcano.id === selectedVolcano.id;

        // Filters
        if (volcano.category === 'non_volcano' && !showNonVolcanoes) return;
        if (volcano.category === 'active_volcano' && !showActiveVolcanoes && !isCurrent) return;

        if (volcano.category === 'active_volcano') {
          if (!isCurrent) {
            // Unselected active volcano: Tactical Diamond Marker (PVMBG Standard)
            const activePinIcon = LModule.divIcon({
              className: 'unselected-volcano-pin',
              html: `
                <div style="cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #0F172A; border: 1.5px solid #F97316; border-radius: 4px; box-shadow: 0 0 8px rgba(249, 115, 22, 0.4); transform: rotate(45deg); transition: transform 0.15s;" onmouseover="this.style.transform='rotate(45deg) scale(1.2)'" onmouseout="this.style.transform='rotate(45deg) scale(1.0)'">
                  <svg style="transform: rotate(-45deg); width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 21H22L12 2Z" fill="#7C2D12" stroke="#F97316" stroke-width="2" stroke-linejoin="round"/>
                    <circle cx="12" cy="15" r="2" fill="#FDBA74"/>
                  </svg>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const marker = LModule.marker([volcano.lat, volcano.lng], { icon: activePinIcon });
            marker.bindTooltip(`
              <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #F8FAFC;">
                <span style="color: #F97316;">▲ ${escapeHtml(volcano.name)}</span> (${escapeHtml(volcano.elevationM)} m)
                <div style="font-weight: normal; color: #94A3B8; font-size: 10px;">${escapeHtml(volcano.province)} • ${escapeHtml(volcano.type)}</div>
              </div>
            `, { direction: 'top', offset: [0, -12], opacity: 0.95 });

            const safeVolcanoId = escapeHtml(volcano.id);
            marker.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC; min-width: 200px;">
                <div style="font-weight: bold; font-size: 13px; color: #F97316;">▲ ${escapeHtml(volcano.name)}</div>
                <div style="color: #94A3B8; font-size: 11px;">${escapeHtml(volcano.province)} • ${escapeHtml(volcano.elevationM)} mdpl</div>
                <div style="color: #E2E8F0; margin-top: 4px; font-size: 11px;">${escapeHtml(volcano.type)}</div>
                <div style="color: #CBD5E1; margin-top: 4px; font-size: 10px; font-style: italic;">${escapeHtml(volcano.historicalAnalogy)}</div>
                <button id="select-volcano-${safeVolcanoId}" style="margin-top: 8px; width: 100%; padding: 5px 8px; background: #DC2626; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; transition: background 0.15s;">
                  ▶ Simulasikan Erupsi Gunung Ini
                </button>
              </div>
            `);

            marker.on('click', () => {
              if (onSelectVolcano) {
                onSelectVolcano(volcano);
              }
            });

            marker.on('popupopen', () => {
              const btn = document.getElementById(`select-volcano-${volcano.id}`);
              if (btn && onSelectVolcano) {
                btn.onclick = () => {
                  onSelectVolcano(volcano);
                  marker.closePopup();
                };
              }
            });

            layerGroup.addLayer(marker);
          }
        } else {
          // Non-volcanic mountain: Stable Ridge Icon
          const nonVolcanoPin = LModule.divIcon({
            className: 'non-volcano-pin',
            html: `
              <div style="cursor: pointer; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: #022C22; border: 1.5px solid #10B981; border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); transition: transform 0.15s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1.0)'">
                <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6L1 19H15L8 6Z" fill="#064E3B" stroke="#10B981" stroke-width="1.8" stroke-linejoin="round"/>
                  <path d="M16 10L10.5 19H21.5L16 10Z" fill="#047857" stroke="#34D399" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const marker = LModule.marker([volcano.lat, volcano.lng], { icon: nonVolcanoPin });
          marker.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #F8FAFC;">
              <span style="color: #34D399;">⛰ ${escapeHtml(volcano.name)}</span> (${escapeHtml(volcano.elevationM)} m)
              <div style="font-weight: normal; color: #94A3B8; font-size: 10px;">Non-Vulkanik • ${escapeHtml(volcano.province)}</div>
            </div>
          `, { direction: 'top', offset: [0, -11], opacity: 0.95 });

          const safeNonVolcanoId = escapeHtml(volcano.id);
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC; min-width: 210px;">
              <div style="font-weight: bold; font-size: 13px; color: #34D399;">⛰ ${escapeHtml(volcano.name)}</div>
              <div style="color: #94A3B8; font-size: 11px;">${escapeHtml(volcano.province)} • ${escapeHtml(volcano.elevationM)} mdpl</div>
              <div style="color: #E2E8F0; margin-top: 4px; font-size: 11px;">${escapeHtml(volcano.type)}</div>
              <div style="margin-top: 6px; padding: 5px; border-radius: 4px; background: #064E3B40; border: 1px solid #10B98160; color: #A7F3D0; font-size: 10px; font-weight: 500;">
                ✓ NON-VULKANIK: Pegunungan lipatan/tektonik. 100% aman dari erupsi awan panas.
              </div>
              <button id="select-nonvolcano-${safeNonVolcanoId}" style="margin-top: 8px; width: 100%; padding: 5px 8px; background: #059669; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer;">
                ▶ Pilih Gunung Ini
              </button>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectVolcano) {
              onSelectVolcano(volcano);
            }
          });

          marker.on('popupopen', () => {
            const btn = document.getElementById(`select-nonvolcano-${volcano.id}`);
            if (btn && onSelectVolcano) {
              btn.onclick = () => {
                onSelectVolcano(volcano);
                marker.closePopup();
              };
            }
          });

          layerGroup.addLayer(marker);
        }
      });

      // If current mountain is non-volcanic, only render its center beacon and stop
      if (isNonVolcano && !scenario.isCustom) {
        const summitIcon = LModule.divIcon({
          className: 'custom-non-volcano-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
              <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #065F46; border: 2px solid #34D399; box-shadow: 0 0 14px #10B981; display: flex; align-items: center; justify-content: center;">
                <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6L1 19H15L8 6Z" fill="#064E3B" stroke="#34D399" stroke-width="2"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const volcanoMarker = LModule.marker([centerLat, centerLng], { icon: summitIcon });
        volcanoMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; color: #F8FAFC;">
            <strong style="color: #34D399; font-size: 14px;">${escapeHtml(selectedVolcano.name)}</strong><br/>
            <span>Elevasi: ${escapeHtml(selectedVolcano.elevationM)} mdpl</span><br/>
            <span style="color: #94A3B8;">Tipe: ${escapeHtml(selectedVolcano.type)}</span><br/>
            <div style="margin-top: 6px; padding: 4px; background: #064E3B; border-radius: 4px; color: #A7F3D0; font-size: 11px;">
              Pegunungan tektonik non-vulkanik. Bebas dari ancaman letusan awan panas.
            </div>
          </div>
        `);
        layerGroup.addLayer(volcanoMarker);
        return;
      }

      // ==============================================================
      // 2. ACTIVE VOLCANO: STATIC PVMBG KRB BOUNDARY RINGS
      // ==============================================================
      if (result.krb1RadiusKm > 0) {
        const circleKRB1 = LModule.circle([centerLat, centerLng], {
          radius: result.krb1RadiusKm * 1000,
          color: '#EAB308',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#EAB308',
          fillOpacity: 0.05,
          dashArray: '6, 6',
        });
        circleKRB1.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #EAB308;">Kawasan Rawan Bencana I (KRB I - PVMBG)</strong><br/>
            <span>Batas Radius Acuan: ${result.krb1RadiusKm} km</span><br/>
            <span style="color: #94A3B8;">Zona potensi hujan abu lebat dan ancaman banjir lahar dingin di lembah sungai.</span>
          </div>
        `);
        layerGroup.addLayer(circleKRB1);
      }

      if (result.krb2RadiusKm > 0) {
        const circleKRB2 = LModule.circle([centerLat, centerLng], {
          radius: result.krb2RadiusKm * 1000,
          color: '#F97316',
          weight: 2,
          opacity: 0.7,
          fillColor: '#F97316',
          fillOpacity: 0.08,
          dashArray: '4, 4',
        });
        circleKRB2.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #F97316;">Kawasan Rawan Bencana II (KRB II - PVMBG)</strong><br/>
            <span>Batas Radius Acuan: ${result.krb2RadiusKm} km</span><br/>
            <span style="color: #94A3B8;">Zona lontaran batu pijar, aliran lava, dan awan panas menengah.</span>
          </div>
        `);
        layerGroup.addLayer(circleKRB2);
      }

      if (result.krb3RadiusKm > 0) {
        const circleKRB3 = LModule.circle([centerLat, centerLng], {
          radius: result.krb3RadiusKm * 1000,
          color: '#EF4444',
          weight: 2,
          opacity: 0.8,
          fillColor: '#EF4444',
          fillOpacity: 0.12,
          dashArray: '2, 4',
        });
        circleKRB3.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #EF4444;">Kawasan Rawan Bencana III (KRB III - PVMBG)</strong><br/>
            <span>Batas Radius Bahaya Mutlak: ${result.krb3RadiusKm} km</span><br/>
            <span style="color: #FCA5A5;">Zona awan panas mematikan & lontaran bom vulkanik. EVAKUASI TOTAL!</span>
          </div>
        `);
        layerGroup.addLayer(circleKRB3);
      }

      // ==============================================================
      // 3. DYNAMIC PROPAGATING PYROCLASTIC SURGE (AWAN PANAS GUGURAN)
      // ==============================================================
      if (currentTimeMinutes > 0 && result.krb3RadiusKm > 0) {
        const flowProgress = Math.min(1.0, currentTimeMinutes / Math.max(1, result.etaPyroclasticMinutes));
        const dynamicFlowRadiusKm = result.krb3RadiusKm * flowProgress;

        const dynamicSurge = LModule.circle([centerLat, centerLng], {
          radius: dynamicFlowRadiusKm * 1000,
          color: '#DC2626',
          weight: 2.5,
          opacity: 0.95,
          fillColor: '#EF4444',
          fillOpacity: 0.45,
        });

        dynamicSurge.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #EF4444;">Awan Panas Guguran (Pyroclastic Density Current)</strong><br/>
            <span>Waktu Tempuh: T + ${currentTimeMinutes} Menit</span><br/>
            <span>Jangkauan Luncuran Aktif: ${dynamicFlowRadiusKm.toFixed(1)} km</span><br/>
            <span>Kecepatan Luncur: ~${result.pyroclasticSpeedKmh} km/jam</span>
          </div>
        `);
        layerGroup.addLayer(dynamicSurge);
      }

      // ==============================================================
      // 4. MULTI-TIER TEPHRA ASH ISOPACH CONES (SEBARAN ABU BERTINGKAT)
      // ==============================================================
      if (result.ashIsopachTiers && result.ashIsopachTiers.length > 0 && currentTimeMinutes > 1) {
        // Render from lightest (largest) to heaviest (smallest) so they stack cleanly
        const tiersReversed = [...result.ashIsopachTiers].reverse();
        tiersReversed.forEach((tier) => {
          if (tier.polygon.length > 0) {
            const isopachPoly = LModule.polygon(tier.polygon, {
              color: tier.borderColor,
              weight: 1.2,
              opacity: 0.75,
              fillColor: tier.fillColor,
              fillOpacity: 0.2,
              dashArray: '3, 3',
            });
            isopachPoly.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
                <strong style="color: ${tier.borderColor};">${tier.label}</strong><br/>
                <span style="color: #CBD5E1;">${tier.thicknessDesc}</span><br/>
                <span style="color: #94A3B8;">Jangkauan Maksimal: ${tier.maxDistanceKm} km</span><br/>
                <span style="color: #94A3B8;">Arah Angin: ${scenario.windDirectionDeg}° (${scenario.windSpeedKmh} km/jam)</span>
              </div>
            `);
            layerGroup.addLayer(isopachPoly);
          }
        });
      }

      // ==============================================================
      // 5. SELECTED VOLCANO SUMMIT BEACON (GLOW RADAR)
      // ==============================================================
      const summitIcon = LModule.divIcon({
        className: 'custom-volcano-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div class="radar-glow" style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.45);"></div>
            <div style="position: relative; width: 26px; height: 26px; border-radius: 4px; background: #7F1D1D; border: 2px solid #EF4444; box-shadow: 0 0 16px #EF4444; display: flex; align-items: center; justify-content: center; transform: rotate(45deg);">
              <svg style="transform: rotate(-45deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 21H22L12 2Z" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const volcanoMarker = LModule.marker([centerLat, centerLng], { icon: summitIcon });
      volcanoMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #F8FAFC; font-size: 14px;">${escapeHtml(selectedVolcano.name)}</strong><br/>
          <span style="color: #EF4444; font-weight: bold;">Status: ${escapeHtml(result.alertLevel)}</span><br/>
          <span style="color: #94A3B8;">Elevasi: ${escapeHtml(selectedVolcano.elevationM)} mdpl</span><br/>
          <span style="color: #94A3B8;">Tinggi Kolom Erupsi: ~${escapeHtml(result.columnHeightKm)} km</span>
        </div>
      `);
      layerGroup.addLayer(volcanoMarker);

      // ==============================================================
      // 6. EVACUATION SHELTERS (TES) WITH VECTOR BADGES
      // ==============================================================
      if (selectedVolcano.shelters) {
        selectedVolcano.shelters.forEach((shelter) => {
          const isSafe = shelter.distanceKm ? shelter.distanceKm > result.krb1RadiusKm : true;
          const shelterIcon = LModule.divIcon({
            className: 'custom-shelter-marker',
            html: `
              <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; background: ${isSafe ? '#064E3B' : '#7F1D1D'}; border: 1.5px solid ${isSafe ? '#10B981' : '#EF4444'}; box-shadow: 0 0 8px ${isSafe ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};">
                <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 6V12C3 17.5 6.8 21.7 12 23C17.2 21.7 21 17.5 21 12V6L12 2Z" fill="${isSafe ? '#047857' : '#991B1B'}" stroke="${isSafe ? '#A7F3D0' : '#FECDD3'}" stroke-width="1.8"/>
                </svg>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const shelterMarker = LModule.marker([shelter.lat, shelter.lng], { icon: shelterIcon });
          shelterMarker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
              <strong style="color: ${isSafe ? '#10B981' : '#EF4444'};">${escapeHtml(shelter.name)}</strong><br/>
              <span>Wilayah: ${escapeHtml(shelter.district ?? '-')}</span><br/>
              <span>Kapasitas: ${escapeHtml(shelter.capacity?.toLocaleString('id-ID') ?? '-')} Jiwa</span><br/>
              <span>Jarak ke Puncak: ${escapeHtml(shelter.distanceKm ?? '-')} km</span><br/>
              <span style="color: ${isSafe ? '#34D399' : '#F87171'}; font-weight: bold;">
                ${isSafe ? 'LOKASI AMAN (DI LUAR KRB I)' : 'PERINGATAN: TERLALU DEKAT DENGAN ZONA BAHAYA'}
              </span>
            </div>
          `);
          layerGroup.addLayer(shelterMarker);
        });
      }
    });

    return () => {
      isCancelled = true;
      if (layerGroupRef.current && map) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [
    map,
    selectedVolcano,
    scenario,
    result,
    currentTimeMinutes,
    showActiveVolcanoes,
    showNonVolcanoes,
    onSelectVolcano,
  ]);

  return null;
}
