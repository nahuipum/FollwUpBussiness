import 'dart:async';

import 'package:flutter/material.dart';

import '../application/auth_models.dart';
import '../application/auth_repository.dart';
import '../infrastructure/unavailable_auth_repository.dart';
import 'screens/auth_login_page.dart';
import 'screens/auth_recovery_page.dart';
import 'screens/auth_reset_password_page.dart';
import 'screens/auth_token_expired_page.dart';
import 'screens/seller_home_page.dart';
import 'widgets/auth_screen_layout.dart';

/// Coordinador visual temporal para enlazar los estados del mockup MOB-001.
/// No autentica, persiste ni transmite credenciales.
class AuthLoginScreen extends StatefulWidget {
  const AuthLoginScreen({super.key, this.repository});
  final AuthRepository? repository;

  @override
  State<AuthLoginScreen> createState() => _AuthLoginScreenState();
}

enum AuthView {
  login,
  loginLoading,
  loginError,
  recover,
  recoverLoading,
  recoverError,
  recoverConfirmation,
  reset,
  resetError,
  resetLoading,
  resetSuccess,
  tokenExpired,
}

class _AuthLoginScreenState extends State<AuthLoginScreen> {
  AuthView _view = AuthView.login;
  late final AuthRepository _repository =
      widget.repository ?? const UnavailableAuthRepository();
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  final _recoveryEmail = TextEditingController();

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    _recoveryEmail.dispose();
    super.dispose();
  }

  void _show(AuthView view) {
    setState(() => _view = view);
  }

  Future<void> _login() async {
    _show(AuthView.loginLoading);
    final result = await _repository.login(
        identifier: _identifier.text, password: _password.text);
    if (!mounted) return;
    if (result.isSuccess) {
      await Navigator.of(context).pushReplacement(
          MaterialPageRoute<void>(builder: (_) => const SellerHomePage()));
      return;
    }
    _show(AuthView.loginError);
  }

  Future<void> _recovery() async {
    _show(AuthView.recoverLoading);
    final result =
        await _repository.requestRecovery(email: _recoveryEmail.text);
    if (!mounted) return;
    // La confirmación se mantiene neutral para todo resultado no validable por el cliente.
    _show(result.failure == AuthFailure.throttled ||
            result.failure == AuthFailure.unavailable ||
            result.failure == AuthFailure.configuration
        ? AuthView.recoverError
        : AuthView.recoverConfirmation);
  }

  String get _subtitle => switch (_view) {
        AuthView.login ||
        AuthView.loginLoading ||
        AuthView.loginError =>
          'Accede a tu jornada',
        AuthView.reset ||
        AuthView.resetError ||
        AuthView.resetLoading =>
          'Crea una contraseña segura',
        _ => 'Acceso seguro',
      };

  @override
  Widget build(BuildContext context) => AuthScreenLayout(
        subtitle: _subtitle,
        view: _view,
        child: _content(),
      );

  Widget _content() => switch (_view) {
        AuthView.login => AuthLoginPage(
            onRecover: () => _show(AuthView.recover),
            onSubmit: _login,
            identifierController: _identifier,
            passwordController: _password,
          ),
        AuthView.loginLoading => const AuthLoginPage(loading: true),
        AuthView.loginError => AuthLoginPage(
            error: true,
            onRecover: () => _show(AuthView.recover),
            onSubmit: _login,
            identifierController: _identifier,
            passwordController: _password,
          ),
        AuthView.recover => AuthRecoveryPage(
            onSubmit: _recovery,
            onBack: () => _show(AuthView.login),
            emailController: _recoveryEmail,
          ),
        AuthView.recoverLoading => const AuthRecoveryPage(loading: true),
        AuthView.recoverError => AuthRecoveryPage(
            error: true,
            onSubmit: _recovery,
            onBack: () => _show(AuthView.login),
            emailController: _recoveryEmail,
          ),
        AuthView.recoverConfirmation => AuthRecoveryConfirmationPage(
            onBack: () => _show(AuthView.login),
            onResend: _recovery,
          ),
        AuthView.reset => AuthResetPasswordPage(
            onSubmit: () => _show(AuthView.resetError),
            onValidation: () => _show(AuthView.resetError),
            onExpired: () => _show(AuthView.tokenExpired),
          ),
        AuthView.resetError => AuthResetPasswordPage(
            error: true,
            onSubmit: () => _show(AuthView.resetError),
            onValidation: () => _show(AuthView.resetError),
            onExpired: () => _show(AuthView.tokenExpired),
          ),
        AuthView.resetLoading => const AuthResetPasswordPage(loading: true),
        AuthView.resetSuccess => AuthResetSuccessPage(
            onLogin: () => _show(AuthView.login),
          ),
        AuthView.tokenExpired => AuthTokenExpiredPage(
            onRecover: () => _show(AuthView.recover),
            onLogin: () => _show(AuthView.login),
          ),
      };
}
