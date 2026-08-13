import 'dart:async';

import 'auth_models.dart';

/// Credenciales que permanecen solamente durante la ejecución de la app.
class ActiveSession {
  const ActiveSession({
    required this.userId,
    required this.companyId,
    required this.accessToken,
  });

  final String userId;
  final String companyId;
  final String accessToken;
}

class StoredSessionSecrets {
  const StoredSessionSecrets({
    required this.userId,
    required this.companyId,
    required this.refreshToken,
    required this.sessionRevocationTicket,
  });

  final String userId;
  final String companyId;
  final String refreshToken;
  final String sessionRevocationTicket;
}

enum RefreshFailure {
  invalid,
  alreadyRotated,
  throttled,
  unavailable,
  malformed
}

class RefreshResult {
  const RefreshResult.success(this.seller) : failure = null;
  const RefreshResult.failure(this.failure) : seller = null;

  final AuthenticatedSeller? seller;
  final RefreshFailure? failure;
  bool get isSuccess => seller != null;
}

abstract interface class SessionStore {
  Future<StoredSessionSecrets?> readSecrets();
  Future<void> replaceSession(AuthenticatedSeller seller);
  Future<void> clearSession();
  Future<StoredSessionSecrets?> clearForLogout();
  Future<void> clearPendingLogoutTicket();
}

abstract interface class SessionRemote {
  Future<RefreshResult> refresh({required String refreshToken});
  Future<bool> logout({String? accessToken, required String ticket});
}

abstract interface class WorkShiftTracker {
  Future<void> stop();
}

abstract interface class SegregatedSessionData {
  Future<void> clear({required String userId, required String companyId});
}

/// Adaptador temporal seguro mientras no existe un servicio de jornada o caché.
class NoopWorkShiftTracker implements WorkShiftTracker {
  const NoopWorkShiftTracker();

  @override
  Future<void> stop() async {}
}

/// No conserva datos ni permite que el cierre falle por una implementación ausente.
class NoopSegregatedSessionData implements SegregatedSessionData {
  const NoopSegregatedSessionData();

  @override
  Future<void> clear(
      {required String userId, required String companyId}) async {}
}

/// Coordina secretos persistidos y el access token efímero sin exponerlos a UI.
class AuthSessionCoordinator {
  AuthSessionCoordinator({
    required this.store,
    required this.remote,
    required this.tracker,
    required this.localData,
  });

  final SessionStore store;
  final SessionRemote remote;
  final WorkShiftTracker tracker;
  final SegregatedSessionData localData;
  ActiveSession? _active;
  Future<RefreshResult>? _refreshing;
  bool _autoRefreshEnabled = true;

  String? get accessToken => _active?.accessToken;

  Future<void> acceptLogin(AuthenticatedSeller seller) async {
    await store.replaceSession(seller);
    _active = ActiveSession(
      userId: seller.userId,
      companyId: seller.companyId,
      accessToken: seller.accessToken,
    );
    _autoRefreshEnabled = true;
  }

  Future<RefreshResult> refresh() {
    if (!_autoRefreshEnabled) {
      return Future.value(const RefreshResult.failure(RefreshFailure.invalid));
    }
    return _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
  }

  Future<RefreshResult> _doRefresh() async {
    final current = await store.readSecrets();
    if (current == null) {
      return const RefreshResult.failure(RefreshFailure.invalid);
    }
    final result = await remote.refresh(refreshToken: current.refreshToken);
    if (result.isSuccess) {
      final seller = result.seller!;
      if (seller.userId != current.userId ||
          seller.companyId != current.companyId) {
        await _clearLocal(current);
        return const RefreshResult.failure(RefreshFailure.malformed);
      }
      try {
        await store.replaceSession(seller);
      } on Object {
        await _clearLocal(current);
        return const RefreshResult.failure(RefreshFailure.malformed);
      }
      _active = ActiveSession(
        userId: seller.userId,
        companyId: seller.companyId,
        accessToken: seller.accessToken,
      );
    } else if (result.failure == RefreshFailure.invalid ||
        result.failure == RefreshFailure.alreadyRotated ||
        result.failure == RefreshFailure.malformed) {
      await _clearLocal(current);
    }
    return result;
  }

  Future<void> logout() async {
    _autoRefreshEnabled = false;
    final secrets = await store.clearForLogout();
    final active = _active;
    _active = null;
    try {
      await tracker.stop();
    } on Object {
      // El cierre local no puede reactivar la sesión si el servicio no responde.
    }
    if (secrets != null) {
      await localData.clear(
        userId: secrets.userId,
        companyId: secrets.companyId,
      );
    }
    if (secrets == null) {
      return;
    }
    final completed = await remote.logout(
      accessToken: active?.accessToken,
      ticket: secrets.sessionRevocationTicket,
    );
    if (completed) {
      await store.clearPendingLogoutTicket();
    }
  }

  Future<bool> retryPendingLogout() async {
    final secrets = await store.readSecrets();
    if (secrets == null || secrets.refreshToken.isNotEmpty) {
      return true;
    }
    if (await remote.logout(ticket: secrets.sessionRevocationTicket)) {
      await store.clearPendingLogoutTicket();
      return true;
    }
    return false;
  }

  Future<void> _clearLocal(StoredSessionSecrets secrets) async {
    _active = null;
    _autoRefreshEnabled = false;
    try {
      await tracker.stop();
    } on Object {
      // La limpieza de credenciales y datos debe continuar.
    }
    await store.clearSession();
    await localData.clear(userId: secrets.userId, companyId: secrets.companyId);
  }
}

/// Ejecuta un intento por inicio o evento de conectividad, sin restaurar sesión.
class PendingLogoutRetryScheduler {
  PendingLogoutRetryScheduler(
    this._session, {
    this.retryDelay = const Duration(seconds: 15),
    this.maxAutomaticAttempts = 3,
  });

  final AuthSessionCoordinator _session;
  final Duration retryDelay;
  final int maxAutomaticAttempts;
  Future<void>? _running;
  Timer? _nextRetry;
  var _attempts = 0;
  var _disposed = false;

  Future<void> start() => _disposed ? Future.value() : _retryOnce();

  Future<void> onConnectivityRestored() {
    if (_disposed) return Future.value();
    _attempts = 0;
    _nextRetry?.cancel();
    return _retryOnce();
  }

  void dispose() {
    _disposed = true;
    _nextRetry?.cancel();
    _nextRetry = null;
  }

  Future<void> _retryOnce() {
    return _running ??= _runOnce().whenComplete(() => _running = null);
  }

  Future<void> _runOnce() async {
    _attempts++;
    final completed = await _session.retryPendingLogout();
    if (!_disposed && !completed && _attempts < maxAutomaticAttempts) {
      _nextRetry = Timer(retryDelay, _retryOnce);
    }
  }
}

abstract interface class ProtectedRequest<T> {
  Future<ProtectedResponse<T>> send(String accessToken);
}

class ProtectedResponse<T> {
  const ProtectedResponse({required this.statusCode, this.body, this.code});
  final int statusCode;
  final T? body;
  final String? code;
}

/// Interceptor agnóstico al transporte: reintenta solo una vez tras expiración.
class ProtectedRequestInterceptor {
  const ProtectedRequestInterceptor(this._session);
  final AuthSessionCoordinator _session;

  Future<ProtectedResponse<T>> execute<T>(ProtectedRequest<T> request) async {
    final token = _session.accessToken;
    if (token == null) {
      return const ProtectedResponse(statusCode: 401);
    }
    final first = await request.send(token);
    if (first.statusCode != 401 || first.code != 'ACCESS_TOKEN_EXPIRED') {
      return first;
    }
    final refreshed = await _session.refresh();
    final retryToken = _session.accessToken;
    if (!refreshed.isSuccess || retryToken == null) {
      return first;
    }
    return request.send(retryToken);
  }
}
