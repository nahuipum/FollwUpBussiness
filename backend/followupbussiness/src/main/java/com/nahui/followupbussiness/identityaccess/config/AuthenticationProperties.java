package com.nahui.followupbussiness.identityaccess.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

public final class AuthenticationProperties {
    @ConfigurationProperties(prefix = "followupbussiness.authentication")
    public static class Values {
        private String rs256PrivateKey, kid, issuer, audience, hmacSecret, webOrigin;

        public String getRs256PrivateKey() {
            return rs256PrivateKey;
        }

        public void setRs256PrivateKey(String x) {
            rs256PrivateKey = x;
        }

        public String getKid() {
            return kid;
        }

        public void setKid(String x) {
            kid = x;
        }

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String x) {
            issuer = x;
        }

        public String getAudience() {
            return audience;
        }

        public void setAudience(String x) {
            audience = x;
        }

        public String getHmacSecret() {
            return hmacSecret;
        }

        public void setHmacSecret(String x) {
            hmacSecret = x;
        }

        public String getWebOrigin() {
            return webOrigin;
        }

        public void setWebOrigin(String x) {
            webOrigin = x;
        }
    }
}
