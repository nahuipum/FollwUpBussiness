package com.nahui.followupbussiness.imports.adapter.in.scheduling;

import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;
import io.micrometer.core.instrument.Counter;
import org.springframework.scheduling.annotation.Scheduled;

public final class CustomerImportRetentionScheduler {
    private final CustomerImportStore store; private final Counter files; private final Counter results;
    public CustomerImportRetentionScheduler(CustomerImportStore store, Counter files, Counter results) { this.store=store;this.files=files;this.results=results; }
    @Scheduled(fixedDelayString = "${followupbussiness.imports.retention-delay-ms:86400000}") public void purgeExpired() { files.increment(store.purgeExpiredFiles()); results.increment(store.purgeExpiredRowErrors()); }
}
