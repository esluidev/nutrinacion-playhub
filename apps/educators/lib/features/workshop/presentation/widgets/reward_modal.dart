import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/theme.dart';

class RewardModal extends StatelessWidget {
  const RewardModal({
    super.key,
    required this.leveledUp,
    required this.currentLevel,
    required this.onAccept,
  });

  final bool leveledUp;
  final int currentLevel;
  final VoidCallback onAccept;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        color: const Color(0x99111827), // gray-900/60
        child: Center(
          child: Container(
            margin: const EdgeInsets.all(16),
            constraints: const BoxConstraints(maxWidth: 448),
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: AppColors.white, width: 4),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x40000000),
                  blurRadius: 40,
                  offset: Offset(0, 16),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Icon circle
                Container(
                  width: 128,
                  height: 128,
                  decoration: BoxDecoration(
                    color: leveledUp
                        ? const Color(0x1AFF6B6B) // coral/10
                        : const Color(0x1AFFB800), // gold/10
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: leveledUp
                          ? const Color(0x4DFF6B6B) // coral/30
                          : const Color(0x4DFFB800), // gold/30
                      width: 4,
                    ),
                  ),
                  child: Icon(
                    leveledUp ? LucideIcons.award : LucideIcons.star,
                    size: 64,
                    color: leveledUp ? AppColors.coral : AppColors.gold,
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  leveledUp ? '¡Subiste de Nivel!' : '¡Gran Trabajo!',
                  style: GoogleFonts.nunito(
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    color: AppColors.gray800,
                  ),
                ),
                const SizedBox(height: 8),

                // Subtitle
                Text(
                  leveledUp
                      ? '¡Has alcanzado el Nivel ${currentLevel + 1}!'
                      : '¡Sigue así, lo estás haciendo genial!',
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray500,
                  ),
                ),
                const SizedBox(height: 32),

                // Reward badges
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Points badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0x1AFFB800),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: const Color(0x4DFFB800), width: 2),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.star, size: 24, color: AppColors.gold),
                          const SizedBox(width: 12),
                          Text(
                            '+50',
                            style: GoogleFonts.nunito(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: AppColors.gold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Level up badge
                    if (leveledUp) ...[
                      const SizedBox(width: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0x1AFF6B6B),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                              color: const Color(0x4DFF6B6B), width: 2),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.award,
                                size: 24, color: AppColors.coral),
                            const SizedBox(width: 12),
                            Text(
                              'Nivel ${currentLevel + 1}',
                              style: GoogleFonts.nunito(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: AppColors.coral,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 32),

                // Accept button
                _AcceptButton(onPressed: onAccept),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AcceptButton extends StatefulWidget {
  const _AcceptButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_AcceptButton> createState() => _AcceptButtonState();
}

class _AcceptButtonState extends State<_AcceptButton> {
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
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primaryDark, width: 2),
          boxShadow: _pressed
              ? []
              : const [
                  BoxShadow(
                      color: AppColors.primaryDarkest, offset: Offset(0, 4))
                ],
        ),
        child: Center(
          child: Text(
            'Aceptar',
            style: GoogleFonts.nunito(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppColors.white,
            ),
          ),
        ),
      ),
    );
  }
}
