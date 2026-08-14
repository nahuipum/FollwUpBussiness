import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/features/auth/application/auth_models.dart';
import 'package:followupbusiness/features/auth/application/auth_session.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_session_remote.dart';
import 'package:followupbusiness/features/auth/infrastructure/client_instance_id.dart';

void main() {
  test(
      'timeout del cuerpo libera el scheduler y el siguiente intento 204 borra el ticket',
      () async {
    final firstResponseStarted = Completer<void>();
    final releaseFirstResponse = Completer<void>();
    var requests = 0;
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final serverSubscription = server.listen((request) async {
      requests++;
      await request.drain<void>();
      if (requests == 1) {
        request.response.statusCode = HttpStatus.ok;
        request.response.headers.chunkedTransferEncoding = true;
        await request.response.flush();
        firstResponseStarted.complete();
        await releaseFirstResponse.future;
        await request.response.close();
        return;
      }
      request.response.statusCode = HttpStatus.noContent;
      await request.response.close();
    });
    final store = _Store();
    final coordinator = AuthSessionCoordinator(
      store: store,
      remote: AuthSessionRemote(
        baseUri: Uri.parse('http://${server.address.address}:${server.port}'),
        clientInstanceId: const _ClientInstanceId(),
        requestTimeout: const Duration(milliseconds: 25),
      ),
      tracker: const NoopWorkShiftTracker(),
      localData: const NoopSegregatedSessionData(),
    );
    final scheduler = PendingLogoutRetryScheduler(
      coordinator,
      maxAutomaticAttempts: 1,
    );

    try {
      final firstAttempt = scheduler.start();
      await firstResponseStarted.future;
      await firstAttempt;

      expect(store.ticketCleared, isFalse);
      await scheduler.onConnectivityRestored();

      expect(requests, 2);
      expect(store.ticketCleared, isTrue);
    } finally {
      scheduler.dispose();
      if (!releaseFirstResponse.isCompleted) releaseFirstResponse.complete();
      await serverSubscription.cancel();
      await server.close(force: true);
    }
  });
}

class _ClientInstanceId implements ClientInstanceIdProvider {
  const _ClientInstanceId();

  @override
  Future<String> value() async => '00000000-0000-4000-8000-000000000000';
}

class _Store implements SessionStore {
  var ticketCleared = false;

  @override
  Future<void> clearPendingLogoutTicket(StoredSessionSecrets ticket) async =>
      ticketCleared = true;

  @override
  Future<void> clearSession() async {}

  @override
  Future<StoredSessionSecrets?> clearForLogout() async => null;

  @override
  Future<StoredSessionSecrets?> readSecrets() async =>
      const StoredSessionSecrets(
        userId: 'user',
        companyId: 'company',
        refreshToken: '',
        sessionRevocationTicket: 'pending-ticket',
      );

  @override
  Future<List<StoredSessionSecrets>> readPendingLogoutTickets() async =>
      [(await readSecrets())!];

  @override
  Future<void> replaceSession(AuthenticatedSeller seller) async {}
}
