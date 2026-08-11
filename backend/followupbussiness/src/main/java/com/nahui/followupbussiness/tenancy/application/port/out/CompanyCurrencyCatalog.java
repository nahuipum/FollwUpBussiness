package com.nahui.followupbussiness.tenancy.application.port.out;

import com.nahui.followupbussiness.tenancy.application.port.in.ListCompanyCurrenciesUseCase.Currency;
import java.util.List;

public interface CompanyCurrencyCatalog { List<Currency> activeCurrencies(); }
