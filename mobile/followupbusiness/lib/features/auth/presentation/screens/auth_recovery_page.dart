import 'package:flutter/material.dart';

import '../widgets/auth_login_card.dart';
import '../widgets/auth_shared_content.dart';

class AuthRecoveryPage extends StatelessWidget {
  const AuthRecoveryPage({
    super.key,
    this.onSubmit,
    this.onBack,
    this.emailController,
    this.loading = false,
    this.error = false,
  });

  final VoidCallback? onSubmit;
  final VoidCallback? onBack;
  final TextEditingController? emailController;
  final bool loading;
  final bool error;

  @override
  Widget build(BuildContext context) => loading ? _loading() : _form();

  Widget _form() => Column(children: [
        const AuthIntro(
          icon: Icons.mail_outline,
          title: 'Recuperar contraseña',
          copy:
              'Ingresa tu correo corporativo para enviarte un enlace de recuperación.',
        ),
        if (error)
          const AuthAlert(
              'No pudimos procesar la solicitud. Revisa tu conexión e inténtalo nuevamente.'),
        AuthCard(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AuthField(
              label: 'Correo electrónico',
              hint: 'ejemplo@empresa.com',
              icon: Icons.mail_outline,
              keyboardType: TextInputType.emailAddress,
              controller: emailController,
            ),
            const SizedBox(height: 17),
            AuthPrimaryButton(
                label: error ? 'Reintentar' : 'Enviar enlace',
                onPressed: onSubmit),
            const SizedBox(height: 10),
            AuthSecondaryButton(
                label: 'Volver al inicio', onPressed: onBack ?? () {}),
          ]),
        ),
        const SizedBox(height: 18),
        const AuthNeutralNote(
            'Si el correo está registrado, recibirás un mensaje con instrucciones. Nunca confirmamos la existencia de la cuenta.'),
      ]);

  Widget _loading() => const Column(children: [
        AuthIntro(
          icon: Icons.hourglass_top,
          title: 'Procesando solicitud',
          copy: 'Estamos preparando la respuesta de forma segura.',
        ),
        AuthCard(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AuthField(
                label: 'Correo electrónico',
                hint: 'vendedor@empresa.com',
                icon: Icons.mail_outline,
                enabled: false),
            SizedBox(height: 17),
            AuthPrimaryButton(label: 'Enviando enlace...', loading: true),
            SizedBox(height: 12),
            AuthProgress(),
          ]),
        ),
        SizedBox(height: 18),
        AuthNeutralNote(
            'El doble envío permanece bloqueado hasta terminar la solicitud vigente.'),
      ]);
}

class AuthRecoveryConfirmationPage extends StatelessWidget {
  const AuthRecoveryConfirmationPage(
      {super.key, required this.onBack, required this.onResend});
  final VoidCallback onBack;
  final VoidCallback onResend;

  @override
  Widget build(BuildContext context) => AuthStatusCard(
        icon: Icons.mail_outline,
        title: 'Revisa tu correo',
        copy:
            'Si el correo está registrado, te enviaremos un enlace para restablecer tu contraseña.',
        support:
            'Por seguridad, no confirmamos si el correo existe en la plataforma.',
        primary: 'Volver al inicio',
        onPrimary: onBack,
        secondary: 'Reenviar enlace',
        onSecondary: onResend,
      );
}
