import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/features/auth/application/auth_models.dart';
import 'package:followupbusiness/features/auth/application/auth_session.dart';
import 'package:followupbusiness/features/auth/infrastructure/pending_logout_connectivity_listener.dart';

void main() {
  group('AuthSessionCoordinator', () {
    test('comparte una renovación concurrente y rota secretos', () async {
      final remote = _Remote()
        ..refreshResult = RefreshResult.success(_seller());
      final store = _Store();
      final coordinator = _coordinator(store: store, remote: remote);
      await coordinator
          .acceptLogin(_seller(refresh: 'old', ticket: 'old-ticket'));

      await Future.wait([coordinator.refresh(), coordinator.refresh()]);

      expect(remote.refreshCalls, 1);
      expect(store.secrets.refreshToken, 'refresh');
      expect(coordinator.accessToken, 'access');
    });

    test('401 y 409 de refresh limpian sesión, datos y tracking', () async {
      for (final failure in [
        RefreshFailure.invalid,
        RefreshFailure.alreadyRotated
      ]) {
        final store = _Store();
        final tracker = _Tracker();
        final data = _Data();
        final coordinator = _coordinator(
          store: store,
          remote: _Remote()..refreshResult = RefreshResult.failure(failure),
          tracker: tracker,
          data: data,
        );
        await coordinator.acceptLogin(_seller());

        final result = await coordinator.refresh();

        expect(result.failure, failure);
        expect(coordinator.accessToken, isNull);
        expect(store.cleared, isTrue);
        expect(tracker.stopped, 1);
        expect(data.cleared, 1);
      }
    });

    test('429 y 503 son recuperables y no borran secretos', () async {
      for (final failure in [
        RefreshFailure.throttled,
        RefreshFailure.unavailable
      ]) {
        final store = _Store();
        final coordinator = _coordinator(
          store: store,
          remote: _Remote()..refreshResult = RefreshResult.failure(failure),
        );
        await coordinator.acceptLogin(_seller());

        expect((await coordinator.refresh()).failure, failure);
        expect(store.cleared, isFalse);
        expect(coordinator.accessToken, 'access');
      }
    });

    test('interceptor reintenta una sola vez después de ACCESS_TOKEN_EXPIRED',
        () async {
      final remote = _Remote()
        ..refreshResult = RefreshResult.success(_seller(access: 'new-access'));
      final coordinator = _coordinator(store: _Store(), remote: remote);
      await coordinator.acceptLogin(_seller());
      final request = _Request([
        const ProtectedResponse(statusCode: 401, code: 'ACCESS_TOKEN_EXPIRED'),
        const ProtectedResponse(statusCode: 401, code: 'ACCESS_TOKEN_EXPIRED'),
      ]);

      final result =
          await ProtectedRequestInterceptor(coordinator).execute(request);

      expect(result.statusCode, 401);
      expect(request.tokens, ['access', 'new-access']);
      expect(remote.refreshCalls, 1);
    });

    test('logout offline conserva ticket y nunca conserva access o refresh',
        () async {
      final store = _Store();
      final tracker = _Tracker();
      final data = _Data();
      final coordinator = _coordinator(
        store: store,
        remote: _Remote()..logoutResult = false,
        tracker: tracker,
        data: data,
      );
      await coordinator.acceptLogin(_seller());

      await coordinator.logout();

      expect(coordinator.accessToken, isNull);
      expect(store.secrets.refreshToken, isEmpty);
      expect(store.secrets.sessionRevocationTicket, 'ticket');
      expect(store.ticketCleared, isFalse);
      expect(tracker.stopped, 1);
      expect(data.cleared, 1);
    });

    test('logout 204 elimina ticket pendiente', () async {
      final store = _Store();
      final coordinator = _coordinator(
        store: store,
        remote: _Remote()..logoutResult = true,
      );
      await coordinator.acceptLogin(_seller());

      await coordinator.logout();

      expect(store.ticketCleared, isTrue);
    });

    test('reintenta A pendiente después de login B sin usar B', () async {
      final store = _Store()
        ..secrets = const StoredSessionSecrets(
          userId: 'b',
          companyId: 'empresa-b',
          refreshToken: 'refresh-b',
          sessionRevocationTicket: 'ticket-b',
        )
        ..pending = [
          const StoredSessionSecrets(
            userId: 'a',
            companyId: 'empresa-a',
            refreshToken: '',
            sessionRevocationTicket: 'ticket-a',
          ),
        ];
      final remote = _Remote()..logoutResult = true;
      final coordinator = _coordinator(store: store, remote: remote);

      final completed = await coordinator.retryPendingLogout();

      expect(completed, isTrue);
      expect(remote.tickets, ['ticket-a']);
      expect(store.pending, isEmpty);
      expect(store.secrets.sessionRevocationTicket, 'ticket-b');
      expect(store.secrets.refreshToken, 'refresh-b');
    });

    test('no borra ticket A cuando la revocación no responde 204', () async {
      final store = _Store()
        ..pending = [
          const StoredSessionSecrets(
            userId: 'a',
            companyId: 'empresa-a',
            refreshToken: '',
            sessionRevocationTicket: 'ticket-a',
          ),
        ];
      final remote = _Remote()..logoutResult = false;

      expect(
        await _coordinator(store: store, remote: remote).retryPendingLogout(),
        isFalse,
      );
      expect(store.pending.single.sessionRevocationTicket, 'ticket-a');
    });

    test('reconexión reinicia revocación agotada y borra ticket solo con 204',
        () async {
      final store = _Store()
        ..secrets = const StoredSessionSecrets(
          userId: 'user',
          companyId: 'company',
          refreshToken: '',
          sessionRevocationTicket: 'pending-ticket',
        );
      final remote = _Remote()..logoutResults = [false, false, false, true];
      final scheduler = PendingLogoutRetryScheduler(
        _coordinator(store: store, remote: remote),
        retryDelay: const Duration(milliseconds: 1),
      );
      final source = _ConnectivitySource(initial: [ConnectivityResult.none]);
      final listener = PendingLogoutConnectivityListener(
        source,
        scheduler.onConnectivityRestored,
      );

      await listener.start();
      await scheduler.start();
      await Future<void>.delayed(const Duration(milliseconds: 20));
      expect(remote.logoutCalls, 3);
      expect(store.ticketCleared, isFalse);

      source.add([ConnectivityResult.wifi]);
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(remote.logoutCalls, 4);
      expect(store.ticketCleared, isTrue);
      await listener.dispose();
      scheduler.dispose();
      await source.dispose();
    });

    test(
        'eventos repetidos no duplican revocación en curso ni borran con no-204',
        () async {
      final store = _Store()
        ..secrets = const StoredSessionSecrets(
          userId: 'user',
          companyId: 'company',
          refreshToken: '',
          sessionRevocationTicket: 'pending-ticket',
        );
      final remote = _Remote()..logoutResult = false;
      final scheduler = PendingLogoutRetryScheduler(
        _coordinator(store: store, remote: remote),
        retryDelay: const Duration(days: 1),
      );
      final source = _ConnectivitySource(initial: [ConnectivityResult.none]);
      final listener = PendingLogoutConnectivityListener(
        source,
        scheduler.onConnectivityRestored,
      );
      await listener.start();

      final running = scheduler.start();
      source.add([ConnectivityResult.wifi]);
      source.add([ConnectivityResult.none]);
      source.add([ConnectivityResult.mobile]);
      await running;

      expect(remote.logoutCalls, 1);
      expect(store.ticketCleared, isFalse);
      await listener.dispose();
      scheduler.dispose();
      await source.dispose();
    });

    test('dispose evita programar reintentos después de un intento en curso',
        () async {
      final store = _Store()
        ..secrets = const StoredSessionSecrets(
          userId: 'user',
          companyId: 'company',
          refreshToken: '',
          sessionRevocationTicket: 'pending-ticket',
        );
      final remote = _CompletingRemote();
      final scheduler = PendingLogoutRetryScheduler(
        _coordinator(store: store, remote: remote),
        retryDelay: const Duration(milliseconds: 1),
      );

      final running = scheduler.start();
      scheduler.dispose();
      remote.complete(false);
      await running;
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(remote.logoutCalls, 1);
    });
  });
}

AuthSessionCoordinator _coordinator({
  required _Store store,
  required _Remote remote,
  _Tracker? tracker,
  _Data? data,
}) =>
    AuthSessionCoordinator(
      store: store,
      remote: remote,
      tracker: tracker ?? _Tracker(),
      localData: data ?? _Data(),
    );

AuthenticatedSeller _seller({
  String access = 'access',
  String refresh = 'refresh',
  String ticket = 'ticket',
}) =>
    AuthenticatedSeller(
      userId: 'user',
      companyId: 'company',
      accessToken: access,
      refreshToken: refresh,
      sessionRevocationTicket: ticket,
    );

class _Store implements SessionStore {
  StoredSessionSecrets secrets = const StoredSessionSecrets(
    userId: 'user',
    companyId: 'company',
    refreshToken: '',
    sessionRevocationTicket: '',
  );
  bool cleared = false;
  bool ticketCleared = false;
  List<StoredSessionSecrets> pending = [];
  @override
  Future<void> clearPendingLogoutTicket(StoredSessionSecrets ticket) async {
    ticketCleared = true;
    pending = pending
        .where((candidate) =>
            candidate.companyId != ticket.companyId ||
            candidate.userId != ticket.userId ||
            candidate.sessionRevocationTicket != ticket.sessionRevocationTicket)
        .toList(growable: false);
  }
  @override
  Future<void> clearSession() async => cleared = true;
  @override
  Future<StoredSessionSecrets?> clearForLogout() async {
    secrets = StoredSessionSecrets(
      userId: secrets.userId,
      companyId: secrets.companyId,
      refreshToken: '',
      sessionRevocationTicket: secrets.sessionRevocationTicket,
    );
    pending = [secrets];
    return secrets;
  }

  @override
  Future<StoredSessionSecrets?> readSecrets() async =>
      secrets.sessionRevocationTicket.isEmpty ? null : secrets;
  @override
  Future<List<StoredSessionSecrets>> readPendingLogoutTickets() async =>
      pending.isNotEmpty
          ? List.unmodifiable(pending)
          : secrets.refreshToken.isEmpty &&
                  secrets.sessionRevocationTicket.isNotEmpty &&
                  !ticketCleared
              ? [secrets]
              : const [];
  @override
  Future<void> replaceSession(AuthenticatedSeller seller) async {
    secrets = StoredSessionSecrets(
      userId: seller.userId,
      companyId: seller.companyId,
      refreshToken: seller.refreshToken,
      sessionRevocationTicket: seller.sessionRevocationTicket,
    );
  }
}

class _Remote implements SessionRemote {
  RefreshResult refreshResult =
      const RefreshResult.failure(RefreshFailure.unavailable);
  bool logoutResult = false;
  List<bool>? logoutResults;
  int refreshCalls = 0;
  int logoutCalls = 0;
  final tickets = <String>[];
  @override
  Future<bool> logout({String? accessToken, required String ticket}) async {
    logoutCalls++;
    tickets.add(ticket);
    await Future<void>.delayed(Duration.zero);
    return logoutResults?.removeAt(0) ?? logoutResult;
  }

  @override
  Future<RefreshResult> refresh({required String refreshToken}) async {
    refreshCalls++;
    await Future<void>.delayed(Duration.zero);
    return refreshResult;
  }
}

class _Tracker implements WorkShiftTracker {
  int stopped = 0;
  @override
  Future<void> stop() async => stopped++;
}

class _Data implements SegregatedSessionData {
  int cleared = 0;
  @override
  Future<void> clear(
          {required String userId, required String companyId}) async =>
      cleared++;
}

class _Request implements ProtectedRequest<void> {
  _Request(this._responses);
  final List<ProtectedResponse<void>> _responses;
  final tokens = <String>[];
  @override
  Future<ProtectedResponse<void>> send(String accessToken) async {
    tokens.add(accessToken);
    return _responses.removeAt(0);
  }
}

class _ConnectivitySource implements ConnectivityStatusSource {
  _ConnectivitySource({required this.initial});

  final List<ConnectivityResult> initial;
  final _controller = StreamController<List<ConnectivityResult>>.broadcast();

  @override
  Future<List<ConnectivityResult>> check() async => initial;

  @override
  Stream<List<ConnectivityResult>> get changes => _controller.stream;

  void add(List<ConnectivityResult> status) => _controller.add(status);

  Future<void> dispose() => _controller.close();
}

class _CompletingRemote extends _Remote {
  final _logout = Completer<bool>();

  @override
  Future<bool> logout({String? accessToken, required String ticket}) {
    logoutCalls++;
    return _logout.future;
  }

  void complete(bool result) => _logout.complete(result);
}
