package com.nahui.followupbussiness.tenancy.adapter.out.persistence;

import com.nahui.followupbussiness.tenancy.application.port.in.ListCompanyCurrenciesUseCase.Currency;
import com.nahui.followupbussiness.tenancy.application.port.out.CompanyCurrencyCatalog;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcCompanyCurrencyCatalog implements CompanyCurrencyCatalog {
    private final JdbcTemplate jdbc;

    public JdbcCompanyCurrencyCatalog(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Currency> activeCurrencies() {
        return jdbc.query("SELECT code,display_name FROM tenancy_currency_catalog WHERE active=TRUE ORDER BY code", (rs, row) -> new Currency(rs.getString("code"), rs.getString("display_name")));
    }
}
