import React, { useEffect, useRef, useState } from 'react';
import { Post } from '../types.ts';
import { COLORS, ICONS } from '../constants.tsx';

declare const L: any;

interface MapProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
  selectedPostId?: string;
  flyToLocation?: { lat: number, lng: number };
}

const Map: React.FC<MapProps> = ({ posts, onMarkerClick, selectedPostId, flyToLocation }) => {
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

  useEffect(() => {
    if (mapInstance.current && flyToLocation) {
      mapInstance.current.flyTo([flyToLocation.lat, flyToLocation.lng], 10, {
        animate: true,
        duration: 1.5
      });
    }
  }, [flyToLocation]);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    posts.forEach(post => {
      const isSelected = post.id === selectedPostId;
      
      const icon = L.divIcon({
        className: `custom-marker-wrapper`,
        html: `
          <div style="
            width: ${isSelected ? '48px' : '36px'};
            height: ${isSelected ? '48px' : '36px'};
            background-color: ${isSelected ? COLORS.coral400 : COLORS.teal500};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(30,58,52,0.2);
            transform: translate(-50%, -50%);
            transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 24 : 18}" height="${isSelected ? 24 : 18}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([post.lat, post.lng], { icon })
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          onMarkerClick(post);
          mapInstance.current.setView([post.lat, post.lng], 9, { animate: true });
        });

      markersLayer.current.addLayer(marker);
    });
  }, [posts, selectedPostId, onMarkerClick]);

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

export default Map;