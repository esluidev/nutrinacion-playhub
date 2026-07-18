import 'package:flutter_test/flutter_test.dart';
import 'package:nutrinacion_storyplay_flutter/main.dart';

void main() {
  testWidgets('Login page renders', (WidgetTester tester) async {
    await tester.pumpWidget(const StoryPlayApp());
    expect(find.text('StoryPlay'), findsOneWidget);
    expect(find.text('Entrar a Jugar'), findsOneWidget);
  });
}
