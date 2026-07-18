import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/theme.dart';

class NutriBotPanel extends StatefulWidget {
  const NutriBotPanel({super.key, required this.currentContext});

  final String currentContext;

  @override
  State<NutriBotPanel> createState() => _NutriBotPanelState();
}

class _NutriBotPanelState extends State<NutriBotPanel> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];

  @override
  void initState() {
    super.initState();
    _messages.add(_ChatMessage(
      role: _Role.bot,
      text: '¡Hola! Soy NutriBot 🤖. ¿Tienen alguna pregunta sobre "${widget.currentContext}"?',
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(_ChatMessage(role: _Role.user, text: text));
      _controller.clear();
    });

    // Simulate bot response (placeholder — no Gemini integration yet)
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        _messages.add(_ChatMessage(
          role: _Role.bot,
          text: '¡Excelente pregunta! Déjame pensar... 🤔',
        ));
      });
      _scrollToBottom();
    });

    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

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
              gradient: LinearGradient(
                colors: [AppColors.purple, AppColors.purpleDark],
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: const Icon(LucideIcons.messageCircle, size: 24, color: AppColors.white),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'NutriBot',
                      style: GoogleFonts.nunito(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.white,
                        height: 1,
                      ),
                    ),
                    Text(
                      'Asistente de clase',
                      style: GoogleFonts.nunito(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFE0DDFF),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Messages
          Expanded(
            child: Container(
              color: AppColors.surface,
              child: ListView.separated(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (_, index) => _MessageBubble(message: _messages[index]),
              ),
            ),
          ),

          // Input bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: const BoxDecoration(
              color: AppColors.white,
              border: Border(top: BorderSide(color: AppColors.gray100)),
            ),
            child: Row(
              children: [
                // Mic button
                _MicButton(),
                const SizedBox(width: 6),

                // Text input — fills all remaining horizontal space
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onSubmitted: (_) => _handleSend(),
                    style: GoogleFonts.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.gray700,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Pregunta a NutriBot...',
                      hintStyle: GoogleFonts.nunito(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gray400,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFFAFAFA),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                        borderSide: BorderSide(color: AppColors.gray200),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                        borderSide: BorderSide(color: AppColors.gray200),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                        borderSide: BorderSide(color: AppColors.purple),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 8),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 6),

                // Send button
                _SendButton(onPressed: _handleSend),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum _Role { user, bot }

class _ChatMessage {
  final _Role role;
  final String text;
  const _ChatMessage({required this.role, required this.text});
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});
  final _ChatMessage message;

  bool get _isUser => message.role == _Role.user;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: _isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.18),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _isUser ? AppColors.purple : AppColors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(_isUser ? 16 : 4),
            bottomRight: Radius.circular(_isUser ? 4 : 16),
          ),
          border: _isUser ? null : Border.all(color: AppColors.gray100),
          boxShadow: AppShadows.sm,
        ),
        child: Text(
          message.text,
          style: GoogleFonts.nunito(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: _isUser ? AppColors.white : AppColors.gray700,
          ),
        ),
      ),
    );
  }
}

class _MicButton extends StatefulWidget {
  @override
  State<_MicButton> createState() => _MicButtonState();
}

class _MicButtonState extends State<_MicButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        transform: Matrix4.translationValues(0, _pressed ? 3 : 0, 0),
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(color: AppColors.gray200, width: 2),
          boxShadow: _pressed
              ? []
              : const [BoxShadow(color: AppColors.gray200, offset: Offset(0, 3))],
        ),
        child: const Icon(LucideIcons.mic, size: 16, color: AppColors.gray400),
      ),
    );
  }
}

class _SendButton extends StatefulWidget {
  const _SendButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_SendButton> createState() => _SendButtonState();
}

class _SendButtonState extends State<_SendButton> {
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
        transform: Matrix4.translationValues(0, _pressed ? 3 : 0, 0),
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: AppColors.purple,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(color: AppColors.purpleDark, width: 2),
          boxShadow: _pressed
              ? []
              : const [BoxShadow(color: AppColors.purpleDark, offset: Offset(0, 3))],
        ),
        child: const Icon(LucideIcons.send, size: 15, color: AppColors.white),
      ),
    );
  }
}
