import 'package:flutter/material.dart';
import '../../../../app/app_theme.dart';

class AuthCard extends StatelessWidget {
  const AuthCard({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => DecoratedBox(
      decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: .96),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.navy.withValues(alpha: .055)),
          boxShadow: const [
            BoxShadow(
                color: Color(0x14102A43), blurRadius: 24, offset: Offset(0, 8))
          ]),
      child: Padding(padding: const EdgeInsets.all(22), child: child));
}

class AuthLoginCard extends StatefulWidget {
  const AuthLoginCard(
      {super.key,
      required this.onRecover,
      required this.onSubmit,
      this.identifierController,
      this.passwordController,
      this.loading = false,
      this.error = false});
  final VoidCallback onRecover;
  final VoidCallback onSubmit;
  final TextEditingController? identifierController;
  final TextEditingController? passwordController;
  final bool loading, error;
  @override
  State<AuthLoginCard> createState() => _AuthLoginCardState();
}

class _AuthLoginCardState extends State<AuthLoginCard> {
  @override
  Widget build(BuildContext context) => AuthCard(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        AuthField(
            label: 'Correo electrónico',
            hint: widget.loading || widget.error
                ? 'vendedor@empresa.com'
                : 'ejemplo@empresa.com',
            icon: Icons.mail_outline,
            keyboardType: TextInputType.emailAddress,
            controller: widget.identifierController,
            enabled: !widget.loading),
        const SizedBox(height: 17),
        AuthField(
            label: 'Contraseña',
            hint: 'Ingresa tu contraseña',
            icon: Icons.lock_outline,
            obscureText: true,
            controller: widget.passwordController,
            enabled: !widget.loading),
        const SizedBox(height: 10),
        Align(
            alignment: Alignment.centerRight,
            child: TextButton(
                onPressed: widget.loading ? null : widget.onRecover,
                child: const Text('¿Olvidaste tu contraseña?'))),
        const _RememberDevice(),
        const SizedBox(height: 19),
        AuthPrimaryButton(
            label: widget.loading ? 'Iniciando sesión...' : 'Iniciar sesión',
            loading: widget.loading,
            onPressed: widget.onSubmit),
        if (widget.loading)
          const Padding(
              padding: EdgeInsets.only(top: 12),
              child:
                  LinearProgressIndicator(minHeight: 4, color: AppColors.teal)),
        const SizedBox(height: 17),
        const _SecureNote(),
      ]));
}

class AuthField extends StatefulWidget {
  const AuthField(
      {super.key,
      required this.label,
      required this.hint,
      required this.icon,
      this.obscureText = false,
      this.keyboardType,
      this.controller,
      this.enabled = true,
      this.errorText});
  final String label, hint;
  final IconData icon;
  final bool obscureText, enabled;
  final TextInputType? keyboardType;
  final TextEditingController? controller;
  final String? errorText;
  @override
  State<AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends State<AuthField> {
  bool _obscure = true;
  @override
  Widget build(BuildContext context) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(widget.label,
            style: const TextStyle(
                color: AppColors.navy,
                fontSize: 12.5,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 7),
        TextField(
            controller: widget.controller,
            enabled: widget.enabled,
            obscureText: widget.obscureText && _obscure,
            keyboardType: widget.keyboardType,
            enableSuggestions: !widget.obscureText,
            autocorrect: false,
            decoration: InputDecoration(
                hintText: widget.hint,
                errorText: widget.errorText,
                prefixIcon:
                    Icon(widget.icon, color: const Color(0xFF52677D), size: 19),
                suffixIcon: widget.obscureText
                    ? IconButton(
                        icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: const Color(0xFF52677D),
                            size: 20),
                        onPressed: widget.enabled
                            ? () => setState(() => _obscure = !_obscure)
                            : null)
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 13, vertical: 16),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.line)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.line)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                        color: AppColors.tealMid, width: 1.4)))),
      ]);
}

class AuthPrimaryButton extends StatelessWidget {
  const AuthPrimaryButton(
      {super.key,
      required this.label,
      this.onPressed,
      this.loading = false,
      this.enabled = true});
  final String label;
  final VoidCallback? onPressed;
  final bool loading, enabled;
  @override
  Widget build(BuildContext context) => SizedBox(
      height: 52,
      child: ElevatedButton(
          onPressed: enabled && !loading ? onPressed : null,
          style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.teal,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12))),
          child: loading
              ? Row(mainAxisSize: MainAxisSize.min, children: [
                  const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white)),
                  const SizedBox(width: 9),
                  Text(label)
                ])
              : Text(label)));
}

class AuthSecondaryButton extends StatelessWidget {
  const AuthSecondaryButton(
      {super.key, required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => SizedBox(
      height: 52,
      child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.tealDark,
              side: const BorderSide(color: Color(0xFFA9CED2)),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12))),
          child: Text(label)));
}

class AuthAlert extends StatelessWidget {
  const AuthAlert(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
          color: const Color(0xFFFFF3F5),
          border: Border.all(color: const Color(0xFFF2B6C0)),
          borderRadius: BorderRadius.circular(13)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.error_outline, color: Color(0xFF8F2B3C), size: 18),
        const SizedBox(width: 10),
        Expanded(
            child: Text(text,
                style: const TextStyle(
                    color: Color(0xFF8F2B3C), fontSize: 12, height: 1.45)))
      ]));
}

class _RememberDevice extends StatefulWidget {
  const _RememberDevice();

  @override
  State<_RememberDevice> createState() => _RememberDeviceState();
}

class _RememberDeviceState extends State<_RememberDevice> {
  bool _remember = false;

  @override
  Widget build(BuildContext context) => Semantics(
        checked: _remember,
        label: 'Recordarme en este dispositivo',
        child: InkWell(
          key: const Key('authRememberCheckbox'),
          borderRadius: BorderRadius.circular(6),
          onTap: () => setState(() => _remember = !_remember),
          child: Row(children: [
            SizedBox(
              width: 19,
              height: 19,
              child: Checkbox(
                value: _remember,
                onChanged: (value) =>
                    setState(() => _remember = value ?? false),
              ),
            ),
            const SizedBox(width: 10),
            const Flexible(
              child: Text('Recordarme en este dispositivo',
                  style: TextStyle(
                      color: AppColors.textSecondary, fontSize: 12.5)),
            ),
          ]),
        ),
      );
}

class _SecureNote extends StatelessWidget {
  const _SecureNote();
  @override
  Widget build(BuildContext context) =>
      const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.shield_outlined, size: 16, color: AppColors.tealDark),
        SizedBox(width: 7),
        Flexible(
            child: Text('Tus datos se almacenan de forma segura',
                style:
                    TextStyle(color: AppColors.textSecondary, fontSize: 11.5),
                textAlign: TextAlign.center))
      ]);
}

class AuthSupportNote extends StatelessWidget {
  const AuthSupportNote({super.key});
  @override
  Widget build(BuildContext context) =>
      const Text('Si tienes problemas para acceder, contacta a soporte.',
          textAlign: TextAlign.center,
          style: TextStyle(
              color: AppColors.textSecondary, fontSize: 11.5, height: 1.5));
}
