import React, { useEffect, useRef, useState } from 'react';
import { COLORS, ICONS } from '../constants.tsx';

declare const L: any;

interface CityGroup {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
}

interface MapProps {
  groups: CityGroup[];
  onMarkerClick: (group: CityGroup) => void;
  selectedGroupId?: string;
  flyToLocation?: { lat: number, lng: number };
}

const SupportMap: React.FC<MapProps> = ({ groups, onMarkerClick, selectedGroupId, flyToLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = L.map(mapContainer.current, {
        center: [54, -98], 
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);
      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
      
      map.whenReady(() => {
        setMapReady(true);
        map.invalidateSize();
      });

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      });
      resizeObserver.observe(mapContainer.current);

      return () => resizeObserver.disconnect();
    } catch (err) {
      console.error("Map load error:", err);
    }
  }, []);

  const getFocusZoom = () => {
    if (typeof window === 'undefined') return 10;
    if (window.innerWidth < 480) return 9;
    if (window.innerWidth < 768) return 9.5;
    return 10.5;
  };

  useEffect(() => {
    if (mapInstance.current && flyToLocation) {
      mapInstance.current.flyTo([flyToLocation.lat, flyToLocation.lng], getFocusZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [flyToLocation]);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    const positionCounts = new Map<string, number>();
    const positionIndex = new Map<string, number>();

    groups.forEach(group => {
      const key = `${group.lat},${group.lng}`;
      positionCounts.set(key, (positionCounts.get(key) || 0) + 1);
    });

    groups.forEach(group => {
      const key = `${group.lat},${group.lng}`;
      const index = positionIndex.get(key) || 0;
      positionIndex.set(key, index + 1);
      const total = positionCounts.get(key) || 1;
      const spreadRadius = 0.02;
      const angle = total > 1 ? (index / total) * Math.PI * 2 : 0;
      const lat = total > 1 ? group.lat + Math.sin(angle) * spreadRadius : group.lat;
      const lng = total > 1 ? group.lng + Math.cos(angle) * spreadRadius : group.lng;
      const isSelected = group.id === selectedGroupId;
      
      const icon = L.divIcon({
        className: `custom-marker-wrapper`,
        html: `
          <div style="
            width: ${isSelected ? '56px' : '46px'};
            height: ${isSelected ? '56px' : '46px'};
            background-color: ${isSelected ? COLORS.coral400 : COLORS.teal500};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(30,58,52,0.2);
            transform: translate(-50%, -50%);
            transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
            position: relative;
          ">
            <div style="
              width: ${isSelected ? '30px' : '24px'};
              height: ${isSelected ? '30px' : '24px'};
              border-radius: 10px;
              background: rgba(255,255,255,0.18);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: ${isSelected ? '14px' : '12px'};
              letter-spacing: 0.04em;
            ">
              ${group.count}
            </div>
            <div style="
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              color: ${COLORS.teal900};
              font-weight: 700;
              font-size: 9px;
              padding: 2px 8px;
              border-radius: 999px;
              box-shadow: 0 6px 12px rgba(15,23,42,0.12);
              text-transform: uppercase;
              letter-spacing: 0.12em;
              white-space: nowrap;
            ">
              notes
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([lat, lng], { icon })
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          onMarkerClick(group);
          mapInstance.current.setView([lat, lng], getFocusZoom(), { animate: true });
        });

      markersLayer.current.addLayer(marker);
    });
  }, [groups, selectedGroupId, onMarkerClick]);

  return (
    <div className="w-full h-full relative bg-[#f0f4f3] overflow-hidden">
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[2000] bg-white">
          <div className="w-10 h-10 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#1e3a34] font-black text-[10px] uppercase tracking-widest opacity-40">Initializing Map...</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default SupportMap;
