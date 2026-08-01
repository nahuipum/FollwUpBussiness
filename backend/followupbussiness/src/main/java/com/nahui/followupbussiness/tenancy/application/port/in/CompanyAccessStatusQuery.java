package com.nahui.followupbussiness.tenancy.application.port.in;

import java.util.UUID;

/** Public cross-module contract; it deliberately exposes no company data. */
public interface CompanyAccessStatusQuery {

    boolean isActive(UUID companyId);
}
