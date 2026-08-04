# Follow Up Bussiness

Aplicación Flutter para vendedores de campo de FollowUpBussiness. EN-004 crea el punto de partida ejecutable y la estructura técnica; no implementa flujos de negocio.

## Requisitos y plataformas

- Flutter 3.44.8 estable.
- Dart 3.12.2.
- Canal Flutter `stable`.
- Android 10 (API 29) o superior.
- iOS se conserva como plataforma del proyecto adoptado; su compilación requiere macOS con Xcode.

El repositorio no define una estrategia de versionado de Flutter (por ejemplo, FVM), por lo que se usa el SDK estable documentado arriba. El `pubspec.yaml` fija el rango de Dart compatible con esa versión.

Los identificadores nativos actuales `com.example.followupbussiness` son provisionales heredados de la plantilla. No existe un identificador definitivo documentado: no deben publicarse ni ampliarse sin una decisión de producto y configuración de firma correspondiente.

## Instalación y ejecución

Desde este directorio:

```bash
flutter pub get
flutter devices
flutter run -d <device-id>
```

Inicia un emulador Android o conecta un dispositivo Android 10+ antes de ejecutar `flutter devices`. En macOS, selecciona un simulador o dispositivo iOS disponible con el mismo comando.

## Calidad, pruebas y builds

```bash
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build apk
flutter build ios
```

`flutter build ios` solo es aplicable desde macOS con Xcode. El APK se puede generar desde un entorno Android correctamente configurado. No se generan builds para plataformas no aprobadas.

## Estructura

```text
lib/
├── app/                         # Composición y widget raíz de la aplicación.
└── features/
    └── app_shell/               # Vista técnica mínima de inicio.
test/                            # Pruebas de widget observables.
android/                         # Adaptador nativo Android.
ios/                             # Adaptador nativo iOS heredado del proyecto.
```

Las features son dueñas de sus pantallas, estado y contratos propios. Una feature no importa implementaciones internas de otra. El código transversal futuro se ubicará en `core/` solo cuando tenga una responsabilidad técnica compartida aprobada; componentes visuales reutilizables irán en `shared/`. Las dependencias entre features se realizarán mediante contratos expuestos por `app/` o `core/`, nunca mediante imports a carpetas internas de otra feature.

Para agregar una feature, crea `lib/features/<feature>/` con sus capas necesarias, expón únicamente su API pública y conéctala desde `app/`. Antes de añadir infraestructura compartida, persistencia, red, estado global o dependencias, verifica que la historia y los contratos lo aprueben.

## Configuración y archivos locales

No hay configuración funcional en EN-004. Cuando exista, los valores no sensibles podrán inyectarse por mecanismos aprobados de build; secretos, tokens y credenciales nunca se incluyen en Dart ni recursos nativos. Los archivos locales y generados que no se versionan están definidos en `.gitignore`: cachés Dart/Flutter, `build/`, cobertura, logs, `.env*`, keystores, `key.properties`, configuración local Android, IDE y artefactos iOS generados.
