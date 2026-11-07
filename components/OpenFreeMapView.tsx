"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { Maximize2, Minimize2, Navigation, Layers } from "lucide-react";

export type OpenFreeMapStyle = "streets" | "dark" | "osm" | "liberty" | "bright" | "positron";

export const ESRI_STREETS_STYLE: any = {
  version: 8,
  sources: {
    "esri-streets": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China, TomTom',
    },
  },
  layers: [
    {
      id: "esri-streets-layer",
      type: "raster",
      source: "esri-streets",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// 2. OpenStreetMap Standard Raster: 100% Open, free, canonical worldwide street map.
export const OSM_RASTER_STYLE: any = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// 3. OpenStreetMap Dark Filtered: Styled raster for dark mode with zero API keys.
export const OSM_DARK_STYLE: any = {
  version: 8,
  sources: {
    "osm-dark-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-dark-layer",
      type: "raster",
      source: "osm-dark-tiles",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        "raster-saturation": -0.85,
        "raster-contrast": 0.35,
        "raster-brightness-max": 0.65,
      },
    },
  ],
};

export function getStyleDefinition(style: string): string | object {
  switch (style) {
    case "streets":
    case "esri":
      return ESRI_STREETS_STYLE;
    case "dark":
      return "https://tiles.openfreemap.org/styles/dark";
    case "osm":
      return OSM_RASTER_STYLE;
    case "osm-dark":
      return OSM_DARK_STYLE;
    case "bright":
      return "https://tiles.openfreemap.org/styles/bright";
    case "liberty":
      return "https://tiles.openfreemap.org/styles/liberty";
    case "positron":
      return "https://tiles.openfreemap.org/styles/positron";
    default:
      return ESRI_STREETS_STYLE;
  }
}

export interface MapMarker {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string; // Hex or CSS color
}

export interface OpenFreeMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  markers?: MapMarker[];
  interactive?: boolean;
  styleMode?: OpenFreeMapStyle;
  autoThemeStyle?: boolean; // When true, uses dark style in dark mode, streets/voyager in light mode
  height?: string;
  className?: string;
  showControls?: boolean;
  enablePicker?: boolean;
  onLocationSelect?: (coords: { latitude: number; longitude: number; address?: string }) => void;
}

export default function OpenFreeMapView({
  latitude = 6.4281, // Default Lagos / Lekki, Nigeria coordinates
  longitude = 3.4219,
  zoom = 13,
  markers = [],
  interactive = true,
  styleMode,
  autoThemeStyle = true,
  height = "320px",
  className = "",
  showControls = true,
  enablePicker = false,
  onLocationSelect,
}: OpenFreeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
  const pickerMarkerRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();
  const [selectedStyle, setSelectedStyle] = useState<OpenFreeMapStyle>(() => {
    if (styleMode) return styleMode;
    return resolvedTheme === "dark" ? "dark" : "streets";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Normalize coordinates safely
  const numLat = Number(latitude);
  const numLng = Number(longitude);
  const validLat = Number.isFinite(numLat) && numLat !== 0 ? numLat : 6.4281;
  const validLng = Number.isFinite(numLng) && numLng !== 0 ? numLng : 3.4219;

  // Sync style with dark/light mode if autoThemeStyle is active and styleMode is not manually forced
  useEffect(() => {
    if (!styleMode && autoThemeStyle) {
      setSelectedStyle(resolvedTheme === "dark" ? "dark" : "streets");
    }
  }, [resolvedTheme, styleMode, autoThemeStyle]);

  // Helper to render property markers
  const renderMarkers = useCallback((map: any, maplibre: any) => {
    if (!map || !maplibre) return;

    // Clear old markers
    markerInstancesRef.current.forEach((m) => {
      try {
        m.remove();
      } catch {
        // ignore
      }
    });
    markerInstancesRef.current = [];

    const listToRender = [...markers];

    // If no markers provided but we have center coordinates, add default center pin
    if (listToRender.length === 0 && !enablePicker) {
      listToRender.push({
        latitude: validLat,
        longitude: validLng,
        title: "Property Location",
        color: "#10b981", // Canonical Emerald
      });
    }

    listToRender.forEach((item) => {
      const itemLat = Number(item.latitude);
      const itemLng = Number(item.longitude);
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) return;

      const el = document.createElement("div");
      el.className = "oversite-map-marker group cursor-pointer";
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            background: ${item.color || "#10b981"};
            opacity: 0.25;
            border-radius: 50%;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 32px;
            height: 32px;
            background: ${item.color || "#10b981"};
            border: 2.5px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        </div>
      `;

      try {
        const marker = new maplibre.Marker({ element: el, anchor: "bottom" })
          .setLngLat([itemLng, itemLat])
          .addTo(map);

        if (item.title || item.description) {
          const popup = new maplibre.Popup({ offset: 28, closeButton: false }).setHTML(`
            <div style="font-family: inherit; padding: 6px 10px; max-width: 200px;">
              <p style="font-weight: 700; font-size: 13px; margin: 0; color: #111827;">${item.title || "Location"}</p>
              ${item.description ? `<p style="font-size: 11px; margin: 2px 0 0; color: #6b7280; line-height: 1.3;">${item.description}</p>` : ""}
            </div>
          `);
          marker.setPopup(popup);
        }

        markerInstancesRef.current.push(marker);
      } catch (err) {
        console.warn("Marker creation error:", err);
      }
    });
  }, [markers, enablePicker, validLat, validLng]);

  // Helper for Draggable Interactive Pin in Picker Mode
  const setupPicker = useCallback((map: any, maplibre: any) => {
    if (!map || !maplibre) return;

    if (pickerMarkerRef.current) {
      try {
        pickerMarkerRef.current.remove();
      } catch {
        // ignore
      }
    }

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          background: #10b981;
          opacity: 0.3;
          border-radius: 50%;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 36px;
          height: 36px;
          background: #10b981;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `;

    try {
      const marker = new maplibre.Marker({ element: el, draggable: true, anchor: "bottom" })
        .setLngLat([validLng, validLat])
        .addTo(map);

      const notifyPicker = async (lngLat: { lat: number; lng: number }) => {
        const roundedLat = Number(lngLat.lat.toFixed(6));
        const roundedLng = Number(lngLat.lng.toFixed(6));

        if (onLocationSelect) {
          onLocationSelect({
            latitude: roundedLat,
            longitude: roundedLng,
          });
        }

        try {
          const res = await fetch(`/api/v1/geo?lat=${roundedLat}&lng=${roundedLng}`);
          const json = await res.json();
          if (json.success && json.data?.displayName && onLocationSelect) {
            onLocationSelect({
              latitude: roundedLat,
              longitude: roundedLng,
              address: json.data.displayName,
            });
          }
        } catch {
          // ignore network failure
        }
      };

      const onDragEnd = () => {
        const lngLat = marker.getLngLat();
        notifyPicker(lngLat);
      };

      marker.on("dragend", onDragEnd);

      map.on("click", (e: any) => {
        marker.setLngLat(e.lngLat);
        notifyPicker(e.lngLat);
      });

      pickerMarkerRef.current = marker;
    } catch (err) {
      console.warn("Picker setup error:", err);
    }
  }, [validLat, validLng, onLocationSelect]);

  // Initialize MapLibre GL once
  useEffect(() => {
    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const maplibre = await import("maplibre-gl");
        maplibreRef.current = maplibre;

        if (isCancelled) return;

        // Configure worker URL pointing to the static bundle in /public to avoid Next.js bundling 404s
        if (typeof window !== "undefined" && typeof maplibre.setWorkerUrl === "function") {
          maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        }

        // Clean up previous instance cleanly
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const initialStyle = getStyleDefinition(selectedStyle);

        const map = new maplibre.Map({
          container: mapContainerRef.current,
          style: initialStyle as any,
          center: [validLng, validLat],
          zoom: zoom,
          interactive: interactive,
          attributionControl: false,
          trackResize: true,
        });

        // Failover protection: if vector tiles fail to load or WebGL errors, gracefully fall back to Esri Streets
        map.on("error", (e: any) => {
          if (!isCancelled) {
            console.warn("MapLibre GL tile warning:", e);
            if (e?.error?.status === 404 || e?.error?.message?.includes("fetch")) {
              map.setStyle(ESRI_STREETS_STYLE);
            }
          }
        });

        if (interactive && showControls) {
          map.addControl(new maplibre.NavigationControl({ showCompass: true, showZoom: true }), "top-right");
        }

        map.on("load", () => {
          if (isCancelled) return;
          setMapLoaded(true);

          // Force immediate and delayed resize passes so container dimensioning never causes blank canvas
          map.resize();
          requestAnimationFrame(() => map.resize());
          setTimeout(() => map.resize(), 100);
          setTimeout(() => map.resize(), 300);

          renderMarkers(map, maplibre);

          if (enablePicker) {
            setupPicker(map, maplibre);
          }
        });

        map.on("styledata", () => {
          if (isCancelled) return;
          map.resize();
        });

        mapInstanceRef.current = map;

        // Observe container size changes and resize canvas smoothly
        if (mapContainerRef.current && typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.resize();
            }
          });
          resizeObserver.observe(mapContainerRef.current);
        }
      } catch (err) {
        console.error("MapLibre GL initialization error:", err);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run on mount only

  // Handle style changes dynamically without destroying the map instance
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    try {
      const targetStyle = getStyleDefinition(selectedStyle);
      mapInstanceRef.current.setStyle(targetStyle as any);

      const onStyleLoad = () => {
        if (mapInstanceRef.current && maplibreRef.current) {
          mapInstanceRef.current.resize();
          renderMarkers(mapInstanceRef.current, maplibreRef.current);
          if (enablePicker) {
            setupPicker(mapInstanceRef.current, maplibreRef.current);
          }
        }
      };

      mapInstanceRef.current.once("style.load", onStyleLoad);
    } catch (err) {
      console.warn("Error changing map style:", err);
    }
  }, [selectedStyle, mapLoaded, renderMarkers, setupPicker, enablePicker]);

  // Track coordinates to avoid animating on initial load
  const prevCoordsRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

  // Update center & zoom if coordinates change after initial mount
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const prev = prevCoordsRef.current;
    // On first load after map loads, record current coordinates without animating
    if (!prev) {
      prevCoordsRef.current = { lat: validLat, lng: validLng, zoom };
      return;
    }

    // Only easeTo if coordinates or zoom actually changed
    const hasMoved =
      Math.abs(prev.lat - validLat) > 0.0001 ||
      Math.abs(prev.lng - validLng) > 0.0001 ||
      prev.zoom !== zoom;

    if (hasMoved) {
      prevCoordsRef.current = { lat: validLat, lng: validLng, zoom };
      mapInstanceRef.current.easeTo({
        center: [validLng, validLat],
        zoom: zoom,
        duration: 650,
      });
    }
  }, [validLat, validLng, zoom, mapLoaded]);

  // Keep marker updates separate from camera movement so marker re-renders never trigger camera jumping
  useEffect(() => {
    if (mapInstanceRef.current && maplibreRef.current && mapLoaded) {
      renderMarkers(mapInstanceRef.current, maplibreRef.current);
    }
  }, [renderMarkers, mapLoaded]);

  // Recenter to user's live GPS
  const handleRecenter = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        mapInstanceRef.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          speed: 1.2,
        });
        if (enablePicker && pickerMarkerRef.current) {
          pickerMarkerRef.current.setLngLat([lng, lat]);
          if (onLocationSelect) {
            onLocationSelect({
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
            });
          }
        }
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true }
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    }, 250);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] transition-all ${
        isFullscreen ? "fixed inset-4 z-[9999] h-auto shadow-2xl" : className
      }`}
      style={{
        height: isFullscreen ? "calc(100vh - 32px)" : height,
        minHeight: "220px",
      }}
    >
      {/* Absolute Map Container Ensures non-zero bounding box */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Floating Toolbar (Top Left) */}
      {interactive && showControls && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] p-1 rounded-xl shadow-md">
          {/* Style Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStyleMenu((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Change Map Style"
            >
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              <span className="hidden sm:inline capitalize">
                {selectedStyle === "streets" ? "Streets & Terrain" : selectedStyle}
              </span>
            </button>

            {showStyleMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-1 z-20">
                {(
                  [
                    { id: "streets", label: "Streets & Terrain" },
                    { id: "dark", label: "Dark Theme" },
                    { id: "osm", label: "OpenStreetMap" },
                    { id: "liberty", label: "OpenFreeMap Liberty" },
                    { id: "bright", label: "OpenFreeMap Bright" },
                  ] as { id: OpenFreeMapStyle; label: string }[]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedStyle(id);
                      setShowStyleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      selectedStyle === id
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold"
                        : "text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <span>{label}</span>
                    {selectedStyle === id && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[var(--border-color)]" />

          {/* Current GPS button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            title="Recenter to my location"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Picker Guidance Chip */}
      {enablePicker && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-heading)] shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>Click or drag marker to set property pin</span>
          </div>
        </div>
      )}
    </div>
  );
}
