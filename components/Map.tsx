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
  items: { kind: 'post' | 'resource'; data: any }[];
  topTags: string[];
}

interface MapProps {
  groups: CityGroup[];
  onMarkerClick: (group: CityGroup) => void;
  selectedGroupId?: string;
  flyToLocation?: { lat: number, lng: number, requestId: number };
}

interface MarkerCluster {
  id: string;
  groups: CityGroup[];
  lat: number;
  lng: number;
  point: { x: number; y: number };
  postCount: number;
}

interface ClusterClickState {
  id: string;
  clickedAt: number;
}

const PIN_READABLE_DISTANCE = 220;
const PIN_SELECTED_DISTANCE = 240;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const SupportMap: React.FC<MapProps> = ({ groups, onMarkerClick, selectedGroupId, flyToLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const lastClusterClick = useRef<ClusterClickState | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapRenderKey, setMapRenderKey] = useState(0);

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

      const refreshMarkers = () => setMapRenderKey((key) => key + 1);
      map.on('zoomend moveend resize', refreshMarkers);

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          refreshMarkers();
        }
      });
      resizeObserver.observe(mapContainer.current);

      return () => {
        // Remove listeners first so they don't fire during teardown.
        map.off('zoomend moveend resize', refreshMarkers);
        resizeObserver.disconnect();
        // Destroy the Leaflet instance and null the refs so that React
        // StrictMode's second effect run (which re-invokes this effect after
        // the cleanup) can safely recreate the map from scratch — including
        // re-registering the zoomend/moveend listeners that drive dynamic
        // pin clustering.  Without this, StrictMode removes the listeners in
        // the cleanup then short-circuits the second run (mapInstance.current
        // is still set), leaving the map alive but unresponsive to zoom events.
        map.remove();
        mapInstance.current = null;
        markersLayer.current = null;
        setMapReady(false);
      };
    } catch (err) {
      console.error("Map load error:", err);
    }
  }, []);

  // Threshold = "how close (in screen pixels) must two pin centres be to merge?"
  // Single pins are 46px wide. Two pins "visually touch" when centres ≈ 46px apart.
  // We add ~25px buffer so pins that are close but not quite touching still cluster.
  // Lower thresholds than before: the old values (92–104) were causing Calgary–Edmonton
  // (49px apart at zoom 4) to be right on the boundary and BREAK the split at zoom 5.
  const getClusterThresholdForZoom = (zoom: number) => {
    if (zoom < 5) return 72;   // cluster when pins would visually overlap at this zoom
    if (zoom < 7) return 62;
    if (zoom < 9) return 52;
    if (zoom < 11) return 44;
    if (zoom < 13) return 38;
    return 32;
  };

  // Round zoom to nearest integer so fractional zoom values (e.g. 4.9999 from flyTo)
  // don't land in the wrong threshold bucket and cause render/simulation mismatches.
  const getClusterThreshold = () => getClusterThresholdForZoom(Math.round(mapInstance.current?.getZoom?.() ?? 4));

  const getFocusZoom = () => {
    if (typeof window === 'undefined') return 10;
    if (window.innerWidth < 480) return 9;
    if (window.innerWidth < 768) return 9.5;
    return 10.5;
  };

  const getReadableSeparationZoom = (clusterGroups: CityGroup[], minDistance = 84) => {
    const map = mapInstance.current;
    if (!map || clusterGroups.length <= 1) return getFocusZoom();

    const getNearestDistanceAtZoom = (zoom: number) => {
      let nearestDistance = Infinity;

      clusterGroups.forEach((group, index) => {
        const pointA = map.project([group.lat, group.lng], zoom);
        clusterGroups.slice(index + 1).forEach((other) => {
          const pointB = map.project([other.lat, other.lng], zoom);
          nearestDistance = Math.min(nearestDistance, pointA.distanceTo(pointB));
        });
      });

      return nearestDistance;
    };

    const currentZoom = map.getZoom();
    if (getNearestDistanceAtZoom(currentZoom) >= minDistance) return currentZoom;

    for (let zoom = Math.ceil(currentZoom) + 1; zoom <= 18; zoom += 1) {
      if (getNearestDistanceAtZoom(zoom) >= minDistance) return zoom;
    }

    return 18;
  };


  const getGroupFocusZoom = (group: CityGroup) => {
    const map = mapInstance.current;
    if (!map) return getFocusZoom();

    const nearbyGroups = groups.filter((candidate) => {
      if (candidate.id === group.id) return true;

      const candidatePoint = map.project([candidate.lat, candidate.lng], map.getZoom());
      const groupPoint = map.project([group.lat, group.lng], map.getZoom());
      return candidatePoint.distanceTo(groupPoint) <= getClusterThreshold() * 1.25;
    });

    return Math.max(getFocusZoom(), getReadableSeparationZoom(nearbyGroups, PIN_SELECTED_DISTANCE));
  };

  const focusGroup = (group: CityGroup, shouldSelect = true) => {
    if (!mapInstance.current) return;

    if (shouldSelect) onMarkerClick(group);
    mapInstance.current.stop();
    mapInstance.current.flyTo([group.lat, group.lng], getGroupFocusZoom(group), {
      animate: true,
      duration: 0.42,
    });
  };

  const focusCluster = (cluster: MarkerCluster) => {
    if (!mapInstance.current) return;

    const now = Date.now();
    const wasJustClicked = lastClusterClick.current?.id === cluster.id && now - lastClusterClick.current.clickedAt < 550;
    lastClusterClick.current = { id: cluster.id, clickedAt: now };

    // Double-click: select the group with the most posts directly.
    if (wasJustClicked || cluster.groups.length <= 1) {
      focusGroup([...cluster.groups].sort((a, b) => b.count - a.count)[0]);
      return;
    }

    const bounds = L.latLngBounds(cluster.groups.map((g) => [g.lat, g.lng]));

    // If all groups sit at the exact same point (identical coords), select directly.
    const spanDeg = (bounds.getNorth() - bounds.getSouth()) + (bounds.getEast() - bounds.getWest());
    if (spanDeg < 0.001) {
      focusGroup([...cluster.groups].sort((a, b) => b.count - a.count)[0]);
      return;
    }

    // flyToBounds — let Leaflet pick the zoom that fits these cities in the viewport.
    // The zoom it picks is ALWAYS high enough that the cities' pixel distances exceed
    // the clustering threshold (because at the chosen zoom, the bounds fill the viewport,
    // meaning cities are hundreds of pixels apart — well above any threshold value).
    // No simulation needed: the geography guarantees separation.
    mapInstance.current.stop();
    mapInstance.current.flyToBounds(bounds, {
      paddingTopLeft: [60, 40],
      paddingBottomRight: [60, 60],
      animate: true,
      duration: 0.4,
      maxZoom: 12,
    });
  };

  const buildMarkerClusters = (): MarkerCluster[] => {
    const map = mapInstance.current;
    if (!map) return [];

    const threshold = getClusterThreshold();
    const clusters: MarkerCluster[] = [];

    groups.forEach((group) => {
      const point = map.latLngToLayerPoint([group.lat, group.lng]);

      // Find the nearest cluster whose CENTROID is within threshold.
      // Centroid updates on each addition (chaining) — this is what allows
      // groups to merge into one big cluster as you zoom out.
      const matchingCluster = clusters.find((cluster) => {
        const dx = cluster.point.x - point.x;
        const dy = cluster.point.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
      });

      if (!matchingCluster) {
        clusters.push({
          id: group.id,
          groups: [group],
          lat: group.lat,
          lng: group.lng,
          point,
          postCount: group.count,
        });
        return;
      }

      const nextTotal = matchingCluster.groups.length + 1;
      matchingCluster.groups.push(group);
      matchingCluster.postCount += group.count;
      matchingCluster.point = {
        x: (matchingCluster.point.x * (nextTotal - 1) + point.x) / nextTotal,
        y: (matchingCluster.point.y * (nextTotal - 1) + point.y) / nextTotal,
      };
      matchingCluster.lat = (matchingCluster.lat * (nextTotal - 1) + group.lat) / nextTotal;
      matchingCluster.lng = (matchingCluster.lng * (nextTotal - 1) + group.lng) / nextTotal;
      matchingCluster.id = matchingCluster.groups.map((g) => g.id).join('__');
    });

    return clusters;
  };

  useEffect(() => {
    if (!mapInstance.current) return;

    const selectedGroup = selectedGroupId
      ? groups.find((group) => group.id === selectedGroupId)
      : null;

    if (selectedGroup) {
      focusGroup(selectedGroup, false);
      return;
    }

    if (flyToLocation) {
      mapInstance.current.stop();
      mapInstance.current.flyTo([flyToLocation.lat, flyToLocation.lng], getFocusZoom(), {
        animate: true,
        duration: 0.65,
      });
    }
  }, [flyToLocation, selectedGroupId, groups]);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    buildMarkerClusters().forEach(cluster => {
      const isCluster = cluster.groups.length > 1;
      const group = cluster.groups[0];
      const isSelected = group.id === selectedGroupId;

      if (isCluster) {
        const hasSelectedGroup = cluster.groups.some((clusterGroup) => clusterGroup.id === selectedGroupId);
        const label = cluster.groups
          .slice(0, 3)
          .map((clusterGroup) => escapeHtml(clusterGroup.city))
          .join(' + ');

        const iconSize = hasSelectedGroup ? 78 : 68;
        const icon = L.divIcon({
          className: 'custom-marker-wrapper',
          html: `
            <div style="position: relative; width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center;">
              <div style="
                position: absolute;
                inset: 5px;
                border-radius: 44% 56% 54% 46% / 52% 42% 58% 48%;
                background: linear-gradient(135deg, ${COLORS.teal500}, ${COLORS.coral400});
                opacity: 0.2;
                animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                position: absolute;
                top: 8px;
                right: 9px;
                width: 10px;
                height: 10px;
                border-radius: 999px;
                background: ${COLORS.coral400};
                border: 2px solid white;
                box-shadow: 0 8px 16px rgba(30,58,52,0.18);
              "></div>
              <div style="
                position: absolute;
                bottom: 11px;
                left: 7px;
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: ${COLORS.teal500};
                border: 2px solid white;
                box-shadow: 0 8px 16px rgba(30,58,52,0.18);
              "></div>
              <div style="
                position: absolute;
                bottom: 5px;
                right: 15px;
                width: 7px;
                height: 7px;
                border-radius: 999px;
                background: ${COLORS.teal900};
                border: 2px solid white;
                box-shadow: 0 8px 16px rgba(30,58,52,0.18);
              "></div>
              <div role="button" tabindex="0" aria-label="${cluster.groups.length} grouped pins containing ${cluster.postCount} posts" style="
                width: ${iconSize - 14}px;
                height: ${iconSize - 14}px;
                border-radius: 44% 56% 54% 46% / 52% 42% 58% 48%;
                background: linear-gradient(135deg, ${COLORS.teal500} 0%, ${COLORS.teal500} 48%, ${COLORS.coral400} 49%, ${COLORS.coral400} 100%);
                border: 3px solid white;
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 0 18px 34px rgba(30,58,52,0.24);
                cursor: pointer;
                position: relative;
              " onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); this.click();}">
                <span style="font-weight: 900; font-size: ${hasSelectedGroup ? '18px' : '16px'}; line-height: 1;">${cluster.groups.length}</span>
                <span style="font-weight: 900; font-size: 7px; line-height: 1; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.9; margin-top: 3px;">pins</span>
              </div>
              <div style="
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255,255,255,0.96);
                color: ${COLORS.teal900};
                font-weight: 900;
                font-size: 8px;
                padding: 4px 9px;
                border-radius: 999px;
                box-shadow: 0 8px 16px rgba(15,23,42,0.12);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                white-space: nowrap;
              ">${cluster.postCount} posts · ${label}${cluster.groups.length > 3 ? ' +' : ''}</div>
            </div>
          `,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2]
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon })
          .on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            focusCluster(cluster);
          });

        markersLayer.current.addLayer(marker);
        return;
      }

      // Intelligent Marker Coloring
      const resourceCount = group.items.filter((i) => i.kind === 'resource').length;
      const storyCount = group.items.filter((i) => i.kind === 'post').length;
      const markerKindLabel = resourceCount > 0 && storyCount > 0
        ? 'Mixed'
        : resourceCount > 0
          ? `${resourceCount} ${resourceCount === 1 ? 'Resource' : 'Resources'}`
          : `${storyCount} ${storyCount === 1 ? 'Story' : 'Stories'}`;

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
              border-radius: 46% 54% 52% 48% / 50% 44% 56% 50%;
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
              border-radius: 46% 54% 52% 48% / 50% 44% 56% 50%;
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
                position: absolute;
                top: 8px;
                right: 9px;
                width: 7px;
                height: 7px;
                border-radius: 999px;
                background: rgba(255,255,255,0.45);
              "></div>
              <div style="
                width: ${isSelected ? '30px' : '24px'};
                height: ${isSelected ? '30px' : '24px'};
                border-radius: 40% 60% 52% 48% / 48% 42% 58% 52%;
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
                ${markerKindLabel}
              </div>
            </div>
          </div>
        `,
        iconSize: [isSelected ? 64 : 54, isSelected ? 64 : 54],
        iconAnchor: [isSelected ? 32 : 27, isSelected ? 32 : 27]
      });

      const marker = L.marker([group.lat, group.lng], { icon })
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          focusGroup(group);
        });

      markersLayer.current.addLayer(marker);
    });
  }, [groups, selectedGroupId, onMarkerClick, mapRenderKey]);

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
