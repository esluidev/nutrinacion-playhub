import 'package:flutter/material.dart';
import '../../../core/models/models.dart';
import 'widgets/workshop_header.dart';
import 'widgets/scene_list_panel.dart';
import 'widgets/canvas_panel.dart';
import 'widgets/progress_panel.dart';
import 'widgets/nutribot_panel.dart';
import 'widgets/game_hud_panel.dart';
import 'widgets/reward_modal.dart';
import 'widgets/guide_modal.dart';

class WorkshopPage extends StatefulWidget {
  const WorkshopPage({
    super.key,
    required this.workshop,
    required this.onFinish,
    required this.onBack,
  });

  final Workshop workshop;
  final void Function(int points, int level) onFinish;
  final VoidCallback onBack;

  @override
  State<WorkshopPage> createState() => _WorkshopPageState();
}

class _WorkshopPageState extends State<WorkshopPage> {
  /// Progress tracker — only modified by next/prev/reward.
  int _progressIndex = 0;
  /// Which scene is displayed in the canvas — modified by play button too.
  int _viewingIndex = 0;
  int _resetKey = 0;
  bool _isPresentationMode = false;
  int _points = 0;
  int _level = 1;
  bool _showRewardModal = false;
  bool _leveledUp = false;
  Scene? _selectedGuide;

  Scene get _currentScene => widget.workshop.scenes[_viewingIndex];

  void _handleNext() {
    final isLast =
        _progressIndex == widget.workshop.scenes.length - 1;
    if (isLast) {
      widget.onFinish(_points, _level);
    } else {
      final scenesCompleted = _progressIndex + 1;
      final willLevelUp = scenesCompleted % 2 == 0;

      setState(() {
        _leveledUp = willLevelUp;
        _showRewardModal = true;
      });
    }
  }

  void _handleAcceptReward() {
    setState(() {
      _showRewardModal = false;
      _points += 50;
      if (_leveledUp) _level++;
      _progressIndex++;
      _viewingIndex = _progressIndex;
    });
  }

  void _handlePrev() {
    if (_progressIndex > 0) {
      setState(() {
        _progressIndex--;
        _viewingIndex = _progressIndex;
      });
    }
  }

  void _handleReset() {
    setState(() => _resetKey++);
  }

  /// Play button — only changes which scene is shown, not progress.
  void _handleSceneSelected(int index) {
    setState(() => _viewingIndex = index);
  }

  void _handleGuideRequested(Scene scene) {
    setState(() => _selectedGuide = scene);
  }

  void _handleModeChanged(bool presentation) {
    setState(() => _isPresentationMode = presentation);
  }

  /// Right panel adapts to screen size.
  double _rightPanelWidth(double screenWidth) {
    if (screenWidth < 1024) return 250;
    if (screenWidth < 1200) return 260;
    if (screenWidth < 1400) return 280;
    return 300;
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final rightWidth = _rightPanelWidth(screenWidth);
    const leftWidth = 280.0;
    const gap = 16.0;
    const duration = Duration(milliseconds: 350);
    const curve = Curves.easeInOut;

    final hudWidth = screenWidth < 1200 ? 240.0 : 270.0;
    const hudGap = 10.0;

    // In reading mode, canvas is inset by both panels + gaps.
    // In game mode, canvas is inset only by the HUD panel on the right.
    final leftTotal = leftWidth + gap;
    final rightTotal = rightWidth + gap;
    final hudTotal = hudWidth + hudGap;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7F6),
      body: SafeArea(
        child: Stack(
          children: [
            // Main layout
            Column(
              children: [
                // Header — hidden in presentation mode
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  child: _isPresentationMode
                      ? const SizedBox.shrink()
                      : WorkshopHeader(
                          title: widget.workshop.title,
                          sceneCount: widget.workshop.scenes.length,
                          onBack: widget.onBack,
                          onModeChanged: _handleModeChanged,
                          isPresentationMode: _isPresentationMode,
                        ),
                ),

                // Workspace — uses animated paddings so the canvas
                // smoothly grows/shrinks while panels slide in/out.
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(gap),
                    child: Stack(
                      children: [
                        // Center panel: Canvas — animated margins
                        AnimatedPositioned(
                          duration: duration,
                          curve: curve,
                          top: 0,
                          bottom: 0,
                          left: _isPresentationMode ? 0 : leftTotal,
                          right: _isPresentationMode ? hudTotal : rightTotal,
                          child: CanvasPanel(
                            workshop: widget.workshop,
                            currentSceneIndex: _viewingIndex,
                            resetKey: _resetKey,
                            onPrev: _handlePrev,
                            onNext: _handleNext,
                            onReset: _handleReset,
                          ),
                        ),

                        // Left panel — slides off to the left
                        AnimatedPositioned(
                          duration: duration,
                          curve: curve,
                          top: 0,
                          bottom: 0,
                          left: _isPresentationMode ? -leftWidth : 0,
                          width: leftWidth,
                          child: AnimatedOpacity(
                            duration: duration,
                            opacity: _isPresentationMode ? 0 : 1,
                            child: SceneListPanel(
                              scenes: widget.workshop.scenes,
                              currentIndex: _viewingIndex,
                              onSceneSelected: _handleSceneSelected,
                              onGuideRequested: _handleGuideRequested,
                            ),
                          ),
                        ),

                        // Right panel (reading mode) — slides off to the right
                        AnimatedPositioned(
                          duration: duration,
                          curve: curve,
                          top: 0,
                          bottom: 0,
                          right: _isPresentationMode ? -rightWidth : 0,
                          width: rightWidth,
                          child: AnimatedOpacity(
                            duration: duration,
                            opacity: _isPresentationMode ? 0 : 1,
                            child: Column(
                              children: [
                                ProgressPanel(
                                  points: _points,
                                  level: _level,
                                  currentSceneIndex: _progressIndex,
                                  totalScenes:
                                      widget.workshop.scenes.length,
                                ),
                                const SizedBox(height: 8),
                                Expanded(
                                  child: NutriBotPanel(
                                    currentContext: _currentScene.title,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Game HUD panel — slides in from right in game mode
                        AnimatedPositioned(
                          duration: duration,
                          curve: curve,
                          top: 0,
                          bottom: 0,
                          right: _isPresentationMode ? 0 : -hudWidth,
                          width: hudWidth,
                          child: AnimatedOpacity(
                            duration: duration,
                            opacity: _isPresentationMode ? 1 : 0,
                            child: GameHudPanel(
                              points: _points,
                              level: _level,
                              progress: (_progressIndex + 1) /
                                  widget.workshop.scenes.length,
                              currentScene: _progressIndex + 1,
                              totalScenes: widget.workshop.scenes.length,
                              onModeChanged: _handleModeChanged,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Reward modal overlay
            if (_showRewardModal)
              RewardModal(
                leveledUp: _leveledUp,
                currentLevel: _level,
                onAccept: _handleAcceptReward,
              ),

            // Guide modal overlay
            if (_selectedGuide != null)
              GuideModal(
                scene: _selectedGuide!,
                onClose: () => setState(() => _selectedGuide = null),
              ),
          ],
        ),
      ),
    );
  }
}
