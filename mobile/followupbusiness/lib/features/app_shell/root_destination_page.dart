import 'package:flutter/material.dart';

import '../../app/app_theme.dart';
import '../../shared/ui/design_system.dart';
import 'widgets/fub_bottom_nav_bar.dart';

enum RootVisualState { standard, loading, error, permissionDenied, stale }

class RootDestinationPage extends StatelessWidget {
  const RootDestinationPage(
      {super.key,
      required this.destination,
      required this.visualState,
      required this.onOpenFocused});

  final RootDestination destination;
  final RootVisualState visualState;
  final VoidCallback onOpenFocused;

  @override
  Widget build(BuildContext context) => SafeArea(
        top: false,
        child: SingleChildScrollView(
          key: PageStorageKey<String>('root-${destination.name}'),
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
          child: FocusTraversalGroup(
            child: switch (visualState) {
              RootVisualState.loading => const FubLoadingState(),
              RootVisualState.error => const FubErrorState(
                  title: 'No pudimos cargar este contenido',
                  message:
                      'La información no está disponible. No se muestran datos simulados.'),
              RootVisualState.permissionDenied => const FubPermissionState(
                  title: 'Sin permiso',
                  message:
                      'Esta plantilla no muestra información restringida.'),
              RootVisualState.stale => const FubStaleDataState(
                  title: 'Dato desactualizado',
                  message:
                      'La información visible podría no ser la más reciente.',
                  lastUpdated: 'Última actualización no disponible'),
              RootVisualState.standard => _standardPage(context),
            },
          ),
        ),
      );

  Widget _standardPage(BuildContext context) => switch (destination) {
        RootDestination.home => _HomeTemplate(),
        RootDestination.route => _RouteTemplate(onOpenFocused: onOpenFocused),
        RootDestination.activity => const _ActivityTemplate(),
        RootDestination.more => const _MoreTemplate(),
      };
}

class _PageIntro extends StatelessWidget {
  const _PageIntro(
      {required this.kicker, required this.title, required this.copy});
  final String kicker, title, copy;
  @override
  Widget build(BuildContext context) => Semantics(
        header: true,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(kicker.toUpperCase(),
              style: const TextStyle(
                  color: AppColors.tealDark,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .8)),
          const SizedBox(height: 5),
          Text(title,
              style: const TextStyle(
                  color: AppColors.navy,
                  fontSize: 24,
                  height: 1.18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -.7)),
          const SizedBox(height: 8),
          Text(copy,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 13, height: 1.55)),
          const SizedBox(height: AppSpacing.lg),
        ]),
      );
}

class _HomeTemplate extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _PageIntro(
              kicker: 'Inicio',
              title: 'Tu jornada aún no inicia',
              copy:
                  'El inicio concentra el estado del día y sus avisos operativos.'),
          FubCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                const FubStatusChip(
                    label: 'No iniciada', tone: FubTone.warning),
                const SizedBox(height: 12),
                const Text('Jornada pendiente',
                    style: TextStyle(
                        color: AppColors.navy,
                        fontSize: 18,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                const Text(
                    'Esta es una estructura visual. No inicia una jornada ni activa tracking.',
                    style:
                        TextStyle(color: AppColors.textSecondary, height: 1.5)),
                const SizedBox(height: 15),
                SizedBox(
                    width: double.infinity,
                    child: FubButton(
                        label: 'Iniciar jornada',
                        icon: Icons.play_circle_outline,
                        onPressed: () => showFubToast(context,
                            message:
                                'Acción visual: no se inicia una jornada real.',
                            tone: FubTone.info))),
              ])),
          const SizedBox(height: 12),
          const FubAlert(
              title: 'Sin tracking activo',
              message:
                  'El seguimiento solo se representa como aviso contextual, nunca como un destino.',
              tone: FubTone.info),
        ],
      );
}

class _RouteTemplate extends StatelessWidget {
  const _RouteTemplate({required this.onOpenFocused});
  final VoidCallback onOpenFocused;
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _PageIntro(
              kicker: 'Ruta',
              title: 'Ruta del día',
              copy:
                  'El destino permanece visible aunque no exista contenido disponible.'),
          FubCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                Row(children: [
                  const Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text('Secuencia disponible',
                            style: TextStyle(
                                color: AppColors.navy,
                                fontSize: 18,
                                fontWeight: FontWeight.w700)),
                        SizedBox(height: 4),
                        Text('Referencia visual sin clientes ni direcciones.',
                            style: TextStyle(
                                color: AppColors.textSecondary, fontSize: 11)),
                      ])),
                  const FubStatusChip(label: 'Muestra', tone: FubTone.warning),
                ]),
                const SizedBox(height: 14),
                const _RouteVisual(),
                const SizedBox(height: 14),
                SizedBox(
                    width: double.infinity,
                    child: FubButton(
                        label: 'Abrir ruta del día',
                        icon: Icons.route_outlined,
                        onPressed: () => showFubToast(context,
                            message:
                                'Acción visual: no se abre navegación externa.',
                            tone: FubTone.info))),
              ])),
          const SizedBox(height: 12),
          FubCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                const FubInfoRow(
                    label: 'Navegación externa',
                    value: 'No disponible',
                    icon: Icons.location_on_outlined),
                const SizedBox(height: 12),
                FubButton(
                    label: 'Abrir plantilla enfocada',
                    icon: Icons.visibility_outlined,
                    onPressed: onOpenFocused),
              ])),
        ],
      );
}

class _RouteVisual extends StatelessWidget {
  const _RouteVisual();

  @override
  Widget build(BuildContext context) => Semantics(
      label: 'Diagrama abstracto de ruta, sin datos reales',
      child: Container(
          height: 150,
          decoration: BoxDecoration(
              color: const Color(0xFFEDF8F8),
              border: Border.all(color: const Color(0xFFDCE9E9)),
              borderRadius: BorderRadius.circular(AppRadii.medium)),
          child: Stack(children: [
            const Center(
                child: Icon(Icons.route_outlined,
                    size: 86, color: AppColors.teal)),
            Positioned(
                left: 12,
                bottom: 11,
                child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: const Color(0xFFB8DDE0)),
                        borderRadius: BorderRadius.circular(AppRadii.pill)),
                    child: const Text('Referencia visual · sin datos',
                        style: TextStyle(
                            color: AppColors.tealDark,
                            fontSize: 10,
                            fontWeight: FontWeight.w700))))
          ])));
}

class _ActivityTemplate extends StatelessWidget {
  const _ActivityTemplate();
  @override
  Widget build(BuildContext context) => const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _PageIntro(
              kicker: 'Actividad',
              title: 'Actividad',
              copy:
                  'Agrupa eventos solo cuando estén disponibles; no simula historial.'),
          FubEmptyState(
              title: 'Aún no hay actividad',
              message:
                  'Los eventos reales aparecerán aquí después de registrarse.'),
          SizedBox(height: 12),
          FubCard(
              child: Column(children: [
            FubInfoRow(
                label: 'Jornada',
                value: 'Sin movimientos · muestra',
                icon: Icons.calendar_today_outlined),
            SizedBox(height: 12),
            FubInfoRow(
                label: 'Visitas',
                value: 'Sin registros · muestra',
                icon: Icons.store_outlined),
            SizedBox(height: 12),
            FubInfoRow(
                label: 'Ventas',
                value: 'No disponible todavía',
                icon: Icons.receipt_long_outlined),
          ])),
        ],
      );
}

class _MoreTemplate extends StatelessWidget {
  const _MoreTemplate();
  @override
  Widget build(BuildContext context) => const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _PageIntro(
              kicker: 'Más',
              title: 'Más',
              copy:
                  'Agrupa cuenta, privacidad, permisos y estado técnico sin sumar destinos.'),
          FubCard(
              child: FubInfoRow(
                  label: 'Perfil del vendedor',
                  value: 'Muestra visual sin datos reales',
                  icon: Icons.person_outline)),
          SizedBox(height: 12),
          FubAlert(
              title: 'Configuración no disponible',
              message:
                  'Esta pantalla no ejecuta logout, permisos ni tracking reales.',
              tone: FubTone.info),
        ],
      );
}
