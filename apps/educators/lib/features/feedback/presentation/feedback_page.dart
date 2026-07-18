import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/theme.dart';

class FeedbackPage extends StatefulWidget {
  const FeedbackPage({
    super.key,
    required this.onFinish,
  });

  final VoidCallback onFinish;

  @override
  State<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends State<FeedbackPage> {
  int _rating = 0;
  final _kidsController = TextEditingController(text: '25');
  String _participation = '';
  final _commentsController = TextEditingController();

  @override
  void dispose() {
    _kidsController.dispose();
    _commentsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _AppHeader(),

            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 480),
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(AppRadius.xxl),
                      border: Border.all(color: AppColors.gray100),
                      boxShadow: AppShadows.sm,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Feedback del Taller',
                                style: GoogleFonts.nunito(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.gray800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Ayúdanos a mejorar la experiencia',
                                style: GoogleFonts.nunito(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.gray500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Star rating
                        _SectionLabel(label: 'CALIFICACIÓN GENERAL'),
                        const SizedBox(height: 8),
                        _StarRating(
                          rating: _rating,
                          onChanged: (v) => setState(() => _rating = v),
                        ),
                        const SizedBox(height: 20),

                        // Kids count
                        _SectionLabel(label: 'CANTIDAD DE NIÑOS'),
                        const SizedBox(height: 8),
                        _NumberField(controller: _kidsController),
                        const SizedBox(height: 20),

                        // Participation level
                        _SectionLabel(label: 'NIVEL DE PARTICIPACIÓN'),
                        const SizedBox(height: 8),
                        _ParticipationSelector(
                          selected: _participation,
                          onChanged: (v) => setState(() => _participation = v),
                        ),
                        const SizedBox(height: 20),

                        // Comments
                        _SectionLabel(label: 'COMENTARIOS ADICIONALES'),
                        const SizedBox(height: 8),
                        _CommentsField(controller: _commentsController),
                        const SizedBox(height: 24),

                        // Submit button
                        _SubmitButton(onPressed: widget.onFinish),
                      ],
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

class _AppHeader extends StatelessWidget {
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

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: GoogleFonts.nunito(
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
        color: AppColors.gray400,
      ),
    );
  }
}

class _StarRating extends StatelessWidget {
  const _StarRating({required this.rating, required this.onChanged});
  final int rating;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(5, (i) {
        final filled = i < rating;
        return GestureDetector(
          onTap: () => onChanged(i + 1),
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: AnimatedScale(
              scale: filled ? 1.1 : 1.0,
              duration: const Duration(milliseconds: 150),
              child: Icon(
                filled ? LucideIcons.star : LucideIcons.star,
                size: 30,
                color: filled ? const Color(0xFFFBBF24) : AppColors.gray200,
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _NumberField extends StatelessWidget {
  const _NumberField({required this.controller});
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      style: GoogleFonts.nunito(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.gray700,
      ),
      decoration: InputDecoration(
        prefixIcon: const Icon(LucideIcons.users, size: 20, color: AppColors.gray400),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
    );
  }
}

class _ParticipationSelector extends StatelessWidget {
  const _ParticipationSelector({
    required this.selected,
    required this.onChanged,
  });

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ParticipationButton(
            label: 'bajo',
            emoji: '\u{1F634}',
            isSelected: selected == 'bajo',
            onTap: () => onChanged('bajo'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ParticipationButton(
            label: 'medio',
            emoji: '\u{1F610}',
            isSelected: selected == 'medio',
            onTap: () => onChanged('medio'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ParticipationButton(
            label: 'alto',
            emoji: '\u{1F929}',
            isSelected: selected == 'alto',
            onTap: () => onChanged('alto'),
          ),
        ),
      ],
    );
  }
}

class _ParticipationButton extends StatefulWidget {
  const _ParticipationButton({
    required this.label,
    required this.emoji,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final String emoji;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  State<_ParticipationButton> createState() => _ParticipationButtonState();
}

class _ParticipationButtonState extends State<_ParticipationButton> {
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
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: widget.isSelected ? AppColors.primaryLight : AppColors.white,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: widget.isSelected ? AppColors.primary : AppColors.gray200,
            width: 2,
          ),
          boxShadow: _pressed
              ? []
              : [
                  BoxShadow(
                    color: widget.isSelected
                        ? AppColors.primaryDarkest
                        : AppColors.gray200,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          children: [
            Text(widget.emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(
              widget.label,
              style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: widget.isSelected ? AppColors.primary : AppColors.gray500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CommentsField extends StatelessWidget {
  const _CommentsField({required this.controller});
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: 4,
      style: GoogleFonts.nunito(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.gray700,
      ),
      decoration: InputDecoration(
        hintText: '¿Qué fue lo que más les gustó?',
        hintStyle: GoogleFonts.nunito(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.gray400,
        ),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.gray200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.all(14),
      ),
    );
  }
}

class _SubmitButton extends StatefulWidget {
  const _SubmitButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_SubmitButton> createState() => _SubmitButtonState();
}

class _SubmitButtonState extends State<_SubmitButton> {
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
        child: Center(
          child: Text(
            'Finalizar Taller',
            style: GoogleFonts.nunito(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppColors.white,
            ),
          ),
        ),
      ),
    );
  }
}
