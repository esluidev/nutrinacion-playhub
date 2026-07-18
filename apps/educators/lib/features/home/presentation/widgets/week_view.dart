import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/models/models.dart';
import '../../../../core/theme/theme.dart';
import '../../../../core/utils/workshop_colors.dart';

class WeekView extends StatelessWidget {
  const WeekView({
    super.key,
    required this.currentDate,
    required this.getWorkshopsForDay,
    required this.onSelectWorkshop,
  });

  final DateTime currentDate;
  final List<Workshop> Function(DateTime) getWorkshopsForDay;
  final void Function(Workshop) onSelectWorkshop;

  DateTime get _weekStart {
    final diff = (currentDate.weekday - 1) % 7;
    return DateTime(currentDate.year, currentDate.month, currentDate.day - diff);
  }

  List<DateTime> get _weekDays {
    return List.generate(7, (i) => _weekStart.add(Duration(days: i)));
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    final days = _weekDays;
    // 240px ensures cards have enough room on tablets;
    // on desktop/larger screens the columns expand via Expanded.
    const double minColumnWidth = 240;

    return LayoutBuilder(
      builder: (context, constraints) {
        // If 7 columns fit, use Expanded; otherwise enable horizontal scroll
        final totalMinWidth = minColumnWidth * 7;
        final needsScroll = constraints.maxWidth < totalMinWidth;
        final columnWidth = needsScroll ? minColumnWidth : null;

        Widget row = Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: List.generate(days.length, (index) {
            final day = days[index];
            final isLast = index == days.length - 1;
            final column = _DayColumn(
              day: day,
              isToday: _isToday(day),
              workshops: getWorkshopsForDay(day),
              onSelectWorkshop: onSelectWorkshop,
              showRightBorder: !isLast,
            );

            if (needsScroll) {
              return SizedBox(width: columnWidth, child: column);
            }
            return Expanded(child: column);
          }),
        );

        if (needsScroll) {
          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              height: constraints.maxHeight,
              child: row,
            ),
          );
        }

        return row;
      },
    );
  }
}

class _DayColumn extends StatelessWidget {
  const _DayColumn({
    required this.day,
    required this.isToday,
    required this.workshops,
    required this.onSelectWorkshop,
    required this.showRightBorder,
  });

  final DateTime day;
  final bool isToday;
  final List<Workshop> workshops;
  final void Function(Workshop) onSelectWorkshop;
  final bool showRightBorder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: showRightBorder
            ? const Border(right: BorderSide(color: AppColors.gray100))
            : null,
      ),
      child: Column(
        children: [
          // ─── Day header ──────────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
            decoration: BoxDecoration(
              color: isToday
                  ? const Color(0xFFF0FDF4) // green-50
                  : const Color(0xFFFAFAFB),
              border: const Border(
                bottom: BorderSide(color: AppColors.gray100),
              ),
            ),
            child: Column(
              children: [
                Text(
                  DateFormat('EEE', 'es').format(day).toUpperCase(),
                  style: GoogleFonts.nunito(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    color: isToday
                        ? const Color(0xFF16A34A)
                        : AppColors.gray400,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${day.day}',
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isToday
                        ? const Color(0xFF15803D)
                        : AppColors.gray800,
                  ),
                ),
              ],
            ),
          ),

          // ─── Workshop cards area (scrollable) ────────────────
          Expanded(
            child: Container(
              color: const Color(0xFFFCFCFC),
              child: workshops.isEmpty
                  ? Center(
                      child: Text(
                        'Sin talleres programados',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.nunito(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.gray400,
                        ),
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: workshops.map((workshop) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _WorkshopCard(
                              workshop: workshop,
                              onTap: () => onSelectWorkshop(workshop),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WorkshopCard extends StatelessWidget {
  const _WorkshopCard({
    required this.workshop,
    required this.onTap,
  });

  final Workshop workshop;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final typeColor = workshopTypeColor(workshop.type);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.gray100, width: 2),
          boxShadow: AppShadows.sm,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Type color bar
            Container(
              height: 6,
              decoration: BoxDecoration(
                color: typeColor,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 12),

            // Title
            Text(
              workshop.title,
              style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: AppColors.gray800,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 12),

            // Details
            _DetailRow(icon: LucideIcons.clock, text: '09:00 - 10:30'),
            const SizedBox(height: 6),
            _DetailRow(icon: LucideIcons.user, text: 'Dra. Maria Lopez'),
            const SizedBox(height: 6),
            _DetailRow(icon: LucideIcons.mapPin, text: 'Sala A - Centro Comunitario'),
            const SizedBox(height: 16),

            // Start button
            _StartButton(onTap: onTap),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.gray400),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.gray500,
            ),
          ),
        ),
      ],
    );
  }
}

class _StartButton extends StatefulWidget {
  const _StartButton({required this.onTap});

  final VoidCallback onTap;

  @override
  State<_StartButton> createState() => _StartButtonState();
}

class _StartButtonState extends State<_StartButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        transform: Matrix4.translationValues(0, _pressed ? 3 : 0, 0),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFAFAFA),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.gray100, width: 2),
          boxShadow: _pressed
              ? []
              : const [BoxShadow(color: AppColors.gray200, offset: Offset(0, 3))],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.play, size: 14, color: AppColors.gray600),
            const SizedBox(width: 6),
            Text(
              'Iniciar Taller',
              style: GoogleFonts.nunito(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.gray600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
