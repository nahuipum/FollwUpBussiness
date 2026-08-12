import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../application/auth_models.dart';

abstract interface class AuthSessionStore {
  Future<void> replaceSession(AuthenticatedSeller seller);
  Future<void> clearSession();
}

abstract interface class SecureValueStore {
  Future<void> write({required String key, required String value});
  Future<void> delete({required String key});
}

class FlutterSecureValueStore implements SecureValueStore {
  FlutterSecureValueStore(this._storage);
  final FlutterSecureStorage _storage;
  @override
  Future<void> delete({required String key}) => _storage.delete(key: key);
  @override
  Future<void> write({required String key, required String value}) =>
      _storage.write(key: key, value: value);
}

class AuthSecureStore implements AuthSessionStore {
  AuthSecureStore({
    FlutterSecureStorage? storage,
    SecureValueStore? secureValues,
    Future<SharedPreferences>? preferences,
  })  : _storage = secureValues ??
            FlutterSecureValueStore(storage ?? const FlutterSecureStorage()),
        _preferences = preferences ?? SharedPreferences.getInstance();

  final SecureValueStore _storage;
  final Future<SharedPreferences> _preferences;
  static const _scopeKey = 'auth.active.scope';

  @override
  Future<void> replaceSession(AuthenticatedSeller seller) async {
    final preferences = await _preferences;
    final nextScope = '${seller.companyId}.${seller.userId}';
    final previousScope = preferences.getString(_scopeKey);
    if (previousScope != null && previousScope != nextScope) {
      await _deleteScope(previousScope);
    }
    try {
      await _storage.write(
          key: _refreshKey(nextScope), value: seller.refreshToken);
      await _storage.write(
          key: _ticketKey(nextScope), value: seller.sessionRevocationTicket);
      await preferences.setString(_scopeKey, nextScope);
    } on Object {
      await _deleteScope(nextScope);
      rethrow;
    }
  }

  @override
  Future<void> clearSession() async {
    final preferences = await _preferences;
    final scope = preferences.getString(_scopeKey);
    if (scope != null) await _deleteScope(scope);
    await preferences.remove(_scopeKey);
  }

  Future<void> _deleteScope(String scope) async {
    await _storage.delete(key: _refreshKey(scope));
    await _storage.delete(key: _ticketKey(scope));
  }

  String _refreshKey(String scope) => 'auth.$scope.refreshToken';
  String _ticketKey(String scope) => 'auth.$scope.sessionRevocationTicket';
}
