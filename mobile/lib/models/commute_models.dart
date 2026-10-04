class StopModel {
  final String stopId;
  final String name;
  final double lat;
  final double lng;
  final String scheduledTime;
  int boardCount;
  String status;
  bool requiresVisualSweep;

  StopModel({
    required this.stopId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.scheduledTime,
    required this.boardCount,
    required this.status,
    required this.requiresVisualSweep,
  });

  factory StopModel.fromJson(Map<String, dynamic> json) {
    return StopModel(
      stopId: json['stop_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      lat: (json['lat'] ?? 0.0).toDouble(),
      lng: (json['lng'] ?? json['lon'] ?? 0.0).toDouble(),
      scheduledTime: json['scheduled_time'] ?? '',
      boardCount: json['board_count'] ?? json['expected_passengers'] ?? 0,
      status: _mapStatus(json),
      requiresVisualSweep:
          json['requires_visual_sweep'] == true || json['demand_state'] == 'ZERO_DEMAND_VISUAL_SWEEP',
    );
  }

  static String _mapStatus(Map<String, dynamic> json) {
    final explicit = json['status'];
    if (explicit is String && explicit.isNotEmpty) return explicit;
    switch (json['demand_state']) {
      case 'ZERO_DEMAND_VISUAL_SWEEP':
        return 'DRIVE_BY_VISUAL_SWEEP';
      case 'ZERO_DEMAND_BYPASS':
        return 'BYPASSED';
      case 'COMPLETED':
        return 'DEPARTED';
      case 'NORMAL':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }
}

class BusModel {
  final String busId;
  final String registrationNumber;
  final String routeId;
  final String? routeName;
  double lat;
  double lng;
  double speedKmh;
  double headingDeg;
  String status;
  int currentOccupancy;
  int capacity;
  String nextStopId;
  String? nextStopName;
  double kalmanSmoothedEtaSeconds;
  String? confidenceWindow;
  double? distanceToNextStopM;
  String driverName;
  String driverPhone;
  bool isStandby;
  double complianceRating;
  String tripState;
  bool rearSweepVerified;

  BusModel({
    required this.busId,
    required this.registrationNumber,
    required this.routeId,
    this.routeName,
    required this.lat,
    required this.lng,
    required this.speedKmh,
    required this.headingDeg,
    required this.status,
    required this.currentOccupancy,
    required this.capacity,
    required this.nextStopId,
    this.nextStopName,
    required this.kalmanSmoothedEtaSeconds,
    this.confidenceWindow,
    this.distanceToNextStopM,
    required this.driverName,
    required this.driverPhone,
    required this.isStandby,
    required this.complianceRating,
    this.tripState = 'SCHEDULED',
    this.rearSweepVerified = false,
  });

  factory BusModel.fromJson(Map<String, dynamic> json) {
    return BusModel(
      busId: json['bus_id'] ?? '',
      registrationNumber: json['registration_number'] ?? json['vehicle_number'] ?? 'KA-01-BUS',
      routeId: json['route_id'] ?? '',
      routeName: json['route_name'],
      lat: (json['lat'] ?? 0.0).toDouble(),
      lng: (json['lng'] ?? json['lon'] ?? 0.0).toDouble(),
      speedKmh: (json['speed_kmh'] ?? 0.0).toDouble(),
      headingDeg: (json['heading_deg'] ?? json['bearing'] ?? 0.0).toDouble(),
      status: _mapStatus(json['status']),
      currentOccupancy: json['current_occupancy'] ?? json['occupancy'] ?? 0,
      capacity: json['capacity'] ?? 45,
      nextStopId: json['next_stop_id'] ?? '',
      nextStopName: json['next_stop_name'],
      kalmanSmoothedEtaSeconds:
          (json['kalman_smoothed_eta_seconds'] ?? json['eta_next_stop_seconds'] ?? 0.0).toDouble(),
      confidenceWindow: json['confidence_window'],
      distanceToNextStopM: json['distance_to_next_stop_m']?.toDouble(),
      driverName: json['driver_name'] ?? 'Driver',
      driverPhone: json['driver_phone'] ?? '',
      isStandby: json['is_standby'] == true,
      complianceRating: (json['compliance_rating'] ?? json['driver_rating'] ?? 5.0).toDouble(),
      tripState: json['trip_state'] ?? 'SCHEDULED',
      rearSweepVerified: json['rear_sweep_verified'] == true,
    );
  }

  static String _mapStatus(dynamic raw) {
    switch ('${raw ?? ''}'.toUpperCase()) {
      case 'CORRIDOR_DEVIATION':
      case 'OFF_ROUTE':
        return 'CORRIDOR_DEVIATION';
      case 'SOS':
      case 'SOS_HALT':
        return 'SOS_HALT';
      case 'DELAYED':
        return 'DELAYED';
      case 'STANDBY':
      case 'STANDBY_DEPLOYED':
        return 'STANDBY_DEPLOYED';
      case 'REPLACED':
        return 'STANDBY_DEPLOYED';
      default:
        return 'ON_TIME';
    }
  }
}

class StudentModel {
  final String studentId;
  final String name;
  final String gradeOrDept;
  final String stopId;
  final String busId;
  String status; // WAITING, BOARDED, ABSENT, HANDED_OVER
  final String emergencyContact;

  StudentModel({
    required this.studentId,
    required this.name,
    required this.gradeOrDept,
    required this.stopId,
    required this.busId,
    required this.status,
    required this.emergencyContact,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      studentId: json['student_id'] ?? '',
      name: json['name'] ?? '',
      gradeOrDept: json['grade_or_dept'] ?? '',
      stopId: json['stop_id'] ?? '',
      busId: json['bus_id'] ?? '',
      status: json['status'] ?? 'WAITING',
      emergencyContact: json['emergency_contact'] ?? '',
    );
  }
}
