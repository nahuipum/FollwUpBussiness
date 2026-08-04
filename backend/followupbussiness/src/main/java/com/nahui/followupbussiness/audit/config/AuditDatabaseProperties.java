package com.nahui.followupbussiness.audit.config;

import java.util.Objects;

public final class AuditDatabaseProperties {
    private String writerUrl;
    private String writerUsername;
    private String writerPassword;
    private String purgerUrl;
    private String purgerUsername;
    private String purgerPassword;
    public String getWriterUrl() { return writerUrl; } public void setWriterUrl(String value) { writerUrl = value; }
    public String getWriterUsername() { return writerUsername; } public void setWriterUsername(String value) { writerUsername = value; }
    public String getWriterPassword() { return writerPassword; } public void setWriterPassword(String value) { writerPassword = value; }
    public String getPurgerUrl() { return purgerUrl; } public void setPurgerUrl(String value) { purgerUrl = value; }
    public String getPurgerUsername() { return purgerUsername; } public void setPurgerUsername(String value) { purgerUsername = value; }
    public String getPurgerPassword() { return purgerPassword; } public void setPurgerPassword(String value) { purgerPassword = value; }
    void validate() {
        if (writerUrl == null || writerUsername == null || writerPassword == null || purgerUrl == null || purgerUsername == null || purgerPassword == null
                || Objects.equals(writerUsername, purgerUsername) || Objects.equals(writerUrl, purgerUrl)) throw new IllegalStateException("Separate audit writer and purger database identities and URLs are required");
    }
}
