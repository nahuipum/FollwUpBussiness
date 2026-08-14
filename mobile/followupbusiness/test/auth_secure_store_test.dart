import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/features/auth/application/auth_models.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_secure_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('segrega refresh y ticket y elimina el alcance anterior', () async {
    final values = _Values();
    final store = AuthSecureStore(secureValues: values);
    await store.replaceSession(_seller(user: 'u1', company: 'c1'));
    await store.replaceSession(_seller(user: 'u2', company: 'c2'));
    expect(
        values.writes.keys,
        containsAll([
          'auth.eyJjb21wYW55SWQiOiJjMiIsInVzZXJJZCI6InUyIn0=.refreshToken',
          'auth.eyJjb21wYW55SWQiOiJjMiIsInVzZXJJZCI6InUyIn0=.sessionRevocationTicket'
        ]));
    expect(
        values.deleted,
        containsAll([
          'auth.eyJjb21wYW55SWQiOiJjMSIsInVzZXJJZCI6InUxIn0=.refreshToken',
          'auth.eyJjb21wYW55SWQiOiJjMSIsInVzZXJJZCI6InUxIn0=.sessionRevocationTicket'
        ]));
    expect(values.writes.values, isNot(contains('access')));
  });

  test('limpia valores parciales si el secure storage falla', () async {
    final values = _Values(failTicket: true);
    final store = AuthSecureStore(secureValues: values);
    await expectLater(store.replaceSession(_seller(user: 'u1', company: 'c1')),
        throwsStateError);
    expect(
        values.deleted,
        containsAll([
          'auth.eyJjb21wYW55SWQiOiJjMSIsInVzZXJJZCI6InUxIn0=.refreshToken',
          'auth.eyJjb21wYW55SWQiOiJjMSIsInVzZXJJZCI6InUxIn0=.sessionRevocationTicket'
        ]));
  });

  test('mantiene la identidad activa solo en secure storage', () async {
    final values = _Values();
    final store = AuthSecureStore(secureValues: values);

    await store.replaceSession(_seller(user: 'user.with.dot', company: 'c.1'));

    final secrets = await store.readSecrets();
    expect(secrets?.userId, 'user.with.dot');
    expect(secrets?.companyId, 'c.1');
    expect(values.writes.keys, contains('auth.active.scope'));
    expect(values.writes.values, isNot(contains('user.with.dot')));
    expect(values.writes.values, isNot(contains('c.1')));
  });

  test('migra el alcance legado y elimina sus metadatos no seguros', () async {
    SharedPreferences.setMockInitialValues({
      'auth.active.scope': 'c1.u1',
      'auth.active.userId': 'u1',
      'auth.active.companyId': 'c1',
    });
    final values = _Values()
      ..writes['auth.c1.u1.refreshToken'] = 'refresh-u1'
      ..writes['auth.c1.u1.sessionRevocationTicket'] = 'ticket-u1';
    final store = AuthSecureStore(secureValues: values);

    final secrets = await store.readSecrets();
    final preferences = await SharedPreferences.getInstance();

    expect(secrets?.userId, 'u1');
    expect(secrets?.companyId, 'c1');
    expect(preferences.getKeys(), isEmpty);
    expect(
        values.deleted,
        containsAll([
          'auth.c1.u1.refreshToken',
          'auth.c1.u1.sessionRevocationTicket',
        ]));
    expect(values.writes.keys, contains('auth.active.scope'));
  });

  test('conserva el ámbito legado si su migración segura falla', () async {
    SharedPreferences.setMockInitialValues({
      'auth.active.scope': 'c1.u1',
      'auth.active.userId': 'u1',
      'auth.active.companyId': 'c1',
    });
    final values = _Values(failTicket: true)
      ..writes['auth.c1.u1.refreshToken'] = 'refresh-u1'
      ..writes['auth.c1.u1.sessionRevocationTicket'] = 'ticket-u1';
    final store = AuthSecureStore(secureValues: values);

    await expectLater(store.readSecrets(), throwsStateError);
    final preferences = await SharedPreferences.getInstance();

    expect(preferences.getString('auth.active.scope'), 'c1.u1');
    expect(
        values.deleted, isNot(contains('auth.c1.u1.sessionRevocationTicket')));
  });

  test('conserva ticket A pendiente al iniciar B y revoca solo A', () async {
    final values = _Values();
    final store = AuthSecureStore(secureValues: values);
    final sellerA = _seller(user: 'a', company: 'empresa-a');
    final sellerB = _seller(user: 'b', company: 'empresa-b');

    await store.replaceSession(sellerA);
    final pendingA = await store.clearForLogout();
    await store.replaceSession(sellerB);

    expect(await store.readSecrets(), isNotNull);
    expect((await store.readSecrets())!.userId, 'b');
    final pendingTickets = await store.readPendingLogoutTickets();
    expect(pendingTickets, hasLength(1));
    expect(pendingTickets.single.userId, pendingA!.userId);
    expect(pendingTickets.single.companyId, pendingA.companyId);
    expect(pendingTickets.single.sessionRevocationTicket,
        pendingA.sessionRevocationTicket);

    await store.clearPendingLogoutTicket(pendingA);

    expect(await store.readPendingLogoutTickets(), isEmpty);
    expect((await store.readSecrets())!.userId, 'b');
  });

  test('mantiene tickets pendientes de ámbitos distintos hasta su 204 propio',
      () async {
    final store = AuthSecureStore(secureValues: _Values());
    final sellerA = _seller(user: 'a', company: 'empresa-a');
    final sellerC = _seller(user: 'c', company: 'empresa-c');

    await store.replaceSession(sellerA);
    final pendingA = (await store.clearForLogout())!;
    await store.replaceSession(sellerC);
    final pendingC = (await store.clearForLogout())!;

    await store.clearPendingLogoutTicket(pendingA);

    final pendingTickets = await store.readPendingLogoutTickets();
    expect(pendingTickets, hasLength(1));
    expect(pendingTickets.single.userId, pendingC.userId);
    expect(pendingTickets.single.companyId, pendingC.companyId);
    expect(pendingTickets.single.sessionRevocationTicket,
        pendingC.sessionRevocationTicket);
  });
}

AuthenticatedSeller _seller({required String user, required String company}) =>
    AuthenticatedSeller(
        userId: user,
        companyId: company,
        accessToken: 'access',
        refreshToken: 'refresh-$user',
        sessionRevocationTicket: 'ticket-$user');

class _Values implements SecureValueStore {
  _Values({this.failTicket = false});
  final bool failTicket;
  final writes = <String, String>{};
  final deleted = <String>[];
  @override
  Future<String?> read({required String key}) async => writes[key];
  @override
  Future<void> delete({required String key}) async {
    deleted.add(key);
    writes.remove(key);
  }

  @override
  Future<void> write({required String key, required String value}) async {
    if (failTicket && key.endsWith('sessionRevocationTicket')) {
      throw StateError('storage');
    }
    writes[key] = value;
  }
}
