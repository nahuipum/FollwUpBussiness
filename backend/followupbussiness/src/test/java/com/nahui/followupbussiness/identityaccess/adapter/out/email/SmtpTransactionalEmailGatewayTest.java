package com.nahui.followupbussiness.identityaccess.adapter.out.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

class SmtpTransactionalEmailGatewayTest {
    @Test
    void sendsTheApprovedLocalWebResetLinkWithTheOpaqueTokenOnlyInTheEmail() {
        JavaMailSender sender = mock(JavaMailSender.class);
        String token = "A".repeat(43);
        new SmtpTransactionalEmailGateway(sender, "no-reply@example.test", "http://localhost:5173/password-reset")
                .sendPasswordAction("person@example.test", token, "durable-work-id");

        ArgumentCaptor<SimpleMailMessage> email = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(email.capture());
        assertThat(email.getValue().getTo()).containsExactly("person@example.test");
        assertThat(email.getValue().getText()).contains("http://localhost:5173/password-reset?token=" + token);
    }
}
