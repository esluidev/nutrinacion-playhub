import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Shadow presets matching the React app's shadow system.
///
/// The React app uses a distinctive "3D button" pattern with colored
/// bottom shadows (e.g. `shadow-[0_4px_0_#15803d]`).
class AppShadows {
  AppShadows._();

  // ─── Button shadows (3D press effect) ─────────────────────────────

  /// Green button shadow – primary CTA
  static const BoxShadow buttonPrimary = BoxShadow(
    color: AppColors.primaryDarkest,
    offset: Offset(0, 4),
  );

  /// Gray button shadow – secondary buttons
  static const BoxShadow buttonSecondary = BoxShadow(
    color: AppColors.gray200,
    offset: Offset(0, 4),
  );

  /// Green light shadow – navigation buttons
  static const BoxShadow buttonNav = BoxShadow(
    color: AppColors.primaryLighter,
    offset: Offset(0, 4),
  );

  /// Teal button shadow
  static const BoxShadow buttonTeal = BoxShadow(
    color: AppColors.teal,
    offset: Offset(0, 4),
  );

  /// Purple button shadow – NutriBot
  static const BoxShadow buttonPurple = BoxShadow(
    color: AppColors.purpleDark,
    offset: Offset(0, 4),
  );

  // ─── Card / surface shadows ───────────────────────────────────────

  /// Very subtle card shadow (login card)
  static const List<BoxShadow> cardSubtle = [
    BoxShadow(
      color: Color(0x0A000000), // ~4% opacity
      blurRadius: 30,
      offset: Offset(0, 8),
    ),
  ];

  /// Small shadow (header bar, small cards)
  static const List<BoxShadow> sm = [
    BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 6,
      offset: Offset(0, 1),
    ),
  ];

  /// Large shadow (modals, popovers)
  static const List<BoxShadow> lg = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 15,
      offset: Offset(0, 10),
    ),
  ];
}
