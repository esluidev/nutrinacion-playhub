import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:rive/rive.dart' as rive;
import 'core/theme/app_theme.dart';
import 'core/models/models.dart';
import 'features/login/presentation/login_page.dart';
import 'features/home/presentation/home_page.dart';
import 'features/workshop/presentation/workshop_page.dart';
import 'features/summary/presentation/summary_page.dart';
import 'features/feedback/presentation/feedback_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es');
  await rive.RiveNative.init();
  runApp(const StoryPlayApp());
}

enum AppView { login, home, workshop, summary, feedback }

class StoryPlayApp extends StatefulWidget {
  const StoryPlayApp({super.key});

  @override
  State<StoryPlayApp> createState() => _StoryPlayAppState();
}

class _StoryPlayAppState extends State<StoryPlayApp> {
  AppView _currentView = AppView.login;
  Workshop? _selectedWorkshop;
  int _finalPoints = 0;
  int _finalLevel = 1;

  void _handleLogin() {
    setState(() => _currentView = AppView.home);
  }

  void _handleSelectWorkshop(Workshop workshop) {
    setState(() {
      _selectedWorkshop = workshop;
      _currentView = AppView.workshop;
    });
  }

  void _handleBackToHome() {
    setState(() {
      _selectedWorkshop = null;
      _currentView = AppView.home;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StoryPlay',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: _buildCurrentView(),
    );
  }

  void _handleWorkshopFinish(int points, int level) {
    setState(() {
      _finalPoints = points;
      _finalLevel = level;
      _currentView = AppView.summary;
    });
  }

  void _handleSummaryContinue() {
    setState(() => _currentView = AppView.feedback);
  }

  void _handleFeedbackFinish() {
    setState(() {
      _selectedWorkshop = null;
      _currentView = AppView.home;
    });
  }

  Widget _buildCurrentView() {
    switch (_currentView) {
      case AppView.login:
        return LoginPage(onLogin: _handleLogin);
      case AppView.home:
        return HomePage(onSelectWorkshop: _handleSelectWorkshop);
      case AppView.workshop:
        return WorkshopPage(
          workshop: _selectedWorkshop!,
          onFinish: _handleWorkshopFinish,
          onBack: _handleBackToHome,
        );
      case AppView.summary:
        return SummaryPage(
          workshop: _selectedWorkshop!,
          points: _finalPoints,
          level: _finalLevel,
          onContinue: _handleSummaryContinue,
        );
      case AppView.feedback:
        return FeedbackPage(onFinish: _handleFeedbackFinish);
    }
  }
}
