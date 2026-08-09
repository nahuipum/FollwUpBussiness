#!/bin/sh
set -eu

: "${POSTGRES_HOST:?POSTGRES_HOST is required}"
: "${POSTGRES_PORT:?POSTGRES_PORT is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${AUDIT_WRITER_PASSWORD:?AUDIT_WRITER_PASSWORD is required}"
: "${AUDIT_PURGER_PASSWORD:?AUDIT_PURGER_PASSWORD is required}"

export PGPASSWORD="$POSTGRES_PASSWORD"
psql --no-psqlrc --set=ON_ERROR_STOP=1 \
  --host "$POSTGRES_HOST" --port "$POSTGRES_PORT" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=writer_password="$AUDIT_WRITER_PASSWORD" --set=purger_password="$AUDIT_PURGER_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE audit_writer_local LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT PASSWORD %L', :'writer_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_writer_local')
\gexec
SELECT format('ALTER ROLE audit_writer_local LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT PASSWORD %L', :'writer_password')
\gexec
SELECT format('CREATE ROLE audit_purger_local LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT PASSWORD %L', :'purger_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_purger_local')
\gexec
SELECT format('ALTER ROLE audit_purger_local LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT PASSWORD %L', :'purger_password')
\gexec
SQL
