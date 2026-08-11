package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nahui.followupbussiness.tenancy.application.port.in.ListCompaniesUseCase;
import com.nahui.followupbussiness.tenancy.domain.model.CompanyStatus;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class JdbcCompanyListStoreTest {
    @Test void usesBoundAndEscapedSearchParameters() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(any(String.class), any(RowMapper.class), any(Object[].class))).thenReturn(List.of());
        var store = new JdbcCompanyListStore(jdbc);

        store.find(new ListCompaniesUseCase.Query(1, 20, "A_%\\B", CompanyStatus.ACTIVE));

        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        var parameters = org.mockito.ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).query(sql.capture(), any(RowMapper.class), parameters.capture());
        assertThat(sql.getValue()).contains("c.status=?", "ILIKE ? ESCAPE '\\'", "LIMIT ? OFFSET ?")
                .doesNotContain("A_%");
        assertThat(parameters.getValue()).containsExactly("ACTIVE", "%A\\_\\%\\\\B%", "%A\\_\\%\\\\B%", "%A\\_\\%\\\\B%", 20, 20L);
    }
}
