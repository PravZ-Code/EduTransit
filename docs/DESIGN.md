# 🎨 DESIGN.md // Design System & UI Specifications
## Intelligent Educational Transport Platform (EduTransit)

> **Document Classification**: Master Design System, UI Component Specification & Design Token Architecture  
> **Target Platforms**: Web Dashboard (Next.js 16.3 + Tailwind CSS 4.3 + MapLibre GL JS 6.11) & Cross-Platform Mobile Apps (Flutter 3.47)  
> **Design Philosophy**: Fuses the battle-tested, high-clarity transactional ergonomics of **redBus** (live route progression, interactive seat/shuttle maps, pill filters, tactile feedback) with modern clean 3D isometric spatial telemetry and institutional multi-tenant governance.

---

## 1. Design Tokens & Visual Language

### 1.1 Color Palette
The color hierarchy guarantees statutory accessibility (WCAG 2.2 AA / GIGW 3.0), instant emergency recognition, and institutional brand elegance.

| Token Name | Hex Code | Visual Swatch | Semantic Application |
| :--- | :--- | :--- | :--- |
| **Brand Primary (EduTransit Crimson)** | `#D84E55` | 🔴 Crimson | Primary CTA buttons, active route tabs, SOS indicators, high-contrast branding highlights |
| **Secondary Slate** | `#1E293B` | 🌑 Deep Slate | Primary typography, dashboard headers, side-drawer chrome, vehicle heading indicators |
| **Neutral Gray** | `#64748B` | 🔘 Slate Gray | Secondary timestamps, helper labels, departed route lines, inactive navigation tabs |
| **Background / Canvas** | `#F8FAFC` | ⚪ Cool White | App background, card container nesting, map canvas base |
| **Card Surface** | `#FFFFFF` | ⬜ Pure White | Elevated cards, bottom sheets, floating navigation pills |
| **Punctual Green (Success)** | `#10B981` | 🟢 Emerald | On-time status glow ($<3$m delay), boarding confirmation, available seats |
| **Traffic Amber (Alert)** | `#F59E0B` | 🟡 Amber Pulse | Route delays ($>5$ mins), approaching stop alerts, holding checkpoints |
| **Emergency Red (Critical)** | `#EF4444` | 🚨 Flare Red | Route deviation alarms, in-app software SOS / volume-key panic trigger, unauthorized stop halts |
| **Accent Cyan / Volumetric Path** | `#06B6D4` | 🔷 Cyan Glow | Upcoming 3D route trajectory ribbons, live camera drone track |
| **School Bus Gold** | `#F59E0B` | 🟡 Gold Amber | Isometric 3D School Bus model color, top-compliance driver ⭐ badge |

### 1.2 Typography Hierarchy
- **Primary Typeface**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (Universal web & mobile legibility).
- **Display H1**: `24px` | Bold (`font-weight: 700`) | Line-height `32px` — Dashboard views, fleet radar banners.
- **Section H2**: `18px` | Semi-Bold (`font-weight: 600`) | Line-height `24px` — Route cards, active stop headers, drawer titles.
- **Body Primary**: `14px` | Regular/Medium (`font-weight: 400/500`) | Line-height `20px` — Passenger manifests, ETA readouts, driver details.
- **Caption / Micro**: `11px` | Semi-Bold (`font-weight: 600`) | Line-height `14px` — Boarding badge status, timestamps, 3D stop pin subtext.
- **Monospace Telemetry**: `JetBrains Mono` or `Roboto Mono` (`12px`) — GPS coordinates, speed counters (`38 km/h`), vehicle registration numbers.

---

## 2. Global Component Library

### 2.1 Top Floating Navigation & Search Pill (Web & Tablet)
Designed to minimize visual clutter on the 3D map canvas (matching the reference HUD).

```text
 ┌──────┬─────────────────────────────────────────────────────────────┬───────┐
 │ [☰]  │  🟢 Campus Central Hub: Main Academic Gate ▼          [♡]   │ [ 🎯 ]│
 └──────┴─────────────────────────────────────────────────────────────┴───────┘
```
- **Menu Trigger with Incident Badge**: `[🔴 ☰]` opens the tactical management drawer; red dot animates when an active deviation or SOS exists.
- **Campus Selector Focus Pill**: Shows current active campus/zone with instant dropdown switching and a favorite bookmark `[♡]` button.
- **Recenter Control**: Floating circular button with blue compass indicator snapping viewport back to active vehicle or campus hub.

### 2.2 Advanced Corridor Filter & Route Pill Bar
A horizontally scrolling pill bar positioned directly beneath the navigation header:
- **Pill Triggers**:
  - `[ 🟢 All Active (84) ]`
  - `[ 🟡 Delayed >5m (6) ]`
  - `[ 🔴 Off-Route (1) ]`
  - `[ 🏫 K-12 Morning ]`
  - `[ 🎓 Inter-Campus Shuttles ]`
  - `[ ⭐ Top Compliance Drivers ]`
- **Active State**: Solid Brand Crimson (`#D84E55`) background with white bold text; inactive state features a cool white background with slate border.

---

## 3. RedBus-Style Passenger Visual Experience (Mobile & Web)

The passenger interface adapts the beloved, high-clarity **redBus** progression timeline for daily institutional commutes:

```text
 ┌──────────────────────────────────────────────────────────────┐
 │ 🚌 BUS 24  •  NORTH CAMPUS EXPRESS                           │
 │ Driver: Ramesh Kumar (★ 4.9)  •  Vehicle: KA-01-F-4412       │
 ├──────────────────────────────────────────────────────────────┤
 │ STATUS: ● EN ROUTE TO CAMPUS                                 │
 │ Current Position : Outer Ring Road Flyover                   │
 │ Next Stop        : Silk Board Gate (In 3 mins)               │
 │ Your Pickup Stop : BTM Water Tank                            │
 │ Predicted Arrival: 07:44 AM (Confidence Window: 07:42–07:46) │
 ├──────────────────────────────────────────────────────────────┤
 │ ROUTE PROGRESSION TIMELINE                                   │
 │                                                              │
 │  ✓  07:15 AM   Depot Terminal (Departed on time)             │
 │  │                                                           │
 │  ✓  07:28 AM   BTM 2nd Stage (Boarded: 6)                    │
 │  │                                                           │
 │  ●  07:35 AM   CURRENT POSITION (38 km/h)                    │
 │  │             [🟢 On Time • Normal Corridor]                │
 │  │                                                           │
 │  ○  07:44 AM   YOUR STOP: BTM Water Tank                     │
 │  │             [2 Students Waiting • 0 Absent]               │
 │  │                                                           │
 │  ○  08:02 AM   Koramangala Sony Signal                       │
 │  │                                                           │
 │  🏁 08:25 AM   University Main Gate Campus                   │
 ├──────────────────────────────────────────────────────────────┤
 │ [ 🗺️ INTERACTIVE LIVE RADAR MAP ]                            │
 ├──────────────────────────────────────────────────────────────┤
 │ [ 🚫 I'm Not Travelling Today ]      [ 📞 Call Attendant ]   │
 └──────────────────────────────────────────────────────────────┘
```

### Visual Specifications of Timeline:
- **Departed Stops (`✓`)**: Muted slate gray text, emerald green checkmark badge, solid emerald connecting line.
- **Active Bus Position (`●`)**: Animated pulsing crimson puck; shows live speed and traffic status.
- **Your Pickup Stop (`○`)**: Highlighted card with gold border and countdown clock (`In 9 mins`).
- **Upcoming Stops (`○`)**: Light gray unfilled bullet, semi-bold timestamp, estimated passenger count.

---

## 4. Real-Time Vehicle Capacity & Occupancy Status Gauge

Instead of commercial ticket seat selection (which is inapplicable to assigned educational bus fleets), the platform utilizes a **Dynamic Vehicle Occupancy & Load Gauge** that gives students, attendants, and dispatchers real-time visibility into passenger density:

```text
 ┌──────────────────────────────────────────────────────────────┐
 │ 🚌 BUS 18 • LIVE OCCUPANCY STATUS                           │
 ├──────────────────────────────────────────────────────────────┤
 │ [██████████████████████████░░░░░░░░░░] 32 / 45 Seats (71%)   │
 │ STATUS: 🟢 SEATS AVAILABLE (13 Remaining)                    │
 ├──────────────────────────────────────────────────────────────┤
 │ • Boarded at Previous Stops : 32 Students                    │
 │ • Declared Absent Today     : 6 Students                     │
 │ • Expected at Next 3 Stops  : 9 Students                     │
 │ • Net Headroom at Campus    : 4 Available Seats              │
 └──────────────────────────────────────────────────────────────┘
```

### Occupancy Component States:
- **🟢 Low / Moderate Load (`<75%`)**: Emerald green fill bar (`#10B981`); "Seats Available".
- **🟡 Near Capacity (`75% - 95%`)**: Amber fill bar (`#F59E0B`); "Limited Seats / High Demand".
- **🔴 At Capacity / Full (`>95%`)**: Crimson fill bar (`#D84E55`); "Bus Full — Standing Only / Overload Alert Dispatched to Supervisor".

---

## 5. Live Isometric 3D Fleet Map Styling (MapLibre GL JS)

Modeled after the user reference screenshot ([`docs/ui_reference.png`](file:///d:/Projects/AI%20Forge/docs/ui_reference.png)):

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   MAPLIBRE GL JS 3D STYLING SPECIFICATION              │
├───────────────────────┬────────────────────────────────────────────────┤
│ Map Engine            │ MapLibre GL JS 6.11.2 (v6 with WebGL/WebGPU)   │
│ Vector Tile Endpoint  │ OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) │
│ Camera Pitch          │ Default 60° (Isometric perspective)           │
│ Camera Bearing        │ Dynamic compass orientation or user orbit      │
├───────────────────────┼────────────────────────────────────────────────┤
│ 3D Buildings          │ `fill-extrusion` layer:                        │
│                       │ • `fill-extrusion-color`: `#E2E8F0`            │
│                       │ • `fill-extrusion-height`: `['get', 'render_height']` │
│                       │ • `fill-extrusion-opacity`: `0.75`             │
├───────────────────────┼────────────────────────────────────────────────┤
│ Vehicle Markers       │ High-resolution isometric SVG models:          │
│                       │ • Yellow School Bus (Length: 32px, Width: 14px)│
│                       │ • White Campus Shuttle                         │
│                       │ • Black/Gold Security Patrol Bike              │
│                       │ Oriented to exact travel bearing (0° - 360°)   │
├───────────────────────┼────────────────────────────────────────────────┤
│ Status Aura (Halos)   │ CSS Keyframe Glowing Halos around vehicle:     │
│                       │ • 🟢 Normal: `box-shadow: 0 0 12px #10B981`    │
│                       │ • 🟡 Delayed: `box-shadow: 0 0 14px #F59E0B`   │
│                       │ • 🔴 Deviation: `box-shadow: 0 0 18px #EF4444` │
├───────────────────────┼────────────────────────────────────────────────┤
│ Floating Badges       │ ⭐ Gold Star Badge hovering 18px above vehicle │
│                       │ signifying top compliance and zero violations. │
└───────────────────────┴────────────────────────────────────────────────┘
```

---

## 6. Mobile Micro-Interactions & Tactile Ergonomics

- **Haptic Feedback Loops (Flutter)**:
  - *Light Impact* (`HapticFeedback.lightImpact()`): Triggered when tapping timeline stops or toggling absence.
  - *Medium Impact* (`HapticFeedback.mediumImpact()`): Triggered when scanning a student QR pass successfully.
  - *Heavy Warning Alert* (`HapticFeedback.heavyImpact()`): Triggered upon holding the Emergency Red SOS button for 2 seconds.
- **Skeleton Flash Loading States**: Smooth shimmer gradients (`#E2E8F0` $\to$ `#F1F5F9`) across bus route cards to reduce perceived latency during network re-sync.
- **Sticky Summary Footer**: Floating bottom sheet with rounded top corners (`border-radius: 24px`) displaying active trip status, speed gauge, and primary action buttons.
- **High-Contrast Driver Mode & Location Sharing Lifecycle**:
  - **Zero-Hardware Dashboard Phone Mount**: Operates purely on the driver's standard smartphone (no vehicle wiring, no OBD-II, no AIS-140 boxes).
  - **Explicit "Start Trip" Location Trigger**: Prominent primary button (`#10B981` Emerald, $>56$px height) that initiates foreground GPS location sharing (emits coordinates every 3 seconds to WebSocket `/ws/telemetry`).
  - **Active Trip HUD**: High-contrast, large-button layout designed for driver visibility under harsh daylight ($>50\text{px}$ touch targets), displaying next stop, anti-early departure countdown hold banners, and turn corridor hints.
  - **Software Emergency Panic**: In-App Red SOS Button + Hardware Volume Rocker double-press accessibility listener (triggers dispatch alert without external panic hardware).
  - **Interlocked "End Trip" & Physical Rear Sweep**: The "End Trip" button remains disabled until the conductor/driver physically walks to the rear of the bus and scans the printed paper QR code affixed to the back window. Once verified, tapping "End Trip" terminates location sharing immediately, protecting driver privacy off-duty.
