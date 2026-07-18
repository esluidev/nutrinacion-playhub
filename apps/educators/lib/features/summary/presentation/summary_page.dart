import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/models/models.dart';
import '../../../core/theme/theme.dart';

class SummaryPage extends StatefulWidget {
  const SummaryPage({
    super.key,
    required this.workshop,
    required this.points,
    required this.level,
    required this.onContinue,
  });

  final Workshop workshop;
  final int points;
  final int level;
  final VoidCallback onContinue;

  @override
  State<SummaryPage> createState() => _SummaryPageState();
}

class _SummaryPageState extends State<SummaryPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _cardScale;
  late Animation<double> _cardOpacity;
  late Animation<double> _iconSlide;
  late Animation<double> _headingSlide;
  late Animation<double> _subtitleSlide;
  late Animation<double> _statsSlide;
  late Animation<double> _buttonSlide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _cardScale = Tween(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.4, curve: Curves.easeOut)),
    );
    _cardOpacity = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.3, curve: Curves.easeOut)),
    );
    _iconSlide = Tween(begin: -20.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.15, 0.45, curve: Curves.easeOut)),
    );
    _headingSlide = Tween(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.25, 0.55, curve: Curves.easeOut)),
    );
    _subtitleSlide = Tween(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.3, 0.6, curve: Curves.easeOut)),
    );
    _statsSlide = Tween(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.4, 0.75, curve: Curves.easeOut)),
    );
    _buttonSlide = Tween(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.6, 0.9, curve: Curves.easeOut)),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _SummaryHeader(),

            // Content
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _cardOpacity.value,
                        child: Transform.scale(
                          scale: _cardScale.value,
                          child: child,
                        ),
                      );
                    },
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 560),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(AppRadius.xxl),
                        border: Border.all(color: AppColors.gray100),
                        boxShadow: AppShadows.sm,
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Success icon
                          AnimatedBuilder(
                            animation: _iconSlide,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _iconSlide.value),
                                child: Opacity(
                                  opacity: _cardOpacity.value.clamp(0, 1),
                                  child: child,
                                ),
                              );
                            },
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    blurRadius: 24,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                LucideIcons.checkCircle,
                                size: 40,
                                color: AppColors.white,
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Heading
                          AnimatedBuilder(
                            animation: _headingSlide,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _headingSlide.value),
                                child: child,
                              );
                            },
                            child: Text(
                              '¡Misión Cumplida!',
                              style: GoogleFonts.nunito(
                                fontSize: 30,
                                fontWeight: FontWeight.w900,
                                color: AppColors.gray800,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Subtitle
                          AnimatedBuilder(
                            animation: _subtitleSlide,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _subtitleSlide.value),
                                child: child,
                              );
                            },
                            child: Text(
                              'Excelente trabajo guiando a los pequeños exploradores en "${widget.workshop.title}".',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.nunito(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.gray500,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Stats grid
                          AnimatedBuilder(
                            animation: _statsSlide,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _statsSlide.value),
                                child: child,
                              );
                            },
                            child: _StatsGrid(
                              points: widget.points,
                              level: widget.level,
                              sceneCount: widget.workshop.scenes.length,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // CTA button
                          AnimatedBuilder(
                            animation: _buttonSlide,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _buttonSlide.value),
                                child: child,
                              );
                            },
                            child: _ContinueButton(onPressed: widget.onContinue),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.gray200)),
        boxShadow: [
          BoxShadow(color: Color(0x0D000000), blurRadius: 6, offset: Offset(0, 1)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.coral,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Center(
              child: Text(
                'SP',
                style: GoogleFonts.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: AppColors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            'StoryPlay',
            style: GoogleFonts.nunito(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppColors.gray800,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({
    required this.points,
    required this.level,
    required this.sceneCount,
  });

  final int points;
  final int level;
  final int sceneCount;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _StatCard(
          icon: LucideIcons.star,
          value: '$points',
          label: 'PUNTOS',
          color: AppColors.gold,
          bgColor: const Color(0x1AFFE66D),
          borderColor: const Color(0x66FFE66D),
        ),
        _StatCard(
          icon: LucideIcons.award,
          value: '$level',
          label: 'NIVEL',
          color: AppColors.coral,
          bgColor: const Color(0x1AFF6B6B),
          borderColor: const Color(0x4DFF6B6B),
        ),
        _StatCard(
          icon: LucideIcons.listVideo,
          value: '$sceneCount',
          label: 'ESCENAS',
          color: AppColors.purple,
          bgColor: const Color(0x1AA29BFE),
          borderColor: const Color(0x4DA29BFE),
        ),
        _StatCard(
          icon: LucideIcons.clock,
          value: '24m',
          label: 'TIEMPO',
          color: AppColors.teal,
          bgColor: const Color(0x1A4ECDC4),
          borderColor: const Color(0x4D4ECDC4),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.bgColor,
    required this.borderColor,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final Color bgColor;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 115,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: borderColor, width: 2),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.nunito(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: color,
              height: 1,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: GoogleFonts.nunito(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
              color: color.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _ContinueButton extends StatefulWidget {
  const _ContinueButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_ContinueButton> createState() => _ContinueButtonState();
}

class _ContinueButtonState extends State<_ContinueButton> {
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
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.primaryDark, width: 2),
          boxShadow: _pressed
              ? []
              : const [BoxShadow(color: AppColors.primaryDarkest, offset: Offset(0, 4))],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Continuar al Feedback',
              style: GoogleFonts.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: AppColors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
