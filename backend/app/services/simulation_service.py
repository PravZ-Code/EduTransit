"""
Real-Time Telemetry Simulation Service for EduTransit.
Animates fleet vehicles along authentic Bangalore road geometry matching the user's reference map:
- Dr. B.R. Ambedkar Rd (Vidhana Soudha)
- Cubbon Park
- Central College
- Suzy Q / Queens Rd
Runs as an asynchronous background loop without fabricated random coordinate jumps.
"""
import asyncio
import time
import math
from typing import Dict, List, Optional
from app.services.data_store import store
from app.services.telemetry_service import telemetry_service
from app.core.spatial import calculate_bearing

class SimulationService:
    def __init__(self):
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None
        # Track waypoint segment index and interpolation step t for each bus
        self.progress: Dict[str, Dict[str, Any]] = {}

    def _init_progress(self):
        for idx, (bus_id, bus) in enumerate(store.buses.items()):
            if bus.is_standby:
                continue
            route = store.routes.get(bus.route_id)
            if route and len(route.waypoints) >= 2:
                    self.progress[bus_id] = {
                        "seg_idx": 0,
                        "t": 0.0,
                        "direction": 1,  # 1 = forward, -1 = reverse loop
                        "speed_kmh": bus.speed_kmh,
                        "phase": (idx % 6) * 1.7  # decorrelated organic traffic breathing
                    }

    async def start(self):
        if self.is_running:
            return
        self._init_progress()
        self.is_running = True
        self._task = asyncio.create_task(self._simulation_loop())

    def stop(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()

    def reset(self):
        self.stop()
        store._init_seed_data()
        self.progress.clear()
        self._init_progress()

    async def _simulation_loop(self):
        """
        Continuous 1-second physics and GPS interpolation tick.
        """
        while self.is_running:
            try:
                now = time.time()
                updates = []

                # Dynamically adopted vehicles (e.g. a standby promoted to a corridor
                # via the 60-second replacement dispatch) join the animation loop here.
                for bus_id, bus in store.buses.items():
                    if bus.trip_state == "IN_TRANSIT" and bus_id not in self.progress:
                        route = store.routes.get(bus.route_id)
                        if route and len(route.waypoints) >= 2:
                            self.progress[bus_id] = {
                                "seg_idx": 0,
                                "t": 0.0,
                                "direction": 1,
                                "speed_kmh": max(bus.speed_kmh, 18.0),
                                "phase": (len(self.progress) % 6) * 1.7,
                            }

                for bus_id, p_info in list(self.progress.items()):
                    bus = store.buses.get(bus_id)
                    if not bus or bus.is_standby or bus.status.value == "REPLACED":
                        continue

                    # PURE-SOFTWARE INVARIANT: no GPS breadcrumbs without an
                    # explicit driver "Start Trip" — the vehicle stays parked.
                    if bus.trip_state != "IN_TRANSIT":
                        continue

                    route = store.routes.get(bus.route_id)
                    if not route or len(route.waypoints) < 2:
                        continue

                    wps = route.waypoints
                    idx = p_info["seg_idx"]
                    t = p_info["t"]
                    direction = p_info["direction"]

                    # Organic traffic breathing: smooth sinusoidal speed modulation.
                    # No random coordinate jumps — pure deterministic road-geometry physics.
                    base_speed = p_info.get("base_speed_kmh", p_info["speed_kmh"])
                    p_info["base_speed_kmh"] = base_speed  # anchor: never let the sine wave decay the base
                    phase = p_info.get("phase", 0.0)
                    live_speed = max(6.0, base_speed * (0.72 + 0.28 * math.sin(now * 0.12 + phase)))
                    p_info["speed_kmh"] = round(live_speed, 1)

                    # Move along segment: step size depends on speed
                    step_size = 0.04 * (p_info["speed_kmh"] / 30.0)
                    t += step_size

                    if t >= 1.0:
                        t = 0.0
                        idx += direction
                        if idx >= len(wps) - 1:
                            direction = -1
                            idx = len(wps) - 2
                        elif idx < 0:
                            direction = 1
                            idx = 0

                    p_info["seg_idx"] = idx
                    p_info["t"] = t
                    p_info["direction"] = direction

                    # Linear interpolation between waypoints[idx] and waypoints[idx+1]
                    p1 = wps[idx]
                    p2 = wps[idx + 1] if direction == 1 else wps[idx + 1]
                    
                    if direction == 1:
                        lat = p1[0] + (p2[0] - p1[0]) * t
                        lon = p1[1] + (p2[1] - p1[1]) * t
                        bearing = calculate_bearing((p1[0], p1[1]), (p2[0], p2[1]))
                    else:
                        lat = p2[0] + (p1[0] - p2[0]) * t
                        lon = p2[1] + (p1[1] - p2[1]) * t
                        bearing = calculate_bearing((p2[0], p2[1]), (p1[0], p1[1]))

                    # Process telemetry
                    updated_bus = telemetry_service.process_telemetry(
                        bus_id=bus_id,
                        lat=round(lat, 6),
                        lon=round(lon, 6),
                        speed_kmh=round(p_info["speed_kmh"], 1),
                        bearing=bearing
                    )
                    updates.append(updated_bus.model_dump())

                # Fan-out to all connected WebSocket clients
                if updates and telemetry_service.active_connections:
                    await telemetry_service.broadcast_fleet_update({
                        "type": "FLEET_TELEMETRY_UPDATE",
                        "timestamp": now,
                        "fleet": updates
                    })

                await asyncio.sleep(1.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Simulation error: {e}")
                await asyncio.sleep(1.0)

# Global simulation singleton
simulation_service = SimulationService()
