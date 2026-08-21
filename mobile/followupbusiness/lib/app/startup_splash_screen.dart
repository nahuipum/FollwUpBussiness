import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'app_theme.dart';

class StartupSplashScreen extends StatefulWidget {
  const StartupSplashScreen({
    super.key,
    required this.duration,
    required this.child,
  });

  final Duration duration;
  final Widget child;

  @override
  State<StartupSplashScreen> createState() => _StartupSplashScreenState();
}

class _StartupSplashScreenState extends State<StartupSplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _loadingController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 650),
  )..repeat();
  bool _ready = false;
  bool _showDetails = false;

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 180), () {
      if (mounted) setState(() => _showDetails = true);
    });
    Future<void>.delayed(widget.duration, () {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  void dispose() {
    _loadingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
        duration: const Duration(milliseconds: 480),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, .025),
              end: Offset.zero,
            ).animate(animation),
            child: child,
          ),
        ),
        child: _ready
            ? widget.child
            : Scaffold(
                key: const ValueKey('startup-splash'),
                backgroundColor: AppColors.background,
                body: Stack(
                  children: [
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFDDF4F5), AppColors.background],
                          begin: Alignment.topCenter,
                          end: Alignment.center,
                        ),
                      ),
                      child: SizedBox.expand(),
                    ),
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 280),
                            curve: Curves.easeOutCubic,
                            padding: _showDetails
                                ? const EdgeInsets.all(15)
                                : EdgeInsets.zero,
                            decoration: BoxDecoration(
                              color: _showDetails
                                  ? Colors.white
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: _showDetails
                                  ? const [
                                      BoxShadow(
                                        color: Color(0x1A176D77),
                                        blurRadius: 28,
                                        offset: Offset(0, 12),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: SizedBox(
                              width: 52,
                              height: 52,
                              child: SvgPicture.asset(
                                'assets/brand/password_recovery_brand_mark.svg',
                              ),
                            ),
                          ),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 280),
                            switchInCurve: Curves.easeOutCubic,
                            transitionBuilder: (child, animation) =>
                                FadeTransition(
                              opacity: animation,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0, -.08),
                                  end: Offset.zero,
                                ).animate(animation),
                                child: child,
                              ),
                            ),
                            child: _showDetails
                                ? Padding(
                                    key: const ValueKey('splash-details'),
                                    padding: const EdgeInsets.only(top: 20),
                                    child: Column(
                                      children: [
                                        const Text(
                                          'FollowUpBusiness',
                                          style: TextStyle(
                                            color: AppColors.navy,
                                            fontSize: 23,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: -.6,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        const Text(
                                          'Preparando tu jornada',
                                          style: TextStyle(
                                            color: AppColors.textSecondary,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(height: 24),
                                        SizedBox(
                                          width: 96,
                                          child: AnimatedBuilder(
                                            animation: _loadingController,
                                            builder: (_, __) =>
                                                LinearProgressIndicator(
                                              value: _loadingController.value,
                                              minHeight: 4,
                                              borderRadius:
                                                  const BorderRadius.all(
                                                Radius.circular(8),
                                              ),
                                              color: AppColors.teal,
                                              backgroundColor:
                                                  const Color(0xFFD5E9EA),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : const SizedBox(
                                    key: ValueKey('splash-empty'),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      );
}
