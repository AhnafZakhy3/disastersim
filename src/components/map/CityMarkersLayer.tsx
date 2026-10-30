'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { EvaluatedCity } from '@/types/disaster';
import { escapeHtml } from '@/lib/sanitize';

interface CityMarkersLayerProps {
  map: L.Map | null;
  cities: EvaluatedCity[];
  showCities: boolean;
  onSelectCity?: (city: EvaluatedCity) => void;
}

export default function CityMarkersLayer({
  map,
  cities,
  showCities,
  onSelectCity,
}: CityMarkersLayerProps) {
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

      if (!showCities) return;

      const layerGroup = layerGroupRef.current;

      cities.forEach((city) => {
        let color = '#10B981'; // Green for safe
        let radius = 4;
        let fillOpacity = 0.75;
        let pulseClass = '';

        if (city.status === 'impacted') {
          color = '#EF4444';
          radius = 7;
          fillOpacity = 0.95;
          pulseClass = 'animate-ping';
        } else if (city.status === 'danger') {
          color = '#EF4444';
          radius = 6;
          fillOpacity = 0.9;
        } else if (city.status === 'warning') {
          color = '#F97316';
          radius = 5.5;
          fillOpacity = 0.85;
        } else if (city.status === 'advisory') {
          color = '#EAB308';
          radius = 4.5;
          fillOpacity = 0.8;
        }

        const marker = LModule.circleMarker([city.lat, city.lng], {
          radius,
          color: '#0F172A',
          weight: 1.2,
          fillColor: color,
          fillOpacity,
        });

        // Hover tooltip
        marker.bindTooltip(
          `
          <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #F8FAFC;">
            <span style="color: ${color};">●</span> ${escapeHtml(city.cityName)}
            <div style="font-weight: normal; font-size: 10px; color: #94A3B8;">
              ${escapeHtml(city.province)} • ${escapeHtml(city.statusLabel)} (${escapeHtml(city.distanceKm)} km)
            </div>
          </div>
          `,
          { direction: 'top', offset: [0, -5], opacity: 0.95 }
        );

        // Click popup
        const safeCityId = escapeHtml(city.id);
        marker.bindPopup(
          `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.45; color: #F8FAFC; min-width: 220px;">
            <div style="font-weight: bold; font-size: 13px; color: #F1F5F9; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
              ${escapeHtml(city.cityName)}
            </div>
            <div style="color: #94A3B8; font-size: 11px;">Provinsi: <strong style="color: #CBD5E1;">${escapeHtml(city.province)}</strong> (${escapeHtml(city.islandGroup)})</div>
            <div style="color: #94A3B8; font-size: 11px;">Populasi BPS: <strong style="color: #CBD5E1;">~${city.population.toLocaleString('id-ID')} jiwa</strong></div>
            <div style="color: #94A3B8; font-size: 11px;">Jarak ke Bencana: <strong style="color: #CBD5E1;">${escapeHtml(city.distanceKm)} km</strong></div>
            
            <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: ${color}20; border: 1px solid ${color}50; font-size: 11px; font-weight: bold; color: ${color};">
              Status: ${escapeHtml(city.statusLabel)}
            </div>
            
            ${city.etaMinutes !== undefined ? `
              <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
                ETA Gelombang: <strong style="color: #38BDF8;">${escapeHtml(city.etaMinutes)} Menit</strong> • Estimasi Tinggi: <strong style="color: #38BDF8;">~${escapeHtml(city.waveHeightM)}m</strong>
              </div>
            ` : ''}

            <button id="focus-city-${safeCityId}" style="margin-top: 8px; width: 100%; padding: 5px 8px; background: #1E293B; hover:bg-slate-700; color: #38BDF8; border: 1px solid #38BDF8; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; transition: all 0.15s;">
              ⌖ Fokuskan Peta ke Kota Ini
            </button>
          </div>
          `
        );

        marker.on('popupopen', () => {
          const btn = document.getElementById(`focus-city-${city.id}`);
          if (btn && onSelectCity) {
            btn.onclick = () => {
              onSelectCity(city);
              map.flyTo([city.lat, city.lng], 9, { duration: 1.2 });
            };
          }
        });

        layerGroup.addLayer(marker);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [map, cities, showCities, onSelectCity]);

  return null;
}
