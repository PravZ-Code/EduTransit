import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/commute_models.dart';
import '../services/api_service.dart';
import '../theme/cm_theme.dart';

/// K-12 Parent / Day-Scholar commute surface — Citymapper light spec.
class StudentParentScreen extends StatefulWidget {
  const StudentParentScreen({super.key});

  @override
  State<StudentParentScreen> createState() => _StudentParentScreenState();
}

class _StudentParentScreenState extends State<StudentParentScreen> {
  static const String _studentId = 'p_101';
  static const String _busId = 'bus_04';

  bool isAbsentToday = false;
  String custodyStatus = "BOARDED"; // HOME, BOARDED, IN_TRANSIT, REACHED_CAMPUS
  List<StopModel> stops = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStops();
  }

  void _loadStops() async {
    final loadedStops = await ApiService.getRouteStops('route_04n');
    if (!mounted) return;
    setState(() {
      stops = loadedStops;
      isLoading = false;
    });
  }

  void _toggleAbsence() async {
    HapticFeedback.lightImpact();
    final newAbsence = !isAbsentToday;
    final result = await ApiService.declareAbsence(
      _studentId,
      newAbsence ? 'Not travelling today: Sick Leave' : 'Resumed travel',
    );
    if (!mounted) return;
    setState(() {
      isAbsentToday = newAbsence;
      if (isAbsentToday) {
        custodyStatus = "ABSENT_AT_HOME";
      } else {
        custodyStatus = "WAITING";
      }
    });

    final sweepNote = result['visual_sweep_required'] == true
        ? ' K-12 Visual Sweep invariant triggered.'
        : '';
    final demandNote = result['updated_stop_demand'] != null
        ? ' Stop demand: ${result['updated_stop_demand']}'
        : '';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isAbsentToday ? CmColors.disruption : CmColors.goGreen,
        content: Text(
          isAbsentToday
            ? 'Declared Absent: Driver manifest dynamically rebalanced.$demandNote$sweepNote'
            : 'Absence cancelled. Welcome back to Route 04N manifest!',
        ),
      ),
    );
  }

  void _simulateProximityCheckin() async {
    HapticFeedback.mediumImpact();
    final result = await ApiService.verifyBoarding(_studentId, _busId);
    if (!mounted) return;
    setState(() {
      custodyStatus = "BOARDED";
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: CmColors.goGreen,
        content: Text(
          'Proximity GPS Check-in (<25m) verified! Custody updated to BOARDED for '
          '${result['student_name'] ?? 'Aarav Sharma'}. Parent alert dispatched.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CmColors.canvas,
      appBar: AppBar(
        backgroundColor: CmColors.blue,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'EduTransit Day-Scholar Commute',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
            ),
            Text(
              'Route 04N → Veltech University, Avadi',
              style: TextStyle(color: Colors.white70, fontSize: 11),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: CmColors.blue))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Child Custody Chain Tracker Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: CmColors.surface1,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: CmColors.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'UNBROKEN CUSTODY CHAIN',
                              style: TextStyle(
                                color: CmColors.textTertiary,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isAbsentToday
                                    ? CmColors.disruption.withValues(alpha: 0.18)
                                    : CmColors.goGreen.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isAbsentToday
                                      ? CmColors.disruption
                                      : CmColors.goGreen,
                                ),
                              ),
                              child: Text(
                                isAbsentToday ? 'ABSENT TODAY' : 'ON BUS (SAFE)',
                                style: TextStyle(
                                  color: isAbsentToday
                                      ? CmColors.disruption
                                      : const Color(0xFF00694A),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: CmColors.surface2,
                              child: Icon(Icons.school, color: CmColors.blue),
                            ),
                            SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Aarav Sharma',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: CmColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  'Computer Science 3rd Sem • Morning Commute',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: CmColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Citymapper leg strip — the commute read as colored mode chips
                        const CmLegStrip([
                          CmLegChip('4 min', CmColors.modeWalk, icon: Icons.directions_walk_rounded),
                          CmLegChip('BUS 04N', CmColors.modeBus),
                          CmLegChip('6 min', CmColors.modeWalk, icon: Icons.directions_walk_rounded),
                        ]),
                        const SizedBox(height: 16),
                        // Custody Stepper Indicator
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildCustodyStep('Home', true),
                            _buildCustodyDivider(true),
                            _buildCustodyStep('Boarded', custodyStatus == 'BOARDED'),
                            _buildCustodyDivider(false),
                            _buildCustodyStep('Transit', false),
                            _buildCustodyDivider(false),
                            _buildCustodyStep('Campus', false),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // "Not Travelling Today" Self-Service Absence Declaration Toggle
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: CmColors.surface1,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: CmColors.divider),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Not Travelling Today?',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: CmColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isAbsentToday
                                  ? 'Marked absent. Stops auto-rebalanced.'
                                  : 'Tap to notify driver before 07:00 AM',
                              style: const TextStyle(
                                fontSize: 11,
                                color: CmColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        Switch(
                          value: isAbsentToday,
                          onChanged: (_) => _toggleAbsence(),
                          activeThumbColor: CmColors.delayRed,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Citymapper Live Corridor Progression (departures-board cadence)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: CmColors.surface1,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: CmColors.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'LIVE CORRIDOR PROGRESSION',
                              style: TextStyle(
                                color: CmColors.textTertiary,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const CmLineBadge('04N', CmColors.modeBus),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ...stops.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final stop = entry.value;
                          final isLast = idx == stops.length - 1;
                          final isCurrent = stop.status == 'APPROACHING';
                          final isDeparted =
                              stop.status == 'DEPARTED' || stop.status == 'COMPLETED';
                          final isSweep = stop.status == 'DRIVE_BY_VISUAL_SWEEP';

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Column(
                                children: [
                                  Container(
                                    width: 16,
                                    height: 16,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: isDeparted
                                          ? CmColors.goGreen
                                          : isCurrent
                                              ? CmColors.modeBus
                                              : CmColors.surface2,
                                      border: Border.all(
                                        color: Colors.white,
                                        width: 2,
                                      ),
                                    ),
                                    child: isDeparted
                                        ? const Icon(Icons.check, size: 10, color: Colors.white)
                                        : null,
                                  ),
                                  if (!isLast)
                                    Container(
                                      width: 2,
                                      height: 38,
                                      color: isDeparted
                                          ? CmColors.goGreen
                                          : CmColors.divider,
                                    ),
                                ],
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              stop.name,
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: isCurrent
                                                    ? FontWeight.w700
                                                    : FontWeight.w500,
                                                color: isCurrent
                                                    ? CmColors.modeBus
                                                    : CmColors.textPrimary,
                                              ),
                                            ),
                                            Text(
                                              isSweep
                                                  ? '⚠ K-12 visual sweep — slow curb check'
                                                  : 'Boarding: ${stop.boardCount} students',
                                              style: TextStyle(
                                                fontSize: 10,
                                                color: isSweep
                                                    ? CmColors.disruption
                                                    : CmColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        stop.scheduledTime,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                          color: isCurrent
                                              ? CmColors.modeBus
                                              : CmColors.textSecondary,
                                          fontFeatures: const [],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          );
                        }),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Proximity Self-Check-in button (<25m)
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: CmColors.blue,
                      side: const BorderSide(color: CmColors.blue, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _simulateProximityCheckin,
                    icon: const Icon(Icons.near_me_outlined),
                    label: const Text('Proximity Check-in (<25m)',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildCustodyStep(String label, bool active) {
    return Column(
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: active ? CmColors.goGreen : CmColors.surface2,
            shape: BoxShape.circle,
          ),
          child: Icon(
            active ? Icons.check : Icons.circle_outlined,
            size: 14,
            color: active ? Colors.white : CmColors.textTertiary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: active ? FontWeight.bold : FontWeight.normal,
            color: active ? CmColors.goGreen : CmColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildCustodyDivider(bool active) {
    return Expanded(
      child: Container(
        height: 2,
        color: active ? CmColors.goGreen : CmColors.divider,
        margin: const EdgeInsets.symmetric(horizontal: 4),
      ),
    );
  }
}
