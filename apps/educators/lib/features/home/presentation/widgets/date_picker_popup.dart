import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/theme.dart';

/// A floating calendar date picker that appears near its anchor.
class DatePickerPopup extends StatefulWidget {
  const DatePickerPopup({
    super.key,
    required this.currentDate,
    required this.anchorOffset,
    required this.anchorSize,
    required this.onDateSelected,
  });

  final DateTime currentDate;
  final Offset anchorOffset;
  final Size anchorSize;
  final ValueChanged<DateTime> onDateSelected;

  @override
  State<DatePickerPopup> createState() => _DatePickerPopupState();
}

class _DatePickerPopupState extends State<DatePickerPopup> {
  late DateTime _displayMonth;

  @override
  void initState() {
    super.initState();
    _displayMonth = DateTime(widget.currentDate.year, widget.currentDate.month);
  }

  void _prevMonth() {
    setState(() {
      _displayMonth = DateTime(_displayMonth.year, _displayMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _displayMonth = DateTime(_displayMonth.year, _displayMonth.month + 1);
    });
  }

  List<DateTime> _generateMonthDays() {
    final firstOfMonth = DateTime(_displayMonth.year, _displayMonth.month, 1);
    final lastOfMonth = DateTime(_displayMonth.year, _displayMonth.month + 1, 0);

    // Pad to start on Monday
    final startWeekday = firstOfMonth.weekday; // 1=Mon
    final startDate = firstOfMonth.subtract(Duration(days: startWeekday - 1));

    // Pad to end on Sunday
    final endWeekday = lastOfMonth.weekday;
    final endDate = lastOfMonth.add(Duration(days: 7 - endWeekday));

    final days = <DateTime>[];
    var current = startDate;
    while (!current.isAfter(endDate)) {
      days.add(current);
      current = current.add(const Duration(days: 1));
    }
    return days;
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  bool _isToday(DateTime d) => _isSameDay(d, DateTime.now());

  @override
  Widget build(BuildContext context) {
    final days = _generateMonthDays();
    const weekLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return Stack(
      children: [
        // Dismiss backdrop
        Positioned.fill(
          child: GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: const ColoredBox(color: Colors.transparent),
          ),
        ),

        // Popup positioned near the anchor
        Positioned(
          top: widget.anchorOffset.dy + widget.anchorSize.height + 8,
          right: 32,
          child: Material(
            color: Colors.transparent,
            child: Container(
              width: 320,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(color: AppColors.gray100),
                boxShadow: AppShadows.lg,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Month header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: _prevMonth,
                        child: const Padding(
                          padding: EdgeInsets.all(4),
                          child: Icon(LucideIcons.chevronLeft,
                              size: 20, color: AppColors.gray500),
                        ),
                      ),
                      Text(
                        DateFormat('MMMM yyyy', 'es').format(_displayMonth),
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.w900,
                          color: AppColors.gray800,
                        ),
                      ),
                      GestureDetector(
                        onTap: _nextMonth,
                        child: const Padding(
                          padding: EdgeInsets.all(4),
                          child: Icon(LucideIcons.chevronRight,
                              size: 20, color: AppColors.gray500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Week day headers
                  Row(
                    children: weekLabels
                        .map((l) => Expanded(
                              child: Center(
                                child: Text(
                                  l,
                                  style: GoogleFonts.nunito(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.gray400,
                                  ),
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 8),

                  // Day grid
                  ...List.generate(
                    (days.length / 7).ceil(),
                    (weekIndex) {
                      final weekDays = days.skip(weekIndex * 7).take(7).toList();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: weekDays.map((day) {
                            final isCurrentMonth =
                                day.month == _displayMonth.month;
                            final isSelected =
                                _isSameDay(day, widget.currentDate);
                            final isToday = _isToday(day);

                            return Expanded(
                              child: GestureDetector(
                                onTap: () => widget.onDateSelected(day),
                                child: Container(
                                  height: 32,
                                  margin: const EdgeInsets.all(1),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary
                                        : isToday
                                            ? const Color(0xFFDCFCE7)
                                            : Colors.transparent,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '${day.day}',
                                      style: GoogleFonts.nunito(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: isSelected
                                            ? AppColors.white
                                            : isToday
                                                ? const Color(0xFF15803D)
                                                : isCurrentMonth
                                                    ? AppColors.gray700
                                                    : AppColors.gray300,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
