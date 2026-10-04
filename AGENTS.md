# AGENTS.md // Master Autonomous Agent & Engineering Directive
## Intelligent Educational Transport Platform (EduTransit)

> **Document Classification**: Master System Specification, Autonomous Agent Operational Rules & Engineering Guardrails  
> **Target System**: Unified Intelligent Transport Management Platform for Schools, Colleges, and Universities  
> **Engineering Lineage**: Built with the verified rigor, zero-cost architecture, and statutory compliance established in SIH (PRAHARI / USHARP).

---

## 1. Project Identity & First Principles

**EduTransit** is a 100% software-only, zero-hardware-dependent, predictive transport management and passenger safety platform for educational institutions.

### Core Guiding Principle:
> **Punctuality through prediction. Safety through an unbroken custody chain. 100% software, zero hardware.**

### Non-Negotiable Invariants:
Agents and developers working on this codebase must understand what EduTransit **IS** and what it **IS NOT**:
- It **IS NOT** a naive "blue dot GPS tracker" or simple CRUD fleet app.
- It **IS NOT** a college-only bus tracker.
- It **IS EXCLUSIVELY** designed for day-scholars and school students commuting daily between designated neighborhood boarding stops and the institution (and return).
- It **IS NOT** hardware-dependent (it requires zero AIS-140 automotive boxes, zero physical RFID card readers, and zero proprietary beacons; runs entirely on standard smartphones and web browsers).
- It **IS** an operational orchestration ecosystem that dynamically connects passenger manifests, predictive arrival times, zero-passenger stop demand, child safety custody, and 60-second vehicle breakdown contingencies.

---

## 2. Core Operational Flow

The system executes a strictly sequential, event-driven state pipeline:

```text
SCHEDULE ➔ SENSE ➔ PREDICT ➔ DEMAND-ADAPT ➔ SAFEGUARD ➔ DISPATCH ➔ AUDIT
```

1. **SCHEDULE**: Ingests multi-campus academic timetables, exam surge dates, and approved directional road corridors ($\pm 75$m lateral buffer).
2. **SENSE**: Driver explicitly taps **"Start Trip"** on their standard smartphone, initiating the foreground location service which transmits high-frequency GPS vectors (3–5s intervals) over persistent WebSockets/MQTT until **"End Trip"** (interlocked with rear safety sweep).
3. **PREDICT**: Asymmetric Kalman filter computes dynamic arrival times factoring in live speed, historical segment percentiles ($P_{75}$), and passenger dwell times.
4. **DEMAND-ADAPT**: Processes "Not Travelling Today" absence declarations, dynamically rebalancing stop boarding requirements and eliminating empty detours.
5. **SAFEGUARD**: Enforces the unbroken custody chain (dynamic screen QR scan, proximity geofence check-in, guardian digital handoff, and rear-of-bus physical sweep).
6. **DISPATCH**: One-click 60-second replacement bus assignment migrating manifests and broadcasting transparent updates to affected students/parents.
7. **AUDIT**: Automated reconciliation of contractor punctuality SLAs, dead-mileage, fuel consumption deviations, and safety violations.

---

## 3. The 100% Software / Zero-Hardware Architecture

All agent implementations must strictly preserve the **zero-hardware constraint**. EduTransit operates with **strictly ZERO external automotive hardware** (no AIS-140 boxes, no OBD-II/CAN-bus taps, no BLE beacons, no hardware RFID card readers, no physical sleep sensor bars). Every physical component has an explicit pure-software replacement:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   PURE SOFTWARE ARCHITECTURAL MAPPING                  │
├────────────────────────┬───────────────────────────────────────────────┤
│ Physical Hardware      │ Required Software Implementation              │
├────────────────────────┼───────────────────────────────────────────────┤
│ Vehicle GPS Tracker    │ ➔ Driver Smartphone Foreground Service        │
│ (AIS-140 / OBD-II)     │   (flutter_background_service + geolocator)   │
│                        │   Emits GPS breadcrumbs at 3-second intervals │
│                        │   Active strictly between Start Trip & End Trip│
├────────────────────────┼───────────────────────────────────────────────┤
│ In-Bus RFID / NFC      │ ➔ Dynamic Time-Expiring QR Code on Student App│
│ Hardware Card Reader   │   Scanned by Conductor camera (mobile_scanner)│
│                        │   OR GPS Proximity Self-Check-in (<25 meters) │
├────────────────────────┼───────────────────────────────────────────────┤
│ Hardware SOS Panic Key │ ➔ In-App Red SOS Button + Hardware Volume Rocker│
│                        │   Double-Press Accessibility Trigger          │
├────────────────────────┼───────────────────────────────────────────────┤
│ Rear-Window Safety Bar │ ➔ Printed Paper QR Code mounted on rear window│
│ Sleep Sensors          │   Conductor must physically scan to end trip  │
└────────────────────────┴───────────────────────────────────────────────┘
```

---

## 4. Role Allocations & Access Boundaries

Enforce role-based access control (RBAC) strictly on the backend. Frontend component hiding is **NOT** security.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              ROLE MATRIX                               │
├─────────────────────────┬──────────────────────────────────────────────┤
│ Role                    │ Scope & Permitted Capabilities               │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 1. Institution Admin    │ • Executive 3D Fleet Radar (Bird's-Eye Mode) │
│    (University / School │ • Campus, Zone & Fleet Registry              │
│     Management)         │ • Contractor SLA & Fuel Audit Reporting      │
│                         │ • Institutional Broadcast Authority          │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 2. Transport Supervisor │ • Tactical 3D Fleet Radar (Drone Follow Mode)│
│    (Dispatch Office &   │ • 60-Sec Standby Bus & Manifest Reassignment │
│     Field Operators)    │ • Route Deviation & Unauthorized Halt Triage │
│                         │ • Downstream Targeted Delay Notification Push│
│                         │ • Direct Driver VoIP / In-App Call           │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 3. Bus Driver &         │ • Explicit Location Sharing on Start/End Trip│
│    In-Cabin Conductor   │ • Turn-by-Turn Approved Corridor Navigation  │
│                         │ • High-Contrast Next Stop & Roster Card      │
│                         │ • Conductor Phone Camera QR Scanner          │
│                         │ • Guardian QR Pass Handover Verification     │
│                         │ • Mandatory Rear QR Physical Sweep Scan      │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 4. Students & Parents   │ HIGHER-ED STUDENTS:                          │
│    (Adaptive End Users) │ • RedBus-Style Live Corridor Progression     │
│                         │ • Inter-Campus Shuttle Seat Availability     │
│                         │ • Digital Dynamic Campus Bus Pass            │
│                         │ • Self-Service Absence Declaration Toggle    │
│                         │ K-12 SCHOOL PARENTS:                         │
│                         │ • Child Custody Tracker (Home➔Boarded➔School)│
│                         │ • Real-Time Boarding Push Alerts with Photo  │
│                         │ • Dynamic Guardian QR Token & Emergency OTP  │
│                         │ • Single-Tap Absence Declaration             │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### Authorization Tests Required:
- A student must NEVER see another student's contact number or location.
- A parent must ONLY access their enrolled children's custody records.
- A driver must NEVER see personal parent phone numbers (masked routing only).
- Supervisors can dispatch within their assigned transport zones only.

---

## 5. Architectural Invariants & Failure-Mode Defenses

These safety and performance invariants were established during our critical falsification research and must **NEVER** be violated:

### Invariant 1: The K-12 Anti-Abandonment Rule
* **Rule**: In K-12 school mode, a scheduled bus stop **CANNOT** be physically bypassed at speed, even if all registered students marked absent.
* **Implementation**: The stop transitions to `DRIVE_BY_VISUAL_SWEEP`. The driver must slow to $<10\text{ km/h}$, perform a 5-second visual curb sweep, and verify no unlisted child is present. In Higher-Ed university mode, dynamic bypass is permitted.

### Invariant 2: Anti-Early Departure Interlock
* **Rule**: A bus running ahead of schedule must **NEVER** depart a downstream stop prior to the published timetable schedule minus 60 seconds.
* **Implementation**: If a bus reaches a stop early, the navigation UI displays a prominent hold banner: *"RUNNING 5 MINS EARLY: Hold at stop until 07:34 AM"*.

### Invariant 3: Hysteresis-Damped Monotonic ETA Smoothing
* **Rule**: Never expose raw fluctuating $d/v$ arrival estimates ("ETA Whiplash").
* **Implementation**: Raw speed vectors must pass through an asymmetric Kalman filter. When traffic clears, ETAs adjust smoothly downwards only after the speed is sustained for $>60\text{ seconds}$. For stops $>15$ mins away, display a confidence window (`07:42 - 07:46 AM`).

### Invariant 4: Dual-Layer Geofencing at Stops
* **Rule**: Never trigger false "Bus has arrived at your stop" alerts when a bus is merely halted at a red light near the stop.
* **Implementation**:
  - *Layer 1 (1,200m Circle)*: Triggers `APPROACHING_STOP` state and "Get Ready" notification.
  - *Layer 2 (75m Polygon + Speed $<5\text{ km/h}$ for $>15\text{ seconds}$)*: Triggers `ARRIVED_AT_STOP` state.

### Invariant 5: Zero-Database-Read Ingestion Pipeline (Surviving 07:30 AM)
* **Rule**: Live vehicle GPS coordinates must **NEVER** query or write synchronously to the relational database (PostgreSQL).
* **Implementation**: Ingested coordinates write to **Redis** (15-second TTL) and fan out to client WebSockets via Edge Pub/Sub. Historical breadcrumbs stream asynchronously via Kafka/queue to TimescaleDB/PostGIS.

---

## 6. The 3D Live Fleet Radar (Snap Map Style)

Both Institution Management and Transport Supervisors view fleet operations through an interactive **3D isometric fleet map** (matching [`docs/ui_reference.png`](file:///d:/Projects/AI%20Forge/docs/ui_reference.png)):

- **Engine**: **MapLibre GL JS 6.11 (v6)** using **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`).
- **Zero API Cost**: 100% free vector tiles, 3D building extrusions (`render_height`), zero API keys, zero rate limits.
- **Visual Mechanics**:
  - Top-down isometric yellow buses, shuttles, and patrol vehicles oriented along exact road compass bearings.
  - Dynamic status halos: 🟢 *Green Glow* (On time), 🟡 *Amber Pulse* (Traffic delay $>5$m), 🔴 *Red Warning Flare* (Deviation/SOS).
  - Floating ⭐ *Gold Star Badge* identifying top-compliance, zero-incident drivers.
  - Interactive Drone-Follow Mode: Locks 3D camera behind any selected bus at a $60^\circ$ third-person perspective.
  - Top floating navigation pill and bottom search/triage drawer (`[🔴 Search Bus, Route, Driver...]`).

---

## 7. The Verified 2026 Production Tech Stack

All code written by agents must strictly adhere to these live-verified versions:

| Component | Technology | Version | Key Libraries / Protocols |
| :--- | :--- | :--- | :--- |
| **Web Dashboard** | Next.js | **16.3.8** (16.3.x) | React 19.3, Tailwind CSS 4.3, Shadcn UI |
| **3D Map Engine** | MapLibre GL JS | **6.11.2** (v6) | OpenFreeMap, 3D Building Extrusions, WebGL/WebGPU |
| **Mobile Apps** | Flutter SDK | **3.47.4** | Dart 3.13.3, `flutter_background_service`, `mobile_scanner` |
| **Backend Core** | Python FastAPI | **0.142.2** | Python 3.14/3.12, Uvicorn 0.54, Pydantic 2.13 |
| **Spatial Engine** | Shapely / Geopy| **2.1.2 / 2.5.0** | PostGIS 3.4, GeoPandas, OSRM turn-by-turn |
| **Telemetry Cache**| Redis (async)  | **8.1.0** | Valkey / Redis 7+, Pub/Sub, Upstash Free Tier |
| **Spatial Database**| PostgreSQL   | **16+** | PostGIS spatial indexing (`GIST`), Supabase/Neon |
| **Notifications** | FCM | Cloud API | Firebase Cloud Messaging (100% Free Unlimited) |

---

## 8. Verification & System Integrity Standard (The SIH Benchmark)

Just as PRAHARI maintained 206/206 passing backend tests and 18/18 mobile tests:

1. **Backend Verification (`pytest tests/`)**:
   - Every spatial algorithm (deviation calculation, stop geofencing, Kalman filter ETA) must have unit and property-based tests.
   - Concurrency stress tests verifying that 1,000 simultaneous telemetry updates do not exhaust memory or drop WebSocket connections.
2. **Mobile Client Verification (`flutter analyze && flutter test`)**:
   - Zero static analysis warnings (`flutter analyze` clean).
   - Mocked background location service tests and QR payload validation tests.
3. **Web Portal Verification (`npm run build`)**:
   - Next.js 16.3 App Router compilation with zero TypeScript errors.
   - Strict linting and clean responsive UI states across desktop and tablet.
4. **No Fabricated Data**:
   - In simulated demo modes, vehicles must follow authentic OSRM road geometry breadcrumbs, never random coordinate jumps or teleportation.
