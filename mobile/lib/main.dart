import 'package:flutter/material.dart';
import 'screens/driver_screen.dart';
import 'screens/student_parent_screen.dart';

void main() {
  runApp(const EduTransitApp());
}

/// Citymapper Design System Theme Specification (.agents/citymapper/DESIGN.md)
class CMColors {
  static const Color darkCanvas = Color(0xFF0C0E14); // Deep blue-black, NOT pure black
  static const Color darkSurface1 = Color(0xFF15171F); // Cards & elevated surfaces
  static const Color darkSurface2 = Color(0xFF1E212B); // Departures board & selected
  static const Color darkDivider = Color(0xFF282C38);
  static const Color textPrimary = Color(0xFFECEEF3);
  static const Color textSecondary = Color(0xFF98A0AE);
  static const Color textTertiary = Color(0xFF646C7A);

  static const Color blue = Color(0xFF2B5BFF); // Brand accent
  static const Color blueBright = Color(0xFF4D7BFF);
  static const Color goGreen = Color(0xFF00C281); // Shape/color-locked GO
  static const Color goDark = Color(0xFF003322);

  // Theme-invariant transit mode colors
  static const Color modeWalk = Color(0xFF00B894);
  static const Color modeBus = Color(0xFFE8453C);
  static const Color modeTube = Color(0xFF2B5BFF);
  static const Color modeRail = Color(0xFF8E44D8);
  static const Color disruption = Color(0xFFFF8A00);
}

class EduTransitApp extends StatelessWidget {
  const EduTransitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduTransit Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: CMColors.blue,
          surface: CMColors.darkSurface1,
        ),
        scaffoldBackgroundColor: CMColors.darkCanvas,
        cardColor: CMColors.darkSurface1,
        dividerColor: CMColors.darkDivider,
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    StudentParentScreen(),
    DriverScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: CMColors.darkCanvas,
          border: Border(
            top: BorderSide(color: CMColors.darkDivider, width: 0.5),
          ),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          backgroundColor: CMColors.darkCanvas,
          indicatorColor: CMColors.blue.withValues(alpha: 0.25),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.school_outlined, color: CMColors.textSecondary),
              selectedIcon: Icon(Icons.school, color: CMColors.blueBright),
              label: 'Student / Parent',
            ),
            NavigationDestination(
              icon: Icon(Icons.directions_bus_outlined, color: CMColors.textSecondary),
              selectedIcon: Icon(Icons.directions_bus, color: CMColors.blueBright),
              label: 'Driver Cabin HUD',
            ),
          ],
        ),
      ),
    );
  }
}
