import 'package:flutter/material.dart';
import 'package:followupbussiness/features/app_shell/app_shell.dart';

class FollowUpBussinessApp extends StatelessWidget {
  const FollowUpBussinessApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Follow Up Bussiness',
      theme: ThemeData(colorSchemeSeed: Colors.indigo),
      home: const AppShell(),
    );
  }
}
