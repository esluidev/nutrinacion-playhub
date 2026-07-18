import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/theme.dart';
import '../home_page.dart';
import 'date_picker_popup.dart';

class HomeNavigationBar extends StatelessWidget {
  const HomeNavigationBar({
    super.key,
    required this.dateText,
    required this.viewMode,
    required this.currentDate,
    required this.onPrev,
    required this.onNext,
    required this.onToday,
    required this.onDateSelected,
    required this.onViewModeChanged,
  });

  final String dateText;
  final ViewMode viewMode;
  final DateTime currentDate;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onToday;
  final ValueChanged<DateTime> onDateSelected;
  final ValueChanged<ViewMode> onViewModeChanged;

  @override
  Widget build(BuildContext context) {
    // React layout: left group (date nav) + spacer + right group (hoy, cal, toggle)
    return Row(
      children: [
        // Left: prev / date / next inside white container
        _buildDateNavigation(),

        const Spacer(),

        // Right: today, calendar, view toggle
        _buildControls(context),
      ],
    );
  }

  Widget _buildDateNavigation() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.gray100),
        boxShadow: AppShadows.sm,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _NavIconButton(
            icon: LucideIcons.chevronLeft,
            onPressed: onPrev,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 200),
              child: Text(
                dateText,
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: AppColors.gray800,
                ),
              ),
            ),
          ),
          _NavIconButton(
            icon: LucideIcons.chevronRight,
            onPressed: onNext,
          ),
        ],
      ),
    );
  }

  Widget _buildControls(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _TodayButton(onPressed: onToday),
        const SizedBox(width: 12),
        _CalendarButton(
          currentDate: currentDate,
          onDateSelected: onDateSelected,
        ),
        const SizedBox(width: 12),
        _ViewModeToggle(
          viewMode: viewMode,
          onChanged: onViewModeChanged,
        ),
      ],
    );
  }
}

/// Small icon button with 3D shadow effect.
class _NavIconButton extends StatefulWidget {
  const _NavIconButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  State<_NavIconButton> createState() => _NavIconButtonState();
}

class _NavIconButtonState extends State<_NavIconButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onPressed();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        transform: Matrix4.translationValues(0, _pressed ? 4 : 0, 0),
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.gray200, width: 2),
          boxShadow: _pressed
              ? []
              : const [BoxShadow(color: AppColors.gray200, offset: Offset(0, 4))],
        ),
        child: Icon(widget.icon, size: 20, color: AppColors.gray600),
      ),
    );
  }
}

/// "Hoy" button with green tint.
class _TodayButton extends StatefulWidget {
  const _TodayButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  State<_TodayButton> createState() => _TodayButtonState();
}

class _TodayButtonState extends State<_TodayButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onPressed();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        transform: Matrix4.translationValues(0, _pressed ? 4 : 0, 0),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: const Color(0xFFBBF7D0), width: 2),
          boxShadow: _pressed
              ? []
              : const [
                  BoxShadow(color: Color(0xFFBBF7D0), offset: Offset(0, 4)),
                ],
        ),
        child: Text(
          'Hoy',
          style: GoogleFonts.nunito(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF15803D),
          ),
        ),
      ),
    );
  }
}

/// Calendar icon button that opens a date picker popup.
class _CalendarButton extends StatelessWidget {
  const _CalendarButton({
    required this.currentDate,
    required this.onDateSelected,
  });

  final DateTime currentDate;
  final ValueChanged<DateTime> onDateSelected;

  @override
  Widget build(BuildContext context) {
    return _NavIconButton(
      icon: LucideIcons.calendar,
      onPressed: () {
        final renderBox = context.findRenderObject() as RenderBox;
        final offset = renderBox.localToGlobal(Offset.zero);
        final size = renderBox.size;

        showDialog(
          context: context,
          barrierColor: Colors.transparent,
          builder: (ctx) => DatePickerPopup(
            currentDate: currentDate,
            anchorOffset: offset,
            anchorSize: size,
            onDateSelected: (date) {
              onDateSelected(date);
              Navigator.of(ctx).pop();
            },
          ),
        );
      },
    );
  }
}

/// Week/Month view mode toggle.
class _ViewModeToggle extends StatelessWidget {
  const _ViewModeToggle({
    required this.viewMode,
    required this.onChanged,
  });

  final ViewMode viewMode;
  final ValueChanged<ViewMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.gray200, width: 2),
        boxShadow: const [
          BoxShadow(color: AppColors.gray200, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ToggleIcon(
            icon: LucideIcons.list,
            isActive: viewMode == ViewMode.week,
            onTap: () => onChanged(ViewMode.week),
          ),
          _ToggleIcon(
            icon: LucideIcons.layoutGrid,
            isActive: viewMode == ViewMode.month,
            onTap: () => onChanged(ViewMode.month),
          ),
        ],
      ),
    );
  }
}

class _ToggleIcon extends StatelessWidget {
  const _ToggleIcon({
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFF0FDF4) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 20,
          color: isActive ? AppColors.primary : AppColors.gray400,
        ),
      ),
    );
  }
}
