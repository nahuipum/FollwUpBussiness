import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../application/auth_models.dart';
import '../application/auth_repository.dart';
import '../application/auth_session.dart';
import 'auth_secure_store.dart';
import 'client_instance_id.dart';

class AuthTransportResponse {
  const AuthTransportResponse(this.statusCode, this.body);
  final int statusCode;
  final String body;
}

abstract interface class AuthTransport {
  Future<AuthTransportResponse> post({
    required Uri uri,
    required String clientInstanceId,
    required Map<String, String> payload,
  });
}

class HttpAuthTransport implements AuthTransport {
  HttpAuthTransport({HttpClient? httpClient})
      : _httpClient = httpClient ?? HttpClient();
  final HttpClient _httpClient;

  @override
  Future<AuthTransportResponse> post({
    required Uri uri,
    required String clientInstanceId,
    required Map<String, String> payload,
  }) async {
    try {
      final request = await _httpClient.postUrl(uri);
      request.headers.contentType = ContentType.json;
      request.headers.set('X-Auth-Client', 'MOBILE');
      request.headers.set('X-Client-Instance-Id', clientInstanceId);
      request.write(jsonEncode(payload));
      final response =
          await request.close().timeout(const Duration(seconds: 15));
      return AuthTransportResponse(
        response.statusCode,
        await utf8.decodeStream(response),
      );
    } on Object {
      return const AuthTransportResponse(503, '');
    }
  }
}

class AuthHttpRepository implements AuthRepository {
  AuthHttpRepository(
      {required this.baseUri,
      required this.clientInstanceId,
      required this.secureStore,
      this.sessionCoordinator,
      AuthTransport? transport})
      : _transport = transport ?? HttpAuthTransport();
  final Uri baseUri;
  final ClientInstanceIdProvider clientInstanceId;
  final AuthSessionStore secureStore;
  final AuthSessionCoordinator? sessionCoordinator;
  final AuthTransport _transport;

  @override
  Future<AuthResult<AuthenticatedSeller>> login(
      {required String identifier, required String password}) async {
    final response = await _post(
        '/auth/login', {'identifier': identifier, 'password': password});
    if (response.statusCode != 200) {
      return AuthResult.failure(_failure(response.statusCode));
    }
    final seller = parseSeller(_decode(response.body));
    if (seller == null) return const AuthResult.failure(AuthFailure.neutral);
    try {
      final coordinator = sessionCoordinator;
      if (coordinator == null) {
        await secureStore.replaceSession(seller);
      } else {
        await coordinator.acceptLogin(seller);
      }
      return AuthResult.success(seller);
    } on Object {
      await secureStore.clearSession();
      return const AuthResult.failure(AuthFailure.neutral);
    }
  }

  @override
  Future<AuthResult<void>> requestRecovery({required String email}) async {
    final response =
        await _post('/auth/password-recovery-requests', {'email': email});
    return response.statusCode == 202
        ? const AuthResult.success(null)
        : AuthResult.failure(_failure(response.statusCode));
  }

  Future<AuthTransportResponse> _post(
          String path, Map<String, String> payload) async =>
      _transport.post(
        uri: baseUri.resolve(path),
        clientInstanceId: await clientInstanceId.value(),
        payload: payload,
      );

  Map<String, dynamic>? _decode(String value) {
    try {
      final decoded = jsonDecode(value);
      return decoded is Map<String, dynamic> ? decoded : null;
    } on FormatException {
      return null;
    }
  }

  static AuthenticatedSeller? parseSeller(Map<String, dynamic>? json) {
    if (json == null || json['channel'] != 'MOBILE') {
      return null;
    }
    final credentials = json['credentials'];
    final user = json['user'];
    if (credentials is! Map<String, dynamic> || user is! Map<String, dynamic>) {
      return null;
    }
    final company = user['company'];
    final roles = user['roles'];
    if (company is! Map<String, dynamic> ||
        roles is! List ||
        roles.length != 1 ||
        roles.single != 'SELLER') {
      return null;
    }
    if (credentials['tokenType'] != 'Bearer' ||
        credentials['expiresIn'] != 600 ||
        json['refreshExpiresIn'] is! int ||
        (json['refreshExpiresIn'] as int) < 1 ||
        user['displayName'] is! String ||
        user['email'] is! String ||
        user['status'] is! String ||
        company['legalName'] is! String ||
        company['code'] is! String ||
        company['status'] is! String) {
      return null;
    }
    final values = [
      user['id'],
      company['id'],
      credentials['accessToken'],
      json['refreshToken'],
      json['sessionRevocationTicket']
    ];
    if (values.any((value) => value is! String || value.isEmpty)) {
      return null;
    }
    return AuthenticatedSeller(
        userId: values[0] as String,
        companyId: values[1] as String,
        accessToken: values[2] as String,
        refreshToken: values[3] as String,
        sessionRevocationTicket: values[4] as String);
  }

  AuthFailure _failure(int status) => switch (status) {
        429 => AuthFailure.throttled,
        503 => AuthFailure.unavailable,
        _ => AuthFailure.neutral
      };
}
