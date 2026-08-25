import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/app/app_theme.dart';
import 'package:followupbusiness/shared/ui/design_system.dart';

void main() {
  Widget app(Widget child) => MaterialApp(
      theme: buildAppTheme(), home: Scaffold(body: Center(child: child)));
  testWidgets('FubButton comunica carga y no ejecuta la acción',
      (tester) async {
    var calls = 0;
    await tester.pumpWidget(app(
        FubButton(label: 'Guardar', loading: true, onPressed: () => calls++)));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.tap(find.byType(ElevatedButton));
    expect(calls, 0);
  });
  testWidgets('FubAlert expone texto e ícono además del color', (tester) async {
    await tester.pumpWidget(app(const FubAlert(
        title: 'Error', message: 'No se pudo guardar.', tone: FubTone.error)));
    expect(find.byIcon(Icons.error_outline), findsOneWidget);
    expect(tester.getSemantics(find.byType(FubAlert)).label,
        contains('No se pudo guardar'));
  });
  testWidgets('FubStaleDataState conserva la fecha visible', (tester) async {
    await tester.pumpWidget(app(const FubStaleDataState(
        title: 'Dato desactualizado',
        message: 'Actualiza para continuar.',
        lastUpdated: 'Última actualización: 09:20')));
    expect(find.text('Última actualización: 09:20'), findsOneWidget);
  });
}
