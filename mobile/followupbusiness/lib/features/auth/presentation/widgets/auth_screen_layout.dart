import 'package:flutter/material.dart';

import 'auth_background.dart';
import 'auth_brand_header.dart';

class AuthScreenLayout extends StatelessWidget {
  const AuthScreenLayout({
    super.key,
    required this.subtitle,
    required this.view,
    required this.child,
    this.onBack,
  });

  final String subtitle;
  final Object view;
  final Widget child;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: onBack == null,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) onBack?.call();
        },
        child: Scaffold(
        // El teclado no debe recalcular ni recentrar la composición de acceso.
        // Se superpone a la vista, como en un formulario móvil convencional.
        resizeToAvoidBottomInset: false,
        body: Stack(children: [
          const Positioned.fill(child: AuthBackground()),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                const horizontalPadding = 22.0;
                final contentWidth =
                    (constraints.maxWidth - horizontalPadding * 2)
                        .clamp(0.0, 420.0);
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: horizontalPadding),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: SizedBox(
                        key: ValueKey(view),
                        width: contentWidth,
                        child:
                            Column(mainAxisSize: MainAxisSize.min, children: [
                          AuthBrandHeader(subtitle: subtitle),
                          const SizedBox(height: 22),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 260),
                            switchInCurve: Curves.easeOutCubic,
                            switchOutCurve: Curves.easeInCubic,
                            transitionBuilder: (currentChild, animation) =>
                                FadeTransition(
                              opacity: animation,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(.08, 0),
                                  end: Offset.zero,
                                ).animate(animation),
                                child: currentChild,
                              ),
                            ),
                            child: KeyedSubtree(
                              key: ValueKey(view),
                              child: child,
                            ),
                          ),
                        ]),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ]),
        ),
      );
}
