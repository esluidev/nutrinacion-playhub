import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/theme.dart';

class ProgressPanel extends StatelessWidget {
  const ProgressPanel({
    super.key,
    required this.points,
    required this.level,
    required this.currentSceneIndex,
    required this.totalScenes,
  });

  final int points;
  final int level;
  final int currentSceneIndex;
  final int totalScenes;

  double get _progress => (currentSceneIndex + 1) / totalScenes;

  String get _feedbackText {
    if (currentSceneIndex == 0) return '¡Comenzamos!';
    if (currentSceneIndex == totalScenes - 1) return '¡Casi listos!';
    return '¡Muy bien!';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppRadius.xxl),
        border: Border.all(color: AppColors.gray100),
        boxShadow: AppShadows.sm,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Gamification stats bar
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0x1AFFB800),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: const Color(0x4DFFB800), width: 2),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.star, size: 24, color: AppColors.gold),
                const SizedBox(width: 6),
                Text(
                  '$points',
                  style: GoogleFonts.nunito(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.gold,
                  ),
                ),
                Container(
                  width: 4,
                  height: 24,
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0x4DFFB800),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Icon(LucideIcons.award, size: 24, color: AppColors.coral),
                const SizedBox(width: 6),
                Text(
                  'Nivel $level',
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.coral,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Circular progress
          SizedBox(
            width: 136,
            height: 136,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CustomPaint(
                  size: const Size(136, 136),
                  painter: _CircularProgressPainter(
                    progress: _progress,
                    trackColor: AppColors.gray100,
                    progressColor: AppColors.coral,
                    strokeWidth: 14,
                  ),
                ),
                Icon(LucideIcons.rocket, size: 42, color: AppColors.coral),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Feedback badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0x1AFF6B6B),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${(_progress * 100).round()}%',
                  style: GoogleFonts.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.coral,
                  ),
                ),
                Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: const BoxDecoration(
                    color: Color(0x66FF6B6B),
                    shape: BoxShape.circle,
                  ),
                ),
                Text(
                  _feedbackText,
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.coral,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CircularProgressPainter extends CustomPainter {
  _CircularProgressPainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  final double progress;
  final Color trackColor;
  final Color progressColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_CircularProgressPainter oldDelegate) =>
      progress != oldDelegate.progress;
}
