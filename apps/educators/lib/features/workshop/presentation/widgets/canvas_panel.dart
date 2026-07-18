import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:rive/rive.dart' as rive;
import '../../../../core/models/models.dart';
import '../../../../core/theme/theme.dart';

class CanvasPanel extends StatelessWidget {
  const CanvasPanel({
    super.key,
    required this.workshop,
    required this.currentSceneIndex,
    required this.resetKey,
    required this.onPrev,
    required this.onNext,
    required this.onReset,
  });

  final Workshop workshop;
  final int currentSceneIndex;
  final int resetKey;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onReset;

  bool get _isFirst => currentSceneIndex == 0;
  bool get _isLast => currentSceneIndex == workshop.scenes.length - 1;

  @override
  Widget build(BuildContext context) {
    final scene = workshop.scenes[currentSceneIndex];

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
          // Canvas area — switches content based on scene riveAsset
          Expanded(
            child: scene.riveAsset != null
                ? Stack(
                    children: [
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Color(0xFFEFF6FF), Color(0xFFEEF2FF)],
                          ),
                        ),
                      ),
                      Positioned.fill(
                        child: _RiveCanvas(
                          key: ValueKey('$currentSceneIndex-$resetKey'),
                          assetPath: scene.riveAsset!,
                        ),
                      ),
                    ],
                  )
                : _EmptyCanvas(sceneName: scene.title),
          ),

          // Bottom control bar
          _ControlBar(
            isFirst: _isFirst,
            isLast: _isLast,
            onPrev: onPrev,
            onNext: onNext,
            onReset: onReset,
          ),
        ],
      ),
    );
  }
}

class _RiveCanvas extends StatefulWidget {
  const _RiveCanvas({super.key, required this.assetPath});

  final String assetPath;

  @override
  State<_RiveCanvas> createState() => _RiveCanvasState();
}

class _RiveCanvasState extends State<_RiveCanvas> {
  late final rive.FileLoader _fileLoader;

  @override
  void initState() {
    super.initState();
    _fileLoader = rive.FileLoader.fromAsset(
      widget.assetPath,
      riveFactory: rive.Factory.rive,
    );
  }

  @override
  void dispose() {
    _fileLoader.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return rive.RiveWidgetBuilder(
      fileLoader: _fileLoader,
      builder: (context, state) => switch (state) {
        rive.RiveLoading() => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        rive.RiveFailed() => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.gray400),
              const SizedBox(height: 12),
              Text(
                'No se pudo cargar la animación',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: AppColors.gray500,
                ),
              ),
            ],
          ),
        ),
        rive.RiveLoaded() => rive.RiveWidget(
          controller: state.controller,
          fit: rive.Fit.cover,
          alignment: Alignment.center,
        ),
      },
    );
  }
}

class _EmptyCanvas extends StatelessWidget {
  const _EmptyCanvas({required this.sceneName});

  final String sceneName;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFEFF6FF), Color(0xFFEEF2FF)],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.playCircle, size: 48, color: AppColors.gray300),
            const SizedBox(height: 12),
            Text(
              sceneName,
              style: GoogleFonts.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.gray400,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Animación no disponible',
              style: GoogleFonts.nunito(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.gray300,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ControlBar extends StatelessWidget {
  const _ControlBar({
    required this.isFirst,
    required this.isLast,
    required this.onPrev,
    required this.onNext,
    required this.onReset,
  });

  final bool isFirst;
  final bool isLast;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.gray100)),
      ),
      child: Row(
        children: [
          _ControlButton(
            label: 'Anterior',
            enabled: !isFirst,
            onPressed: onPrev,
          ),
          const SizedBox(width: 12),
          _IconOnlyButton(icon: LucideIcons.rotateCcw, onPressed: onReset),
          const Spacer(),
          _ControlButton(
            label: isLast ? 'Finalizar' : 'Siguiente',
            isPrimary: true,
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatefulWidget {
  const _ControlButton({
    required this.label,
    this.isPrimary = false,
    this.enabled = true,
    required this.onPressed,
  });

  final String label;
  final bool isPrimary;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  State<_ControlButton> createState() => _ControlButtonState();
}

class _ControlButtonState extends State<_ControlButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final effectivePressed = _pressed && widget.enabled;

    final bgColor = widget.isPrimary ? AppColors.primary : AppColors.white;
    final borderColor = widget.isPrimary ? AppColors.primaryDark : AppColors.gray200;
    final shadowColor = widget.isPrimary ? AppColors.primaryDarkest : AppColors.gray200;
    final textColor = widget.isPrimary ? AppColors.white : AppColors.gray500;

    return GestureDetector(
      onTapDown: widget.enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: widget.enabled
          ? (_) {
              setState(() => _pressed = false);
              widget.onPressed();
            }
          : null,
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        transform: Matrix4.translationValues(0, effectivePressed ? 4 : 0, 0),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: borderColor, width: 2),
          boxShadow: effectivePressed
              ? []
              : [BoxShadow(color: shadowColor, offset: const Offset(0, 4))],
        ),
        child: Opacity(
          opacity: widget.enabled ? 1.0 : 0.5,
          child: Text(
            widget.label,
            style: GoogleFonts.nunito(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }
}

class _IconOnlyButton extends StatefulWidget {
  const _IconOnlyButton({required this.icon, required this.onPressed});
  final IconData icon;
  final VoidCallback onPressed;

  @override
  State<_IconOnlyButton> createState() => _IconOnlyButtonState();
}

class _IconOnlyButtonState extends State<_IconOnlyButton> {
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
        width: 48,
        height: 48,
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
