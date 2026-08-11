CREATE TABLE tenancy_currency_catalog (
    code VARCHAR(3) PRIMARY KEY,
    display_name VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO tenancy_currency_catalog (code, display_name) VALUES
    ('PEN', 'Sol peruano'),
    ('USD', 'Dólar estadounidense'),
    ('EUR', 'Euro');

CREATE SEQUENCE tenancy_company_code_sequence START WITH 1 INCREMENT BY 1;
