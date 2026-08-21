import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../application/auth_session.dart';
import 'auth_http_repository.dart';
import 'client_instance_id.dart';

class AuthSessionRemote implements SessionRemote {
  AuthSessionRemote({
    required this.baseUri,
    required this.clientInstanceId,
    HttpClient? httpClient,
    Duration? requestTimeout,
  })  : _client = httpClient ?? HttpClient(),
        _requestTimeout = requestTimeout ?? _defaultRequestTimeout;

  final Uri baseUri;
  final ClientInstanceIdProvider clientInstanceId;
  final HttpClient _client;
  final Duration _requestTimeout;
  static const _defaultRequestTimeout = Duration(seconds: 15);

  @override
  Future<RefreshResult> refresh({required String refreshToken}) async {
    final response =
        await _post('/auth/refresh', {'refreshToken': refreshToken});
    if (response.statusCode == 200) {
      final seller = AuthHttpRepository.parseSeller(_decode(response.body));
      return seller == null
          ? const RefreshResult.failure(RefreshFailure.malformed)
          : RefreshResult.success(seller);
    }
    final code = _errorCode(response.body);
    if (response.statusCode == 401 &&
        const {
          'REFRESH_TOKEN_EXPIRED',
          'REFRESH_TOKEN_INVALID',
          'REFRESH_TOKEN_REUSED',
        }.contains(code)) {
      return const RefreshResult.failure(RefreshFailure.invalid);
    }
    if (response.statusCode == 409 && code == 'REFRESH_ALREADY_ROTATED') {
      return const RefreshResult.failure(RefreshFailure.alreadyRotated);
    }
    if (response.statusCode == 429 && code == 'AUTH_RATE_LIMITED') {
      return const RefreshResult.failure(RefreshFailure.throttled);
    }
    return const RefreshResult.failure(RefreshFailure.unavailable);
  }

  @override
  Future<bool> logout({String? accessToken, required String ticket}) async {
    HttpClientRequest? request;
    StreamSubscription<List<int>>? bodySubscription;
    try {
      return await (() async {
        request = await _client.postUrl(baseUri.resolve('/auth/logout'));
        request!.headers.contentType = ContentType.json;
        request!.headers.set('X-Auth-Client', 'MOBILE');
        request!.headers
            .set('X-Client-Instance-Id', await clientInstanceId.value());
        if (accessToken == null) {
          request!.headers.set('X-Session-Revocation-Ticket', ticket);
        } else {
          request!.headers
              .set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
        }
        request!.write(jsonEncode(const {'allSessions': false}));
        final response = await request!.close();
        await _drain(response, (subscription) => bodySubscription = subscription);
        return response.statusCode == 204;
      })().timeout(
        _requestTimeout,
        onTimeout: () {
          bodySubscription?.cancel();
          request?.abort();
          return false;
        },
      );
    } on Object {
      return false;
    }
  }

  Future<void> _drain(
    HttpClientResponse response,
    void Function(StreamSubscription<List<int>>) onSubscribed,
  ) {
    final completed = Completer<void>();
    final subscription = response.listen(
      (_) {},
      onError: completed.completeError,
      onDone: completed.complete,
      cancelOnError: true,
    );
    onSubscribed(subscription);
    return completed.future;
  }

  Future<_Response> _post(String path, Map<String, String> body) async {
    try {
      final request = await _client.postUrl(baseUri.resolve(path));
      request.headers.contentType = ContentType.json;
      request.headers.set('X-Auth-Client', 'MOBILE');
      request.headers
          .set('X-Client-Instance-Id', await clientInstanceId.value());
      request.write(jsonEncode(body));
      final response =
          await request.close().timeout(_requestTimeout);
      return _Response(response.statusCode, await utf8.decodeStream(response));
    } on Object {
      return const _Response(503, '');
    }
  }

  Map<String, dynamic>? _decode(String body) {
    try {
      final decoded = jsonDecode(body);
      return decoded is Map<String, dynamic> ? decoded : null;
    } on FormatException {
      return null;
    }
  }

  String? _errorCode(String body) {
    final json = _decode(body);
    final value = json?['code'] ?? json?['errorCode'];
    return value is String ? value : null;
  }
}

class _Response {
  const _Response(this.statusCode, this.body);
  final int statusCode;
  final String body;
}
