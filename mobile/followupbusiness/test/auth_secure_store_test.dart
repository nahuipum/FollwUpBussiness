import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/features/auth/application/auth_models.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_secure_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('segrega refresh y ticket y elimina el alcance anterior', () async {
    SharedPreferences.setMockInitialValues({});
    final values = _Values();
    final store = AuthSecureStore(secureValues: values);
    await store.replaceSession(_seller(user: 'u1', company: 'c1'));
    await store.replaceSession(_seller(user: 'u2', company: 'c2'));
    expect(
        values.writes.keys,
        containsAll([
          'auth.c1.u1.refreshToken',
          'auth.c1.u1.sessionRevocationTicket',
          'auth.c2.u2.refreshToken',
          'auth.c2.u2.sessionRevocationTicket'
        ]));
    expect(
        values.deleted,
        containsAll(
            ['auth.c1.u1.refreshToken', 'auth.c1.u1.sessionRevocationTicket']));
    expect(values.writes.values, isNot(contains('access')));
  });

  test('limpia valores parciales si el secure storage falla', () async {
    SharedPreferences.setMockInitialValues({});
    final values = _Values(failTicket: true);
    final store = AuthSecureStore(secureValues: values);
    await expectLater(store.replaceSession(_seller(user: 'u1', company: 'c1')),
        throwsStateError);
    expect(
        values.deleted,
        containsAll(
            ['auth.c1.u1.refreshToken', 'auth.c1.u1.sessionRevocationTicket']));
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
  }

  @override
  Future<void> write({required String key, required String value}) async {
    if (failTicket && key.endsWith('sessionRevocationTicket')) {
      throw StateError('storage');
    }
    writes[key] = value;
  }
}
