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
  flyToLocation?: { lat: number, lng: number };
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
        map.off('zoomend moveend resize', refreshMarkers);
        resizeObserver.disconnect();
      };
    } catch (err) {
      console.error("Map load error:", err);
    }
  }, []);

  const getClusterThresholdForZoom = (zoom: number) => {
    if (zoom < 5) return 104;
    if (zoom < 7) return 92;
    if (zoom < 9) return 78;
    if (zoom < 11) return 66;
    if (zoom < 13) return 54;
    return 42;
  };

  const getClusterThreshold = () => getClusterThresholdForZoom(mapInstance.current?.getZoom?.() ?? 4);

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

  // Fixed-seed cluster simulation.
  // IMPORTANT: seeds never move after placement. Centroid drift (chaining) causes
  // intermediate cities to drag neighbouring seeds together, making countClustersAtZoom
  // disagree with buildMarkerClusters. By fixing the seed at the first group's position
  // new groups join the nearest seed but do not shift it, giving stable, predictable
  // results that exactly mirror what buildMarkerClusters produces at the same zoom.
  const countClustersAtZoom = (targetGroups: CityGroup[], zoom: number): number => {
    const map = mapInstance.current;
    if (!map) return 1;

    const threshold = getClusterThresholdForZoom(zoom);
    const seeds: { x: number; y: number }[] = [];

    for (const group of targetGroups) {
      const pt = map.project([group.lat, group.lng], zoom);
      const hit = seeds.find(s => {
        const dx = s.x - pt.x;
        const dy = s.y - pt.y;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
      });
      if (!hit) seeds.push({ x: pt.x, y: pt.y });
    }

    return seeds.length;
  };

  // Find the first zoom level where the OVERALL cluster count increases.
  // Using all `groups` (not just cluster.groups) means the simulation matches
  // buildMarkerClusters exactly — same input, same fixed-seed algorithm.
  const getClusterBreakoutZoom = (cluster: MarkerCluster): number => {
    const map = mapInstance.current;
    if (!map || cluster.groups.length <= 1) return getFocusZoom();

    const currentZoom = map.getZoom();
    const baseCount = countClustersAtZoom(groups, Math.round(currentZoom));

    for (let zoom = Math.ceil(currentZoom) + 1; zoom <= 18; zoom += 1) {
      if (countClustersAtZoom(groups, zoom) > baseCount) return zoom;
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
    mapInstance.current.flyTo([group.lat, group.lng], getGroupFocusZoom(group), {
      animate: true,
      duration: 1.05,
    });
  };

  const focusCluster = (cluster: MarkerCluster) => {
    if (!mapInstance.current) return;

    const now = Date.now();
    const wasJustClicked = lastClusterClick.current?.id === cluster.id && now - lastClusterClick.current.clickedAt < 900;
    lastClusterClick.current = { id: cluster.id, clickedAt: now };

    // Find the zoom level where this cluster first splits into distinguishable sub-clusters.
    // We do NOT use getReadableSeparationZoom here — that forces 220px separation for every
    // pair, which drives targetZoom to 11+ for any cluster containing nearby cities (e.g.
    // Toronto–Hamilton), then flyTo(boundsCenter, 11) scrolls most of those cities offscreen.
    const breakoutZoom = getClusterBreakoutZoom(cluster);
    const currentZoom = mapInstance.current.getZoom();

    // If all pins are co-located (identical coords) or the user double-clicked while already
    // at the breakout zoom, fall through to selecting the group with the most posts.
    if (breakoutZoom >= 18 || (wasJustClicked && currentZoom >= breakoutZoom - 0.35)) {
      const primaryGroup = [...cluster.groups].sort((a, b) => b.count - a.count)[0];
      focusGroup(primaryGroup);
      return;
    }

    // Fly exactly to breakoutZoom centred on the cluster's geographic centre.
    //
    // WHY NOT flyToBounds: flyToBounds(bounds, { maxZoom: breakoutZoom }) treats maxZoom as
    // an UPPER BOUND — if the bounds span a large area (e.g. all of Canada), Leaflet picks a
    // LOWER zoom to fit the bounds in the viewport.  That lower zoom is below breakoutZoom,
    // so buildMarkerClusters runs at the lower zoom, all groups are still within threshold,
    // and the cluster never splits.  flyTo(center, breakoutZoom) guarantees we land at the
    // exact zoom where countClustersAtZoom first returns > 1, which is the same zoom at which
    // buildMarkerClusters will produce multiple visible pins.
    const bounds = L.latLngBounds(cluster.groups.map((g) => [g.lat, g.lng]));
    const center = bounds.getCenter();
    mapInstance.current.flyTo([center.lat, center.lng], breakoutZoom, {
      animate: true,
      duration: 1,
    });
  };

  const buildMarkerClusters = (): MarkerCluster[] => {
    const map = mapInstance.current;
    if (!map) return [];

    const threshold = getClusterThreshold();

    // Each entry holds an immovable SEED point (used for comparison) and a
    // mutable visual centroid (used for marker placement). Keeping the seed
    // fixed means cities can only join a cluster they are close to the SEED,
    // not to a centroid that has drifted toward a neighbour — no chaining.
    const slots: { seed: { x: number; y: number }; mc: MarkerCluster }[] = [];

    for (const group of groups) {
      const point = map.latLngToLayerPoint([group.lat, group.lng]);

      const hit = slots.find(s => {
        const dx = s.seed.x - point.x;
        const dy = s.seed.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
      });

      if (!hit) {
        slots.push({
          seed: { x: point.x, y: point.y },
          mc: {
            id: group.id,
            groups: [group],
            lat: group.lat,
            lng: group.lng,
            point: { x: point.x, y: point.y },
            postCount: group.count,
          },
        });
        continue;
      }

      // Group joins this slot — update visual centroid but NOT the seed.
      const mc = hit.mc;
      const n = mc.groups.length + 1;
      mc.groups.push(group);
      mc.postCount += group.count;
      mc.lat = (mc.lat * (n - 1) + group.lat) / n;
      mc.lng = (mc.lng * (n - 1) + group.lng) / n;
      mc.point = { x: (mc.point.x * (n - 1) + point.x) / n, y: (mc.point.y * (n - 1) + point.y) / n };
      mc.id = mc.groups.map(g => g.id).join('__');
    }

    return slots.map(s => s.mc);
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
      mapInstance.current.flyTo([flyToLocation.lat, flyToLocation.lng], getFocusZoom(), {
        animate: true,
        duration: 1.5
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
