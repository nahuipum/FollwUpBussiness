package com.nahui.followupbussiness.outbox.domain;

public final class UnroutablePublicationException extends RuntimeException {
    public UnroutablePublicationException() {
        super("RabbitMQ publication was returned as unroutable");
    }
}
