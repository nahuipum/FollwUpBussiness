package com.nahui.followupbussiness.notifications.adapter.out.push;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.nahui.followupbussiness.notifications.application.port.out.RoutePushGateway;

/** FCM adapter; ADC is resolved in configuration and neither token nor provider detail is logged. */
public final class FcmRoutePushGateway implements RoutePushGateway {
    private final FirebaseMessaging messaging;
    public FcmRoutePushGateway(FirebaseMessaging messaging) { this.messaging = messaging; }
    @Override public Result send(Request request) {
        try {
            messaging.send(Message.builder().setToken(request.protectedToken())
                    .setNotification(Notification.builder().setTitle(request.title()).setBody(request.body()).build())
                    .putData("refresh", "routes").build());
            return Result.DELIVERED;
        } catch (FirebaseMessagingException ex) {
            String code = ex.getMessagingErrorCode() == null ? "" : ex.getMessagingErrorCode().name();
            if (code.equals("UNREGISTERED") || code.equals("INVALID_ARGUMENT")) return Result.INVALID_TOKEN;
            if (code.equals("QUOTA_EXCEEDED") || code.equals("UNAVAILABLE") || code.equals("INTERNAL")) return Result.TRANSIENT_FAILURE;
            return Result.PERMANENT_FAILURE;
        } catch (RuntimeException ex) { return Result.TRANSIENT_FAILURE; }
    }
}
