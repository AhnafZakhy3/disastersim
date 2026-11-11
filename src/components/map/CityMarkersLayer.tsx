'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import Supercluster, { ClusterFeature, PointFeature } from 'supercluster';
import { EvaluatedCity } from '@/types/disaster';
import { escapeHtml } from '@/lib/sanitize';

interface CityMarkersLayerProps {
  map: L.Map | null;
  cities: EvaluatedCity[];
  showCities: boolean;
  onSelectCity?: (city: EvaluatedCity) => void;
}

/**
 * High-performance mobile-optimized layer for 514 Indonesian cities.
 * Integrates Supercluster with Leaflet map lifecycle, rendering interactive cluster badges
 * when zoomed out and tactical individual city markers when zoomed in.
 * Drastically reduces active DOM elements from 514 to ~15-30 on mobile viewports.
 */
export default function CityMarkersLayer({
  map,
  cities,
  showCities,
  onSelectCity,
}: CityMarkersLayerProps) {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const superclusterRef = useRef<Supercluster<EvaluatedCity> | null>(null);

  // 1. Build and update Supercluster k-d tree index whenever cities data changes
  useEffect(() => {
    if (!cities || cities.length === 0) {
      superclusterRef.current = null;
      return;
    }

    const clusterIndex = new Supercluster<EvaluatedCity>({
      radius: 65,
      maxZoom: 16,
      minPoints: 2,
    });

    const features: GeoJSON.Feature<GeoJSON.Point, EvaluatedCity>[] = cities.map((city) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [city.lng, city.lat],
      },
      properties: city,
    }));

    clusterIndex.load(features);
    superclusterRef.current = clusterIndex;
  }, [cities]);

  // 2. Render visible clusters and markers based on map bounding box & zoom
  useEffect(() => {
    if (!map) return;

    let isCancelled = false;

    import('leaflet').then((LModule) => {
      if (isCancelled || !map) return;

      if (!layerGroupRef.current) {
        layerGroupRef.current = LModule.layerGroup().addTo(map);
      }

      const layerGroup = layerGroupRef.current;

      const renderViewport = () => {
        if (!map || isCancelled) return;
        layerGroup.clearLayers();

        if (!showCities || !superclusterRef.current) {
          return;
        }

        const bounds = map.getBounds();
        const bbox: [number, number, number, number] = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ];
        const zoom = Math.round(map.getZoom());

        let visibleItems: any[] = [];
        try {
          visibleItems = superclusterRef.current.getClusters(bbox, zoom);
        } catch {
          visibleItems = [];
        }

        visibleItems.forEach((item) => {
          const [lng, lat] = item.geometry.coordinates;

          // Case A: Clustered Group of Cities
          if (item.properties && item.properties.cluster) {
            const count = item.properties.point_count;
            const clusterId = item.id as number;

            // Determine cluster severity tint based on leaves
            let hasDanger = false;
            let hasWarning = false;
            try {
              const leaves = superclusterRef.current?.getLeaves(clusterId, 15, 0) || [];
              for (const leaf of leaves) {
                if (leaf.properties.status === 'danger' || leaf.properties.status === 'impacted') {
                  hasDanger = true;
                  break;
                }
                if (leaf.properties.status === 'warning') {
                  hasWarning = true;
                }
              }
            } catch {
              // Safe fallback
            }

            const clusterBg = hasDanger
              ? '#7F1D1D'
              : hasWarning
              ? '#7C2D12'
              : '#064E3B';
            const clusterBorder = hasDanger
              ? '#EF4444'
              : hasWarning
              ? '#F97316'
              : '#10B981';
            const clusterShadow = hasDanger
              ? 'rgba(239, 68, 68, 0.6)'
              : hasWarning
              ? 'rgba(249, 115, 22, 0.5)'
              : 'rgba(16, 185, 129, 0.4)';

            const badgeSize = count > 50 ? 38 : count > 20 ? 34 : 30;

            const clusterIcon = LModule.divIcon({
              className: 'custom-city-cluster-marker',
              html: `
                <div style="width: ${badgeSize}px; height: ${badgeSize}px; border-radius: 50%; background: ${clusterBg}; border: 2px solid ${clusterBorder}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${clusterShadow}; cursor: pointer; color: #FFFFFF; font-family: monospace; font-weight: 800; font-size: 11px; transition: transform 0.15s ease;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1.0)'">
                  ${count}
                </div>
              `,
              iconSize: [badgeSize, badgeSize],
              iconAnchor: [badgeSize / 2, badgeSize / 2],
            });

            const clusterMarker = LModule.marker([lat, lng], { icon: clusterIcon });
            clusterMarker.on('click', () => {
              if (superclusterRef.current && map) {
                try {
                  const expansionZoom = superclusterRef.current.getClusterExpansionZoom(clusterId);
                  map.flyTo([lat, lng], Math.min(expansionZoom, 15), { duration: 0.8 });
                } catch {
                  map.flyTo([lat, lng], map.getZoom() + 2, { duration: 0.8 });
                }
              }
            });

            clusterMarker.bindTooltip(
              `<div style="font-size: 11px; font-weight: bold; color: #F8FAFC;">Kluster ${count} Wilayah</div><div style="font-size: 10px; color: #94A3B8;">Klik untuk memperbesar</div>`,
              { direction: 'top', offset: [0, -badgeSize / 2] }
            );

            layerGroup.addLayer(clusterMarker);
            return;
          }

          // Case B: Individual City Marker Leaf
          const city = item.properties as EvaluatedCity;

          let color = '#10B981'; // Green for safe
          let radius = 4;
          let fillOpacity = 0.75;

          if (city.status === 'standby') {
            color = '#64748B'; // Slate-500 neutral for standby
            radius = 3.5;
            fillOpacity = 0.6;
          } else if (city.status === 'impacted' || city.status === 'danger') {
            color = '#EF4444';
            radius = 6.5;
            fillOpacity = 0.95;
          } else if (city.status === 'warning') {
            color = '#F97316';
            radius = 5.5;
            fillOpacity = 0.85;
          } else if (city.status === 'advisory') {
            color = '#EAB308';
            radius = 4.5;
            fillOpacity = 0.8;
          }

          const tooltipHtml = `
            <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #F8FAFC;">
              <span style="color: ${color};">●</span> ${escapeHtml(city.cityName)}
              <div style="font-weight: normal; font-size: 10px; color: #94A3B8;">
                ${escapeHtml(city.province)} • ${escapeHtml(city.statusLabel)}${city.status !== 'standby' ? ` (${escapeHtml(city.distanceKm)} km)` : ''}
              </div>
            </div>
          `;

          const safeCityId = escapeHtml(city.id);
          const popupHtml = `
            <div style="font-family: inherit; font-size: 12px; line-height: 1.45; color: #F8FAFC; min-width: 220px;">
              <div style="font-weight: bold; font-size: 13px; color: #F1F5F9; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
                ${escapeHtml(city.cityName)}
              </div>
              <div style="color: #94A3B8; font-size: 11px;">Provinsi: <strong style="color: #CBD5E1;">${escapeHtml(city.province)}</strong> (${escapeHtml(city.islandGroup)})</div>
              <div style="color: #94A3B8; font-size: 11px;">Estimasi Populasi: <strong style="color: #CBD5E1;">~${city.population.toLocaleString('id-ID')} jiwa</strong></div>
              ${city.status !== 'standby' ? `
                <div style="color: #94A3B8; font-size: 11px;">Jarak ke Bencana: <strong style="color: #CBD5E1;">${escapeHtml(city.distanceKm)} km</strong></div>
              ` : ''}
              
              <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: ${color}20; border: 1px solid ${color}50; font-size: 11px; font-weight: bold; color: ${color};">
                Status: ${escapeHtml(city.statusLabel)}
              </div>
              
              ${city.etaMinutes !== undefined ? `
                <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
                  ETA Gelombang: <strong style="color: #38BDF8;">${escapeHtml(city.etaMinutes)} Menit</strong> • Estimasi Tinggi: <strong style="color: #38BDF8;">~${escapeHtml(city.waveHeightM)}m</strong>
                </div>
              ` : ''}

              <button id="focus-city-${safeCityId}" style="margin-top: 8px; width: 100%; padding: 5px 8px; background: #1E293B; color: #38BDF8; border: 1px solid #38BDF8; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; transition: all 0.15s;">
                ⌖ Fokuskan Peta ke Kota Ini
              </button>
            </div>
          `;

          const marker = LModule.circleMarker([lat, lng], {
            radius,
            color: '#0F172A',
            weight: 1.2,
            fillColor: color,
            fillOpacity,
          });

          marker.bindTooltip(tooltipHtml, {
            direction: 'top',
            offset: [0, -5],
            opacity: 0.95,
          });

          marker.bindPopup(popupHtml);

          marker.on('popupopen', () => {
            const btn = document.getElementById(`focus-city-${city.id}`);
            if (btn && onSelectCity) {
              btn.onclick = () => {
                onSelectCity(city);
                map.flyTo([lat, lng], 9, { duration: 1.2 });
              };
            }
          });

          layerGroup.addLayer(marker);
        });
      };

      // Initial render
      renderViewport();

      // Viewport change listeners
      map.on('moveend', renderViewport);
      map.on('zoomend', renderViewport);

      return () => {
        map.off('moveend', renderViewport);
        map.off('zoomend', renderViewport);
      };
    });

    return () => {
      isCancelled = true;
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [map, showCities, onSelectCity]);

  return null;
}
