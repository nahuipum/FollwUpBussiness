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
  static const navy2 = Color(0xFF163B62);
  static const navy3 = Color(0xFF0F6B78);
  static const tealLight = Color(0xFF7DD3D7);
  static const formText = Color(0xFF26384A);
  static const muted = Color(0xFF8090A0);
  static const placeholder = Color(0xFF96A4B2);
  static const danger = Color(0xFFD83B57);
  static const dangerDark = Color(0xFF8F2B3C);
  static const dangerBackground = Color(0xFFFFF3F5);
  static const dangerLine = Color(0xFFF2B6C0);
  static const success = Color(0xFF168A5B);
  static const successDark = Color(0xFF116746);
  static const successBackground = Color(0xFFEFFAF5);
  static const successLine = Color(0xFFBDE8D5);
  static const info = Color(0xFF246B9B);
  static const infoDark = Color(0xFF1D5E87);
  static const infoBackground = Color(0xFFF0F7FC);
  static const infoLine = Color(0xFFC6E1F2);
  static const warning = Color(0xFF9B6908);
  static const warningDark = Color(0xFF7F570A);
  static const warningBackground = Color(0xFFFFF9EB);
  static const warningLine = Color(0xFFF2D89A);
  static const softSurface = Color(0xFFF8FBFD);
  static const disabledBackground = Color(0xFFF5F7F9);
  static const disabledLine = Color(0xFFD8E0E6);
  static const skeleton = Color(0xFFE9EEF2);
}

abstract final class AppSpacing {
  static const xxs = 4.0,
      xs = 8.0,
      sm = 12.0,
      md = 16.0,
      lg = 20.0,
      xl = 24.0,
      xxl = 32.0;
}

abstract final class AppRadii {
  static const small = 12.0, medium = 18.0, large = 24.0, pill = 999.0;
}

ThemeData buildAppTheme() {
  const scheme = ColorScheme.light(
    primary: AppColors.teal,
    onPrimary: Colors.white,
    secondary: AppColors.tealMid,
    onSecondary: AppColors.navy,
    surface: Colors.white,
    onSurface: AppColors.text,
    error: AppColors.danger,
    onError: Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
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
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      hintStyle: const TextStyle(color: AppColors.placeholder),
      contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 16),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: const BorderSide(color: AppColors.line)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: const BorderSide(color: AppColors.line)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: const BorderSide(color: AppColors.tealMid, width: 2)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: const BorderSide(color: AppColors.danger)),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: const Color(0xFF123A46),
      contentTextStyle: const TextStyle(color: Colors.white),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.small)),
    ),
  );
}
