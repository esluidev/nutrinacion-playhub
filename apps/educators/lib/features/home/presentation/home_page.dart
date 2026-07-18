import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/models/models.dart';
import '../../../core/theme/theme.dart';
import 'widgets/home_header.dart';
import 'widgets/navigation_bar.dart';
import 'widgets/week_view.dart';
import 'widgets/month_view.dart';

enum ViewMode { week, month }

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.onSelectWorkshop});

  final void Function(Workshop workshop) onSelectWorkshop;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  DateTime _currentDate = DateTime.now();
  ViewMode _viewMode = ViewMode.week;

  void _handlePrev() {
    setState(() {
      _currentDate = _viewMode == ViewMode.week
          ? _currentDate.subtract(const Duration(days: 7))
          : DateTime(_currentDate.year, _currentDate.month - 1);
    });
  }

  void _handleNext() {
    setState(() {
      _currentDate = _viewMode == ViewMode.week
          ? _currentDate.add(const Duration(days: 7))
          : DateTime(_currentDate.year, _currentDate.month + 1);
    });
  }

  void _handleToday() {
    setState(() => _currentDate = DateTime.now());
  }

  void _handleDateSelected(DateTime date) {
    setState(() => _currentDate = date);
  }

  void _handleViewModeChanged(ViewMode mode) {
    setState(() => _viewMode = mode);
  }

  List<Workshop> _getWorkshopsForDay(DateTime date) {
    return mockWorkshops.where((w) {
      return w.date.year == date.year &&
          w.date.month == date.month &&
          w.date.day == date.day;
    }).toList();
  }

  String get _headerDateText {
    if (_viewMode == ViewMode.week) {
      final start = _weekStart(_currentDate);
      final end = start.add(const Duration(days: 6));
      final startStr = DateFormat("d MMM", 'es').format(start);
      final endStr = DateFormat("d MMM, yyyy", 'es').format(end);
      return '$startStr - $endStr';
    } else {
      return DateFormat("MMMM yyyy", 'es').format(_currentDate);
    }
  }

  DateTime _weekStart(DateTime date) {
    final diff = (date.weekday - 1) % 7;
    return DateTime(date.year, date.month, date.day - diff);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ─── Header bar ──────────────────────────────────────
            HomeHeader(
              onLogout: () {
                // TODO: handle logout
              },
            ),

            // ─── Main content area ──────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(32, 16, 32, 32),
                child: Column(
                  children: [
                    // Navigation bar
                    HomeNavigationBar(
                      dateText: _headerDateText,
                      viewMode: _viewMode,
                      currentDate: _currentDate,
                      onPrev: _handlePrev,
                      onNext: _handleNext,
                      onToday: _handleToday,
                      onDateSelected: _handleDateSelected,
                      onViewModeChanged: _handleViewModeChanged,
                    ),
                    const SizedBox(height: 16),

                    // Calendar view (fills remaining space)
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(AppRadius.xl),
                          border: Border.all(color: AppColors.gray100),
                          boxShadow: AppShadows.sm,
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: _viewMode == ViewMode.week
                            ? WeekView(
                                currentDate: _currentDate,
                                getWorkshopsForDay: _getWorkshopsForDay,
                                onSelectWorkshop: widget.onSelectWorkshop,
                              )
                            : MonthView(
                                currentDate: _currentDate,
                                getWorkshopsForDay: _getWorkshopsForDay,
                                onSelectWorkshop: widget.onSelectWorkshop,
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
