'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { EvacuationRouteResult } from '@/lib/routing/routingTypes';
import { escapeHtml } from '@/lib/sanitize';

interface EvacuationRouteLayerProps {
  map: L.Map | null;
  route: EvacuationRouteResult | null;
}

export default function EvacuationRouteLayer({
  map,
  route,
}: EvacuationRouteLayerProps) {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    let isCancelled = false;

    import('leaflet').then((LModule) => {
      if (isCancelled || !map) return;

      if (!layerGroupRef.current) {
        layerGroupRef.current = LModule.layerGroup().addTo(map);
      }

      const layerGroup = layerGroupRef.current;
      layerGroup.clearLayers();

      if (!route || !route.success || !route.geometry || route.geometry.length < 2) {
        return;
      }

      const latLngs = route.geometry.map(([lat, lng]) => [lat, lng] as [number, number]);

      // 1. Primary Route Glow (Shadow Layer)
      const routeGlow = LModule.polyline(latLngs, {
        color: route.isDetourRoute ? '#D97706' : '#0891B2',
        weight: 9,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layerGroup.addLayer(routeGlow);

      // 2. Primary Route Polyline (High Contrast Cyan or Amber for Detour)
      const routePolyline = LModule.polyline(latLngs, {
        color: route.isDetourRoute ? '#F59E0B' : '#22D3EE',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const distKm = (route.distanceMeters / 1000).toFixed(2);
      const durMins = Math.max(1, Math.round(route.durationSeconds / 60));

      // Multi-tier hazard severity badge styling
      let hazardBadgeColor = '#10B981';
      let hazardBadgeLabel = '✓ TIDAK BERPOTONGAN DENGAN ZONA BAHAYA MODEL';

      if (route.hazardSeverity === 'critical') {
        hazardBadgeColor = '#DC2626';
        hazardBadgeLabel = '🚨 BAHAYA KRITIS: MEMOTONG KRB III / ZONA INUNDASI';
      } else if (route.hazardSeverity === 'high') {
        hazardBadgeColor = '#EF4444';
        hazardBadgeLabel = '⚠️ BAHAYA TINGGI: MEMOTONG KRB II / HUJAN ABU LEBAT';
      } else if (route.hazardSeverity === 'medium') {
        hazardBadgeColor = '#F97316';
        hazardBadgeLabel = '⚡ BAHAYA MENENGAH: MEMOTONG KRB I / HUJAN ABU SEDANG';
      } else if (route.hazardSeverity === 'low') {
        hazardBadgeColor = '#EAB308';
        hazardBadgeLabel = 'ℹ️ WASPADA: MEMOTONG HUJAN ABU RINGAN';
      } else if (route.hazardCheckStatus === 'intersects') {
        hazardBadgeColor = '#EF4444';
        hazardBadgeLabel = '⚠️ RUTE MEMOTONG ZONA BAHAYA MODEL';
      } else if (route.hazardCheckStatus === 'unknown') {
        hazardBadgeColor = '#F59E0B';
        hazardBadgeLabel = '❓ STATUS BAHAYA BELUM DAPAT DIPASTIKAN';
      }

      routePolyline.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.45; color: #F8FAFC; min-width: 250px;">
          <div style="font-weight: bold; font-size: 13px; color: ${route.isDetourRoute ? '#F59E0B' : '#22D3EE'}; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
            ${route.isDetourRoute ? 'JALUR EVAKUASI MEMUTAR (HAZARD DETOUR)' : 'JALUR EVAKUASI PEJALAN KAKI'}
          </div>
          <div style="color: #CBD5E1; font-size: 11px;">
            Dari: <strong>${escapeHtml(route.origin.name)}</strong>
          </div>
          <div style="color: #CBD5E1; font-size: 11px;">
            Menuju: <strong style="color: #34D399;">${escapeHtml(route.destination.name)}</strong>
          </div>
          <div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: rgba(15, 23, 42, 0.6); padding: 6px; border-radius: 4px; border: 1px solid #334155;">
            <div>
              <span style="color: #94A3B8; font-size: 10px; display: block;">Jarak Jaringan:</span>
              <strong style="color: #F8FAFC; font-size: 12px;">${distKm} km</strong>
            </div>
            <div>
              <span style="color: #94A3B8; font-size: 10px; display: block;">Est. Waktu Tempuh:</span>
              <strong style="color: #F8FAFC; font-size: 12px;">~${durMins} Menit</strong>
            </div>
          </div>

          ${route.impedanceMultiplier && route.impedanceMultiplier > 1.0 ? `
            <div style="margin-top: 4px; font-size: 10px; color: #FBBF24;">
              ⏱ Faktor Hambatan Lapangan: <strong>${route.impedanceMultiplier}x</strong> (kepanikan & kerumunan massa).
            </div>
          ` : ''}

          <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: ${hazardBadgeColor}20; border: 1px solid ${hazardBadgeColor}60; font-size: 10px; font-weight: bold; color: ${hazardBadgeColor};">
            ${hazardBadgeLabel}
          </div>

          ${route.isDetourRoute && route.detourReason ? `
            <div style="margin-top: 4px; font-size: 10px; color: #FCD34D; line-height: 1.3;">
              Alasan Memutar: ${escapeHtml(route.detourReason)}
            </div>
          ` : ''}

          ${route.offlineMode ? `
            <div style="margin-top: 4px; font-size: 9px; color: #38BDF8; font-weight: bold;">
              📶 Mode Offline: Menggunakan fixture data rute lokal in-memory.
            </div>
          ` : ''}

          <div style="margin-top: 6px; font-size: 9px; color: #94A3B8; line-height: 1.3; border-top: 1px dashed #334155; padding-top: 4px;">
            Sumber Jaringan: ${escapeHtml(route.provider)}<br/>
            <em>Simulasi rute edukasi • Bukan jaminan navigasi operasional darurat.</em>
          </div>
        </div>
      `);
      layerGroup.addLayer(routePolyline);

      // 3. Render Secondary Overflow Spillover Route if Allocated
      if (
        route.capacityAllocation &&
        route.capacityAllocation.secondaryRouteGeometry &&
        route.capacityAllocation.secondaryRouteGeometry.length > 1 &&
        route.capacityAllocation.secondaryDestination
      ) {
        const secLatLngs = route.capacityAllocation.secondaryRouteGeometry.map(
          ([lat, lng]) => [lat, lng] as [number, number]
        );

        const secondaryPolyline = LModule.polyline(secLatLngs, {
          color: '#E11D48',
          weight: 3.5,
          opacity: 0.9,
          dashArray: '6, 6',
          lineCap: 'round',
        });

        secondaryPolyline.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #F8FAFC;">
            <strong style="color: #FB7185;">JALUR LIMPASAN KUOTA (OVERFLOW TO TES 2)</strong><br/>
            <span>Daya tampung TES 1 penuh (${route.capacityAllocation.occupancyPercentage}%).</span><br/>
            <span>Mengalihkan <strong>${route.capacityAllocation.secondaryAllocatedCount.toLocaleString('id-ID')} jiwa</strong> ke:</span><br/>
            <strong style="color: #38BDF8;">${escapeHtml(route.capacityAllocation.secondaryDestination.name)}</strong>
          </div>
        `);
        layerGroup.addLayer(secondaryPolyline);

        // Marker for Secondary TES Destination
        const secDestIcon = LModule.divIcon({
          className: 'custom-evacuation-sec-dest-marker',
          html: `
            <div style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #881337; border: 2px solid #FB7185; box-shadow: 0 0 10px rgba(251, 113, 133, 0.7);">
              <span style="color: #FFF; font-size: 10px; font-weight: bold;">TES 2</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const secDestMarker = LModule.marker(
          [route.capacityAllocation.secondaryDestination.lat, route.capacityAllocation.secondaryDestination.lng],
          { icon: secDestIcon }
        );
        secDestMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #F8FAFC;">
            <strong style="color: #FB7185;">TES CADANGAN LIMPASAN (TES 2)</strong><br/>
            <span>${escapeHtml(route.capacityAllocation.secondaryDestination.name)}</span><br/>
            <span>Kapasitas: ${route.capacityAllocation.secondaryDestination.capacity?.toLocaleString('id-ID') ?? '-'} Jiwa</span>
          </div>
        `);
        layerGroup.addLayer(secDestMarker);
      }

      // 4. Origin Marker Pin
      const originIcon = LModule.divIcon({
        className: 'custom-evacuation-origin-marker',
        html: `
          <div style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #0284C7; border: 2px solid #FFFFFF; box-shadow: 0 0 12px rgba(2, 132, 199, 0.8);">
            <span style="color: #FFFFFF; font-size: 11px; font-weight: 900; font-family: monospace;">A</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const originMarker = LModule.marker([route.origin.lat, route.origin.lng], {
        icon: originIcon,
      });
      originMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #F8FAFC;">
          <strong style="color: #38BDF8;">TITIK AWAL EVAKUASI</strong><br/>
          <span>${escapeHtml(route.origin.name)}</span>
        </div>
      `);
      layerGroup.addLayer(originMarker);

      // 5. Destination Marker Pin (TES Shield)
      const destIcon = LModule.divIcon({
        className: 'custom-evacuation-dest-marker',
        html: `
          <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #065F46; border: 2px solid #34D399; box-shadow: 0 0 14px rgba(52, 211, 153, 0.7);">
            <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6V12C3 17.5 6.8 21.7 12 23C17.2 21.7 21 17.5 21 12V6L12 2Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const destMarker = LModule.marker([route.destination.lat, route.destination.lng], {
        icon: destIcon,
      });
      destMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.45; color: #F8FAFC; min-width: 220px;">
          <div style="font-weight: bold; font-size: 13px; color: #34D399; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
            ${escapeHtml(route.destination.name)}
          </div>
          <div style="font-size: 11px; color: #CBD5E1;">
            Lokasi: <strong>${escapeHtml(route.destination.districtName)}</strong>
          </div>
          <div style="font-size: 11px; color: #CBD5E1;">
            Status: <span style="color: #34D399; font-weight: bold;">Terverifikasi (Verified)</span>
          </div>
          <div style="font-size: 11px; color: #CBD5E1;">
            Kapasitas: <strong>~${route.destination.capacity?.toLocaleString('id-ID') ?? '-'} Jiwa</strong>
          </div>
          ${route.capacityAllocation ? `
            <div style="font-size: 11px; color: ${route.capacityAllocation.isOverCapacity ? '#F87171' : '#34D399'};">
              Okupansi Terisi: <strong>${route.capacityAllocation.occupancyPercentage}%</strong> (~${route.capacityAllocation.allocatedCount.toLocaleString('id-ID')} jiwa)
            </div>
          ` : ''}
          <div style="font-size: 11px; color: #CBD5E1;">
            Elevasi: <strong>${route.destination.elevationM ?? '-'} mdpl</strong>
          </div>
          <div style="margin-top: 6px; font-size: 9px; color: #94A3B8; border-top: 1px dashed #334155; padding-top: 4px;">
            Sumber Data: ${escapeHtml(route.destination.sourceName)}
          </div>
        </div>
      `);
      layerGroup.addLayer(destMarker);

      // Fit map viewport to show the entire route with padding
      try {
        const bounds = routePolyline.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 15,
          });
        }
      } catch {
        // Safe fallback
      }
    });

    return () => {
      isCancelled = true;
      if (layerGroupRef.current && map) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [map, route]);

  return null;
}
