import 'package:flutter/material.dart';

import '../widgets/auth_login_card.dart';
import '../widgets/auth_shared_content.dart';

class AuthResetPasswordPage extends StatelessWidget {
  const AuthResetPasswordPage({
    super.key,
    this.onSubmit,
    this.onValidation,
    this.onExpired,
    this.loading = false,
    this.error = false,
  });

  final VoidCallback? onSubmit;
  final VoidCallback? onValidation;
  final VoidCallback? onExpired;
  final bool loading;
  final bool error;

  @override
  Widget build(BuildContext context) => loading ? _loading() : _form();

  Widget _form() => Column(children: [
        AuthIntro(
          icon: Icons.lock_outline,
          title: 'Restablecer contraseña',
          copy: error
              ? 'Corrige los datos marcados antes de continuar.'
              : 'Crea una nueva contraseña segura para tu cuenta.',
        ),
        if (error)
          const AuthAlert(
              'La nueva contraseña todavía no cumple todos los requisitos.'),
        AuthCard(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AuthField(
              label: 'Nueva contraseña',
              hint: 'Ingresa tu nueva contraseña',
              icon: Icons.lock_outline,
              obscureText: true,
              errorText:
                  error ? 'Agrega una mayúscula y un carácter especial.' : null,
            ),
            const SizedBox(height: 12),
            const AuthPasswordRequirements(),
            const SizedBox(height: 17),
            AuthField(
              label: 'Confirmar contraseña',
              hint: 'Confirma tu nueva contraseña',
              icon: Icons.lock_outline,
              obscureText: true,
              errorText: error ? 'Las contraseñas no coinciden.' : null,
            ),
            const SizedBox(height: 17),
            AuthPrimaryButton(
              label: 'Actualizar contraseña',
              enabled: !error,
              onPressed: onSubmit,
            ),
          ]),
        ),
        const SizedBox(height: 12),
        Wrap(alignment: WrapAlignment.center, children: [
          TextButton(
              onPressed: onValidation,
              child: const Text('Ver estado de validación')),
          TextButton(
              onPressed: onExpired, child: const Text('Ver enlace vencido')),
        ]),
      ]);

  Widget _loading() => const Column(children: [
        AuthIntro(
          icon: Icons.hourglass_top,
          title: 'Restablecer contraseña',
          copy: 'Estamos actualizando tus credenciales.',
        ),
        AuthCard(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AuthField(
                label: 'Nueva contraseña',
                hint: '••••••••••••',
                icon: Icons.lock_outline,
                enabled: false),
            SizedBox(height: 17),
            AuthField(
                label: 'Confirmar contraseña',
                hint: '••••••••••••',
                icon: Icons.lock_outline,
                enabled: false),
            SizedBox(height: 17),
            AuthPrimaryButton(
                label: 'Actualizando contraseña...', loading: true),
            SizedBox(height: 12),
            AuthProgress(),
          ]),
        ),
      ]);
}

class AuthResetSuccessPage extends StatelessWidget {
  const AuthResetSuccessPage({super.key, required this.onLogin});
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) => AuthStatusCard(
        icon: Icons.check,
        success: true,
        title: 'Contraseña actualizada',
        copy:
            'Tu contraseña se actualizó correctamente. Ya puedes volver a iniciar sesión.',
        support:
            'Por seguridad, el enlace utilizado ya no podrá volver a abrirse.',
        primary: 'Ir a iniciar sesión',
        onPrimary: onLogin,
      );
}
