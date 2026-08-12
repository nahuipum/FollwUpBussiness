import 'package:flutter/material.dart';

import '../widgets/auth_login_card.dart';

class AuthLoginPage extends StatelessWidget {
  const AuthLoginPage({
    super.key,
    this.onRecover,
    this.onSubmit,
    this.identifierController,
    this.passwordController,
    this.loading = false,
    this.error = false,
  });

  final VoidCallback? onRecover;
  final VoidCallback? onSubmit;
  final TextEditingController? identifierController;
  final TextEditingController? passwordController;
  final bool loading;
  final bool error;

  @override
  Widget build(BuildContext context) => Column(children: [
        if (error)
          const AuthAlert(
              'No se pudo iniciar sesión. Verifica tus datos e inténtalo nuevamente.'),
        AuthLoginCard(
          onRecover: onRecover ?? () {},
          onSubmit: onSubmit ?? () {},
          identifierController: identifierController,
          passwordController: passwordController,
          loading: loading,
          error: error,
        ),
        if (!loading) ...[
          const SizedBox(height: 18),
          const AuthSupportNote(),
        ],
      ]);
}
