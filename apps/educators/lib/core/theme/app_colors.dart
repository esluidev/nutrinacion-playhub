import 'dart:ui';

/// Design system color palette extracted from the React StoryPlay app.
///
/// Usage:
/// ```dart
/// Container(color: AppColors.primary)
/// ```
class AppColors {
  AppColors._();

  // ─── Primary (Green) ───────────────────────────────────────────────
  static const Color primary = Color(0xFF22C55E);
  static const Color primaryDark = Color(0xFF16A34A);
  static const Color primaryDarkest = Color(0xFF15803D);
  static const Color primaryLight = Color(0xFFF0FDF4); // green-50
  static const Color primaryLighter = Color(0xFFBBF7D0); // green-200

  // ─── Accent: Coral / Red ───────────────────────────────────────────
  static const Color coral = Color(0xFFFF6B6B);
  static const Color coralLight = Color(0x1AFF6B6B); // 10% opacity

  // ─── Accent: Teal ─────────────────────────────────────────────────
  static const Color teal = Color(0xFF4ECDC4);
  static const Color tealLight = Color(0xFFE6F7F5);

  // ─── Accent: Purple ───────────────────────────────────────────────
  static const Color purple = Color(0xFFA29BFE);
  static const Color purpleDark = Color(0xFF8A82F8);

  // ─── Accent: Gold / Yellow ────────────────────────────────────────
  static const Color gold = Color(0xFFFFB800);
  static const Color goldDark = Color(0xFFD4B200);
  static const Color yellowLight = Color(0xFFFFE66D);

  // ─── Backgrounds ──────────────────────────────────────────────────
  static const Color background = Color(0xFFF4F7F6);
  static const Color surface = Color(0xFFF8FAFC);
  static const Color white = Color(0xFFFFFFFF);

  // ─── Gray Scale ───────────────────────────────────────────────────
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF1F5F9);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray300 = Color(0xFFCBD5E1);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray700 = Color(0xFF1F2937);
  static const Color gray800 = Color(0xFF111827);
  static const Color gray900 = Color(0xFF0F172A);

  // ─── Text ─────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF334155);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textTertiary = Color(0xFF94A3B8);

  // ─── Workshop type colors ─────────────────────────────────────────
  static const Color workshopAlimentacion = primary;
  static const Color workshopCuidado = teal;
  static const Color workshopActividad = coral;
}
