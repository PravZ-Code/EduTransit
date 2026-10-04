"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { BusTelemetry, RouteData, Stop } from "@/types/fleet";

interface MapRadarProps {
  buses: BusTelemetry[];
  routes: RouteData[];
  selectedBusId: string | null;
  onSelectBus: (busId: string | null) => void;
  resetCounter: number;
}

/** Per-bus animation record powering smooth interpolated motion. */
interface BusAnim {
  marker: maplibregl.Marker;
  el: HTMLElement;
  bodyEl: HTMLElement;
  from: [number, number]; // [lng, lat] displayed origin
  to: [number, number]; // [lng, lat] telemetry target
  cur: [number, number]; // [lng, lat] currently displayed
  fromBearing: number;
  toBearing: number;
  curBearing: number;
  startTs: number;
  moving: boolean;
}

const ANIM_DURATION_MS = 700;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const shortestAngleDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

export const MapRadar: React.FC<MapRadarProps> = ({
  buses,
  routes,
  selectedBusId,
  onSelectBus,
  resetCounter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const busAnimsRef = useRef<Map<string, BusAnim>>(new Map());
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const rafRef = useRef<number | null>(null);
  const selectedBusIdRef = useRef<string | null>(null);

  selectedBusIdRef.current = selectedBusId;

  // 1. Initialize MapLibre GL Map with OpenFreeMap 3D Liberty Style
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [80.0754, 13.1186], // Veltech University, Avadi (Chennai) — Main Campus
      zoom: 15.0,
      pitch: 60, // 3D Isometric View Angle
      bearing: 15,
      maxPitch: 75,
      attributionControl: false,
    });

    mapRef.current = map;

    // Provide transparent fallback for missing OpenFreeMap amenity POI icons
    map.on("styleimagemissing", (e) => {
      const id = e.id;
      if (!map.hasImage(id)) {
        map.addImage(id, {
          width: 1,
          height: 1,
          data: new Uint8Array([0, 0, 0, 0]),
        });
      }
    });

    map.on("load", () => {
      // Add 3D Extruded Buildings Layer
      try {
        const layers = map.getStyle().layers || [];
        let labelLayerId: string | undefined;
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === "symbol" && layers[i].layout && (layers[i].layout as any)["text-field"]) {
            labelLayerId = layers[i].id;
            break;
          }
        }

        map.addLayer(
          {
            id: "3d-buildings",
            source: "openmaptiles",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "render_height"],
                0, "#e2e8f0",
                30, "#cbd5e1",
                60, "#94a3b8"
              ],
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], 12],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": 0.85,
            },
          },
          labelLayerId
        );
      } catch (err) {
        console.warn("Building extrusion layer load fallback:", err);
      }
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Dynamic Corridor Routes Layer Management (Updates without destroying map)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routes || routes.length === 0) return;

    const renderRoutes = () => {
      routes.forEach((route) => {
        const coordinates = route.polyline.map(([lat, lng]) => [lng, lat]);
        const sourceId = `corridor-halo-${route.route_id}`;
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          });
        } else {
          try {
            map.addSource(sourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: coordinates,
                },
              },
            });

            map.addLayer({
              id: `corridor-buffer-${route.route_id}`,
              type: "line",
              source: sourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#D84E55",
                "line-width": 16,
                "line-opacity": 0.18,
              },
            });

            map.addLayer({
              id: `corridor-center-${route.route_id}`,
              type: "line",
              source: sourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#D84E55",
                "line-width": 4,
                "line-dasharray": [2, 1],
              },
            });
          } catch (_) {
            // Layer may already be present
          }
        }
      });
    };

    if (map.isStyleLoaded()) {
      renderRoutes();
    } else {
      map.once("load", renderRoutes);
    }
  }, [routes]);

  // 3. Handle Reset Camera Button
  useEffect(() => {
    if (!mapRef.current || resetCounter === 0) return;
    mapRef.current.easeTo({
      center: [80.0754, 13.1186], // Veltech University, Avadi
      zoom: 15.0,
      pitch: 60,
      bearing: 15,
      duration: 1200,
    });
  }, [resetCounter]);

  // 4. Render Stop Pins
  useEffect(() => {
    if (!mapRef.current) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    routes.forEach((route) => {
      route.stops.forEach((stop: Stop) => {
        const el = document.createElement("div");
        el.className = "group relative flex items-center justify-center cursor-pointer";

        const pin = document.createElement("div");
        pin.className = `stop-pin ${stop.requires_visual_sweep ? "sweep-required" : ""}`;
        el.appendChild(pin);

        // Tooltip Banner
        const tooltip = document.createElement("div");
        tooltip.className =
          "absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md shadow-md border border-slate-200 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5";

        let statusBadge = "";
        if (stop.status === "DRIVE_BY_VISUAL_SWEEP") {
          statusBadge = "⚠️ VISUAL SWEEP";
        } else if (stop.status === "BYPASSED") {
          statusBadge = "⏭️ Zero-Demand Bypass";
        } else if (stop.status === "DEPARTED" || stop.status === "ARRIVED") {
          statusBadge = "✓ Serviced";
        } else if (stop.board_count > 0) {
          statusBadge = `👥 ${stop.board_count} Students`;
        } else {
          statusBadge = "0 Demand";
        }

        tooltip.innerHTML = `<span>${stop.name}</span> <span class="text-[#D84E55] font-extrabold">• ${statusBadge}</span>`;
        el.appendChild(tooltip);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(mapRef.current!);

        stopMarkersRef.current.push(marker);
      });
    });
  }, [routes]);

  // 5. Smooth Interpolation Engine (rAF) — eliminates marker "jumping" between telemetry ticks
  const startAnimLoop = () => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const map = mapRef.current;
      if (!map) {
        rafRef.current = null;
        return;
      }
      let anyMoving = false;

      busAnimsRef.current.forEach((rec) => {
        if (!rec.moving) return;
        const t = Math.min(1.0, (performance.now() - rec.startTs) / ANIM_DURATION_MS);
        const e = easeOutCubic(t);
        rec.cur = [
          rec.from[0] + (rec.to[0] - rec.from[0]) * e,
          rec.from[1] + (rec.to[1] - rec.from[1]) * e,
        ];
        rec.curBearing = rec.fromBearing + shortestAngleDelta(rec.fromBearing, rec.toBearing) * e;
        rec.marker.setLngLat(rec.cur);
        rec.bodyEl.style.transform = `rotate(${rec.curBearing}deg)`;

        if (t >= 1.0) rec.moving = false;
        else anyMoving = true;
      });

      // Drone-Follow Mode: lock the 3D camera behind the selected vehicle at 60°.
      const selId = selectedBusIdRef.current;
      if (selId) {
        const rec = busAnimsRef.current.get(selId);
        if (rec) {
          map.jumpTo({
            center: rec.cur,
            bearing: rec.curBearing,
            pitch: 60,
            zoom: 17,
          });
        }
      }

      if (anyMoving || selectedBusIdRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // 6. Render / Update Moving 3D Isometric Vehicle Markers
  useEffect(() => {
    if (!mapRef.current) return;

    buses.forEach((bus) => {
      let rec = busAnimsRef.current.get(bus.bus_id);

      if (!rec) {
        // Create new interactive 3D Vehicle Marker Element
        const container = document.createElement("div");
        container.className = "bus-marker-container";
        container.title = `${bus.registration_number} (${bus.driver_name})`;

        // Status Halo (Green = On-Time, Amber = Delay, Red = Deviation/SOS)
        const halo = document.createElement("div");
        halo.className = "bus-halo";
        container.appendChild(halo);

        // 3D Isometric Bus Body
        const body = document.createElement("div");
        body.className = "bus-3d-body";

        // Windshield
        const windshield = document.createElement("div");
        windshield.className = "bus-windshield";
        body.appendChild(windshield);

        // Reg Label
        const label = document.createElement("div");
        label.className = "bus-label-badge";
        const shortNum = bus.registration_number.replace(/^(KA-01-|TN-13-)/, "");
        label.innerText = shortNum;
        body.appendChild(label);

        // Gold Star for top drivers
        if (bus.compliance_rating >= 4.9) {
          const star = document.createElement("div");
          star.className = "gold-star-badge";
          star.innerText = "⭐";
          container.appendChild(star);
        }

        container.appendChild(body);

        // Click to trigger Drone-Follow mode
        container.addEventListener("click", () => {
          onSelectBus(bus.bus_id);
        });

        const marker = new maplibregl.Marker({
          element: container,
          rotationAlignment: "map",
          pitchAlignment: "map",
        })
          .setLngLat([bus.lng, bus.lat])
          .addTo(mapRef.current!);

        rec = {
          marker,
          el: container,
          bodyEl: body,
          from: [bus.lng, bus.lat],
          to: [bus.lng, bus.lat],
          cur: [bus.lng, bus.lat],
          fromBearing: bus.heading_deg,
          toBearing: bus.heading_deg,
          curBearing: bus.heading_deg,
          startTs: performance.now(),
          moving: false,
        };
        busAnimsRef.current.set(bus.bus_id, rec);
      } else {
        // Chain a new interpolation segment from the currently displayed position.
        const target: [number, number] = [bus.lng, bus.lat];
        const moved =
          Math.abs(rec.to[0] - target[0]) > 1e-6 ||
          Math.abs(rec.to[1] - target[1]) > 1e-6;
        if (moved) {
          rec.from = [...rec.cur] as [number, number];
          rec.to = target;
          rec.fromBearing = rec.curBearing;
          rec.toBearing = bus.heading_deg;
          rec.startTs = performance.now();
          rec.moving = true;
        }
      }

      // Status halo refresh
      const haloEl = rec.el.querySelector(".bus-halo");
      if (haloEl) {
        haloEl.className = "bus-halo";
        if (bus.status === "CORRIDOR_DEVIATION" || bus.status === "SOS_HALT") {
          haloEl.classList.add("deviation");
        } else if (bus.status === "DELAYED") {
          haloEl.classList.add("delayed");
        } else {
          haloEl.classList.add("on-time");
        }
      }

      // Selection highlight
      rec.el.classList.toggle("selected", selectedBusId === bus.bus_id);
    });

    startAnimLoop();

    // Cleanup decommissioned buses
    const activeIds = new Set(buses.map((b) => b.bus_id));
    busAnimsRef.current.forEach((rec, id) => {
      if (!activeIds.has(id)) {
        rec.marker.remove();
        busAnimsRef.current.delete(id);
      }
    });
  }, [buses, selectedBusId, onSelectBus]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full outline-none" />
    </div>
  );
};
