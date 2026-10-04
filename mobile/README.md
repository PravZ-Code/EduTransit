# EduTransit Mobile App // Flutter Client
> **100% Software-Only • Zero-Hardware-Dependent • Day-Scholar Safety & Driver HUD**

The EduTransit mobile client is a unified, cross-platform Flutter application (supporting Android, iOS, and Web) engineered for both **Bus Drivers / In-Cabin Conductors** and **Day-Scholar Students / Parents**. It requires **strictly ZERO automotive hardware** (no AIS-140 boxes, no OBD-II/CAN-bus devices, no BLE beacons, no physical RFID card readers).

---

## 📱 Subsystems & Roles

### 1. Driver & Conductor Cabin HUD (`lib/screens/driver_screen.dart`)
- **Strictly Zero-Hardware Operation**: Runs entirely on the driver's standard consumer smartphone mounted on the dashboard.
- **Explicit Trip Location Sharing Lifecycle**:
  - **"Start Trip"**: Driver explicitly taps the green "Start Trip" button before departing the depot. This starts the foreground location service (`flutter_background_service` + `geolocator`), which streams real-time GPS telemetry (coordinates, heading, speed) at 3-second intervals over WebSockets to `/api/v1/ws/telemetry`.
  - **Active Trip Monitoring**: Displays turn-by-turn corridor hints, upcoming stop roster cards, and dynamic cross-track deviation warnings ($\pm 75$m tolerance).
  - **Anti-Early Departure Interlock**: If the bus reaches a stop ahead of schedule, a prominent hold banner displays: *"RUNNING EARLY: Hold at stop until HH:MM AM"*.
  - **Conductor QR Scanner**: Conductor uses the phone camera (`mobile_scanner`) to scan students' dynamic rotating QR passes.
  - **Mandatory Rear Safety Sweep & "End Trip"**: At the final destination, the driver/conductor must physically walk to the rear of the bus to inspect all rows and scan the printed paper QR code mounted on the back window. Only after this physical sweep is verified can the driver tap **"End Trip"**.
  - **Location Termination & Privacy**: Tapping "End Trip" immediately terminates the GPS foreground service. Location is **NEVER** shared when off-duty.
  - **In-App Red SOS**: Integrated software emergency button + hardware volume-rocker double-press accessibility listener.

### 2. Day-Scholar Student & K-12 Parent Custody Tracker (`lib/screens/student_parent_screen.dart`)
- **Unbroken Custody Chain Stepper**: Tracks student custody state in real-time (`HOME` $\to$ `BOARDED` $\to$ `IN_TRANSIT` $\to$ `SCHOOL_ARRIVED` $\to$ `HANDOVER_COMPLETE`).
- **Dynamic Rotating QR Pass**: Time-expiring dynamic QR code refreshed every 30 seconds for fraud-proof boarding verification (eliminating physical RFID/NFC cards).
- **Proximity Self-Check-in**: Automatic check-in when student smartphone is $<25$ meters from the bus.
- **"Not Travelling Today" Absence Toggle**: Single-tap absence declaration that dynamically removes the stop from boarding demand and notifies the driver.
- **RedBus-Style Route Progression Timeline**: Shows departed stops, live bus location, user pickup stop, and downstream stops with smoothed Kalman ETAs.

---

## 🚀 Running the Mobile App

### Web Mode (Local Prototype):
```powershell
flutter run -d chrome --web-port 5000
```

### Android / iOS Device:
```powershell
flutter run -d <device_id>
```

### Test & Analysis:
```powershell
flutter test      # Runs all widget and unit tests
flutter analyze   # Verifies static analysis (0 warnings)
```
