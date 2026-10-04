import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Citymapper Design System tokens for EduTransit mobile.
/// Source of truth: .agents/citymapper/DESIGN.md
class CmColors {
  CmColors._();

  // Brand accent & GO lock
  static const blue = Color(0xFF2B5BFF);       // Citymapper Blue — accent/brand
  static const blueBright = Color(0xFF4D7BFF); // Dark-mode link / active variant
  static const bluePressed = Color(0xFF1E45CC);
  static const goGreen = Color(0xFF00C281);    // GO / Live / On-time ONLY

  // Transit mode colors — theme-invariant (the brand's soul)
  static const modeWalk = Color(0xFF00B894);
  static const modeBus = Color(0xFFE8453C);
  static const modeMetro = Color(0xFF2B5BFF);
  static const modeRail = Color(0xFF8E44D8);

  // Semantic
  static const disruption = Color(0xFFFF8A00); // closures / delays / absent state
  static const delayRed = Color(0xFFE8453C);   // severe problem (shares bus red)

  // Light canvas ramp
  static const canvas = Color(0xFFFFFFFF);
  static const surface1 = Color(0xFFF4F5F8);
  static const surface2 = Color(0xFFE8EAF0);
  static const divider = Color(0xFFE3E5EC);

  // Light text ramp
  static const textPrimary = Color(0xFF10131A);
  static const textSecondary = Color(0xFF5A6473);
  static const textTertiary = Color(0xFF8A93A3);

  // Dark canvas ramp (deep blue-black — never pure black)
  static const darkCanvas = Color(0xFF0C0E14);
  static const darkSurface1 = Color(0xFF15171F);
  static const darkSurface2 = Color(0xFF1E212B);
  static const darkDivider = Color(0xFF282C38);
  static const darkTextPrimary = Color(0xFFECEEF3);
  static const darkTextSecondary = Color(0xFF98A0AE);
  static const darkTextTertiary = Color(0xFF646C7A);
}

/// GO-green CTA glow: 0 10px 22px -10px rgba(0,194,129,0.7)
final BoxShadow cmGoGlow = BoxShadow(
  color: CmColors.goGreen.withValues(alpha: 0.70),
  blurRadius: 22,
  offset: const Offset(0, 10),
  spreadRadius: -10,
);

/// Chunky Citymapper departure/ETA figure style (800+, tabular numerics).
TextStyle cmEtaHero(Color color, [double size = 22]) => TextStyle(
      color: color,
      fontSize: size,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.3,
      fontFeatures: const [FontFeature.tabularFigures()],
    );

/// Mode badge: 8pt-radius colored chip, 12pt weight 900 white uppercase.
class CmLineBadge extends StatelessWidget {
  final String label;
  final Color color;
  final double height;

  const CmLineBadge(this.label, this.color, {super.key, this.height = 24});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        label.toUpperCase(),
        maxLines: 1,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

/// A single mode chip inside a leg strip: colored pill, white label/glyph.
class CmLegChip extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;

  const CmLegChip(this.label, this.color, {super.key, this.icon = Icons.directions_bus});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Signature Citymapper leg strip: mode chips joined by tertiary arrows.
class CmLegStrip extends StatelessWidget {
  final List<Widget> chips;

  const CmLegStrip(this.chips, {super.key});

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    for (var i = 0; i < chips.length; i++) {
      children.add(chips[i]);
      if (i < chips.length - 1) {
        children.add(const Padding(
          padding: EdgeInsets.symmetric(horizontal: 3),
          child: Text(
            '›',
            style: TextStyle(
              color: CmColors.textTertiary,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ));
      }
    }
    return Wrap(spacing: 4, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: children);
  }
}

/// The signature Citymapper GO button: 54pt full-width pill, GO Green,
/// play triangle + bold label, green-tinted glow. Shape/color LOCKED.
class CmGoButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final IconData icon;

  const CmGoButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon = Icons.play_arrow_rounded,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 54,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(27),
        boxShadow: [cmGoGlow],
      ),
      child: ElevatedButton.icon(
        onPressed: () {
          HapticFeedback.mediumImpact();
          onPressed();
        },
        icon: Icon(icon, color: Colors.white, size: 26),
        label: Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5,
            color: Colors.white,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: CmColors.goGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(27)),
        ),
      ),
    );
  }
}
