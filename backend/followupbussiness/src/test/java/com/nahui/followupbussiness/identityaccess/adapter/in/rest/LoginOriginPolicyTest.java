package com.nahui.followupbussiness.identityaccess.adapter.in.rest;
import org.junit.jupiter.api.Test;
import java.nio.file.*;
import static org.assertj.core.api.Assertions.assertThat;
class LoginOriginPolicyTest { @Test void webOriginUsesApplicationPortAndExactConfiguredEquality() throws Exception { String controller=Files.readString(Path.of("src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LoginController.java")); String configuration=Files.readString(Path.of("src/main/java/com/nahui/followupbussiness/identityaccess/config/WebOriginPolicyConfiguration.java")); assertThat(controller).contains("!origins.isAllowed(servlet.getHeader(\"Origin\"))"); assertThat(configuration).contains("properties.getWebOrigin() != null && properties.getWebOrigin().equals(origin)"); } }
