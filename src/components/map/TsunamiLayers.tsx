'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import {
  TsunamiFaultPreset,
  TsunamiScenario,
  TsunamiSimulationResult,
} from '@/types/disaster';
import { INDONESIA_TSUNAMI_FAULTS } from '@/data/tsunamiFaults';
import {
  clipWavefrontWithLand,
  createPerpendicularInundationCorridor,
  calculateHaversineDistanceKm,
} from '@/lib/geoUtils';
import { escapeHtml } from '@/lib/sanitize';

interface TsunamiLayersProps {
  map: L.Map | null;
  selectedFault: TsunamiFaultPreset;
  scenario: TsunamiScenario;
  result: TsunamiSimulationResult;
  currentTimeMinutes: number;
  showTsunamiFaults?: boolean;
  onSelectFault?: (fault: TsunamiFaultPreset) => void;
}

/**
 * Generates an oriented ellipse polygon representing an elongated tsunami wave front
 * radiating perpendicularly from a tectonic fault rupture.
 */
function createOrientedEllipsePolygon(
  centerLat: number,
  centerLng: number,
  semiMajorKm: number,
  semiMinorKm: number,
  strikeDeg: number
): [number, number][] {
  const points: [number, number][] = [];
  const strikeRad = (strikeDeg * Math.PI) / 180;
  const latRad = (centerLat * Math.PI) / 180;
  const cosLat = Math.max(0.2, Math.cos(latRad));
  const steps = 40;

  for (let i = 0; i <= steps; i++) {
    const theta = (i * 2 * Math.PI) / steps;
    const x0 = semiMajorKm * Math.cos(theta);
    const y0 = semiMinorKm * Math.sin(theta);
    // Rotate along fault strike axis
    const dx = x0 * Math.sin(strikeRad) + y0 * Math.cos(strikeRad);
    const dy = x0 * Math.cos(strikeRad) - y0 * Math.sin(strikeRad);
    const lat = centerLat + (dy / 110.574);
    const lng = centerLng + (dx / (111.320 * cosLat));
    points.push([lat, lng]);
  }
  return points;
}

export default function TsunamiLayers({
  map,
  selectedFault,
  scenario,
  result,
  currentTimeMinutes,
  showTsunamiFaults = true,
  onSelectFault,
}: TsunamiLayersProps) {
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

      const centerLat = scenario.isCustom && scenario.customLocation
        ? scenario.customLocation.lat
        : selectedFault.lat;
      const centerLng = scenario.isCustom && scenario.customLocation
        ? scenario.customLocation.lng
        : selectedFault.lng;

      const faultStrike = scenario.isCustom ? 290 : selectedFault.faultStrikeDeg;
      const ruptureLen = scenario.isCustom ? 200 : selectedFault.ruptureLengthKm;

      // ==============================================================
      // 1. RENDER ALL INDONESIAN TSUNAMI FAULTS & MEGATHRUST ARCS
      // ==============================================================
      if (showTsunamiFaults) {
        INDONESIA_TSUNAMI_FAULTS.forEach((fault) => {
          const isCurrent = !scenario.isCustom && fault.id === selectedFault.id;
          if (isCurrent) return;

          const faultPinIcon = LModule.divIcon({
            className: 'unselected-tsunami-pin',
            html: `
              <div style="cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #082F49; border: 1.5px solid #0284C7; border-radius: 4px; box-shadow: 0 0 8px rgba(2, 132, 199, 0.5); transition: transform 0.15s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1.0)'">
                <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C4 10 7 10 9 12C11 14 14 14 16 12C18 10 21 10 22 12" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
                  <path d="M2 17C4 15 7 15 9 17C11 19 14 19 16 17C18 15 21 15 22 17" stroke="#0284C7" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = LModule.marker([fault.lat, fault.lng], { icon: faultPinIcon });
          marker.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #F8FAFC;">
              <span style="color: #38BDF8;">≈ ${escapeHtml(fault.name)}</span>
              <div style="font-weight: normal; color: #94A3B8; font-size: 10px;">${escapeHtml(fault.region)} • Mw ${escapeHtml(fault.defaultMw)}</div>
            </div>
          `, { direction: 'top', offset: [0, -12], opacity: 0.95 });

          const safeFaultId = escapeHtml(fault.id);
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC; min-width: 210px;">
              <div style="font-weight: bold; font-size: 13px; color: #38BDF8;">≈ ${escapeHtml(fault.name)}</div>
              <div style="color: #94A3B8; font-size: 11px;">${escapeHtml(fault.region)}</div>
              <div style="color: #CBD5E1; margin-top: 4px; font-size: 11px;">Potensi: Mw ${escapeHtml(fault.defaultMw)} • Kedalaman ${escapeHtml(fault.defaultDepthKm)} km</div>
              <div style="color: #94A3B8; margin-top: 4px; font-size: 10px; font-style: italic;">${escapeHtml(fault.description)}</div>
              <button id="select-fault-${safeFaultId}" style="margin-top: 8px; width: 100%; padding: 5px 8px; background: #0284C7; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; transition: background 0.15s;">
                ▶ Simulasikan Megathrust Ini
              </button>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectFault) {
              onSelectFault(fault);
            }
          });

          marker.on('popupopen', () => {
            const btn = document.getElementById(`select-fault-${fault.id}`);
            if (btn && onSelectFault) {
              btn.onclick = () => {
                onSelectFault(fault);
                marker.closePopup();
              };
            }
          });

          layerGroup.addLayer(marker);
        });
      }

      // ==============================================================
      // 2. ACTIVE EPICENTER & TECTONIC RUPTURE AXIS
      // ==============================================================
      // Draw Rupture Fault Line Axis
      const halfRuptureKm = ruptureLen / 2;
      const strikeRad = (faultStrike * Math.PI) / 180;
      const latRad = (centerLat * Math.PI) / 180;
      const cosLat = Math.max(0.2, Math.cos(latRad));

      const dxRupture = halfRuptureKm * Math.sin(strikeRad);
      const dyRupture = halfRuptureKm * Math.cos(strikeRad);

      const ruptureP1: [number, number] = [
        centerLat - (dyRupture / 110.574),
        centerLng - (dxRupture / (111.320 * cosLat)),
      ];
      const ruptureP2: [number, number] = [
        centerLat + (dyRupture / 110.574),
        centerLng + (dxRupture / (111.320 * cosLat)),
      ];

      const ruptureLine = LModule.polyline([ruptureP1, ruptureP2], {
        color: '#EF4444',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 4',
      });
      ruptureLine.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="color: #EF4444;">Garis Retakan Patahan (Rupture Fault Axis)</strong><br/>
          <span>Panjang Retakan: ${ruptureLen} km</span><br/>
          <span>Arah Jurus (Strike): ${faultStrike}°</span><br/>
          <span style="color: #94A3B8;">Arah pelepasan energi gelombang tegak lurus sumbu retakan.</span>
        </div>
      `);
      layerGroup.addLayer(ruptureLine);

      // Active Epicenter Marker
      const epicenterIcon = LModule.divIcon({
        className: 'custom-tsunami-epicenter',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div class="radar-glow" style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(56, 189, 248, 0.45);"></div>
            <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #0369A1; border: 2px solid #38BDF8; box-shadow: 0 0 16px #38BDF8; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
                <circle cx="12" cy="12" r="7" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="2 2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const epicenterMarker = LModule.marker([centerLat, centerLng], { icon: epicenterIcon });
      const epicenterTitle = scenario.isCustom && scenario.customLocation ? scenario.customLocation.name : selectedFault.name;
      epicenterMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; color: #F8FAFC;">
          <strong style="color: #38BDF8; font-size: 14px;">${escapeHtml(epicenterTitle)}</strong><br/>
          <span style="color: #FFFFFF; font-weight: bold;">Kekuatan Gempa: M ${escapeHtml(scenario.mw.toFixed(1))} Mw</span><br/>
          <span style="color: #94A3B8;">Kedalaman Hiposenter: ${escapeHtml(scenario.depthKm)} km</span><br/>
          <span style="color: #94A3B8;">Kecepatan Gelombang Laut Dalam: ${escapeHtml(result.deepWaterSpeedKmh)} km/jam</span><br/>
          <span style="color: ${result.bmkgColor}; font-weight: bold;">Status BMKG: ${escapeHtml(result.bmkgStatus)}</span>
        </div>
      `);
      layerGroup.addLayer(epicenterMarker);

      // ==============================================================
      // 3. PROPAGATING TECTONIC DYNAMIC WAVE TRAIN (CREST, RIPPLES & TROUGH)
      // ==============================================================
      if (currentTimeMinutes > 0) {
        const currentRadiusKm = (result.deepWaterSpeedKmh * (currentTimeMinutes / 60));
        const semiMajorKm = (ruptureLen * 0.4) + currentRadiusKm;
        const semiMinorKm = currentRadiusKm;

        // 3a. Primary Leading Wave Crest (Puncak Gelombang Terdepan)
        const crestPoints = createOrientedEllipsePolygon(centerLat, centerLng, semiMajorKm, semiMinorKm, faultStrike);
        const clippedCrests = clipWavefrontWithLand(crestPoints, centerLat, centerLng);
        clippedCrests.forEach((polyPoints) => {
          const activeLeadingWave = LModule.polygon(polyPoints, {
            color: '#38BDF8',
            weight: 3.2,
            opacity: 0.95,
            fillColor: '#0284C7',
            fillOpacity: 0.12,
            className: 'tsunami-wave-ring',
          });
          activeLeadingWave.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
              <strong style="color: #38BDF8; font-size: 13px;">Puncak Gelombang Terdepan (Leading Wave Crest)</strong><br/>
              <span>Waktu Tempuh: T + ${currentTimeMinutes} Menit</span><br/>
              <span>Radius Rambat: ${currentRadiusKm.toFixed(1)} km</span><br/>
              <span>Kecepatan Rambat: ${result.deepWaterSpeedKmh} km/jam</span><br/>
              <span style="color: #0284C7; font-weight: bold;">Gelombang terpotong di garis pantai dan terhenti di daratan.</span>
            </div>
          `);
          layerGroup.addLayer(activeLeadingWave);
        });

        // 3b. Secondary Wave Crest (Gelombang Pengiring Kedua)
        if (currentRadiusKm > 15) {
          const secMinorKm = Math.max(8, semiMinorKm * 0.82);
          const secMajorKm = Math.max(15, semiMajorKm * 0.82);
          const secPoints = createOrientedEllipsePolygon(centerLat, centerLng, secMajorKm, secMinorKm, faultStrike);
          const clippedSec = clipWavefrontWithLand(secPoints, centerLat, centerLng);
          clippedSec.forEach((polyPoints) => {
            const secWave = LModule.polygon(polyPoints, {
              color: '#0EA5E9',
              weight: 2.2,
              opacity: 0.80,
              fillColor: '#0284C7',
              fillOpacity: 0.05,
            });
            layerGroup.addLayer(secWave);
          });
        }

        // 3c. Tertiary Ripple (Riak Gelombang Ketiga)
        if (currentRadiusKm > 30) {
          const tertMinorKm = Math.max(12, semiMinorKm * 0.64);
          const tertMajorKm = Math.max(20, semiMajorKm * 0.64);
          const tertPoints = createOrientedEllipsePolygon(centerLat, centerLng, tertMajorKm, tertMinorKm, faultStrike);
          const clippedTert = clipWavefrontWithLand(tertPoints, centerLat, centerLng);
          clippedTert.forEach((polyPoints) => {
            const tertWave = LModule.polygon(polyPoints, {
              color: '#0284C7',
              weight: 1.6,
              opacity: 0.60,
              fill: false,
            });
            layerGroup.addLayer(tertWave);
          });
        }

        // 3d. Trailing Wave Trough (Palung Hisap Air Laut Surut)
        if (currentRadiusKm > 10) {
          const troughMinorKm = Math.max(5, semiMinorKm * 0.48);
          const troughMajorKm = Math.max(10, semiMajorKm * 0.48);
          const troughPoints = createOrientedEllipsePolygon(centerLat, centerLng, troughMajorKm, troughMinorKm, faultStrike);
          const clippedTroughs = clipWavefrontWithLand(troughPoints, centerLat, centerLng);
          clippedTroughs.forEach((polyPoints) => {
            const troughWave = LModule.polygon(polyPoints, {
              color: '#0369A1',
              weight: 1.6,
              opacity: 0.75,
              dashArray: '5, 4',
              fill: false,
            });
            layerGroup.addLayer(troughWave);
          });
        }
      }

      // Static Isochrone Time Envelopes (T+5, T+10, T+20, T+30, T+45, T+60m)
      result.isochroneRings.forEach((ring) => {
        if (ring.timeMinutes <= currentTimeMinutes || currentTimeMinutes >= 55) {
          const isoMajorKm = (ruptureLen * 0.35) + ring.radiusKm;
          const isoMinorKm = ring.radiusKm;
          const isoPoints = createOrientedEllipsePolygon(centerLat, centerLng, isoMajorKm, isoMinorKm, faultStrike);
          const clippedIsos = clipWavefrontWithLand(isoPoints, centerLat, centerLng);
          clippedIsos.forEach((polyPoints) => {
            const isochronePoly = LModule.polygon(polyPoints, {
              color: '#06B6D4',
              weight: 1.2,
              opacity: 0.45,
              fillColor: '#06B6D4',
              fillOpacity: 0.03,
              dashArray: '5, 5',
            });
            isochronePoly.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
                <strong style="color: #06B6D4;">Isochrone Gelombang T + ${ring.timeMinutes} Menit</strong><br/>
                <span>Jarak dari Patahan: ~${ring.radiusKm} km</span><br/>
                <span>Estimasi Tinggi Gelombang: ${ring.waveHeightM} meter</span>
              </div>
            `);
            layerGroup.addLayer(isochronePoly);
          });
        }
      });

      // ==============================================================
      // 4. REAL COASTLINE IMPACT ALERT & INUNDATION BUFFER
      // ==============================================================
      // Determine authentic coastal line coordinates
      let targetCoastline: [number, number][] = [];
      if (!scenario.isCustom && selectedFault.coastlinePolyline) {
        targetCoastline = selectedFault.coastlinePolyline;
      } else if (result.districtImpacts && result.districtImpacts.length > 0) {
        // Connect the closest coastal regencies
        targetCoastline = result.districtImpacts.map(d => d.coordinates);
      }

      if (targetCoastline.length >= 2) {
        const isImpacted = currentTimeMinutes >= result.etaCoastMinutes;
        const coastColor = isImpacted ? result.bmkgColor : '#64748B';

        const coastLine = LModule.polyline(targetCoastline, {
          color: coastColor,
          weight: isImpacted ? 5.5 : 3.0,
          opacity: isImpacted ? 0.95 : 0.65,
          dashArray: isImpacted ? undefined : '6, 6',
        });

        coastLine.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC;">
            <strong style="color: ${coastColor}; font-size: 13px;">
              ${isImpacted ? 'GARIS PANTAI TERDAMPAK TSUNAMI' : 'GARIS PANTAI ZONA WASPADA'}
            </strong><br/>
            <span>Status Peringatan BMKG: <strong>${result.bmkgStatus}</strong></span><br/>
            <span>Estimasi Waktu Tiba Gelombang Pertama: <strong>${result.etaCoastMinutes} Menit</strong></span><br/>
            <span>Estimasi Tinggi Gelombang Pantai: <strong>${result.coastWaveHeightM} Meter</strong></span><br/>
            <span>Jarak Rendaman Daratan: <strong>${result.inundationDistanceM} Meter</strong></span><br/>
            <span style="color: ${isImpacted ? '#EF4444' : '#F59E0B'}; font-weight: bold;">
              ${isImpacted ? 'Gelombang telah menghantam pantai! Evakuasi ke dataran >20 mdpl!' : 'Waktu evakuasi tersisa sebelum gelombang tiba.'}
            </span>
          </div>
        `);
        layerGroup.addLayer(coastLine);

        // Dynamic inland inundation penetration based on time elapsed past ETA
        if (isImpacted) {
          const timePastImpact = Math.max(0, currentTimeMinutes - result.etaCoastMinutes);
          // Inundation penetrates gradually over 20 minutes from 35% to 100% of max distance
          const penetrationFactor = Math.min(1.0, 0.35 + 0.65 * (timePastImpact / 20));
          const currentPenetrationM = Math.round(result.inundationDistanceM * penetrationFactor);

          const inundationCorridor = createPerpendicularInundationCorridor(
            targetCoastline,
            centerLat,
            centerLng,
            currentPenetrationM
          );
          const inundationPolygon = LModule.polygon(inundationCorridor, {
            color: result.bmkgColor,
            weight: 2.0,
            opacity: 0.85,
            fillColor: result.bmkgColor,
            fillOpacity: 0.35,
          });
          inundationPolygon.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC;">
              <strong style="color: ${result.bmkgColor}; font-size: 13px;">Zona Rendaman Daratan (Inundasi Aktif)</strong><br/>
              <span>Kedalaman Penetrasi Masuk Daratan: <strong>~${currentPenetrationM} meter</strong> (Maks: ${result.inundationDistanceM}m)</span><br/>
              <span>Tinggi Gelombang Tiba di Pantai: <strong>~${result.coastWaveHeightM} meter</strong></span><br/>
              <span style="color: #EF4444; font-weight: bold;">Air laut telah merangsek masuk ke permukiman pesisir!</span>
            </div>
          `);
          layerGroup.addLayer(inundationPolygon);

          // Add pulsating impact markers along impacted shoreline vertices
          const currentWaveRadiusKm = result.deepWaterSpeedKmh * (currentTimeMinutes / 60);
          targetCoastline.forEach((pt) => {
            const distToEpicenter = calculateHaversineDistanceKm(centerLat, centerLng, pt[0], pt[1]);
            if (distToEpicenter <= currentWaveRadiusKm + 20) {
              const impactDot = LModule.circleMarker(pt, {
                radius: 6,
                color: '#FFFFFF',
                weight: 1.5,
                fillColor: result.bmkgColor,
                fillOpacity: 0.9,
              });
              impactDot.bindTooltip(`
                <div style="font-size: 10px; font-weight: bold; color: #FFF;">
                  Hantaman Gelombang (~${result.coastWaveHeightM}m)
                </div>
              `, { direction: 'top', offset: [0, -6] });
              layerGroup.addLayer(impactDot);
            }
          });
        }
      }

      // ==============================================================
      // 5. DISTRICT IMPACT WARNING PINS (InaTEWS BMKG)
      // ==============================================================
      if (result.districtImpacts && result.districtImpacts.length > 0) {
        result.districtImpacts.forEach((district) => {
          const isDistrictHit = currentTimeMinutes >= district.etaMinutes;
          const warningColor =
            district.warningLevel === 'AWAS' ? '#EF4444' :
            district.warningLevel === 'SIAGA' ? '#F97316' : '#EAB308';

          const districtDot = LModule.divIcon({
            className: 'district-warning-dot',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;">
                ${isDistrictHit ? `<div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: ${warningColor}60; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
                <div style="position: relative; width: ${isDistrictHit ? '15px' : '12px'}; height: ${isDistrictHit ? '15px' : '12px'}; border-radius: 50%; background: ${warningColor}; border: 2px solid #FFFFFF; box-shadow: 0 0 8px ${warningColor}; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  ${isDistrictHit ? '<span style="font-size: 8px; font-weight: bold; color: white;">!</span>' : ''}
                </div>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const districtMarker = LModule.marker(district.coordinates, { icon: districtDot });
          const countdownText = isDistrictHit
            ? '<span style="color: #EF4444; font-weight: bold;">TERDAMPAK</span>'
            : `<span style="color: #38BDF8;">Tiba dlm ${Math.max(1, district.etaMinutes - currentTimeMinutes)}m</span>`;

          districtMarker.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #F8FAFC;">
              <span style="color: ${warningColor};">● ${escapeHtml(district.districtName)}</span> [${countdownText}]
              <div style="font-weight: normal; color: #CBD5E1; font-size: 10px;">
                Status: ${escapeHtml(district.warningLevel)} • ETA: ${escapeHtml(district.etaMinutes)}m • Tinggi: ~${escapeHtml(district.estimatedWaveHeightM)}m
              </div>
            </div>
          `, { direction: 'top', offset: [0, -9] });

          districtMarker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC; min-width: 200px;">
              <strong style="color: ${warningColor}; font-size: 13px;">${escapeHtml(district.districtName)}</strong><br/>
              <span style="color: #94A3B8;">Provinsi: ${escapeHtml(district.province)}</span><br/>
              <span>Jarak ke Episentrum: ${escapeHtml(district.distanceKm)} km</span><br/>
              <span>Estimasi Waktu Tiba (ETA): <strong>${escapeHtml(district.etaMinutes)} Menit</strong></span><br/>
              <span>Estimasi Tinggi Gelombang: <strong>${escapeHtml(district.estimatedWaveHeightM)} Meter</strong></span><br/>
              <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: ${warningColor}20; border: 1px solid ${warningColor}; font-size: 11px;">
                <strong>Status Saat Ini (T+${currentTimeMinutes}m):</strong><br/>
                ${isDistrictHit
                  ? '<span style="color: #EF4444; font-weight: bold;">⚠️ GELOMBANG TELAH TIBA DI PESISIR</span>'
                  : `<span style="color: #38BDF8; font-weight: bold;">⏳ Waktu Evakuasi Tersisa: ${Math.max(1, district.etaMinutes - currentTimeMinutes)} Menit</span>`
                }
              </div>
            </div>
          `);

          layerGroup.addLayer(districtMarker);
        });
      }

      // ==============================================================
      // 6. SAFE VERTICAL EVACUATION SHELTERS (TEV)
      // ==============================================================
      const safeShelters = result.recommendedShelters && result.recommendedShelters.length > 0
        ? result.recommendedShelters
        : selectedFault.safePoints;

      if (safeShelters) {
        safeShelters.forEach((point) => {
          const shelterIcon = LModule.divIcon({
            className: 'custom-tsunami-shelter',
            html: `
              <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; background: #064E3B; border: 1.5px solid #10B981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);">
                <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 6V12C3 17.5 6.8 21.7 12 23C17.2 21.7 21 17.5 21 12V6L12 2Z" fill="#047857" stroke="#A7F3D0" stroke-width="1.8"/>
                </svg>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const shelterMarker = LModule.marker([point.lat, point.lng], { icon: shelterIcon });
          shelterMarker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC;">
              <strong style="color: #10B981;">${escapeHtml(point.name)}</strong><br/>
              <span>Wilayah: ${escapeHtml(point.district ?? '-')}</span><br/>
              <span>Elevasi Aman: ${escapeHtml(point.elevationM ?? '-')} mdpl</span><br/>
              <span style="color: #34D399; font-weight: bold;">ZONA EVAKUASI VERTIKAL DI ATAS RUN-UP TSUNAMI</span>
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
    selectedFault,
    scenario,
    result,
    currentTimeMinutes,
    showTsunamiFaults,
    onSelectFault,
  ]);

  return null;
}
