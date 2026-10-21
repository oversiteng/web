"use client";

import React, { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { Maximize2, Minimize2, Navigation, Layers } from "lucide-react";

export type OpenFreeMapStyle = "liberty" | "bright" | "positron" | "dark" | "fiord" | "3d";

const STYLE_URLS: Record<OpenFreeMapStyle, string> = {
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  bright: "https://tiles.openfreemap.org/styles/bright",
  positron: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
  fiord: "https://tiles.openfreemap.org/styles/fiord",
  "3d": "https://tiles.openfreemap.org/styles/liberty", // liberty base with 3D buildings enabled
};

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
  autoThemeStyle?: boolean; // When true, uses dark style in dark mode, liberty/positron in light mode
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
  const markerInstancesRef = useRef<any[]>([]);
  const pickerMarkerRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();
  const [selectedStyle, setSelectedStyle] = useState<OpenFreeMapStyle>(() => {
    if (styleMode) return styleMode;
    return resolvedTheme === "dark" ? "dark" : "liberty";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Sync style with dark/light mode if autoThemeStyle is active and styleMode is not forced
  useEffect(() => {
    if (!styleMode && autoThemeStyle) {
      setSelectedStyle(resolvedTheme === "dark" ? "dark" : "liberty");
    }
  }, [resolvedTheme, styleMode, autoThemeStyle]);

  // Initialize MapLibre GL
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const maplibre = await import("maplibre-gl");

      if (isCancelled) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const styleUrl = STYLE_URLS[selectedStyle] || STYLE_URLS.liberty;

      const map = new maplibre.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [longitude, latitude],
        zoom: zoom,
        interactive: interactive,
        attributionControl: false,
      });

      // Add Attribution (OpenFreeMap + OpenStreetMap required)
      map.addControl(
        new maplibre.AttributionControl({
          compact: true,
          customAttribution:
            '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        }),
        "bottom-right"
      );

      // Add navigation controls (zoom in/out/compass) if enabled
      if (interactive && showControls) {
        map.addControl(new maplibre.NavigationControl({ showCompass: true, showZoom: true }), "top-right");
      }

      map.on("load", () => {
        if (isCancelled) return;
        setMapLoaded(true);

        // Render markers
        renderMarkers(map, maplibre);

        // If picker mode is enabled, add draggable picker marker
        if (enablePicker) {
          setupPicker(map, maplibre);
        }
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedStyle]); // Re-create when style changes

  // Update center & zoom if props change without full recreation
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      mapInstanceRef.current.easeTo({
        center: [longitude, latitude],
        zoom: zoom,
        duration: 800,
      });
    }
  }, [latitude, longitude, zoom, mapLoaded]);

  // Helper to render property markers
  const renderMarkers = (map: any, maplibre: any) => {
    // Clear old markers
    markerInstancesRef.current.forEach((m) => m.remove());
    markerInstancesRef.current = [];

    const listToRender = [...markers];

    // If no markers provided but we have center coordinates, add default center pin
    if (listToRender.length === 0 && !enablePicker) {
      listToRender.push({
        latitude,
        longitude,
        title: "Property Location",
        color: "#10b981", // Canonical Emerald
      });
    }

    listToRender.forEach((item) => {
      // Create custom modern emerald pin element
      const el = document.createElement("div");
      el.className = "oversite-map-marker group cursor-pointer";
      el.innerHTML = `
        <div style="
          width: 34px;
          height: 34px;
          background: ${item.color || "#10b981"};
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
      `;

      const marker = new maplibre.Marker({ element: el, anchor: "bottom" })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map);

      if (item.title || item.description) {
        const popup = new maplibre.Popup({ offset: 25, closeButton: false }).setHTML(`
          <div style="font-family: inherit; padding: 6px 10px;">
            <p style="font-weight: 700; font-size: 13px; margin: 0; color: #111827;">${item.title || "Location"}</p>
            ${item.description ? `<p style="font-size: 11px; margin: 2px 0 0; color: #6b7280;">${item.description}</p>` : ""}
          </div>
        `);
        marker.setPopup(popup);
      }

      markerInstancesRef.current.push(marker);
    });
  };

  // Helper for Draggable Interactive Pin in Picker Mode
  const setupPicker = (map: any, maplibre: any) => {
    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
    }

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        width: 38px;
        height: 38px;
        background: #10b981;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.45);
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
    `;

    const marker = new maplibre.Marker({ element: el, draggable: true, anchor: "bottom" })
      .setLngLat([longitude, latitude])
      .addTo(map);

    const onDragEnd = () => {
      const lngLat = marker.getLngLat();
      if (onLocationSelect) {
        onLocationSelect({
          latitude: Number(lngLat.lat.toFixed(6)),
          longitude: Number(lngLat.lng.toFixed(6)),
        });
      }
    };

    marker.on("dragend", onDragEnd);

    // Also support clicking anywhere on the map to place/move the marker
    map.on("click", (e: any) => {
      marker.setLngLat(e.lngLat);
      if (onLocationSelect) {
        onLocationSelect({
          latitude: Number(e.lngLat.lat.toFixed(6)),
          longitude: Number(e.lngLat.lng.toFixed(6)),
        });
      }
    });

    pickerMarkerRef.current = marker;
  };

  // Re-render markers if marker list changes
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      import("maplibre-gl").then((maplibre) => {
        renderMarkers(mapInstanceRef.current, maplibre);
      });
    }
  }, [markers, mapLoaded]);

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
      style={{ height: isFullscreen ? "calc(100vh - 32px)" : height }}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

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
              <span className="hidden sm:inline capitalize">{selectedStyle}</span>
            </button>

            {showStyleMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-1 z-20">
                {(["liberty", "positron", "bright", "dark", "fiord"] as OpenFreeMapStyle[]).map((styleName) => (
                  <button
                    key={styleName}
                    type="button"
                    onClick={() => {
                      setSelectedStyle(styleName);
                      setShowStyleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium capitalize transition-colors flex items-center justify-between cursor-pointer ${
                      selectedStyle === styleName
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold"
                        : "text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <span>{styleName}</span>
                    {selectedStyle === styleName && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
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
