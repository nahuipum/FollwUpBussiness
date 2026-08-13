import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../application/auth_models.dart';
import '../application/auth_session.dart';

abstract interface class AuthSessionStore {
  Future<void> replaceSession(AuthenticatedSeller seller);
  Future<void> clearSession();
}

abstract interface class SecureValueStore {
  Future<String?> read({required String key});
  Future<void> write({required String key, required String value});
  Future<void> delete({required String key});
}

class FlutterSecureValueStore implements SecureValueStore {
  FlutterSecureValueStore(this._storage);
  final FlutterSecureStorage _storage;
  @override
  Future<String?> read({required String key}) => _storage.read(key: key);
  @override
  Future<void> delete({required String key}) => _storage.delete(key: key);
  @override
  Future<void> write({required String key, required String value}) =>
      _storage.write(key: key, value: value);
}

class AuthSecureStore implements AuthSessionStore, SessionStore {
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
  static const _userKey = 'auth.active.userId';
  static const _companyKey = 'auth.active.companyId';

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
      await preferences.setString(_userKey, seller.userId);
      await preferences.setString(_companyKey, seller.companyId);
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
    await preferences.remove(_userKey);
    await preferences.remove(_companyKey);
  }

  @override
  Future<StoredSessionSecrets?> readSecrets() async {
    final preferences = await _preferences;
    final scope = preferences.getString(_scopeKey);
    final userId = preferences.getString(_userKey);
    final companyId = preferences.getString(_companyKey);
    if (scope == null || userId == null || companyId == null) return null;
    final ticket = await _storage.read(key: _ticketKey(scope));
    if (ticket == null || ticket.isEmpty) return null;
    final refresh = await _storage.read(key: _refreshKey(scope)) ?? '';
    return StoredSessionSecrets(
      companyId: companyId,
      userId: userId,
      refreshToken: refresh,
      sessionRevocationTicket: ticket,
    );
  }

  /// El cierre local borra primero el refresh y conserva solo el ticket seguro.
  @override
  Future<StoredSessionSecrets?> clearForLogout() async {
    final secrets = await readSecrets();
    if (secrets == null) return null;
    await _storage.delete(key: _refreshKey(_scope(secrets)));
    return secrets;
  }

  @override
  Future<void> clearPendingLogoutTicket() async {
    final preferences = await _preferences;
    final scope = preferences.getString(_scopeKey);
    if (scope != null) await _storage.delete(key: _ticketKey(scope));
    await preferences.remove(_scopeKey);
    await preferences.remove(_userKey);
    await preferences.remove(_companyKey);
  }

  Future<void> _deleteScope(String scope) async {
    await _storage.delete(key: _refreshKey(scope));
    await _storage.delete(key: _ticketKey(scope));
  }

  String _refreshKey(String scope) => 'auth.$scope.refreshToken';
  String _ticketKey(String scope) => 'auth.$scope.sessionRevocationTicket';
  String _scope(StoredSessionSecrets secrets) =>
      '${secrets.companyId}.${secrets.userId}';
}
