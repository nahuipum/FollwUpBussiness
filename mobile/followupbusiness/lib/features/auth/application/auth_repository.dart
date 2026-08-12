import 'auth_models.dart';

abstract interface class AuthRepository {
  Future<AuthResult<AuthenticatedSeller>> login({
    required String identifier,
    required String password,
  });

  Future<AuthResult<void>> requestRecovery({required String email});
}
