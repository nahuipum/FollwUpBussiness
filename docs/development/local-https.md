# Transporte local de FE-001

TLS no es obligatorio para trabajar en loopback. La configuración local por
defecto usa `http://localhost:5173` para el frontend y
`http://localhost:8080` para el backend. La aplicación sigue rechazando HTTP
hacia hosts remotos; producción y cualquier entorno publicado deben usar TLS.

## Inicio rápido sin TLS

1. Mantén `SERVER_SSL_ENABLED=false` y configura
   `AUTH_WEB_ORIGIN=http://localhost:5173` en el backend.
2. Usa `VITE_API_BASE_URL=http://localhost:8080` en el frontend.
3. Inicia el backend desde `backend/followupbussiness` y luego ejecuta
   `npm run dev` desde `frontend/followupbussiness`.

Los certificados no son necesarios en este modo. La cookie de sesión conserva
`HttpOnly`, `Secure` y `SameSite=Strict`; no se relajan sus atributos para otros
entornos.

## HTTPS local opcional

Cuando necesites probar TLS, crea certificados de `localhost` fuera del
repositorio y configura en el backend `SERVER_SSL_ENABLED=true`,
`SERVER_SSL_KEY_STORE`, `SERVER_SSL_KEY_STORE_PASSWORD`,
`SERVER_SSL_KEY_ALIAS` y `AUTH_WEB_ORIGIN=https://localhost:5173`. En el
frontend usa `VITE_API_BASE_URL=https://localhost:8080` junto con
`FRONTEND_HTTPS_CERT` y `FRONTEND_HTTPS_KEY`.

Las dos rutas del certificado deben declararse juntas. No guardes certificados,
claves ni contraseñas en el repositorio.
