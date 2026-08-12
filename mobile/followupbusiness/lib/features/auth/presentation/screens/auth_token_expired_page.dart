import 'package:flutter/material.dart';

import '../widgets/auth_shared_content.dart';

class AuthTokenExpiredPage extends StatelessWidget {
  const AuthTokenExpiredPage({
    super.key,
    required this.onRecover,
    required this.onLogin,
  });

  final VoidCallback onRecover;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) => AuthStatusCard(
        icon: Icons.link_off_outlined,
        warning: true,
        title: 'Enlace no válido',
        copy:
            'El enlace de recuperación ya venció o no es válido. Solicita uno nuevo para continuar.',
        primary: 'Solicitar nuevo enlace',
        onPrimary: onRecover,
        secondary: 'Volver al inicio',
        onSecondary: onLogin,
      );
}
