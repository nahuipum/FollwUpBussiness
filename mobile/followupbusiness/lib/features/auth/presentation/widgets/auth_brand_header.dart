import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../../app/app_theme.dart';

class AuthBrandHeader extends StatelessWidget {
  const AuthBrandHeader({super.key, this.subtitle = 'Accede a tu jornada'});
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          const FittedBox(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AuthBrandMark(),
                SizedBox(width: 10),
                _BrandWordmark(),
              ],
            ),
          ),
          const SizedBox(height: 7),
          Text(subtitle,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 13)),
        ],
      );
}

class _BrandWordmark extends StatelessWidget {
  const _BrandWordmark();
  @override
  Widget build(BuildContext context) => RichText(
        text: const TextSpan(
          style: TextStyle(
              color: AppColors.navy,
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.65),
          children: [
            TextSpan(text: 'FollowUp'),
            TextSpan(
                text: 'Business',
                style: TextStyle(
                    color: AppColors.teal, fontWeight: FontWeight.w700)),
          ],
        ),
      );
}

/// Marca compartida con el flujo de recuperación web, servida desde el SVG fuente.
class AuthBrandMark extends StatelessWidget {
  const AuthBrandMark({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
                color: Color(0x33176D77), blurRadius: 20, offset: Offset(0, 8))
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(3),
            child: SvgPicture.asset(
                'assets/brand/password_recovery_brand_mark.svg',
                fit: BoxFit.contain),
          ),
        ),
      );
}
