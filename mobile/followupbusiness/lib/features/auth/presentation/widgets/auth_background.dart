import 'package:flutter/material.dart';

/// Fondo continuo fiel al mockup: base clara y zona cyan terminada en ola.
class AuthBackground extends StatelessWidget {
  const AuthBackground({super.key});

  @override
  Widget build(BuildContext context) =>
      CustomPaint(painter: _AuthBackgroundPainter());
}

class _AuthBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFF7F9FC),
    );
    final cyan = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFCDF2F4), Color(0xFFF7F9FC)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, size.width, 112));
    final shape = Path()
      ..moveTo(-size.width * .06, 0)
      ..lineTo(size.width * 1.06, 0)
      ..lineTo(size.width * 1.06, 79)
      ..cubicTo(
          size.width * .87, 76, size.width * .98, 82, size.width * .72, 88)
      ..cubicTo(
          size.width * .46, 99, size.width * .18, 53, -size.width * .06, 55)
      ..close();
    canvas.drawPath(shape, cyan);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
