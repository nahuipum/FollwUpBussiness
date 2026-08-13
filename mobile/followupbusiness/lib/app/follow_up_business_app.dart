import 'dart:async';

import 'package:flutter/material.dart';
import 'package:followupbusiness/app/app_theme.dart';
import 'package:followupbusiness/features/auth/application/auth_repository.dart';
import 'package:followupbusiness/features/auth/application/auth_session.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_http_repository.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_session_remote.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_secure_store.dart';
import 'package:followupbusiness/features/auth/infrastructure/client_instance_id.dart';
import 'package:followupbusiness/features/auth/infrastructure/pending_logout_connectivity_listener.dart';
import 'package:followupbusiness/features/auth/infrastructure/unavailable_auth_repository.dart';
import 'package:followupbusiness/features/auth/presentation/auth_login_screen.dart';

class FollowUpBusinessApp extends StatefulWidget {
  const FollowUpBusinessApp({super.key, this.authRepository});
  final AuthRepository? authRepository;

  @override
  State<FollowUpBusinessApp> createState() => _FollowUpBusinessAppState();
}

class _FollowUpBusinessAppState extends State<FollowUpBusinessApp> {
  _AuthRuntime? _runtime;

  @override
  void initState() {
    super.initState();
    if (widget.authRepository == null) _runtime = _authRuntime();
  }

  @override
  void dispose() {
    _runtime?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FollowUpBusiness',
      theme: buildAppTheme(),
      home: AuthLoginScreen(
        repository: widget.authRepository ??
            _runtime?.repository ??
            const UnavailableAuthRepository(),
      ),
    );
  }
}

_AuthRuntime? _authRuntime() {
  const baseUrl = String.fromEnvironment('API_BASE_URL');
  final baseUri = Uri.tryParse(baseUrl);
  if (baseUri == null || !baseUri.hasScheme || !baseUri.hasAuthority) {
    return null;
  }
  final store = AuthSecureStore();
  final clientId = ClientInstanceId();
  final coordinator = AuthSessionCoordinator(
    store: store,
    remote: AuthSessionRemote(baseUri: baseUri, clientInstanceId: clientId),
    tracker: const NoopWorkShiftTracker(),
    localData: const NoopSegregatedSessionData(),
  );
  final scheduler = PendingLogoutRetryScheduler(coordinator);
  final connectivity = PendingLogoutConnectivityListener(
    ConnectivityPlusStatusSource(),
    scheduler.onConnectivityRestored,
  );
  unawaited(scheduler.start());
  unawaited(connectivity.start());
  return _AuthRuntime(
    AuthHttpRepository(
      baseUri: baseUri,
      clientInstanceId: clientId,
      secureStore: store,
      sessionCoordinator: coordinator,
    ),
    scheduler,
    connectivity,
  );
}

class _AuthRuntime {
  _AuthRuntime(this.repository, this._scheduler, this._connectivity);

  final AuthRepository repository;
  final PendingLogoutRetryScheduler _scheduler;
  final PendingLogoutConnectivityListener _connectivity;

  void dispose() {
    _scheduler.dispose();
    unawaited(_connectivity.dispose());
  }
}
