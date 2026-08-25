import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

import '../../app/app_theme.dart';
import '../../shared/ui/design_system.dart';
import 'root_destination_page.dart';
import 'widgets/fub_bottom_nav_bar.dart';
import 'widgets/fub_focused_page.dart';

class AppShell extends StatefulWidget {
  const AppShell(
      {super.key,
      this.initialDestination = RootDestination.home,
      this.visualState = RootVisualState.standard});

  final RootDestination initialDestination;
  final RootVisualState visualState;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with RestorationMixin {
  late final RestorableInt _destination =
      RestorableInt(widget.initialDestination.index);
  final List<RootDestination> _history = [];
  var _transitioning = false;

  @override
  String get restorationId => 'authenticated-shell';

  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_destination, 'root-destination');
  }

  @override
  void dispose() {
    _destination.dispose();
    super.dispose();
  }

  RootDestination get _current => RootDestination.values[_destination.value];

  Future<void> _select(RootDestination destination,
      {bool addToHistory = true}) async {
    if (destination == _current || _transitioning) return;
    if (addToHistory) _history.add(_current);
    setState(() => _transitioning = true);
    await Future<void>.delayed(const Duration(milliseconds: 90));
    if (!mounted) return;
    setState(() {
      _destination.value = destination.index;
      _transitioning = false;
    });
    unawaited(SemanticsService.sendAnnouncement(
        View.of(context), destination.label, TextDirection.ltr));
  }

  void _goBack() {
    if (_history.isNotEmpty) {
      unawaited(_select(_history.removeLast(), addToHistory: false));
      return;
    }
    if (_current != RootDestination.home) {
      unawaited(_select(RootDestination.home, addToHistory: false));
      return;
    }
    showFubToast(context,
        message: 'Ya estás en Inicio. La sesión permanece activa.');
  }

  void _openFocused() {
    Navigator.of(context).push(MaterialPageRoute<void>(
        settings: const RouteSettings(name: '/focused-template'),
        builder: (_) => const FubFocusedPage(
            title: 'Visita activa', subtitle: 'Regreso controlado')));
  }

  @override
  Widget build(BuildContext context) => PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _goBack();
      },
      child: Scaffold(
        appBar: FubAppBar(
            title: 'FollowUpBusiness',
            subtitle: _current.label,
            showBrandWordmark: true,
            actions: [
              IconButton(
                  key: const Key('operational-notifications'),
                  tooltip: 'Avisos operativos',
                  onPressed: () => showFubToast(context,
                      message:
                          'Los avisos operativos son una muestra visual de esta plantilla.'),
                  icon: const Icon(Icons.notifications_none,
                      color: Color(0xFF52677D))),
              Padding(
                  padding: EdgeInsets.only(right: 14),
                  child: Semantics(
                      label: 'Perfil del vendedor',
                      child: CircleAvatar(
                          radius: 17,
                          backgroundColor: Color(0xFFEDF8F8),
                          child: Text('V',
                              style: TextStyle(
                                  color: AppColors.tealDark,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800)))))
            ]),
        body: AnimatedOpacity(
            duration: const Duration(milliseconds: 90),
            curve: Curves.easeOut,
            opacity: _transitioning ? 0 : 1,
            child: RootDestinationPage(
                key: ValueKey('${_current.name}-${widget.visualState.name}'),
                destination: _current,
                visualState: widget.visualState,
                onOpenFocused: _openFocused)),
        bottomNavigationBar:
            FubBottomNavBar(current: _current, onDestinationSelected: _select),
      ));
}
