import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:edutransit_mobile/main.dart';

void main() {
  testWidgets('EduTransit Mobile renders Day-Scholar and Driver modes', (WidgetTester tester) async {
    // Build EduTransitApp and trigger a frame.
    await tester.pumpWidget(const EduTransitApp());
    await tester.pump();

    // Verify Student / Parent screen renders
    expect(find.text('EduTransit Day-Scholar Commute'), findsOneWidget);
    expect(find.text('UNBROKEN CUSTODY CHAIN'), findsOneWidget);
    expect(find.text('Not Travelling Today?'), findsOneWidget);

    // Switch to Driver Cabin HUD tab
    await tester.tap(find.byIcon(Icons.directions_bus_outlined));
    await tester.pump();

    // Verify Driver Cabin HUD is rendered
    expect(find.textContaining('DRIVER CABIN HUD'), findsOneWidget);
    expect(find.text('COMMUTER MANIFEST LOAD'), findsOneWidget);
    expect(find.text('Scan QR Pass'), findsOneWidget);

    // Verify pure-software trip lifecycle controls render (zero hardware ignition)
    expect(find.text('TRIP CONTROL (100% SOFTWARE)'), findsOneWidget);
    expect(find.textContaining('END TRIP'), findsOneWidget);
  });
}
