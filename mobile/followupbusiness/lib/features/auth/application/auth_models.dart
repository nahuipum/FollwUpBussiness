class AuthenticatedSeller {
  const AuthenticatedSeller({
    required this.userId,
    required this.companyId,
    required this.accessToken,
    required this.refreshToken,
    required this.sessionRevocationTicket,
  });

  final String userId;
  final String companyId;
  final String accessToken;
  final String refreshToken;
  final String sessionRevocationTicket;
}

enum AuthFailure { neutral, throttled, unavailable, configuration }

class AuthResult<T> {
  const AuthResult.success(this.value) : failure = null;
  const AuthResult.failure(this.failure) : value = null;

  final T? value;
  final AuthFailure? failure;
  bool get isSuccess => failure == null;
}
