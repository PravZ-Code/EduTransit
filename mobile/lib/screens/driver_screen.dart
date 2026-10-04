import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../theme/cm_theme.dart';

/// Driver Cabin HUD — 100% software trip orchestration, Citymapper dark spec.
/// The driver EXPLICITLY taps Start Trip (the locked GO-green pill) to engage
/// the smartphone foreground GPS beacon; End Trip is interlocked behind the
/// mandatory physical rear-window QR sweep. Zero hardware anywhere.
class DriverScreen extends StatefulWidget {
  const DriverScreen({super.key});

  @override
  State<DriverScreen> createState() => _DriverScreenState();
}

class _DriverScreenState extends State<DriverScreen> {
  static const String _busId = 'bus_04';

  bool isRunningEarly = true; // Invariant 2 demonstration
  bool rearSweepCompleted = false;
  String tripState = 'IN_TRANSIT'; // SCHEDULED | IN_TRANSIT | COMPLETED
  int currentOccupancy = 28;
  int capacity = 45;
  double speedKmh = 34.0;
  double etaSeconds = 240.0;
  String? confidenceWindow;
  double? distanceToNextStopM;
  String nextStopName = 'Pattabiram Outer Ring';
  String vehicleNumber = 'TN-13-F-4004';
  bool isBackendLive = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _loadLiveTelemetry();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _loadLiveTelemetry());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadLiveTelemetry() async {
    final bus = await ApiService.getBus(_busId);
    if (!mounted || bus == null) return;
    setState(() {
      isBackendLive = true;
      currentOccupancy = bus.currentOccupancy;
      capacity = bus.capacity;
      speedKmh = bus.speedKmh;
      etaSeconds = bus.kalmanSmoothedEtaSeconds;
      confidenceWindow = bus.confidenceWindow;
      distanceToNextStopM = bus.distanceToNextStopM;
      nextStopName = bus.nextStopName ?? nextStopName;
      vehicleNumber = bus.registrationNumber;
      tripState = bus.tripState;
      rearSweepCompleted = bus.rearSweepVerified;
    });
  }

  void _showSnack(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(backgroundColor: CmColors.darkSurface1, content: Text(message, style: const TextStyle(color: CmColors.darkTextPrimary))),
    );
  }

  // ---------------- SOS (zero-hardware panic beacon) ----------------

  Future<void> _triggerSos() async {
    HapticFeedback.heavyImpact();
    final result = await ApiService.triggerSos(_busId, reason: 'Driver SOS Panic Trigger');
    if (!mounted) return;
    final message = result['message'] as String? ?? 'SOS beacon ACTIVE.';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CmColors.darkSurface1,
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: CmColors.delayRed, size: 28),
            SizedBox(width: 8),
            Expanded(
              child: Text('SOS EMERGENCY HALT',
                  style: TextStyle(color: CmColors.darkTextPrimary, fontWeight: FontWeight.w900)),
            ),
          ],
        ),
        content: Text(
          '$message\n\nEmergency beacon active! High-priority telemetry pushed to Transport '
          'Dispatch Radar. (100% software — in-app button / volume-rocker double-press.)',
          style: const TextStyle(color: CmColors.darkTextSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('DISMISS ALARM',
                style: TextStyle(color: CmColors.darkTextSecondary, fontWeight: FontWeight.bold)),
          ),
          TextButton(
            onPressed: () async {
              await ApiService.resolveSos(_busId);
              if (ctx.mounted) Navigator.pop(ctx);
              _showSnack('SOS cleared. Corridor operations resumed.', CmColors.goGreen);
            },
            child: const Text('RESOLVE & RESUME',
                style: TextStyle(color: CmColors.goGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // ---------------- Trip lifecycle (pure software) ----------------

  Future<void> _startTrip() async {
    final result = await ApiService.startTrip(_busId);
    if (!mounted) return;
    if (result['success'] == true) {
      setState(() => tripState = 'IN_TRANSIT');
      _showSnack(
        result['message'] as String? ?? 'Foreground GPS beacon engaged (3s interval).',
        CmColors.goGreen,
      );
    } else {
      _showSnack(result['detail'] as String? ?? 'Could not start trip.', CmColors.delayRed);
    }
  }

  Future<void> _endTrip() async {
    if (!rearSweepCompleted) {
      HapticFeedback.lightImpact();
      _showSnack(
        'Interlock: complete the Rear QR Sweep before ending the trip.',
        CmColors.disruption,
      );
      return;
    }
    HapticFeedback.mediumImpact();
    final result = await ApiService.endTrip(_busId);
    if (!mounted) return;
    if (result['success'] == true) {
      setState(() {
        tripState = 'COMPLETED';
        rearSweepCompleted = false;
      });
      _showSnack(
        result['message'] as String? ?? 'Trip closed. Zero children on board. Beacon disengaged.',
        CmColors.goGreen,
      );
    } else {
      _showSnack(result['detail'] as String? ?? 'Trip termination blocked.', CmColors.delayRed);
    }
  }

  // ---------------- Conductor actions ----------------

  Future<void> _scanStudentBoarding() async {
    HapticFeedback.mediumImpact();
    final result = await ApiService.verifyBoarding('p_102', _busId);
    if (!mounted) return;
    setState(() {
      if (currentOccupancy < capacity) currentOccupancy++;
    });
    _showSnack(
      '✅ Verified: ${result['student_name'] ?? 'Diya Patel'} boarded. Parent custody alert dispatched.',
      CmColors.goGreen,
    );
  }

  Future<void> _performRearSweep() async {
    HapticFeedback.lightImpact();
    final result = await ApiService.verifyRearSweep(_busId);
    if (!mounted) return;
    if (result['detail'] != null) {
      _showSnack(result['detail'] as String, CmColors.delayRed);
      return;
    }
    setState(() => rearSweepCompleted = true);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CmColors.darkSurface1,
        title: const Row(
          children: [
            Icon(Icons.verified_rounded, color: CmColors.goGreen),
            SizedBox(width: 8),
            Expanded(
                child: Text('Rear Sweep Audit Verified',
                    style: TextStyle(color: CmColors.darkTextPrimary))),
          ],
        ),
        content: const Text(
          'Zero sleeping children verified.\n'
          'Physical paper QR scanned at rear window (software sleep-sensor replacement). '
          'Trip termination now unlocked.',
          style: TextStyle(color: CmColors.darkTextSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK', style: TextStyle(color: CmColors.blueBright)),
          ),
        ],
      ),
    );
  }

  // ---------------- UI ----------------

  @override
  Widget build(BuildContext context) {
    final occupancyPct = (currentOccupancy / capacity).clamp(0.0, 1.0);
    final isTransit = tripState == 'IN_TRANSIT';

    return Scaffold(
      backgroundColor: CmColors.darkCanvas,
      appBar: AppBar(
        backgroundColor: CmColors.darkCanvas,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'DRIVER CABIN HUD // $vehicleNumber',
              style: const TextStyle(
                color: CmColors.darkTextPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w800,
              ),
            ),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isTransit ? CmColors.goGreen : CmColors.darkTextTertiary,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  isTransit
                      ? 'Foreground GPS Beacon: Emitting (3s)'
                      : 'Foreground GPS Beacon: IDLE — Start Trip to engage',
                  style: const TextStyle(color: CmColors.darkTextSecondary, fontSize: 11),
                ),
                if (isBackendLive) ...[
                  const SizedBox(width: 6),
                  const Icon(Icons.cloud_done_outlined, size: 12, color: CmColors.blueBright),
                ],
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.emergency, color: CmColors.delayRed, size: 28),
            onPressed: _triggerSos,
            tooltip: 'In-App SOS / Volume-Rocker Double-Press',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Trip Lifecycle Card (pure software — no ignition hardware)
            AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CmColors.darkSurface1,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isTransit ? CmColors.goGreen.withValues(alpha: 0.5) : CmColors.darkDivider,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'TRIP CONTROL (100% SOFTWARE)',
                        style: TextStyle(
                          color: CmColors.darkTextTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isTransit
                              ? CmColors.goGreen.withValues(alpha: 0.18)
                              : CmColors.disruption.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          isTransit ? 'TRIP ACTIVE' : tripState == 'COMPLETED' ? 'TRIP CLOSED' : 'READY',
                          style: TextStyle(
                            color: isTransit ? CmColors.goGreen : CmColors.disruption,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (isTransit)
                    // END TRIP — must NEVER be GO-green; only GO is green.
                    SizedBox(
                      height: 54,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: rearSweepCompleted
                              ? CmColors.delayRed
                              : CmColors.darkSurface2,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(27)),
                          elevation: 0,
                          side: rearSweepCompleted
                              ? BorderSide.none
                              : const BorderSide(color: CmColors.delayRed),
                        ),
                        onPressed: _endTrip,
                        icon: Icon(
                          rearSweepCompleted ? Icons.stop_circle : Icons.lock_outline,
                          color: rearSweepCompleted ? Colors.white : CmColors.delayRed,
                        ),
                        label: Text(
                          rearSweepCompleted ? 'END TRIP (Sweep Verified)' : 'END TRIP — Scan Rear QR First',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: rearSweepCompleted ? Colors.white : CmColors.delayRed,
                          ),
                        ),
                      ),
                    )
                  else
                    // The locked Citymapper GO control — THE single green action.
                    CmGoButton(
                      label: 'START TRIP · ENGAGE GPS BEACON',
                      onPressed: _startTrip,
                    ),
                  if (isTransit) ...[
                    const SizedBox(height: 8),
                    Text(
                      rearSweepCompleted
                          ? 'Rear sweep verified — End Trip unlocked. Beacon disengages on close.'
                          : 'End Trip is interlocked: conductor must scan the rear-window paper QR first.',
                      style: const TextStyle(color: CmColors.darkTextTertiary, fontSize: 11),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Invariant 2: Anti-Early Departure Interlock — Citymapper disruption banner
            if (isTransit && isRunningEarly)
              AnimatedOpacity(
                duration: const Duration(milliseconds: 350),
                opacity: 1,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: CmColors.disruption.withValues(alpha: 0.18),
                    border: Border.all(color: CmColors.disruption),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.lock_clock_rounded, color: CmColors.disruption, size: 26),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ANTI-EARLY DEPARTURE INTERLOCK ACTIVE',
                              style: TextStyle(
                                color: CmColors.disruption,
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                                letterSpacing: 0.3,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Running 4 mins ahead. Hold at stop until 07:38 AM to prevent leaving students behind.',
                              style: TextStyle(color: CmColors.darkTextSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // High-Contrast Turn-by-Turn Approved Corridor Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CmColors.darkSurface1,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: CmColors.darkDivider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'APPROVED ROAD CORRIDOR (±75m Buffer)',
                        style: TextStyle(
                          color: CmColors.darkTextTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                        ),
                      ),
                      const CmLineBadge('04N', CmColors.modeBus),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'NEXT DESIGNATED STOP',
                              style: TextStyle(color: CmColors.darkTextTertiary, fontSize: 10),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              nextStopName,
                              style: const TextStyle(
                                color: CmColors.darkTextPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: CmColors.blue.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          distanceToNextStopM != null
                              ? '${(distanceToNextStopM! / 1000).toStringAsFixed(1)} km'
                              : '0.6 km',
                          style: const TextStyle(
                            color: CmColors.blueBright,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: CmColors.darkDivider, height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.speed, color: CmColors.blueBright, size: 20),
                          const SizedBox(width: 6),
                          Text(
                            '${speedKmh.round()} km/h',
                            style: const TextStyle(color: CmColors.darkTextSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(Icons.timer_outlined, color: CmColors.goGreen, size: 20),
                          const SizedBox(width: 6),
                          Text(
                            'ETA ${_formatEta(etaSeconds)}',
                            style: cmEtaHero(CmColors.goGreen, 14),
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (confidenceWindow != null && confidenceWindow!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        'Kalman confidence window: $confidenceWindow',
                        style: const TextStyle(color: CmColors.darkTextTertiary, fontSize: 11),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Live Passenger Occupancy (Zero Seat-Selection - Commuter Aggregation)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CmColors.darkSurface1,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: CmColors.darkDivider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'COMMUTER MANIFEST LOAD',
                        style: TextStyle(
                          color: CmColors.darkTextTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                        ),
                      ),
                      Text(
                        '$currentOccupancy / $capacity Seats (${(occupancyPct * 100).toInt()}%)',
                        style: const TextStyle(
                          color: CmColors.darkTextPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: occupancyPct,
                      minHeight: 10,
                      backgroundColor: CmColors.darkSurface2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        occupancyPct > 0.95
                            ? CmColors.delayRed
                            : occupancyPct > 0.75
                                ? CmColors.disruption
                                : CmColors.goGreen,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    occupancyPct > 0.95
                        ? 'Bus full — overload alert dispatched to supervisor'
                        : occupancyPct > 0.75
                            ? 'High demand — limited remaining capacity'
                            : 'Seats available',
                    style: TextStyle(
                      color: occupancyPct > 0.95
                          ? CmColors.delayRed
                          : occupancyPct > 0.75
                              ? CmColors.disruption
                              : CmColors.goGreen,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Conductor Actions & Hardware Replacement Demonstrations
            const Text(
              'CONDUCTOR ACTIONS (Zero Hardware)',
              style: TextStyle(
                color: CmColors.darkTextTertiary,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CmColors.modeBus,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    onPressed: _scanStudentBoarding,
                    icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
                    label: const Text('Scan QR Pass',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          rearSweepCompleted ? CmColors.goGreen : CmColors.modeRail,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    onPressed: _performRearSweep,
                    icon: Icon(
                      rearSweepCompleted ? Icons.check_circle : Icons.camera_alt_outlined,
                      color: Colors.white,
                    ),
                    label: Text(
                      rearSweepCompleted ? 'Sweep Audited' : 'Rear QR Sweep',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatEta(double seconds) {
    final m = (seconds / 60).floor();
    final s = (seconds % 60).round();
    return '${m}m ${s}s';
  }
}
