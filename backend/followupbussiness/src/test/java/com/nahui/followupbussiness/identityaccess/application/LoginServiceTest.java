package com.nahui.followupbussiness.identityaccess.application;

import com.nahui.followupbussiness.identityaccess.application.port.out.*;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.tenancy.application.port.in.CompanyAccessStatusQuery;
import org.junit.jupiter.api.Test;
import java.time.Clock; import java.time.Instant; import java.time.ZoneOffset; import java.util.*;
import static org.assertj.core.api.Assertions.*;

class LoginServiceTest {
 private final UUID accountId=UUID.randomUUID(), companyId=UUID.randomUUID();
 @Test void activeCompanyAccountCreatesSessionWithServerDerivedTenantAndRole(){ var sessions=new CapturingSessions(); var result=service(active(companyId),id->true,sessions).login("user@example.test","password".toCharArray(),"MOBILE",UUID.randomUUID()); assertThat(result.accessToken()).isEqualTo("jwt"); assertThat(sessions.company).isEqualTo(companyId); assertThat(result.refreshToken()).hasSize(43); }
 @Test void inactiveAccountAndCompanyAreIndistinguishable(){ assertThatThrownBy(()->service(inactive(companyId),id->true,new CapturingSessions()).login("a","password".toCharArray(),"WEB",UUID.randomUUID())).isInstanceOf(LoginService.LoginFailedException.class); assertThatThrownBy(()->service(active(companyId),id->false,new CapturingSessions()).login("a","password".toCharArray(),"WEB",UUID.randomUUID())).isInstanceOf(LoginService.LoginFailedException.class); }
 @Test void incompleteHistoricalBootstrapProfileIsRejectedNeutrally(){ var account=new LoginAccountQuery.Account(accountId,"hash",BaseRole.PLATFORM_SUPERADMIN,null,"ACTIVE",null,null); assertThatThrownBy(()->service(account,id->true,new CapturingSessions()).login("platform","password".toCharArray(),"WEB",UUID.randomUUID())).isInstanceOf(LoginService.LoginFailedException.class); }
 @Test void unknownAndUnusableAccountsBothExecuteOneDummyPasswordVerification(){ var verifier=new CapturingPasswords(); var empty=service(id->Optional.empty(),id->true,new CapturingSessions(),verifier); var inactive=service(id->Optional.of(inactive(companyId)),id->true,new CapturingSessions(),verifier); assertThatThrownBy(()->empty.login("none","password".toCharArray(),"WEB",UUID.randomUUID())).isInstanceOf(LoginService.LoginFailedException.class); assertThatThrownBy(()->inactive.login("inactive","password".toCharArray(),"WEB",UUID.randomUUID())).isInstanceOf(LoginService.LoginFailedException.class); assertThat(verifier.hashes).hasSize(2).allMatch(hash->hash.startsWith("$2a$12$")); }
 private LoginService service(LoginAccountQuery.Account account,CompanyAccessStatusQuery companies,CapturingSessions sessions){ LoginAccountQuery q=id->Optional.of(account); PasswordHashingPort p=new PasswordHashingPort(){public String hash(char[] x){return "";} public boolean matches(char[] x,String h){return true;}}; return new LoginService(q,p,companies,sessions,(a,s,c,r)->"jwt",Clock.fixed(Instant.EPOCH,ZoneOffset.UTC),"01234567890123456789012345678901".getBytes()); }
 private LoginService service(LoginAccountQuery q,CompanyAccessStatusQuery companies,CapturingSessions sessions,PasswordHashingPort passwords){ return new LoginService(q,passwords,companies,sessions,(a,s,c,r)->"jwt",Clock.fixed(Instant.EPOCH,ZoneOffset.UTC),"01234567890123456789012345678901".getBytes()); }
 private LoginAccountQuery.Account active(UUID company){return new LoginAccountQuery.Account(accountId,"hash",BaseRole.SELLER,company,"ACTIVE","User","user@example.test");} private LoginAccountQuery.Account inactive(UUID company){return new LoginAccountQuery.Account(accountId,"hash",BaseRole.SELLER,company,"INACTIVE","User","user@example.test");}
 private static final class CapturingSessions implements SessionFamilyPort { UUID company; public void create(UUID i,UUID a,UUID c,String ch,byte[] ci,byte[] r,byte[] csrf,byte[] t,Instant e,Instant created){company=c;} }
 private static final class CapturingPasswords implements PasswordHashingPort { final List<String> hashes=new ArrayList<>(); public String hash(char[] password){return "";} public boolean matches(char[] password,String hash){hashes.add(hash);return false;} }
}
