# HTTPS local de FE-001

La integración local usa `https://localhost:5173` para el frontend y
`https://localhost:8080` para el backend. Los certificados y sus contraseñas
permanecen fuera del repositorio.

1. Instala una CA local de confianza y crea un certificado para `localhost`
   (por ejemplo, con `mkcert -install` y `mkcert -cert-file <ruta-externa>/localhost.pem -key-file <ruta-externa>/localhost-key.pem localhost 127.0.0.1 ::1`).
2. Convierte el par a un PKCS12 externo con `openssl pkcs12 -export -in <ruta-externa>/localhost.pem -inkey <ruta-externa>/localhost-key.pem -out <ruta-externa>/localhost.p12 -name local-https`; el comando solicita la contraseña sin imprimirla.
3. En una consola PowerShell, configura `SERVER_SSL_ENABLED=true`, `SERVER_SSL_KEY_STORE=file:<ruta-externa>/localhost.p12`, `SERVER_SSL_KEY_STORE_PASSWORD=<contraseña-del-keystore>`, `SERVER_SSL_KEY_ALIAS=local-https` y `AUTH_WEB_ORIGIN=https://localhost:5173`; inicia el backend con `mvn spring-boot:run` desde `backend/followupbussiness`.
4. En otra consola, configura `VITE_API_BASE_URL=https://localhost:8080`, `FRONTEND_HTTPS_CERT=<ruta-externa>/localhost.pem` y `FRONTEND_HTTPS_KEY=<ruta-externa>/localhost-key.pem`; inicia `npm run dev` desde `frontend/followupbussiness`.

Con una cuenta WEB autorizada, abre `https://localhost:5173`, inicia sesión y
verifica en DevTools que `POST https://localhost:8080/auth/login` no tiene
error CORS y devuelve `Set-Cookie` con `HttpOnly; Secure`. La aplicación no
lee esa cookie desde JavaScript; valida también el mensaje de error y el cierre
pendiente.
