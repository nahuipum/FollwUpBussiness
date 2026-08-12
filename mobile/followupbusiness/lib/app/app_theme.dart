import 'package:flutter/material.dart';

abstract final class AppColors {
  static const navy = Color(0xFF102A43);
  static const teal = Color(0xFF176D77);
  static const tealDark = Color(0xFF145F68);
  static const tealMid = Color(0xFF38B2AC);
  static const text = Color(0xFF14213D);
  static const textSecondary = Color(0xFF67778A);
  static const line = Color(0xFFCFD9E4);
  static const background = Color(0xFFF7F9FC);
  static const softCyan = Color(0xFFCDF2F4);
}

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.teal,
    brightness: Brightness.light,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme.copyWith(primary: AppColors.teal),
    scaffoldBackgroundColor: AppColors.background,
    fontFamily: 'Inter',
    textTheme: const TextTheme(
      headlineSmall: TextStyle(
        color: AppColors.navy,
        fontSize: 25,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.7,
      ),
      bodyMedium: TextStyle(color: AppColors.textSecondary, fontSize: 13.5),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
    ),
  );
}
