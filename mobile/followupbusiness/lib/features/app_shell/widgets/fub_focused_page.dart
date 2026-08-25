import 'package:flutter/material.dart';

import '../../../app/app_theme.dart';
import '../../../shared/ui/design_system.dart';

/// Plantilla sin barra inferior para formularios o una visita activa futura.
class FubFocusedPage extends StatelessWidget {
  const FubFocusedPage(
      {super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          toolbarHeight: 72,
          leading: Semantics(
            button: true,
            label: 'Volver a Ruta',
            child: IconButton(
              tooltip: 'Volver a Ruta',
              icon: const Icon(Icons.arrow_back_outlined),
              onPressed: () => Navigator.of(context).maybePop(),
            ),
          ),
          title:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title,
                style: const TextStyle(
                    color: AppColors.navy,
                    fontSize: 16,
                    fontWeight: FontWeight.w800)),
            Text(subtitle,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 10)),
          ]),
          actions: [
            IconButton(
              tooltip: 'Cerrar pantalla enfocada',
              onPressed: () => Navigator.of(context).maybePop(),
              icon: const Icon(Icons.close),
            )
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: FocusTraversalGroup(
              child: const FubStateTemplate(
                title: 'Plantilla enfocada',
                message:
                    'Espacio visual para una visita activa o formulario futuro. No representa una visita, dato ni acción real.',
                tone: FubTone.info,
                icon: Icons.visibility_outlined,
              ),
            ),
          ),
        ),
      );
}
