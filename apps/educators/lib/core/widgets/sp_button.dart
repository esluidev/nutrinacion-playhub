import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// A 3D-style button matching the React app's press-down effect.
///
/// The button has a colored bottom shadow that disappears on press,
/// while the button visually translates down.
class SpButton extends StatefulWidget {
  const SpButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.backgroundColor = AppColors.primary,
    this.borderColor = AppColors.primaryDark,
    this.shadowColor = AppColors.primaryDarkest,
    this.textStyle,
    this.isFullWidth = false,
    this.padding,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final Color backgroundColor;
  final Color borderColor;
  final Color shadowColor;
  final TextStyle? textStyle;
  final bool isFullWidth;
  final EdgeInsets? padding;

  /// Secondary (gray) variant
  factory SpButton.secondary({
    Key? key,
    required String label,
    VoidCallback? onPressed,
    Widget? icon,
    bool isFullWidth = false,
  }) {
    return SpButton(
      key: key,
      label: label,
      onPressed: onPressed,
      icon: icon,
      backgroundColor: AppColors.white,
      borderColor: AppColors.gray200,
      shadowColor: AppColors.gray200,
      textStyle: AppTypography.button.copyWith(color: AppColors.gray600),
      isFullWidth: isFullWidth,
    );
  }

  @override
  State<SpButton> createState() => _SpButtonState();
}

class _SpButtonState extends State<SpButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final effectivePadding = widget.padding ??
        const EdgeInsets.symmetric(horizontal: 24, vertical: 14);

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onPressed?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        transform: Matrix4.translationValues(0, _isPressed ? 4 : 0, 0),
        width: widget.isFullWidth ? double.infinity : null,
        decoration: BoxDecoration(
          color: widget.backgroundColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: widget.borderColor, width: 2),
          boxShadow: _isPressed
              ? []
              : [BoxShadow(color: widget.shadowColor, offset: const Offset(0, 4))],
        ),
        padding: effectivePadding,
        child: Row(
          mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (widget.icon != null) ...[
              widget.icon!,
              const SizedBox(width: 8),
            ],
            Text(
              widget.label,
              style: widget.textStyle ?? AppTypography.buttonLarge,
            ),
          ],
        ),
      ),
    );
  }
}
