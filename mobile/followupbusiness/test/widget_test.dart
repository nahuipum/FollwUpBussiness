import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/app/follow_up_business_app.dart';
import 'package:followupbusiness/features/auth/application/auth_models.dart';
import 'package:followupbusiness/features/auth/application/auth_repository.dart';

class _DelayedAuthRepository implements AuthRepository {
  const _DelayedAuthRepository();
  @override
  Future<AuthResult<AuthenticatedSeller>> login(
          {required String identifier, required String password}) =>
      Future<AuthResult<AuthenticatedSeller>>.delayed(
          const Duration(milliseconds: 900),
          () => const AuthResult.failure(AuthFailure.neutral));
  @override
  Future<AuthResult<void>> requestRecovery({required String email}) =>
      Future<AuthResult<void>>.delayed(const Duration(milliseconds: 900),
          () => const AuthResult.success(null));
}

const _app = FollowUpBusinessApp(authRepository: _DelayedAuthRepository());

void main() {
  testWidgets('muestra la composición visual de acceso',
      (WidgetTester tester) async {
    await tester.pumpWidget(_app);

    expect(find.text('Accede a tu jornada'), findsOneWidget);
    expect(find.text('Correo electrónico'), findsOneWidget);
    expect(find.text('Iniciar sesión'), findsOneWidget);
  });

  testWidgets('centra el bloque de acceso sin desplazamiento',
      (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(_app);

    final header = tester.getTopLeft(find.text('Accede a tu jornada'));
    final card = tester.getTopLeft(find.text('Iniciar sesión'));
    expect(find.byType(SingleChildScrollView), findsNothing);
    expect(header.dy, greaterThan(150));
    expect(card.dy, greaterThan(header.dy));
  });

  testWidgets('alterna Recordarme solo en la UI local',
      (WidgetTester tester) async {
    await tester.pumpWidget(_app);

    final checkbox = find.byKey(const Key('authRememberCheckbox'));
    expect(tester.widget<Checkbox>(find.byType(Checkbox)).value, isFalse);
    await tester.tap(checkbox);
    await tester.pump();
    expect(tester.widget<Checkbox>(find.byType(Checkbox)).value, isTrue);
  });

  testWidgets('enlaza inicio, recuperación y confirmación neutral en memoria',
      (WidgetTester tester) async {
    await tester.pumpWidget(_app);

    await tester.tap(find.text('¿Olvidaste tu contraseña?'));
    await tester.pumpAndSettle();
    expect(find.text('Recuperar contraseña'), findsOneWidget);
    expect(find.text('Enviar enlace'), findsOneWidget);

    await tester.tap(find.text('Enviar enlace'));
    await tester.pump();
    expect(find.text('Procesando solicitud'), findsOneWidget);
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Revisa tu correo'), findsOneWidget);
    expect(find.textContaining('no confirmamos'), findsOneWidget);

    await tester.tap(find.text('Volver al inicio'));
    await tester.pumpAndSettle();
    expect(find.text('Iniciar sesión'), findsOneWidget);
  });

  testWidgets('muestra carga y alerta neutral de inicio de sesión',
      (WidgetTester tester) async {
    await tester.pumpWidget(_app);

    await tester.tap(find.text('Iniciar sesión'));
    await tester.pump();
    expect(find.text('Iniciando sesión...'), findsOneWidget);
    await tester.pump(const Duration(seconds: 1));
    expect(find.textContaining('No se pudo iniciar sesión'), findsOneWidget);
  });
}
