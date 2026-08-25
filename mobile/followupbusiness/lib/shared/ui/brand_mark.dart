import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Marca usada por el acceso. No sustituir por una interpretación del mockup.
class AuthBrandMark extends StatelessWidget {
  const AuthBrandMark({super.key, this.size = 36});

  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(size / 3),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33176D77),
              blurRadius: 20,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(size / 3),
          child: Padding(
            padding: EdgeInsets.all(size / 12),
            child: SvgPicture.asset(
              'assets/brand/password_recovery_brand_mark.svg',
              fit: BoxFit.contain,
            ),
          ),
        ),
      );
}
