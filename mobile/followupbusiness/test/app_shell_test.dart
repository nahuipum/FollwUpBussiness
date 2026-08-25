import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/app/app_theme.dart';
import 'package:followupbusiness/features/app_shell/app_shell.dart';
import 'package:followupbusiness/features/app_shell/root_destination_page.dart';
import 'package:followupbusiness/features/app_shell/widgets/fub_bottom_nav_bar.dart';
import 'package:followupbusiness/shared/ui/design_system.dart';

void main() {
  Widget app({RootVisualState state = RootVisualState.standard}) => MaterialApp(
      theme: buildAppTheme(),
      restorationScopeId: 'test',
      home: AppShell(visualState: state));

  testWidgets('navega entre los cuatro destinos raíz autenticados',
      (tester) async {
    await tester.pumpWidget(app());
    expect(find.byType(FubBottomNavBar), findsOneWidget);
    await tester.tap(find.byKey(const Key('bottom-nav-route')));
    await tester.pumpAndSettle();
    expect(find.text('Ruta del día'), findsOneWidget);
    await tester.tap(find.byKey(const Key('bottom-nav-activity')));
    await tester.pumpAndSettle();
    expect(find.text('Aún no hay actividad'), findsOneWidget);
    await tester.tap(find.byKey(const Key('bottom-nav-more')));
    await tester.pumpAndSettle();
    expect(find.byType(FubAlert), findsOneWidget);
  });

  testWidgets('la barra inferior conserva la altura del mockup',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(app());

    expect(tester.getSize(find.byType(FubBottomNavBar)).height, 78);
    expect(
        tester.getTopLeft(find.byType(FubBottomNavBar)).dy, greaterThan(740));
  });

  testWidgets('Atrás recorre el historial de destinos raíz sin cerrar sesión',
      (tester) async {
    await tester.pumpWidget(app());
    await tester.tap(find.byKey(const Key('bottom-nav-route')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('bottom-nav-activity')));
    await tester.pumpAndSettle();

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Ruta del día'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Tu jornada aún no inicia'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Tu jornada aún no inicia'), findsOneWidget);
    expect(find.text('Ya estás en Inicio. La sesión permanece activa.'),
        findsOneWidget);
  });

  testWidgets(
      'oculta la barra inferior en la plantilla enfocada y permite volver',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(app());
    await tester.tap(find.byKey(const Key('bottom-nav-route')));
    await tester.pumpAndSettle();
    final focusedAction =
        find.widgetWithText(ElevatedButton, 'Abrir plantilla enfocada');
    await tester.ensureVisible(focusedAction);
    tester.widget<ElevatedButton>(focusedAction).onPressed!.call();
    await tester.pumpAndSettle();
    expect(find.byType(FubBottomNavBar), findsNothing);
    expect(find.text('Plantilla enfocada'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.byType(FubBottomNavBar), findsOneWidget);
    expect(find.text('Ruta del día'), findsOneWidget);
  });

  testWidgets(
      'la navegación expone semántica seleccionada y no depende del color',
      (tester) async {
    await tester.pumpWidget(app());
    final home = tester.getSemantics(find.byKey(const Key('bottom-nav-home')));
    expect(home.label, contains('Inicio'));
    expect(home.flagsCollection.isSelected, Tristate.isTrue);
  });

  testWidgets('muestra el estado desactualizado sin fecha ficticia',
      (tester) async {
    await tester.pumpWidget(app(state: RootVisualState.stale));
    expect(find.text('Dato desactualizado'), findsOneWidget);
    expect(find.text('Última actualización no disponible'), findsOneWidget);
  });
}
