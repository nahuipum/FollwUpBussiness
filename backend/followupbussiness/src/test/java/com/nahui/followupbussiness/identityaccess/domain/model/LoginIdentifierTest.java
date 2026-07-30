package com.nahui.followupbussiness.identityaccess.domain.model;

import org.junit.jupiter.api.Test;

import java.util.Locale;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginIdentifierTest {

    @Test
    void operatorIdentityIsCanonicalizedWithoutChangingItsBoundaries() {
        String mixedCase = "Operator-" + UUID.randomUUID() + "@Invalid.Example";

        LoginIdentifier identifier = LoginIdentifier.fromOperatorInput(mixedCase);

        assertThat(identifier.value()).isEqualTo(mixedCase.toLowerCase(Locale.ROOT));
    }

    @Test
    void boundaryWhitespaceAndControlCharactersAreRejectedWithoutEchoingTheValue() {
        String boundaryValue = " operator-" + UUID.randomUUID() + "@invalid.example";
        String controlValue = "operator-" + UUID.randomUUID() + "\n@invalid.example";

        assertThatThrownBy(() -> LoginIdentifier.fromOperatorInput(boundaryValue))
                .hasMessageNotContaining(boundaryValue);
        assertThatThrownBy(() -> LoginIdentifier.fromOperatorInput(controlValue))
                .hasMessageNotContaining(controlValue);
    }
}
