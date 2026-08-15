package com.nahui.followupbussiness.workforce.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.workforce.application.TerritoryService;
import com.nahui.followupbussiness.workforce.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.net.URI;
import java.time.Instant;
import java.util.*;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/territories")
public class TerritoryController {
    private final TerritoryService service;

    public TerritoryController(TerritoryService service) {
        this.service = service;
    }

    @GetMapping
    ResponseEntity<?> list(@AuthenticationPrincipal AuthenticatedActor a, @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(200) int pageSize, @RequestParam(required = false) String search, @RequestParam(required = false) TerritoryStatus status) {
        try {
            var r = service.list(status, search, page, pageSize, a);
            return ResponseEntity.ok(new Page(r.items().stream().map(Response::from).toList(), new PageInfo(page, pageSize, r.total(), r.total() == 0 ? 0 : (r.total() + pageSize - 1) / pageSize)));
        } catch (TerritoryService.AccessDeniedException e) {
            return problem(HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping
    ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedActor a, @Valid @RequestBody Create req) {
        try {
            var t = service.create(req.name(), req.code(), req.description(), a);
            return ResponseEntity.created(URI.create("/territories/" + t.id())).eTag(Long.toString(t.version())).body(Response.from(t));
        } catch (TerritoryService.AccessDeniedException e) {
            return problem(HttpStatus.FORBIDDEN);
        } catch (TerritoryService.ConflictException | DataIntegrityViolationException e) {
            return problem(HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            return problem(HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    @GetMapping("/{id}")
    ResponseEntity<?> get(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedActor a) {
        try {
            return service.get(id, a).<ResponseEntity<?>>map(t -> ResponseEntity.ok().eTag(Long.toString(t.version())).body(Response.from(t))).orElseGet(() -> problem(HttpStatus.NOT_FOUND));
        } catch (TerritoryService.AccessDeniedException e) {
            return problem(HttpStatus.FORBIDDEN);
        }
    }

    @PatchMapping("/{id}")
    ResponseEntity<?> update(@PathVariable UUID id, @RequestHeader("If-Match") String ifMatch, @AuthenticationPrincipal AuthenticatedActor a, @Valid @RequestBody Update req) {
        try {
            var t = service.update(id, req.name(), req.code(), req.description(), req.status(), Long.parseLong(ifMatch.replace("\"", "")), a);
            return ResponseEntity.ok().eTag(Long.toString(t.version())).body(Response.from(t));
        } catch (NumberFormatException e) {
            return problem(HttpStatus.BAD_REQUEST);
        } catch (TerritoryService.AccessDeniedException e) {
            return problem(HttpStatus.FORBIDDEN);
        } catch (TerritoryService.NotFoundException e) {
            return problem(HttpStatus.NOT_FOUND);
        } catch (TerritoryService.ConflictException e) {
            return problem(HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            return problem(HttpStatus.BAD_REQUEST);
        }
    }

    private static ResponseEntity<ProblemDetail> problem(HttpStatus s) {
        return ResponseEntity.status(s).body(ProblemDetail.forStatusAndDetail(s, "Request cannot be processed"));
    }

    record Create(@NotBlank @Size(min = 2, max = 160) String name, @Size(max = 40) String code,
                  @Size(max = 500) String description) {
    }

    record Update(@Size(min = 2, max = 160) String name, @Size(max = 40) String code,
                  @Size(max = 500) String description, TerritoryStatus status) {
    }

    record Response(UUID id, String name, String code, String description, TerritoryStatus status, Instant createdAt,
                    Instant updatedAt, long version) {
        static Response from(Territory t) {
            return new Response(t.id(), t.name(), t.code(), t.description(), t.status(), t.createdAt(), t.updatedAt(), t.version());
        }
    }

    record Page(List<Response> items, PageInfo page) {
    }

    record PageInfo(int page, int pageSize, long totalElements, long totalPages) {
    }
}
