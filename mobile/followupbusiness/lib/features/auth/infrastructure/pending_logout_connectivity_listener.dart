import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

abstract interface class ConnectivityStatusSource {
  Future<List<ConnectivityResult>> check();
  Stream<List<ConnectivityResult>> get changes;
}

class ConnectivityPlusStatusSource implements ConnectivityStatusSource {
  ConnectivityPlusStatusSource([Connectivity? connectivity])
      : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  @override
  Future<List<ConnectivityResult>> check() => _connectivity.checkConnectivity();

  @override
  Stream<List<ConnectivityResult>> get changes =>
      _connectivity.onConnectivityChanged;
}

/// Notifica una sola transición sin red → con red por ciclo de suscripción.
class PendingLogoutConnectivityListener {
  PendingLogoutConnectivityListener(this._source, this._onRestored);

  final ConnectivityStatusSource _source;
  final Future<void> Function() _onRestored;
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  var _wasOffline = false;

  Future<void> start() async {
    if (_subscription != null) return;
    _subscription = _source.changes.listen(_onChanged);
    _wasOffline = _isOffline(await _source.check());
  }

  void _onChanged(List<ConnectivityResult> results) {
    final offline = _isOffline(results);
    if (_wasOffline && !offline) unawaited(_onRestored());
    _wasOffline = offline;
  }

  Future<void> dispose() async {
    final subscription = _subscription;
    _subscription = null;
    if (subscription != null) await subscription.cancel();
  }

  bool _isOffline(List<ConnectivityResult> results) =>
      results.isEmpty ||
      results.every((result) => result == ConnectivityResult.none);
}
