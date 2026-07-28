# Frontend — FieldSales CRM

Esqueleto del panel administrativo de FieldSales CRM, ubicado en
`frontend/followupbussiness` dentro del monorepo. Contiene únicamente la
inicialización React, el componente raíz, estilos globales y la configuración
de calidad para los incrementos posteriores.

## Requisitos

- Node.js: `^20.19.0 || >=22.12.0`. La configuración se validó con Node.js
  24.16.0.
- npm: gestor de paquetes del proyecto. El bloqueo reproducible es
  `package-lock.json` (lockfile v3).

## Instalación y ejecución

Desde este directorio:

```bash
npm ci
npm run dev
```

Vite mostrará la URL local para abrir la aplicación. Para previsualizar una
compilación de producción, ejecutar `npm run preview` después de `npm run build`.

## Variables de entorno

Solo se permiten variables públicas de Vite con el prefijo `VITE_`. Nunca se
deben incluir secretos, tokens ni credenciales en variables expuestas al
navegador. Los archivos `.env` y `.env.*` están ignorados; cuando se requieran
variables documentadas, añadir un `.env.example` sin valores sensibles.

## Validaciones

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

- `typecheck` ejecuta los proyectos TypeScript referenciados sin emitir archivos.
- `lint` ejecuta ESLint sobre los archivos TypeScript y TSX.
- `test` ejecuta las pruebas de componente con Vitest, React Testing Library y
  jsdom.
- `build` comprueba los tipos y crea el bundle de producción en `dist/`.

## Estructura actual y crecimiento

```text
src/
├── app/          # componente raíz de la aplicación
├── styles/       # estilos globales
└── main.tsx      # punto de entrada React
```

No se incluyen rutas, estado global, cliente HTTP, WebSocket, mapas, librería
de UI ni reglas de negocio. Cuando exista código de producto, crear
`src/features/<feature>/` para la funcionalidad y `src/shared/` únicamente para
código transversal reutilizable. Las features no deben acoplarse mediante
imports internos entre sí; sus límites se definirán con APIs públicas explícitas.

Los tipos REST deberán derivarse de `../../docs/api/openapi.yaml`. El contrato
actual no define esquemas suficientes y este esqueleto no consume endpoints.

## TypeScript estricto

Los proyectos de aplicación y configuración habilitan `strict: true` y además:

- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- `noUnusedLocals`
- `noUnusedParameters`
- `forceConsistentCasingInFileNames`

`skipLibCheck` se mantiene para no validar declaraciones de dependencias de
terceros; no excluye la comprobación estricta del código fuente propio.
