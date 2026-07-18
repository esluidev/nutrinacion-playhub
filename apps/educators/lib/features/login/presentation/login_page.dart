import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/theme.dart';
import '../../../core/widgets/widgets.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, this.onLogin});

  final VoidCallback? onLogin;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController(text: 'demo@storyplay.com');
  final _passwordController = TextEditingController(text: 'password');

  late final AnimationController _animController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.06), // ~20px slide up relative
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    widget.onLogin?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: SingleChildScrollView(
          // React: p-4 = 16px
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: SlideTransition(
            position: _slideAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                width: double.infinity,
                // React: max-w-md ≈ 448px
                constraints: const BoxConstraints(maxWidth: 448),
                // React: p-8 = 32px
                padding: const EdgeInsets.all(AppSpacing.xxl),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  // React: rounded-3xl = 24px
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  // React: border border-gray-100
                  border: Border.all(color: AppColors.gray100),
                  // React: shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                  boxShadow: AppShadows.cardSubtle,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // ─── Logo + Title ────────────────────────────
                    // React: mb-8 = 32px for the whole logo section
                    _buildLogo(),
                    // React: mb-4 on logo box (handled inside _buildLogo)
                    const SizedBox(height: AppSpacing.lg), // 16px before title
                    // React: text-3xl font-black text-gray-800 tracking-tight
                    Text('StoryPlay', style: AppTypography.heading1),
                    const SizedBox(height: 4),
                    // React: text-gray-400 font-bold mt-1
                    Text(
                      'Nutrición divertida',
                      style: AppTypography.body.copyWith(
                        color: AppColors.gray400,
                      ),
                    ),
                    // React: mb-8 = 32px after title section
                    const SizedBox(height: AppSpacing.xxl),

                    // ─── Form ────────────────────────────────────
                    // React: space-y-5 = 20px between form groups
                    SpTextField(
                      controller: _emailController,
                      label: 'Correo Electrónico',
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: Icon(
                        LucideIcons.mail,
                        size: 18,
                        color: AppColors.gray400,
                      ),
                    ),
                    const SizedBox(height: 20), // space-y-5 = 1.25rem = 20px
                    SpTextField(
                      controller: _passwordController,
                      label: 'Contraseña',
                      obscureText: true,
                      prefixIcon: Icon(
                        LucideIcons.lock,
                        size: 18,
                        color: AppColors.gray400,
                      ),
                    ),
                    // React: mt-4 = 16px before button
                    const SizedBox(height: AppSpacing.lg),

                    // ─── Submit ──────────────────────────────────
                    // React: py-4 = 16px vertical padding
                    SpButton(
                      label: 'Entrar Ahora',
                      onPressed: _handleLogin,
                      isFullWidth: true,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16, // py-4 = 16px
                      ),
                    ),

                    // React: mt-8 = 32px
                    const SizedBox(height: AppSpacing.xxl),

                    // ─── Footer ──────────────────────────────────
                    // React: text-xs font-bold text-gray-400 tracking-widest uppercase
                    Text('ACCESO DOCENTE', style: AppTypography.caption),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    // React: w-20 h-20 bg-[#ff6b6b] rounded-2xl shadow-lg shadow-red-200
    return Container(
      width: 80, // w-20 = 5rem = 80px
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.coral,
        borderRadius: BorderRadius.circular(AppRadius.lg), // rounded-2xl = 16px
        boxShadow: const [
          BoxShadow(
            color: Color(0x40FF6B6B), // shadow-red-200 with shadow-lg opacity
            blurRadius: 15,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        // React: w-8 h-10 bg-[#f8f9fa] rounded-full shadow-inner
        child: Container(
          width: 32, // w-8 = 2rem = 32px
          height: 40, // h-10 = 2.5rem = 40px
          decoration: const BoxDecoration(
            color: Color(0xFFF8F9FA), // bg-[#f8f9fa]
            shape: BoxShape.rectangle,
            borderRadius: BorderRadius.all(
              Radius.circular(100),
            ), // rounded-full
          ),
        ),
      ),
    );
  }
}
