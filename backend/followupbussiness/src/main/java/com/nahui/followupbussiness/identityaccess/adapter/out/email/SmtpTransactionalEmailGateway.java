package com.nahui.followupbussiness.identityaccess.adapter.out.email;

import com.nahui.followupbussiness.identityaccess.application.port.out.TransactionalEmailGateway;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

public final class SmtpTransactionalEmailGateway implements TransactionalEmailGateway {
    private final JavaMailSender sender;
    private final String from;
    private final String activationUrl;

    public SmtpTransactionalEmailGateway(JavaMailSender sender, String from, String activationUrl) {
        this.sender = sender;
        this.from = from;
        this.activationUrl = activationUrl;
    }

    @Override
    public void sendPasswordAction(String identifier, String token, String idempotencyKey) {
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(identifier);
        message.setSubject("Activa tu cuenta de FollowUpBusiness");
        message.setText("Completa tu acceso aquí: " + activationUrl + "?token=" + token);
        sender.send(message);
    }
}
