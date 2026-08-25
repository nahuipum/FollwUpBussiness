import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import 'brand_mark.dart';

enum FubTone { info, success, warning, error }

enum FubButtonVariant { primary, secondary, text, destructive }

class FubAppBar extends StatelessWidget implements PreferredSizeWidget {
  const FubAppBar(
      {super.key,
      required this.title,
      this.subtitle,
      this.actions = const [],
      this.showBrandWordmark = false});
  final String title;
  final String? subtitle;
  final List<Widget> actions;
  final bool showBrandWordmark;
  @override
  Size get preferredSize => const Size.fromHeight(72);
  @override
  Widget build(BuildContext context) => AppBar(
      toolbarHeight: 72,
      elevation: 1,
      shadowColor: AppColors.navy.withValues(alpha: .08),
      titleSpacing: AppSpacing.md,
      title: Row(children: [
        const AuthBrandMark(),
        const SizedBox(width: 11),
        Expanded(
            child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              showBrandWordmark
                  ? RichText(
                      text: const TextSpan(
                          style: TextStyle(
                              color: AppColors.navy,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -.5),
                          children: [
                          TextSpan(text: 'FollowUp'),
                          TextSpan(
                              text: 'Business',
                              style: TextStyle(
                                  color: AppColors.teal,
                                  fontWeight: FontWeight.w700))
                        ]))
                  : Text(title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -.5)),
              if (subtitle != null)
                Text(subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 10)),
            ])),
      ]),
      actions: actions);
}

class FubButton extends StatelessWidget {
  const FubButton(
      {super.key,
      required this.label,
      this.onPressed,
      this.variant = FubButtonVariant.primary,
      this.loading = false,
      this.icon});
  final String label;
  final VoidCallback? onPressed;
  final FubButtonVariant variant;
  final bool loading;
  final IconData? icon;
  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    final child = loading
        ? const SizedBox(
            width: 18,
            height: 18,
            child:
                CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
        : Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[
              Icon(icon, size: 18),
              const SizedBox(width: 8)
            ],
            Flexible(child: Text(label, textAlign: TextAlign.center))
          ]);
    final style = ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
        padding:
            const WidgetStatePropertyAll(EdgeInsets.symmetric(horizontal: 16)),
        shape: WidgetStatePropertyAll(RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.small))));
    return Semantics(
        button: true,
        enabled: enabled,
        label: label,
        child: switch (variant) {
          FubButtonVariant.primary => ElevatedButton(
              onPressed: enabled ? onPressed : null,
              style: style.copyWith(
                  backgroundColor: const WidgetStatePropertyAll(AppColors.teal),
                  foregroundColor: const WidgetStatePropertyAll(Colors.white)),
              child: child),
          FubButtonVariant.secondary => OutlinedButton(
              onPressed: enabled ? onPressed : null,
              style: style.copyWith(
                  foregroundColor:
                      const WidgetStatePropertyAll(AppColors.tealDark),
                  side: const WidgetStatePropertyAll(
                      BorderSide(color: Color(0xFFA9CED2)))),
              child: child),
          FubButtonVariant.text => TextButton(
              onPressed: enabled ? onPressed : null,
              style: style.copyWith(
                  foregroundColor:
                      const WidgetStatePropertyAll(AppColors.tealDark)),
              child: child),
          FubButtonVariant.destructive => ElevatedButton(
              onPressed: enabled ? onPressed : null,
              style: style.copyWith(
                  backgroundColor:
                      const WidgetStatePropertyAll(AppColors.danger),
                  foregroundColor: const WidgetStatePropertyAll(Colors.white)),
              child: child),
        });
  }
}

class FubTextField extends StatelessWidget {
  const FubTextField(
      {super.key,
      required this.label,
      this.controller,
      this.hint,
      this.errorText,
      this.enabled = true,
      this.maxLines = 1,
      this.keyboardType,
      this.prefixIcon});
  final String label;
  final TextEditingController? controller;
  final String? hint, errorText;
  final bool enabled;
  final int maxLines;
  final TextInputType? keyboardType;
  final IconData? prefixIcon;
  @override
  Widget build(BuildContext context) => Semantics(
      textField: true,
      label: label,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.navy,
                fontSize: 12,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 7),
        TextField(
            controller: controller,
            enabled: enabled,
            maxLines: maxLines,
            keyboardType: keyboardType,
            decoration: InputDecoration(
                hintText: hint,
                errorText: errorText,
                prefixIcon: prefixIcon == null
                    ? null
                    : Icon(prefixIcon,
                        color: const Color(0xFF52677D), size: 19)))
      ]));
}

class FubSelectField<T> extends StatelessWidget {
  const FubSelectField(
      {super.key,
      required this.label,
      required this.items,
      this.value,
      this.onChanged,
      this.hint});
  final String label;
  final List<DropdownMenuItem<T>> items;
  final T? value;
  final ValueChanged<T?>? onChanged;
  final String? hint;
  @override
  Widget build(BuildContext context) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.navy,
                fontSize: 12,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 7),
        DropdownButtonFormField<T>(
            initialValue: value,
            items: items,
            onChanged: onChanged,
            hint: hint == null ? null : Text(hint!))
      ]);
}

class FubCard extends StatelessWidget {
  const FubCard(
      {super.key,
      required this.child,
      this.padding = const EdgeInsets.all(AppSpacing.md)});
  final Widget child;
  final EdgeInsetsGeometry padding;
  @override
  Widget build(BuildContext context) => Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.medium),
          side: BorderSide(color: AppColors.navy.withValues(alpha: .07))),
      child: Padding(padding: padding, child: child));
}

class FubInfoRow extends StatelessWidget {
  const FubInfoRow(
      {super.key,
      required this.label,
      required this.value,
      this.icon,
      this.trailing});
  final String label, value;
  final IconData? icon;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Semantics(
      label: '$label: $value',
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (icon != null) ...[
          Icon(icon, color: AppColors.tealDark, size: 20),
          const SizedBox(width: 10)
        ],
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 11)),
          const SizedBox(height: 2),
          Text(value,
              style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 14,
                  fontWeight: FontWeight.w700))
        ])),
        ...<Widget?>[trailing].whereType<Widget>(),
      ]));
}

class FubStatusChip extends StatelessWidget {
  const FubStatusChip(
      {super.key, required this.label, required this.tone, this.icon});
  final String label;
  final FubTone tone;
  final IconData? icon;
  @override
  Widget build(BuildContext context) {
    final c = _tone(tone);
    return Semantics(
        label: label,
        child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
            decoration: BoxDecoration(
                color: c.background,
                border: Border.all(color: c.line),
                borderRadius: BorderRadius.circular(AppRadii.pill)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(icon ?? c.icon, size: 14, color: c.foreground),
              const SizedBox(width: 5),
              Text(label,
                  style: TextStyle(
                      color: c.foreground,
                      fontSize: 11,
                      fontWeight: FontWeight.w700))
            ])));
  }
}

class FubBadge extends FubStatusChip {
  const FubBadge(
      {super.key, required super.label, required super.tone, super.icon});
}

class FubAlert extends StatelessWidget {
  const FubAlert(
      {super.key,
      required this.title,
      required this.message,
      required this.tone});
  final String title, message;
  final FubTone tone;

  @override
  Widget build(BuildContext context) {
    final c = _tone(tone);
    return Semantics(
      liveRegion: true,
      label: '$title. $message',
      child: Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
            color: c.background,
            border: Border.all(color: c.line),
            borderRadius: BorderRadius.circular(13)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(c.icon, color: c.foreground, size: 18),
          const SizedBox(width: 10),
          Expanded(
              child: RichText(
                  text: TextSpan(
                      style: TextStyle(
                          color: c.foreground, fontSize: 12, height: 1.45),
                      children: [
                TextSpan(
                    text: '$title\n',
                    style: const TextStyle(fontWeight: FontWeight.w800)),
                TextSpan(text: message)
              ]))),
        ]),
      ),
    );
  }
}

void showFubToast(BuildContext context,
    {required String message, FubTone tone = FubTone.info}) {
  final c = _tone(tone);
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        Icon(c.icon, color: Colors.white),
        const SizedBox(width: 10),
        Expanded(child: Text(message))
      ]),
      backgroundColor: c.foreground));
}

Future<T?> showFubDialog<T>(BuildContext context,
    {required String title,
    required String message,
    required FubTone tone,
    required Widget confirm,
    Widget? cancel}) {
  final c = _tone(tone);
  return showDialog<T>(
      context: context,
      builder: (_) => AlertDialog(
              icon: Icon(c.icon, color: c.foreground),
              title: Text(title),
              content: Text(message),
              actions: [
                ...<Widget?>[cancel].whereType<Widget>(),
                confirm
              ]));
}

Future<T?> showFubBottomSheet<T>(BuildContext context,
    {required String title,
    required String message,
    required FubTone tone,
    required Widget child}) {
  final c = _tone(tone);
  return showModalBottomSheet<T>(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(
          child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Icon(c.icon, color: c.foreground),
                      const SizedBox(width: 10),
                      Expanded(
                          child: Text(title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 18)))
                    ]),
                    const SizedBox(height: 8),
                    Text(message,
                        style: const TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 16),
                    child
                  ]))));
}

class FubLoadingState extends StatelessWidget {
  const FubLoadingState({super.key, this.label = 'Cargando contenido…'});
  final String label;
  @override
  Widget build(BuildContext context) => Semantics(
      liveRegion: true,
      label: label,
      child: const Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(
            width: 30,
            height: 30,
            child: CircularProgressIndicator(color: AppColors.teal)),
        SizedBox(height: 13),
        Text('Cargando contenido…',
            style: TextStyle(color: AppColors.textSecondary))
      ])));
}

class FubEmptyState extends FubStateTemplate {
  const FubEmptyState(
      {super.key, required super.title, required super.message, super.action})
      : super(tone: FubTone.info, icon: Icons.info_outline);
}

class FubErrorState extends FubStateTemplate {
  const FubErrorState(
      {super.key, required super.title, required super.message, super.action})
      : super(tone: FubTone.error, icon: Icons.error_outline);
}

class FubPermissionState extends FubStateTemplate {
  const FubPermissionState(
      {super.key, required super.title, required super.message, super.action})
      : super(tone: FubTone.warning, icon: Icons.shield_outlined);
}

class FubStaleDataState extends FubStateTemplate {
  const FubStaleDataState(
      {super.key,
      required super.title,
      required super.message,
      required this.lastUpdated,
      super.action})
      : super(tone: FubTone.warning, icon: Icons.warning_amber_outlined);
  final String lastUpdated;
  @override
  Widget build(BuildContext context) =>
      Column(mainAxisSize: MainAxisSize.min, children: [
        super.build(context),
        const SizedBox(height: 8),
        FubStatusChip(label: lastUpdated, tone: FubTone.warning)
      ]);
}

class FubStateTemplate extends StatelessWidget {
  const FubStateTemplate(
      {super.key,
      required this.title,
      required this.message,
      required this.tone,
      required this.icon,
      this.action});
  final String title, message;
  final FubTone tone;
  final IconData icon;
  final Widget? action;
  @override
  Widget build(BuildContext context) {
    final c = _tone(tone);
    return Semantics(
        container: true,
        label: '$title. $message',
        child: FubCard(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                  color: c.background,
                  border: Border.all(color: c.line),
                  borderRadius: BorderRadius.circular(21)),
              child: Icon(icon, color: c.foreground, size: 34)),
          const SizedBox(height: 13),
          Text(title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 7),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 12, height: 1.5)),
          if (action != null) ...[const SizedBox(height: 14), action!]
        ])));
  }
}

_Tone _tone(FubTone tone) => switch (tone) {
      FubTone.info => const _Tone(AppColors.infoDark, AppColors.infoBackground,
          AppColors.infoLine, Icons.info_outline),
      FubTone.success => const _Tone(
          AppColors.successDark,
          AppColors.successBackground,
          AppColors.successLine,
          Icons.check_circle_outline),
      FubTone.warning => const _Tone(
          AppColors.warningDark,
          AppColors.warningBackground,
          AppColors.warningLine,
          Icons.warning_amber_outlined),
      FubTone.error => const _Tone(AppColors.dangerDark,
          AppColors.dangerBackground, AppColors.dangerLine, Icons.error_outline)
    };

class _Tone {
  const _Tone(this.foreground, this.background, this.line, this.icon);
  final Color foreground, background, line;
  final IconData icon;
}
