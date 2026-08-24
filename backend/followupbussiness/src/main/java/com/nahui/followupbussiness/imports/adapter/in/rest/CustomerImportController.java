package com.nahui.followupbussiness.imports.adapter.in.rest;

import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.imports.application.port.in.*;
import com.nahui.followupbussiness.imports.domain.CustomerImport;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/customer-imports")
public final class CustomerImportController {
 private static final MediaType CSV = MediaType.parseMediaType("text/csv;charset=UTF-8");
 private final CreateCustomerImportUseCase create; private final GetCustomerImportUseCase get; private final DownloadCustomerImportErrorsUseCase errors;
 public CustomerImportController(CreateCustomerImportUseCase create, GetCustomerImportUseCase get, DownloadCustomerImportErrorsUseCase errors) { this.create=create; this.get=get; this.errors=errors; }
 @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 ResponseEntity<?> create(@RequestPart("file") MultipartFile file, @RequestParam String templateVersion, @RequestParam(defaultValue="true") boolean partialAcceptance, @RequestHeader("Idempotency-Key") String key, @AuthenticationPrincipal AuthenticatedActor actor, HttpServletRequest request) {
  UUID correlation=correlation(request); try { CustomerImport job=create.create(new CreateCustomerImportUseCase.Command(key,file.getOriginalFilename(),file.getContentType(),templateVersion,partialAcceptance,file.getBytes()),actor,correlation); return ResponseEntity.accepted().location(URI.create("/customer-imports/"+job.id())).header("X-Correlation-Id",correlation.toString()).body(View.from(job)); }
  catch (CreateCustomerImportUseCase.Forbidden e) { return problem(HttpStatus.FORBIDDEN,correlation); } catch (CreateCustomerImportUseCase.Conflict e) { return problem(HttpStatus.CONFLICT,correlation); } catch (CreateCustomerImportUseCase.PayloadTooLarge e) { return problem(HttpStatus.PAYLOAD_TOO_LARGE,correlation); } catch (CreateCustomerImportUseCase.Invalid e) { return problem(HttpStatus.UNPROCESSABLE_CONTENT,correlation); } catch (java.io.IOException e) { return problem(HttpStatus.BAD_REQUEST,correlation); }
 }
 @GetMapping("/{id}") ResponseEntity<?> get(@PathVariable UUID id,@AuthenticationPrincipal AuthenticatedActor actor,HttpServletRequest request) { UUID correlation=correlation(request); try { return get.get(id,actor).<ResponseEntity<?>>map(x->ResponseEntity.ok().header("X-Correlation-Id",correlation.toString()).body(View.from(x))).orElseGet(()->problem(HttpStatus.NOT_FOUND,correlation)); } catch (GetCustomerImportUseCase.Forbidden e) { return problem(HttpStatus.FORBIDDEN,correlation); } }
 @GetMapping(value="/{id}/errors", produces="text/csv") ResponseEntity<?> errors(@PathVariable UUID id,@AuthenticationPrincipal AuthenticatedActor actor,HttpServletRequest request) { UUID correlation=correlation(request); try { var file=errors.download(id,actor); return ResponseEntity.ok().header("X-Correlation-Id",correlation.toString()).header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+file.filename()+"\"").contentType(CSV).contentLength(file.content().length).body(file.content()); } catch (DownloadCustomerImportErrorsUseCase.Forbidden e) { return problem(HttpStatus.FORBIDDEN,correlation); } catch (DownloadCustomerImportErrorsUseCase.Expired e) { return problem(HttpStatus.GONE,correlation); } catch (DownloadCustomerImportErrorsUseCase.NotFound e) { return problem(HttpStatus.NOT_FOUND,correlation); } }
 static ResponseEntity<ProblemDetail> problem(HttpStatus status,UUID c) { ProblemDetail p=ProblemDetail.forStatusAndDetail(status,"Request cannot be processed"); p.setProperty("correlationId",c.toString()); return ResponseEntity.status(status).header("X-Correlation-Id",c.toString()).body(p); }
 static UUID correlation(HttpServletRequest r) { Object value=r.getAttribute("com.nahui.followupbussiness.request.correlationId"); if(value instanceof UUID id)return id; try{return UUID.fromString(r.getHeader("X-Correlation-Id"));}catch(Exception e){return UUID.randomUUID();} }
 record View(UUID importId,String status,int acceptedRows,int rejectedRows,java.time.Instant createdAt,java.time.Instant errorFileExpiresAt) { static View from(CustomerImport x) { return new View(x.id(),x.status().name(),x.acceptedRows(),x.rejectedRows(),x.createdAt(),x.errorFileExpiresAt()); } }
}
