package com.nahui.followupbussiness.outbox.application.port.out;

import com.nahui.followupbussiness.outbox.domain.OutboxEvent;

public interface EventTransport {
    void publish(OutboxEvent event);
}
