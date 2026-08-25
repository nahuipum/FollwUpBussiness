import 'package:flutter/material.dart';
import '../../../../app/app_theme.dart';
import '../../../../shared/ui/brand_mark.dart';

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
