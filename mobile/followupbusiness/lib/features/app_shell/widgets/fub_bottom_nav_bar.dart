import 'package:flutter/material.dart';

import '../../../app/app_theme.dart';

enum RootDestination { home, route, activity, more }

extension RootDestinationLabel on RootDestination {
  String get label => switch (this) {
        RootDestination.home => 'Inicio',
        RootDestination.route => 'Ruta',
        RootDestination.activity => 'Actividad',
        RootDestination.more => 'Más',
      };

  IconData get icon => switch (this) {
        RootDestination.home => Icons.home_outlined,
        RootDestination.route => Icons.route_outlined,
        RootDestination.activity => Icons.bar_chart_outlined,
        RootDestination.more => Icons.more_horiz,
      };
}

/// Navegación exclusiva del shell autenticado y de sus cuatro destinos raíz.
class FubBottomNavBar extends StatelessWidget {
  const FubBottomNavBar(
      {super.key, required this.current, required this.onDestinationSelected});

  final RootDestination current;
  final ValueChanged<RootDestination> onDestinationSelected;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 78,
        child: Semantics(
          container: true,
          label: 'Navegación principal',
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .98),
              border: Border(
                  top:
                      BorderSide(color: AppColors.navy.withValues(alpha: .09))),
              boxShadow: const [
                BoxShadow(
                    color: Color(0x0E102A43),
                    blurRadius: 22,
                    offset: Offset(0, -7))
              ],
            ),
            child: SafeArea(
              top: false,
              minimum: const EdgeInsets.fromLTRB(8, 7, 8, 10),
              child: Row(
                children: RootDestination.values
                    .map((destination) => Expanded(
                          child: _BottomNavItem(
                            destination: destination,
                            selected: destination == current,
                            onTap: () => onDestinationSelected(destination),
                          ),
                        ))
                    .toList(growable: false),
              ),
            ),
          ),
        ),
      );
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem(
      {required this.destination, required this.selected, required this.onTap});

  final RootDestination destination;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.tealDark : AppColors.muted;
    return Semantics(
      button: true,
      selected: selected,
      label: destination.label,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: InkWell(
          key: Key('bottom-nav-${destination.name}'),
          onTap: onTap,
          borderRadius: BorderRadius.circular(11),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            constraints: const BoxConstraints(minHeight: 56),
            decoration: BoxDecoration(
              color: selected ? const Color(0xFFEDF8F8) : Colors.transparent,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Stack(alignment: Alignment.center, children: [
              if (selected)
                Positioned(
                  top: 0,
                  child: Container(
                    width: 22,
                    height: 3,
                    decoration: const BoxDecoration(
                      color: AppColors.teal,
                      borderRadius: BorderRadius.vertical(
                          bottom: Radius.circular(AppRadii.pill)),
                    ),
                  ),
                ),
              Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(destination.icon, size: 21, color: color),
                const SizedBox(height: 4),
                Text(destination.label,
                    style: TextStyle(
                        color: color,
                        fontSize: 10,
                        fontWeight: FontWeight.w700))
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}
