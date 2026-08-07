package com.nahui.followupbussiness.identityaccess.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.application.CompanyUserService;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/company/users")
public final class CompanyUserController {
    private static final String CORRELATION_ID_ATTRIBUTE = "com.nahui.followupbussiness.request.correlationId";
    private final CompanyUserService service;
    public CompanyUserController(CompanyUserService service) { this.service = service; }

    @GetMapping public ResponseEntity<?> list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int pageSize, @RequestParam(required=false) String search, @RequestParam(required=false) String role, @RequestParam(required=false) String status, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) { try { return ok(service.list(page,pageSize,search,optionalRole(role),status,actor),request); } catch (RuntimeException e) { return err(e,request); } }
    @GetMapping("/{userId}") public ResponseEntity<?> get(@PathVariable UUID userId, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) { try { return ok(service.get(userId,actor,correlationId(request)),request); } catch (RuntimeException e) { return err(e,request); } }
    @PostMapping public ResponseEntity<?> invite(@Valid @RequestBody InviteRequest body, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) { try { UUID correlation=correlationId(request); return ResponseEntity.accepted().header("X-Correlation-Id",correlation.toString()).body(service.invite(new CompanyUserService.Invite(body.displayName(),body.username(),body.email(),body.role()),actor,correlation)); } catch (RuntimeException e) { return err(e,request); } }
    @PatchMapping("/{userId}") public ResponseEntity<?> update(@PathVariable UUID userId, @RequestHeader("If-Match") String version, @Valid @RequestBody UpdateRequest body, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) { try { return ok(service.update(userId,new CompanyUserService.Update(body.displayName(),body.username(),body.email(),body.role(),Long.parseLong(version.replace("\"",""))),actor,correlationId(request)),request); } catch (RuntimeException e) { return err(e,request); } }
    @PatchMapping("/{userId}/status") public ResponseEntity<?> status(@PathVariable UUID userId, @RequestBody StatusRequest body, @AuthenticationPrincipal AuthenticatedActor actor,HttpServletRequest request) { try { return ok(service.status(userId,body.status(),actor,correlationId(request)),request); } catch (RuntimeException e) { return err(e,request); } }

    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> invalid(MethodArgumentNotValidException ignored, HttpServletRequest request) { return err(new CompanyUserService.Invalid(),request); }
    private static ResponseEntity<?> ok(Object body,HttpServletRequest request) { return ResponseEntity.ok().header("X-Correlation-Id",correlationId(request).toString()).body(body); }
    private static ResponseEntity<?> err(RuntimeException e,HttpServletRequest request) { HttpStatus status=e instanceof CompanyUserService.Forbidden?HttpStatus.FORBIDDEN:e instanceof CompanyUserService.NotFound?HttpStatus.NOT_FOUND:e instanceof CompanyUserService.Invalid?HttpStatus.BAD_REQUEST:HttpStatus.CONFLICT; ProblemDetail problem=ProblemDetail.forStatusAndDetail(status,"Request cannot be processed"); problem.setType(URI.create("urn:followupbussiness:company-users:error")); problem.setProperty("correlationId",correlationId(request).toString()); return ResponseEntity.status(status).header("X-Correlation-Id",correlationId(request).toString()).body(problem); }
    static UUID correlationId(HttpServletRequest request) { Object current=request.getAttribute(CORRELATION_ID_ATTRIBUTE); if(current instanceof UUID value) return value; UUID value; try { value=UUID.fromString(request.getHeader("X-Correlation-Id")); } catch(Exception ignored) { value=UUID.randomUUID(); } request.setAttribute(CORRELATION_ID_ATTRIBUTE,value); return value; }
    private static BaseRole optionalRole(String value) { if(value==null) return null; try{return BaseRole.valueOf(value);}catch(Exception e){throw new CompanyUserService.Invalid();} }
    public record InviteRequest(@NotBlank @Size(min=2,max=160) @Pattern(regexp="^[^\\r\\n]*$") String displayName, @Size(min=3,max=100) @Pattern(regexp="^[^\\r\\n]*$") String username, @NotBlank @Email @Size(max=254) @Pattern(regexp="^[^\\r\\n]*$") String email, BaseRole role) { }
    public record UpdateRequest(@Size(min=2,max=160) @Pattern(regexp="^[^\\r\\n]*$") String displayName, @Size(min=3,max=100) @Pattern(regexp="^[^\\r\\n]*$") String username, @Email @Size(max=254) @Pattern(regexp="^[^\\r\\n]*$") String email, BaseRole role) { }
    public record StatusRequest(String status) { }
}
