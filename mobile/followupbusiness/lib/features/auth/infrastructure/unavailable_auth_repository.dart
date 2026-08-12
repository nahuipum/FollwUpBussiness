import '../application/auth_models.dart';
import '../application/auth_repository.dart';

class UnavailableAuthRepository implements AuthRepository {
  const UnavailableAuthRepository();
  @override
  Future<AuthResult<AuthenticatedSeller>> login(
          {required String identifier, required String password}) async =>
      const AuthResult.failure(AuthFailure.configuration);
  @override
  Future<AuthResult<void>> requestRecovery({required String email}) async =>
      const AuthResult.failure(AuthFailure.configuration);
}
