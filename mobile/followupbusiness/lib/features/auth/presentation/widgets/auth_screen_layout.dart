import 'package:flutter/material.dart';

import 'auth_background.dart';
import 'auth_brand_header.dart';

class AuthScreenLayout extends StatelessWidget {
  const AuthScreenLayout({
    super.key,
    required this.subtitle,
    required this.view,
    required this.child,
  });

  final String subtitle;
  final Object view;
  final Widget child;

  @override
  Widget build(BuildContext context) => Scaffold(
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
                          child,
                        ]),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ]),
      );
}
