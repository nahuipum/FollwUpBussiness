package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.*;
import com.nahui.followupbussiness.identityaccess.application.port.in.ProvisionInitialCompanyAdminUseCase;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI; import java.util.List; import java.util.Map; import java.util.Set; import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.*; import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/platform/companies") @ConditionalOnBean(ProvisionInitialCompanyAdminUseCase.class)
public final class InitialCompanyAdminController {
    private final ProvisionInitialCompanyAdminUseCase service; public InitialCompanyAdminController(ProvisionInitialCompanyAdminUseCase service){this.service=service;}
    @PostMapping("/{companyId}/initial-admin") ResponseEntity<?> provision(@PathVariable UUID companyId, @RequestBody Map<String,Object> body, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest servlet) {
        UUID correlation=correlation(servlet); try { var request=Request.from(body); var r=service.execute(new ProvisionInitialCompanyAdminCommand(companyId,request.displayName(),request.username(),request.email()),actor);
            return ResponseEntity.accepted().header("X-Correlation-Id",correlation.toString()).header(HttpHeaders.CACHE_CONTROL,"no-store").body(new User(r.id(),r.displayName(),r.username(),r.email(),"INVITED",List.of("COMPANY_ADMIN"),r.createdAt(),r.updatedAt(),1));
        } catch (ProvisionInitialCompanyAdminService.Forbidden e) { return problem(HttpStatus.FORBIDDEN,correlation); }
        catch (ProvisionInitialCompanyAdminService.CompanyUnavailable e) { return problem(HttpStatus.NOT_FOUND,correlation); }
        catch (ProvisionInitialCompanyAdminService.Conflict e) { return problem(HttpStatus.CONFLICT,correlation); }
        catch (ProvisionInitialCompanyAdminService.Invalid | IllegalArgumentException e) { return problem(HttpStatus.BAD_REQUEST,correlation); }
    }
    static ResponseEntity<ProblemDetail> problem(HttpStatus status, UUID correlation) { var p=ProblemDetail.forStatusAndDetail(status,"Request cannot be processed"); p.setType(URI.create("urn:followupbussiness:initial-admin:invalid")); p.setProperty("code","INITIAL_ADMIN_"+status.value()); p.setProperty("correlationId",correlation.toString()); return ResponseEntity.status(status).header(HttpHeaders.CACHE_CONTROL,"no-store").header("X-Correlation-Id",correlation.toString()).body(p); }
    static UUID correlation(HttpServletRequest r) { try { Object x=r.getAttribute("com.nahui.followupbussiness.request.correlationId"); if(x instanceof UUID id)return id; UUID id=UUID.fromString(r.getHeader("X-Correlation-Id"));r.setAttribute("com.nahui.followupbussiness.request.correlationId",id);return id;}catch(Exception e){UUID id=UUID.randomUUID();r.setAttribute("com.nahui.followupbussiness.request.correlationId",id);return id;} }
    record Request(String displayName, String username, String email) {
        static Request from(Map<String,Object> body) {
            if (body == null || !Set.of("displayName", "username", "email").containsAll(body.keySet())) throw new IllegalArgumentException();
            Object name=body.get("displayName"), user=body.get("username"), email=body.get("email");
            if (!(name instanceof String) || !(email instanceof String) || (user != null && !(user instanceof String))) throw new IllegalArgumentException();
            String n=((String) name).strip(), e=((String) email).strip(); String u=user == null ? null : ((String) user).strip();
            if (n.length()<2 || n.length()>160 || e.isBlank() || e.length()>254 || !e.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || (u != null && (u.length()<3 || u.length()>100))) throw new IllegalArgumentException();
            return new Request(n,u,e);
        }
    }
    record User(UUID id,String displayName,String username,String email,String status,List<String> roles,java.time.Instant createdAt,java.time.Instant updatedAt,long version) { }
}
