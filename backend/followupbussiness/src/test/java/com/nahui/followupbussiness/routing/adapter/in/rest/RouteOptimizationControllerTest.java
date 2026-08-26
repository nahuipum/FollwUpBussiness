package com.nahui.followupbussiness.routing.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import com.nahui.followupbussiness.routing.application.port.in.OptimizeRouteUseCase;
import org.junit.jupiter.api.Test;

class RouteOptimizationControllerTest {
 @Test void invalidCommandReturns422(){var service=mock(OptimizeRouteUseCase.class);when(service.optimize(null,null)).thenThrow(new OptimizeRouteUseCase.Invalid());var response=new RouteOptimizationController(service).optimize(null,null,"correlation");assertThat(response.getStatusCode().value()).isEqualTo(422);}
 @Test void unavailableProviderReturnsSafe503ProblemWithoutPersistenceDetails(){var service=mock(OptimizeRouteUseCase.class);when(service.optimize(null,null)).thenThrow(new OptimizeRouteUseCase.Unavailable());var response=new RouteOptimizationController(service).optimize(null,null,"correlation");assertThat(response.getStatusCode().value()).isEqualTo(503);assertThat(response.getHeaders().getFirst("Retry-After")).isEqualTo("1");assertThat(response.getBody().toString()).contains("PROVIDER_UNCONFIGURED").doesNotContain("matrix");}
 @Test void exhaustedQuotaReturnsSafe503RateLimitedCode(){var service=mock(OptimizeRouteUseCase.class);when(service.optimize(null,null)).thenThrow(new OptimizeRouteUseCase.RateLimited());var response=new RouteOptimizationController(service).optimize(null,null,"correlation");assertThat(response.getStatusCode().value()).isEqualTo(503);assertThat(response.getBody().toString()).contains("PROVIDER_RATE_LIMITED").doesNotContain("account");}
}
