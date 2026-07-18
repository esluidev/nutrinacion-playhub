import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/models/models.dart';
import '../../../../core/theme/theme.dart';

class SceneListPanel extends StatelessWidget {
  const SceneListPanel({
    super.key,
    required this.scenes,
    required this.currentIndex,
    required this.onSceneSelected,
    required this.onGuideRequested,
  });

  final List<Scene> scenes;
  final int currentIndex;
  final ValueChanged<int> onSceneSelected;
  final ValueChanged<Scene> onGuideRequested;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppRadius.xxl),
        border: Border.all(color: AppColors.gray100),
        boxShadow: AppShadows.sm,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFFFAFAFA),
              border: Border(bottom: BorderSide(color: AppColors.gray100)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.listVideo, size: 24, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  'Escenas del Taller',
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.gray800,
                  ),
                ),
              ],
            ),
          ),

          // Scene list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: scenes.length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (_, index) => _SceneCard(
                scene: scenes[index],
                index: index,
                isActive: currentIndex == index,
                isCompleted: currentIndex > index,
                onTap: () => onSceneSelected(index),
                onGuide: () => onGuideRequested(scenes[index]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SceneCard extends StatelessWidget {
  const _SceneCard({
    required this.scene,
    required this.index,
    required this.isActive,
    required this.isCompleted,
    required this.onTap,
    required this.onGuide,
  });

  final Scene scene;
  final int index;
  final bool isActive;
  final bool isCompleted;
  final VoidCallback onTap;
  final VoidCallback onGuide;

  Color get _bgColor {
    if (isActive) return const Color(0xFFE6F7F5); // light teal
    if (isCompleted) return const Color(0xFFF0FDF4); // light green
    return AppColors.surface;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: number + title + description
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Number badge
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: (isActive || isCompleted)
                      ? AppColors.primary
                      : const Color(0xFFE2E8F0),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(LucideIcons.check, size: 18, color: AppColors.white)
                      : Text(
                          '${index + 1}',
                          style: GoogleFonts.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: (isActive || isCompleted)
                                ? AppColors.white
                                : const Color(0xFF64748B),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),

              // Title + description
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 2),
                    Text(
                      scene.title,
                      style: GoogleFonts.nunito(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: isActive ? AppColors.primary : const Color(0xFF1E293B),
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      scene.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Bottom row: badge + buttons
          Container(
            padding: const EdgeInsets.only(top: 12),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: Color(0x80CBD5E1)),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Game type badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0x1AFF6B6B),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0x4DFF6B6B)),
                  ),
                  child: Text(
                    scene.gameType.label.toUpperCase(),
                    style: GoogleFonts.nunito(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                      color: AppColors.coral,
                    ),
                  ),
                ),

                // Action buttons
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _SceneActionButton(
                      icon: LucideIcons.bookOpen,
                      color: AppColors.teal,
                      onTap: onGuide,
                    ),
                    if (!isActive) ...[
                      const SizedBox(width: 8),
                      _SceneActionButton(
                        icon: LucideIcons.play,
                        color: AppColors.primary,
                        onTap: onTap,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SceneActionButton extends StatefulWidget {
  const _SceneActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  State<_SceneActionButton> createState() => _SceneActionButtonState();
}

class _SceneActionButtonState extends State<_SceneActionButton> {
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
        transform: Matrix4.translationValues(0, _pressed ? 4 : 0, 0),
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
          boxShadow: _pressed
              ? []
              : const [BoxShadow(color: Color(0xFFE2E8F0), offset: Offset(0, 4))],
        ),
        child: Icon(widget.icon, size: 16, color: widget.color),
      ),
    );
  }
}
