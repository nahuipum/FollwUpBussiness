import 'package:flutter/material.dart';
import 'package:followupbusiness/app/app_theme.dart';
import 'package:followupbusiness/features/auth/application/auth_repository.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_http_repository.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_secure_store.dart';
import 'package:followupbusiness/features/auth/infrastructure/client_instance_id.dart';
import 'package:followupbusiness/features/auth/infrastructure/unavailable_auth_repository.dart';
import 'package:followupbusiness/features/auth/presentation/auth_login_screen.dart';

class FollowUpBusinessApp extends StatelessWidget {
  const FollowUpBusinessApp({super.key, this.authRepository});
  final AuthRepository? authRepository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FollowUpBusiness',
      theme: buildAppTheme(),
      home: AuthLoginScreen(repository: authRepository ?? _authRepository()),
    );
  }
}

AuthRepository _authRepository() {
  const baseUrl = String.fromEnvironment('API_BASE_URL');
  final baseUri = Uri.tryParse(baseUrl);
  if (baseUri == null || !baseUri.hasScheme || !baseUri.hasAuthority) {
    return const UnavailableAuthRepository();
  }
  return AuthHttpRepository(
    baseUri: baseUri,
    clientInstanceId: ClientInstanceId(),
    secureStore: AuthSecureStore(),
  );
}
