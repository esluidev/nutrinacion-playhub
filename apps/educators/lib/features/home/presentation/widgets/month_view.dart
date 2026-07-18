import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/models/models.dart';
import '../../../../core/theme/theme.dart';
import '../../../../core/utils/workshop_colors.dart';

class MonthView extends StatelessWidget {
  const MonthView({
    super.key,
    required this.currentDate,
    required this.getWorkshopsForDay,
    required this.onSelectWorkshop,
  });

  final DateTime currentDate;
  final List<Workshop> Function(DateTime) getWorkshopsForDay;
  final void Function(Workshop) onSelectWorkshop;

  List<DateTime> get _monthDays {
    final firstOfMonth = DateTime(currentDate.year, currentDate.month, 1);
    final lastOfMonth = DateTime(currentDate.year, currentDate.month + 1, 0);

    final startWeekday = firstOfMonth.weekday;
    final startDate = firstOfMonth.subtract(Duration(days: startWeekday - 1));

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

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }

  bool _isCurrentMonth(DateTime d) => d.month == currentDate.month;

  @override
  Widget build(BuildContext context) {
    final days = _monthDays;
    const weekHeaders = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
    final weekCount = (days.length / 7).ceil();

    return Column(
      children: [
        // Week day headers
        Container(
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFA),
            border: Border(bottom: BorderSide(color: AppColors.gray100)),
          ),
          child: Row(
            children: weekHeaders.map((label) {
              final isLast = label == weekHeaders.last;
              return Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: isLast
                        ? null
                        : const Border(
                            right: BorderSide(color: AppColors.gray100)),
                  ),
                  child: Center(
                    child: Text(
                      label,
                      style: GoogleFonts.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: AppColors.gray400,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),

        // Day grid
        Expanded(
          child: Column(
            children: List.generate(weekCount, (weekIndex) {
              final weekDays = days.skip(weekIndex * 7).take(7).toList();
              return Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: weekDays.map((day) {
                    final isLast = day == weekDays.last;
                    final isCurrent = _isCurrentMonth(day);
                    final isToday = _isToday(day);
                    final dayWorkshops = getWorkshopsForDay(day);

                    return Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: !isCurrent
                              ? const Color(0xFFFAFAFA)
                              : isToday
                                  ? const Color(0xFFF0FDF4).withValues(alpha: 0.3)
                                  : null,
                          border: Border(
                            right: isLast
                                ? BorderSide.none
                                : const BorderSide(color: AppColors.gray100),
                            bottom: const BorderSide(color: AppColors.gray100),
                          ),
                        ),
                        child: Opacity(
                          opacity: isCurrent ? 1.0 : 0.5,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Day number
                              Text(
                                '${day.day}',
                                style: GoogleFonts.nunito(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  color: isToday
                                      ? AppColors.primary
                                      : AppColors.gray500,
                                ),
                              ),
                              const SizedBox(height: 6),

                              // Workshop indicators
                              ...dayWorkshops.map((workshop) {
                                return GestureDetector(
                                  onTap: () => onSelectWorkshop(workshop),
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: BoxDecoration(
                                            color: workshopTypeColor(
                                                workshop.type),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            workshop.title,
                                            overflow: TextOverflow.ellipsis,
                                            style: GoogleFonts.nunito(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.gray600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}
