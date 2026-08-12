import 'package:flutter/material.dart';

import '../../../../app/app_theme.dart';
import 'auth_login_card.dart';

class AuthIntro extends StatelessWidget {
  const AuthIntro({
    super.key,
    required this.icon,
    required this.title,
    required this.copy,
  });

  final IconData icon;
  final String title;
  final String copy;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Column(children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: const Color(0xFFEAF7F8),
            child: Icon(icon, color: AppColors.teal, size: 28),
          ),
          const SizedBox(height: 13),
          Text(title,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(copy,
              textAlign: TextAlign.center,
              style:
                  const TextStyle(color: AppColors.textSecondary, height: 1.5)),
        ]),
      );
}

class AuthNeutralNote extends StatelessWidget {
  const AuthNeutralNote(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.shield_outlined, color: AppColors.teal, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11.5,
                    height: 1.45)),
          ),
        ],
      );
}

class AuthProgress extends StatelessWidget {
  const AuthProgress({super.key});
  @override
  Widget build(BuildContext context) => const LinearProgressIndicator(
      minHeight: 4, color: AppColors.teal, backgroundColor: Color(0xFFE4EFF0));
}

class AuthPasswordRequirements extends StatelessWidget {
  const AuthPasswordRequirements({super.key});
  @override
  Widget build(BuildContext context) => const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mínimo 8 caracteres', style: _requirementStyle),
          Text('Una mayúscula y una minúscula', style: _requirementStyle),
          Text('Al menos un número', style: _requirementStyle),
          Text('Un carácter especial', style: _requirementStyle),
        ],
      );
}

class AuthStatusCard extends StatelessWidget {
  const AuthStatusCard({
    super.key,
    required this.icon,
    required this.title,
    required this.copy,
    required this.primary,
    required this.onPrimary,
    this.support,
    this.secondary,
    this.onSecondary,
    this.success = false,
    this.warning = false,
  });

  final IconData icon;
  final String title;
  final String copy;
  final String primary;
  final VoidCallback onPrimary;
  final String? support;
  final String? secondary;
  final VoidCallback? onSecondary;
  final bool success;
  final bool warning;

  @override
  Widget build(BuildContext context) => AuthCard(
        child: Column(children: [
          CircleAvatar(
            radius: 29,
            backgroundColor: success
                ? const Color(0xFFEFFAF5)
                : warning
                    ? const Color(0xFFFFF9EB)
                    : const Color(0xFFF0F7FC),
            child: Icon(icon,
                color: success
                    ? const Color(0xFF168A5B)
                    : warning
                        ? const Color(0xFF9B6908)
                        : AppColors.teal,
                size: 29),
          ),
          const SizedBox(height: 18),
          Text(title,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center),
          const SizedBox(height: 10),
          Text(copy,
              textAlign: TextAlign.center,
              style:
                  const TextStyle(color: AppColors.textSecondary, height: 1.5)),
          if (support != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(support!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                      height: 1.45)),
            ),
          const SizedBox(height: 20),
          AuthPrimaryButton(label: primary, onPressed: onPrimary),
          if (secondary != null)
            TextButton(onPressed: onSecondary, child: Text(secondary!)),
        ]),
      );
}

const _requirementStyle =
    TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.75);
