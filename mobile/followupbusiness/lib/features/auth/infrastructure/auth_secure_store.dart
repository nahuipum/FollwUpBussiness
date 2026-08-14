import 'dart:convert';

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
  Future<SharedPreferences>? _preferences;
  static const _scopeKey = 'auth.active.scope';
  static const _pendingTicketsKey = 'auth.pending.logout.tickets';
  static const _legacyUserKey = 'auth.active.userId';
  static const _legacyCompanyKey = 'auth.active.companyId';

  @override
  Future<void> replaceSession(AuthenticatedSeller seller) async {
    final nextScope = _scope(seller.companyId, seller.userId);
    final previousScope = await _storage.read(key: _scopeKey);
    if (previousScope != null &&
        previousScope != nextScope &&
        !await _isPendingScope(previousScope)) {
      await _deleteScope(previousScope);
    }
    try {
      await _storage.write(
          key: _refreshKey(nextScope), value: seller.refreshToken);
      await _storage.write(
          key: _ticketKey(nextScope), value: seller.sessionRevocationTicket);
      await _storage.write(key: _scopeKey, value: nextScope);
      await _clearLegacyMetadata();
    } on Object {
      await _deleteScope(nextScope);
      rethrow;
    }
  }

  @override
  Future<void> clearSession() async {
    final scope = await _storage.read(key: _scopeKey);
    if (scope != null) await _deleteScope(scope);
    await _storage.delete(key: _scopeKey);
    await _clearLegacyScope();
  }

  @override
  Future<StoredSessionSecrets?> readSecrets() async {
    final scope = await _storage.read(key: _scopeKey) ?? await _migrateLegacy();
    if (scope == null) return null;
    final identity = _identity(scope);
    if (identity == null) return null;
    final ticket = await _storage.read(key: _ticketKey(scope));
    if (ticket == null || ticket.isEmpty) return null;
    final refresh = await _storage.read(key: _refreshKey(scope)) ?? '';
    return StoredSessionSecrets(
      companyId: identity.companyId,
      userId: identity.userId,
      refreshToken: refresh,
      sessionRevocationTicket: ticket,
    );
  }

  /// El cierre local borra primero el refresh y conserva solo el ticket seguro.
  @override
  Future<StoredSessionSecrets?> clearForLogout() async {
    final secrets = await readSecrets();
    if (secrets == null) return null;
    await _addPendingTicket(secrets);
    await _storage.delete(
      key: _refreshKey(_scope(secrets.companyId, secrets.userId)),
    );
    await _storage.delete(
      key: _ticketKey(_scope(secrets.companyId, secrets.userId)),
    );
    return secrets;
  }

  @override
  Future<List<StoredSessionSecrets>> readPendingLogoutTickets() async {
    final raw = await _storage.read(key: _pendingTicketsKey);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final values = jsonDecode(raw);
      if (values is! List) return const [];
      return values
          .whereType<Map<String, dynamic>>()
          .map(_pendingTicket)
          .whereType<StoredSessionSecrets>()
          .toList(growable: false);
    } on FormatException {
      return const [];
    }
  }

  @override
  Future<void> clearPendingLogoutTicket(StoredSessionSecrets ticket) async {
    final pending = await readPendingLogoutTickets();
    final remaining = pending
        .where((candidate) =>
            candidate.companyId != ticket.companyId ||
            candidate.userId != ticket.userId ||
            candidate.sessionRevocationTicket != ticket.sessionRevocationTicket)
        .toList(growable: false);
    await _writePendingTickets(remaining);
    final scope = _scope(ticket.companyId, ticket.userId);
    if (await _storage.read(key: _scopeKey) == scope) {
      await _storage.delete(key: _scopeKey);
    }
  }

  Future<void> _addPendingTicket(StoredSessionSecrets ticket) async {
    final pending = await readPendingLogoutTickets();
    if (pending.any((candidate) =>
        candidate.sessionRevocationTicket == ticket.sessionRevocationTicket)) {
      return;
    }
    await _writePendingTickets([...pending, ticket]);
  }

  Future<void> _writePendingTickets(List<StoredSessionSecrets> tickets) async {
    if (tickets.isEmpty) {
      await _storage.delete(key: _pendingTicketsKey);
      return;
    }
    await _storage.write(
      key: _pendingTicketsKey,
      value: jsonEncode(tickets
          .map((ticket) => {
                'companyId': ticket.companyId,
                'userId': ticket.userId,
                'ticket': ticket.sessionRevocationTicket,
              })
          .toList(growable: false)),
    );
  }

  StoredSessionSecrets? _pendingTicket(dynamic value) {
    if (value is! Map<String, dynamic> ||
        value['companyId'] is! String ||
        value['userId'] is! String ||
        value['ticket'] is! String ||
        (value['ticket'] as String).isEmpty) {
      return null;
    }
    return StoredSessionSecrets(
      companyId: value['companyId'] as String,
      userId: value['userId'] as String,
      refreshToken: '',
      sessionRevocationTicket: value['ticket'] as String,
    );
  }

  Future<bool> _isPendingScope(String scope) async =>
      (await readPendingLogoutTickets()).any((ticket) =>
          _scope(ticket.companyId, ticket.userId) == scope);

  Future<void> _deleteScope(String scope) async {
    await _storage.delete(key: _refreshKey(scope));
    await _storage.delete(key: _ticketKey(scope));
  }

  Future<String?> _migrateLegacy() async {
    final preferences = await _getPreferences();
    final legacyScope = preferences.getString(_scopeKey);
    final userId = preferences.getString(_legacyUserKey);
    final companyId = preferences.getString(_legacyCompanyKey);
    if (legacyScope == null || userId == null || companyId == null) {
      await _clearLegacyMetadata(preferences);
      return null;
    }
    if (legacyScope != '$companyId.$userId') {
      await _clearLegacyMetadata(preferences);
      return null;
    }
    final ticket = await _storage.read(key: _ticketKey(legacyScope));
    if (ticket == null || ticket.isEmpty) {
      await _deleteScope(legacyScope);
      await _clearLegacyMetadata(preferences);
      return null;
    }
    final refresh = await _storage.read(key: _refreshKey(legacyScope)) ?? '';
    final secureScope = _scope(companyId, userId);
    try {
      await _storage.write(key: _refreshKey(secureScope), value: refresh);
      await _storage.write(key: _ticketKey(secureScope), value: ticket);
      await _storage.write(key: _scopeKey, value: secureScope);
    } on Object {
      await _deleteScope(secureScope);
      rethrow;
    }
    await _deleteScope(legacyScope);
    await _clearLegacyMetadata(preferences);
    return secureScope;
  }

  Future<void> _clearLegacyScope() async {
    final preferences = await _getPreferences();
    final scope = preferences.getString(_scopeKey);
    if (scope != null) await _deleteScope(scope);
    await _clearLegacyMetadata(preferences);
  }

  Future<void> _clearLegacyMetadata([SharedPreferences? preferences]) async {
    final resolvedPreferences = preferences ?? await _getPreferences();
    await resolvedPreferences.remove(_scopeKey);
    await resolvedPreferences.remove(_legacyUserKey);
    await resolvedPreferences.remove(_legacyCompanyKey);
  }

  Future<SharedPreferences> _getPreferences() =>
      _preferences ??= SharedPreferences.getInstance();

  String _refreshKey(String scope) => 'auth.$scope.refreshToken';
  String _ticketKey(String scope) => 'auth.$scope.sessionRevocationTicket';
  String _scope(String companyId, String userId) => base64Url.encode(
      utf8.encode(jsonEncode({'companyId': companyId, 'userId': userId})));

  _SessionIdentity? _identity(String scope) {
    try {
      final value =
          jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(scope))));
      if (value is! Map<String, dynamic> ||
          value['companyId'] is! String ||
          value['userId'] is! String) {
        return null;
      }
      return _SessionIdentity(
        companyId: value['companyId'] as String,
        userId: value['userId'] as String,
      );
    } on FormatException {
      return null;
    }
  }
}

class _SessionIdentity {
  const _SessionIdentity({required this.companyId, required this.userId});

  final String companyId;
  final String userId;
}
