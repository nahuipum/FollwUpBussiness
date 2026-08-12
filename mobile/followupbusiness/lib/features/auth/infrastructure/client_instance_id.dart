import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

abstract interface class ClientInstanceIdProvider {
  Future<String> value();
}

class ClientInstanceId implements ClientInstanceIdProvider {
  ClientInstanceId({Future<SharedPreferences>? preferences})
      : _preferences = preferences ?? SharedPreferences.getInstance();

  final Future<SharedPreferences> _preferences;
  static const _key = 'auth.clientInstanceId';

  @override
  Future<String> value() async {
    final preferences = await _preferences;
    final existing = preferences.getString(_key);
    if (existing != null) return existing;
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex =
        bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
    final value =
        '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
    await preferences.setString(_key, value);
    return value;
  }
}
