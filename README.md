# EduTransit // Intelligent Educational Transport Platform
> **100% Software-Only • Zero-Hardware-Dependent • Day-Scholar Commuter Transport & Safety Ecosystem**

Built with the engineering lineage, statutory safety invariants, and zero-cost architecture benchmarked in SIH.

---

## 📁 Project Architecture & Repositories

| Subsystem | Folder | Technology Stack | Key Responsibilities & Capabilities |
| :--- | :--- | :--- | :--- |
| **Backend** | [`backend/`](file:///d:/Projects/AI%20Forge/backend) | Python FastAPI 0.142, Uvicorn, Geopy, PostGIS/Shapely | • Asymmetric Kalman filter ETA smoothing with confidence windows<br>• ±75m cross-track corridor deviation auditing<br>• Real-time WebSocket telemetry stream (`/ws/telemetry`)<br>• **Pure-software trip lifecycle**: `POST /trip/start` & `POST /trip/end` (rear-sweep interlocked)<br>• Zero-hardware SOS beacon: `POST /sos/trigger` → `POST /sos/resolve`<br>• Dynamic stop demand rebalancing & K-12 Visual Sweep invariant<br>• One-click 60-second standby dispatch with auto reserve selection<br>• Incident triage API + executive KPI snapshot (`/stats/summary`) |
| **Frontend** | [`frontend/`](file:///d:/Projects/AI%20Forge/frontend) | Next.js 16.3.8, React 19, MapLibre GL JS, OpenFreeMap | • 3D Live Fleet Radar matching [`docs/ui_reference.png`](file:///d:/Projects/AI%20Forge/docs/ui_reference.png)<br>• **Butter-smooth rAF marker interpolation** (no telemetry jumping) + shortest-path bearing easing<br>• **Incident Radar** side panel: live deviations/SOS feed with one-tap resolve<br>• Corridor filter pill bar (All / Delayed / Off-Route / Standby / ⭐ Top Drivers)<br>• Live connection state machine (LIVE / RECONNECTING / OFFLINE demo)<br>• Executive KPI chips: on-time %, boarded, incidents, fleet load<br>• Drone-Follow camera locked to interpolated vehicle position<br>• Kalman ETA confidence windows on vehicle cards |
| **Mobile** | [`mobile/`](file:///d:/Projects/AI%20Forge/mobile) | Flutter 3.47.4, Dart 3.13.3, Material 3 | • **Driver Cabin HUD**: explicit **START TRIP / END TRIP** controls (GPS beacon engages only on Start Trip), Anti-Early Departure banner, live telemetry polling, conductor QR scanner, rear sweep physical audit, in-app SOS + resolve<br>• **Student / Parent Mode**: Unbroken custody chain stepper, RedBus corridor progression timeline, "Not Travelling Today" absence toggle, proximity check-in (<25m)<br>• Haptic micro-interactions per DESIGN.md §6 (light/medium/heavy impact) |

---

## 🚀 Quick Start Guide

### 1. Launch Backend API & Telemetry Simulator
```powershell
cd backend
$env:PYTHONPATH="."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Interactive Swagger Docs: `http://localhost:8000/docs`
* WebSocket Telemetry Feed: `ws://localhost:8000/api/v1/ws/telemetry`
* Run Backend Tests: `python -m pytest tests/ -v` (**19/19 passing**)

### 2. Multi-Port Multi-App Suite (Ports 3000 – 3004) — Citymapper Design System
The entire UI has been completely rebuilt to strictly adhere to the Citymapper design specification (`/.agents/citymapper/DESIGN.md`):
- **Deep Blue-Black Canvas (`#0C0E14`)**: Dark-mode instrument panel with Surface 1 (`#15171F`), Surface 2 (`#1E212B`), and hairline dividers (`#282C38`).
- **Theme-Invariant Transit Mode Colors**: Walk (`#00B894`), Bus (`#E8453C`), Metro/Express (`#2B5BFF`), Rail (`#8E44D8`), Bike (`#00A8C5`), Cab (`#FFB400`).
- **The Signature Leg Strip**: Horizontal colored mode chips with `›` arrows (`Walk 4m › Bus 3 18m › Walk 2m`).
- **Shape- & Color-Locked GO Button (`#00C281`)**: 54px full pill with filled play triangle and uppercase "GO" (`#003322`), green-tinted shadow.
- **Origin → Destination Cards (O→D)**: Gray "from" dot + blue "to" dot connected by a transit line segment.
- **Live Departures Board**: 34×24 mode badge, destination, and tabular minutes turning orange (`#FF8A00`) at ≤ 3 min.
- **Inline Disruption Banners**: `#FF8A00` alert strips with ⚠ glyphs.
- **Full-Screen GO Trip Mode Takeover**: Chunky instruction typography (800–900), vertical progress line with pulsing mode-colored segments.

| Port | App Experience | Route | Citymapper Signature Elements |
| :--- | :--- | :--- | :--- |
| **:3000** | **College Monitoring** | `/` | Tactical Radar Map, 6 Stat Cards with tabular numbers, Active Trips with Leg Strips, Departures Board, Route Status Table with mode chips, 60-Sec Standby GO Dispatch Button. |
| **:3001** | **Parents App** | `/parents` | Origin→Destination Card, Leg Strip Route Cards, Shape-Locked GO Button, Live Departures Board, Disruption Banners, Full-Screen GO Trip Mode Takeover, Dynamic Guardian QR. |
| **:3002** | **K-12 App** | `/k12` | Good Morning Priya, O→D Card, Leg Strip, Shape-Locked GO Button, Departures Board, Child Profile Card with Single-Tap Absence Switch, Full-Screen GO Trip Mode. |
| **:3003** | **College Students App** | `/college` | CampusPass: `[Live Shuttle | My Pass]`, O→D Card, Route Leg Strips, Seat Availability Gauge, Shape-Locked GO Button, Digital Dynamic Pass with <25m Proximity Self-Check-in. |
| **:3004** | **Drivers App** | `/driver` | Driver Cabin HUD: Route A line badge, O→D Card, Anti-Early Departure Disruption Banner, Manifest Load Gauge, Shape-Locked GO Button for Camera Boarding Verification, Rear QR Sweep Interlock. |

#### Launch All 5 Apps Concurrently:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run_multiport.ps1
```

#### Or Run Individual Apps:
```powershell
cd frontend
npm run dev:3000   # College Monitoring
npm run dev:3001   # Parents Journey Assurance
npm run dev:3002   # K-12 Guardian School Bus
npm run dev:3003   # College CampusPass
npm run dev:3004   # Driver Cabin HUD
```

*Note: All apps feature a persistent top `PortSwitcherHeader` allowing one-click navigation across all 5 apps and live API connection status.*

### 3. Launch Mobile Application (Flutter Client)
```powershell
cd mobile
flutter run -d chrome  # or -d windows / android / ios
```
* Run Mobile Tests: `flutter test` (Verified 100% passing)
* Analyze Code: `flutter analyze` (Verified 0 warnings)

---

## 🛡️ Non-Negotiable Safety & Architectural Invariants

1. **Zero Hardware Dependency**:
   - Vehicle GPS Trackers → Driver Smartphone Foreground Service — **engaged only after the driver explicitly taps Start Trip in-app**.
   - In-Bus RFID Readers → Dynamic Rotating QR Code / Proximity Check-in (<25m).
   - Hardware SOS Buttons → In-App Red SOS Button + Volume-Rocker Double-Press Trigger.
   - Child Sleep Hardware Sensors → Mandatory Conductor Physical Rear Window QR Sweep — **End Trip is cryptographically interlocked until the sweep scan succeeds (HTTP 409 otherwise)**.
2. **K-12 Anti-Abandonment Rule**:
   - If all students at a K-12 stop mark absent, the stop transitions to `DRIVE_BY_VISUAL_SWEEP` (<10 km/h visual curb sweep) rather than speeding past.
3. **Anti-Early Departure Interlock**:
   - A bus running ahead of schedule is physically held at the stop until scheduled timetable time.
4. **Hysteresis-Damped ETA**:
   - Raw speed vectors pass through an asymmetric Kalman filter; arrival estimates are displayed with confidence windows — never raw `d/v` whiplash.
5. **Zero Seat Selection**:
   - Designed exclusively for day-scholars commuting from neighborhood boarding stops to the institution on assigned fixed manifests.

---

## 🔌 Core API Surface

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/v1/fleet` | GET | Full live fleet telemetry (active + standby) |
| `/api/v1/fleet/{bus_id}` | GET | Vehicle detail + route + manifest |
| `/api/v1/trip/start` | POST | Driver taps Start Trip → foreground GPS beacon engages |
| `/api/v1/trip/end` | POST | Driver taps End Trip → 409 until rear sweep verified |
| `/api/v1/sweep/verify` | POST | Conductor rear-window QR physical audit |
| `/api/v1/sos/trigger` | POST | Zero-hardware SOS beacon (CRITICAL incident) |
| `/api/v1/sos/resolve` | POST | Clear SOS, restore corridor-compliant status |
| `/api/v1/trips/absence` | POST | "Not Travelling Today" demand rebalancing |
| `/api/v1/trips/board` | POST | QR camera scan / <25m proximity self check-in |
| `/api/v1/fleet/replace` | POST | 60-second standby dispatch (auto reserve selection) |
| `/api/v1/incidents` | GET | Active deviations, halts, SOS, breakdowns |
| `/api/v1/incidents/{id}/resolve` | POST | Supervisor triage resolution |
| `/api/v1/stats/summary` | GET | Executive KPIs: on-time %, load, custody integrity |
| `/api/v1/ws/telemetry` | WS | High-frequency live telemetry + incident fan-out |
