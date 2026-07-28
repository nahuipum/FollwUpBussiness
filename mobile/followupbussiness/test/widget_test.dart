import 'package:flutter_test/flutter_test.dart';
import 'package:followupbussiness/app/follow_up_bussiness_app.dart';

void main() {
  testWidgets('renders the application root', (WidgetTester tester) async {
    await tester.pumpWidget(const FollowUpBussinessApp());

    expect(find.text('Follow Up Bussiness'), findsOneWidget);
  });
}
