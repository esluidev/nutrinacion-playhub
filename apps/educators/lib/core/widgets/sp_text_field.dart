import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Styled text field matching the React app's input design.
///
/// React reference:
/// ```
/// bg-[#f8fafc] border-2 border-gray-100 rounded-2xl px-4 py-3
/// text-gray-700 font-bold
/// focus:border-[#22c55e] focus:bg-white
/// ```
class SpTextField extends StatelessWidget {
  const SpTextField({
    super.key,
    this.controller,
    this.label,
    this.hintText,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
    this.onChanged,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hintText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Padding(
            // React: ml-1 mb-2 → 4px left, 8px bottom
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(label!, style: AppTypography.label),
          ),
        ],
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: AppTypography.input,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: AppTypography.inputHint,
            prefixIcon: prefixIcon,
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg), // rounded-2xl = 16px
              borderSide: const BorderSide(color: AppColors.gray100, width: 2),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: const BorderSide(color: AppColors.gray100, width: 2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            // React: px-4 py-3 = 16px horizontal, 12px vertical
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ],
    );
  }
}
