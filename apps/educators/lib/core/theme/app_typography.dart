import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography system matching the React app's Nunito font usage.
///
/// IMPORTANT: Each style uses GoogleFonts.nunito() directly to ensure
/// the correct font weight file is loaded. Using just fontFamily + fontWeight
/// does NOT work reliably with google_fonts.
///
/// Tailwind CSS reference sizes:
/// - text-xs  = 12px
/// - text-sm  = 14px
/// - text-base = 16px
/// - text-lg  = 18px
/// - text-xl  = 20px
/// - text-2xl = 24px
/// - text-3xl = 30px
/// - text-4xl = 36px
class AppTypography {
  AppTypography._();

  // ─── Headings ─────────────────────────────────────────────────────

  /// text-3xl font-black – main titles ("StoryPlay")
  static TextStyle get heading1 => GoogleFonts.nunito(
    fontSize: 30,
    fontWeight: FontWeight.w900,
    color: AppColors.gray800,
    letterSpacing: -0.5,
  );

  /// text-2xl font-black – section titles
  static TextStyle get heading2 => GoogleFonts.nunito(
    fontSize: 24,
    fontWeight: FontWeight.w900,
    color: AppColors.gray800,
    letterSpacing: -0.3,
  );

  /// text-xl font-bold – card/panel titles
  static TextStyle get heading3 => GoogleFonts.nunito(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: AppColors.gray800,
  );

  /// text-lg font-bold – sub-headings
  static TextStyle get heading4 => GoogleFonts.nunito(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.gray700,
  );

  // ─── Body ─────────────────────────────────────────────────────────

  /// text-base font-bold – primary body text (16px)
  static TextStyle get bodyLarge => GoogleFonts.nunito(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  /// text-sm font-bold – standard body text (14px)
  static TextStyle get body => GoogleFonts.nunito(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  /// text-sm font-medium – secondary body text
  static TextStyle get bodySecondary => GoogleFonts.nunito(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  // ─── Labels / Captions ────────────────────────────────────────────

  /// text-sm font-bold – form labels (React: text-sm font-bold text-gray-500)
  static TextStyle get label => GoogleFonts.nunito(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.gray500,
  );

  /// text-xs font-bold uppercase – footer text, small captions
  /// (React: text-xs font-bold text-gray-400 tracking-widest uppercase)
  static TextStyle get caption => GoogleFonts.nunito(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: AppColors.gray400,
    letterSpacing: 1.6,
  );

  /// 10px font-black uppercase – tiny badge labels
  static TextStyle get badge => GoogleFonts.nunito(
    fontSize: 10,
    fontWeight: FontWeight.w900,
    letterSpacing: 1.2,
  );

  // ─── Buttons ──────────────────────────────────────────────────────

  /// text-lg font-black – large CTA buttons
  static TextStyle get buttonLarge => GoogleFonts.nunito(
    fontSize: 18,
    fontWeight: FontWeight.w900,
    color: AppColors.white,
  );

  /// text-sm font-black – standard buttons
  static TextStyle get button => GoogleFonts.nunito(
    fontSize: 14,
    fontWeight: FontWeight.w900,
    color: AppColors.white,
  );

  // ─── Input ────────────────────────────────────────────────────────

  /// Input text (React: text-gray-700 font-bold)
  static TextStyle get input => GoogleFonts.nunito(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.gray700,
  );

  /// Input hint style
  static TextStyle get inputHint => GoogleFonts.nunito(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.gray400,
  );
}
