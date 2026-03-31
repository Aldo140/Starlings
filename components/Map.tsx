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
  posts: any[]; // Or Post[] if imported
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

      // Intelligent Marker Coloring
      const resourceCount = group.posts.filter((p: any) => typeof p.message === 'string' && p.message.startsWith('[RESOURCE')).length;
      const storyCount = group.posts.length - resourceCount;

      let backgroundStyle = `background-color: ${COLORS.teal500};`;
      if (resourceCount > 0 && storyCount === 0) {
        backgroundStyle = `background-color: ${COLORS.coral400};`;
      } else if (resourceCount > 0 && storyCount > 0) {
        backgroundStyle = `background: linear-gradient(135deg, ${COLORS.teal500} 50%, ${COLORS.coral400} 50%);`;
      }

      const icon = L.divIcon({
        className: `custom-marker-wrapper`,
        html: `
          <div style="position: relative; width: ${isSelected ? '64px' : '54px'}; height: ${isSelected ? '64px' : '54px'}; display: flex; align-items: center; justify-content: center;">
            
            <!-- Ambient Pulse Layer -->
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              ${backgroundStyle}
              opacity: 0.4;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              z-index: 0;
            "></div>

            <!-- Main Marker Body -->
            <div 
              role="button" 
              tabindex="0" 
              aria-label="${group.count} items from ${group.city}"
              style="
              width: ${isSelected ? '56px' : '46px'};
              height: ${isSelected ? '56px' : '46px'};
              ${backgroundStyle}
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 8px 24px rgba(30,58,52,0.25);
              transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
              position: relative;
              z-index: 10;
              cursor: pointer;
            " onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); this.click();}">
              <div style="
                width: ${isSelected ? '30px' : '24px'};
                height: ${isSelected ? '30px' : '24px'};
                border-radius: 10px;
                background: rgba(255,255,255,0.25);
                backdrop-filter: blur(4px);
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
                bottom: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                color: ${COLORS.teal900};
                font-weight: 800;
                font-size: 9px;
                padding: 3px 10px;
                border-radius: 999px;
                box-shadow: 0 6px 12px rgba(15,23,42,0.12);
                text-transform: uppercase;
                letter-spacing: 0.12em;
                white-space: nowrap;
              ">
                ${resourceCount > 0 && storyCount > 0 ? 'Mixed' : (resourceCount > 0 ? 'Resources' : 'Stories')}
              </div>
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
    <div className="absolute inset-0 w-full h-full bg-[#f0f4f3] overflow-hidden">
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[2000] bg-[#f0f4f3]">
          <div className="w-10 h-10 border-4 border-[#448a7d] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#1e3a34] font-black text-[10px] uppercase tracking-widest opacity-40">Initializing Map...</p>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full z-10" />
    </div>
  );
};

export default SupportMap;
