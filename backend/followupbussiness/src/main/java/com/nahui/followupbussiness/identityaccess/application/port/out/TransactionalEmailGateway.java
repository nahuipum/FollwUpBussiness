package com.nahui.followupbussiness.identityaccess.application.port.out;

/** Interchangeable outbound identity channel, selected by environment configuration. */
public interface TransactionalEmailGateway {
    /** idempotencyKey is stable for the durable work item across lease recovery. */
    void sendPasswordAction(String identifier, String token, String idempotencyKey);
}
