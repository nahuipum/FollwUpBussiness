package com.nahui.followupbussiness.workforce.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.workforce.application.SellerService;
import com.nahui.followupbussiness.workforce.domain.Seller;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/sellers")
public final class SellerController {
    private final SellerService service;
    public SellerController(SellerService service) { this.service=service; }
    @PostMapping public ResponseEntity<?> create(@Valid @RequestBody Create request, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest http) {
        UUID correlation=correlationId(http);
        try { return ResponseEntity.accepted().header("X-Correlation-Id",correlation.toString()).body(Response.from(service.create(new SellerService.Command(request.displayName(),request.username(),request.email(),request.phone(),request.employeeCode(),request.supervisorId(),request.territoryIds()),actor,correlation))); }
        catch(SellerService.Forbidden e){return problem(HttpStatus.FORBIDDEN,correlation);} catch(SellerService.Conflict e){return problem(HttpStatus.CONFLICT,correlation);} catch(RuntimeException e){return problem(HttpStatus.UNPROCESSABLE_ENTITY,correlation);}
    }
    private static ResponseEntity<ProblemDetail> problem(HttpStatus status, UUID correlation){ProblemDetail p=ProblemDetail.forStatusAndDetail(status,"Request cannot be processed");p.setProperty("correlationId",correlation.toString());return ResponseEntity.status(status).header("X-Correlation-Id",correlation.toString()).body(p);}
    private static UUID correlationId(HttpServletRequest request) { Object current=request.getAttribute("com.nahui.followupbussiness.request.correlationId"); if(current instanceof UUID value)return value; try{return UUID.fromString(request.getHeader("X-Correlation-Id"));}catch(Exception ignored){return UUID.randomUUID();} }
    record Create(@NotBlank @Size(min=2,max=160) String displayName,@Size(min=3,max=100) String username,@NotBlank @Email @Size(max=254) String email,@Size(max=30) String phone,@Size(max=50) String employeeCode,UUID supervisorId,List<UUID> territoryIds){}
    record Response(UUID id,UUID userId,String displayName,String email,String phone,String employeeCode,UUID supervisorId,List<UUID> territoryIds,String status,Instant createdAt,Instant updatedAt,long version){static Response from(Seller s){return new Response(s.id(),s.userId(),s.displayName(),s.email(),s.phone(),s.employeeCode(),s.supervisorId(),s.territoryIds(),s.status().name(),s.createdAt(),s.updatedAt(),s.version());}}
}
