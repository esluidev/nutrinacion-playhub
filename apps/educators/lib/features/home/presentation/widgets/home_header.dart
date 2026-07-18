import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/theme.dart';

class HomeHeader extends StatefulWidget {
  const HomeHeader({super.key, this.onLogout});

  final VoidCallback? onLogout;

  @override
  State<HomeHeader> createState() => _HomeHeaderState();
}

class _HomeHeaderState extends State<HomeHeader> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.gray200)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 6,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Logo + title
          _buildLogo(),
          const SizedBox(width: 12),
          Text(
            'StoryPlay',
            style: GoogleFonts.nunito(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppColors.gray800,
            ),
          ),

          const Spacer(),

          // User menu
          _buildUserMenuButton(),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.coral,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Center(
        child: Text(
          'SP',
          style: GoogleFonts.nunito(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: AppColors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildUserMenuButton() {
    return PopupMenuButton<String>(
      offset: const Offset(0, 48),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        side: const BorderSide(color: AppColors.gray100),
      ),
      elevation: 8,
      onSelected: (value) {
        if (value == 'logout') widget.onLogout?.call();
      },
      itemBuilder: (context) => [
        _buildMenuItem(LucideIcons.user, 'Mi Perfil', 'profile'),
        _buildMenuItem(LucideIcons.settings, 'Configuración', 'settings'),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'logout',
          child: Row(
            children: [
              const Icon(LucideIcons.logOut, size: 18, color: Color(0xFFF87171)),
              const SizedBox(width: 12),
              Text(
                'Cerrar Sesión',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFDC2626),
                ),
              ),
            ],
          ),
        ),
      ],
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Hola, Docente',
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray800,
                  ),
                ),
                Text(
                  'Aula 4B',
                  style: GoogleFonts.nunito(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7), // green-100
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFFBBF7D0), // green-200
                  width: 2,
                ),
              ),
              child: Center(
                child: Text(
                  'D',
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  PopupMenuItem<String> _buildMenuItem(
    IconData icon,
    String label,
    String value,
  ) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.gray400),
          const SizedBox(width: 12),
          Text(
            label,
            style: GoogleFonts.nunito(
              fontWeight: FontWeight.w700,
              color: AppColors.gray700,
            ),
          ),
        ],
      ),
    );
  }
}
