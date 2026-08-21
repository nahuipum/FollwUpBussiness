import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:followupbusiness/features/auth/application/auth_models.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_http_repository.dart';
import 'package:followupbusiness/features/auth/infrastructure/auth_secure_store.dart';
import 'package:followupbusiness/features/auth/infrastructure/client_instance_id.dart';

void main() {
  group('AuthHttpRepository', () {
    test('rechaza canal, rol o respuesta incompleta sin persistir', () async {
      for (final body in [
        _response(channel: 'WEB'),
        _response(roles: ['SELLER', 'SUPERVISOR']),
        _response(remove: 'refreshToken')
      ]) {
        final store = _Store();
        final result = await _repository(body: body, store: store)
            .login(identifier: 'seller', password: 'password');
        expect(result.failure, AuthFailure.neutral);
        expect(store.replaced, isFalse);
      }
    });

    test('rechaza usuario o empresa inactivos sin persistir sesión', () async {
      for (final body in [
        _response(userStatus: 'INVITED'),
        _response(userStatus: 'INACTIVE'),
        _response(companyStatus: 'INACTIVE'),
      ]) {
        final store = _Store();
        final result = await _repository(body: body, store: store)
            .login(identifier: 'seller', password: 'password');

        expect(result.failure, AuthFailure.neutral);
        expect(store.replaced, isFalse);
      }
    });

    test('persiste solo credenciales de seller tras respuesta MOBILE completa',
        () async {
      final store = _Store();
      final transport = _Transport(AuthTransportResponse(200, _response()));
      final result = await AuthHttpRepository(
              baseUri: Uri.parse('http://api.local/'),
              clientInstanceId: const _ClientId(),
              secureStore: store,
              transport: transport)
          .login(identifier: 'seller', password: 'password');
      expect(result.isSuccess, isTrue);
      expect(store.seller!.accessToken, 'access');
      expect(transport.path, '/auth/login');
      expect(transport.clientId, '00000000-0000-4000-8000-000000000000');
      expect(
          transport.payload, {'identifier': 'seller', 'password': 'password'});
    });

    test('limpia sesión si falla la persistencia', () async {
      final store = _Store(throwsOnReplace: true);
      final result = await _repository(body: _response(), store: store)
          .login(identifier: 'seller', password: 'password');
      expect(result.failure, AuthFailure.neutral);
      expect(store.cleared, isTrue);
    });

    test('recovery distingue 202, 429 y 503 para reintento controlado',
        () async {
      for (final entry in {
        202: null,
        429: AuthFailure.throttled,
        503: AuthFailure.unavailable
      }.entries) {
        final result = await _repository(status: entry.key)
            .requestRecovery(email: 'seller@example.test');
        expect(result.failure, entry.value);
      }
    });
  });
}

AuthHttpRepository _repository(
        {String body = '', int status = 200, _Store? store}) =>
    AuthHttpRepository(
      baseUri: Uri.parse('http://api.local/'),
      clientInstanceId: const _ClientId(),
      secureStore: store ?? _Store(),
      transport: _Transport(AuthTransportResponse(status, body)),
    );

String _response(
    {String channel = 'MOBILE',
    List<String> roles = const ['SELLER'],
    String userStatus = 'ACTIVE',
    String companyStatus = 'ACTIVE',
    String? remove}) {
  final json = <String, dynamic>{
    'channel': channel,
    'credentials': {
      'accessToken': 'access',
      'tokenType': 'Bearer',
      'expiresIn': 600
    },
    'refreshToken': 'refresh',
    'sessionRevocationTicket': 'ticket',
    'refreshExpiresIn': 1,
    'user': {
      'id': 'user',
      'displayName': 'Seller',
      'email': 'seller@example.test',
      'status': userStatus,
      'roles': roles,
      'company': {
        'id': 'company',
        'legalName': 'Company',
        'code': 'CMP',
        'status': companyStatus
      }
    }
  };
  json.remove(remove);
  return jsonEncode(json);
}

class _ClientId implements ClientInstanceIdProvider {
  const _ClientId();
  @override
  Future<String> value() async => '00000000-0000-4000-8000-000000000000';
}

class _Store implements AuthSessionStore {
  _Store({this.throwsOnReplace = false});
  final bool throwsOnReplace;
  bool replaced = false;
  bool cleared = false;
  AuthenticatedSeller? seller;
  @override
  Future<void> clearSession() async {
    cleared = true;
  }

  @override
  Future<void> replaceSession(AuthenticatedSeller value) async {
    if (throwsOnReplace) throw StateError('storage');
    replaced = true;
    seller = value;
  }
}

class _Transport implements AuthTransport {
  _Transport(this.response);
  final AuthTransportResponse response;
  String? path;
  String? clientId;
  Map<String, String>? payload;
  @override
  Future<AuthTransportResponse> post(
      {required Uri uri,
      required String clientInstanceId,
      required Map<String, String> payload}) async {
    path = uri.path;
    clientId = clientInstanceId;
    this.payload = payload;
    return response;
  }
}
