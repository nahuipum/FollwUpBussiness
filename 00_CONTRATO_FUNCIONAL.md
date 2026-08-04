# Contrato funcional y especificación de requerimientos  
## Plataforma de gestión de vendedores de campo, rutas, visitas y ventas

**Nombre provisional del producto:** FollowUpBussiness
**Versión del documento:** 1.1
**Estado:** Backlog funcional refinado; decisiones de enablers pendientes
**Tipo de documento:** Contrato funcional, especificación de requerimientos y base de producto  
**Fecha:** 27 de julio de 2026  

---

# 1. Propósito del documento

El presente documento consolida el alcance funcional, las reglas de negocio, los requerimientos, las historias de usuario, los criterios de aceptación, las restricciones y los lineamientos generales para desarrollar una plataforma de gestión de vendedores de campo.

El documento servirá como base para:

- Definir qué incluye y qué no incluye el producto.
- Organizar el backlog.
- Crear épicas, historias y tareas técnicas.
- Estimar tiempos y esfuerzo.
- Planificar sprints.
- Validar entregables.
- Controlar cambios de alcance.
- Evitar interpretaciones distintas entre negocio, producto, diseño y desarrollo.

Este documento no reemplaza los contratos comerciales, legales o laborales que puedan celebrarse posteriormente. Su finalidad principal es definir el comportamiento esperado del software.

---

# 2. Visión del producto

La plataforma permitirá a una empresa organizar, supervisar y medir la actividad de sus vendedores de campo.

El sistema deberá permitir:

- Registrar clientes y sus ubicaciones.
- Generar rutas automáticas.
- Asignar rutas y clientes a vendedores.
- Visualizar la ubicación de los vendedores durante su jornada.
- Validar que una visita se realice cerca de la ubicación del cliente.
- Registrar ventas asociadas a cada visita y cliente.
- Consultar el histórico de ventas.
- Comparar rutas programadas con rutas ejecutadas.
- Medir visitas, cobertura, ventas y productividad.
- Mantener trazabilidad de las acciones realizadas por cada usuario.

La propuesta de valor principal será:

> Permitir que una empresa conozca dónde se encuentran sus vendedores, qué clientes visitaron, qué vendieron, qué clientes quedaron pendientes y qué tan efectiva fue cada ruta.

---

# 3. Objetivos del producto

## 3.1 Objetivo general

Desarrollar una plataforma web y móvil que permita gestionar vendedores de campo, planificar rutas, verificar visitas y registrar ventas de manera centralizada.

## 3.2 Objetivos específicos

1. Digitalizar la planificación diaria de visitas.
2. Reducir la elaboración manual de rutas.
3. Mejorar la cobertura de clientes.
4. Validar las visitas mediante geolocalización.
5. Obtener visibilidad de la ubicación del vendedor durante su jornada.
6. Registrar ventas directamente desde el punto visitado.
7. Consultar las ventas realizadas por cliente y vendedor.
8. Generar indicadores de desempeño comercial.
9. Facilitar la supervisión del equipo de campo.
10. Mantener un historial auditable de rutas, visitas y ventas.

---

# 4. Alcance funcional

## 4.1 Alcance del MVP

La primera versión funcional deberá incluir:

### Módulo de administración

- Autenticación y gestión de usuarios.
- Gestión de vendedores.
- Registro y edición de clientes.
- Registro de coordenadas de clientes.
- Importación masiva de clientes.
- Visualización de clientes en mapa.
- Creación manual de rutas.
- Generación automática de rutas.
- Asignación de rutas a vendedores.
- Consulta de rutas planificadas.
- Seguimiento de ubicación de vendedores.
- Consulta de visitas realizadas.
- Consulta de visitas pendientes.
- Consulta de ventas del día.
- Consulta del histórico de ventas.
- Consulta de ventas por cliente.
- Consulta de ventas por vendedor.
- Dashboard básico de productividad.
- Registro de auditoría.

### Módulo del vendedor

- Inicio de sesión.
- Inicio y cierre de jornada.
- Visualización de ruta asignada.
- Visualización de clientes pendientes y visitados.
- Navegación hacia el cliente.
- Actualización periódica de ubicación.
- Habilitación del marcaje de visita dentro de una geocerca.
- Registro de inicio de visita.
- Registro de fin de visita.
- Registro del resultado de la visita.
- Registro de venta.
- Consulta de ventas realizadas durante el día.
- Funcionamiento con conectividad intermitente.
- Sincronización automática cuando se recupere internet.

---

# 5. Fuera de alcance inicial

Los siguientes elementos no forman parte obligatoria del MVP, salvo que sean aprobados mediante cambio de alcance:

- Facturación electrónica.
- Integración directa con SUNAT.
- Procesamiento de pagos.
- Integración bancaria.
- Gestión contable.
- Gestión completa de inventarios.
- Gestión de almacenes.
- Gestión de cobranzas.
- Gestión de comisiones.
- Firma digital certificada.
- Inteligencia artificial para predicción de ventas.
- Optimización avanzada con tráfico en tiempo real.
- Integración con ERP de terceros.
- Aplicación para clientes finales.
- Chat interno.
- Nómina o control de asistencia laboral.
- Geolocalización fuera de la jornada.
- Seguimiento continuo del dispositivo cuando el usuario haya cerrado su jornada.

Estos módulos podrán incorporarse posteriormente como fases adicionales.

---

# 6. Tipos de usuario

## 6.1 Administrador

Usuario responsable de la configuración y supervisión general.

Podrá:

- Crear y administrar usuarios.
- Registrar clientes.
- Crear y asignar rutas.
- Consultar ubicaciones.
- Revisar visitas.
- Consultar ventas.
- Configurar parámetros.
- Acceder a reportes.
- Consultar auditoría.

## 6.2 Supervisor

Usuario responsable de uno o varios equipos de vendedores.

Podrá:

- Consultar vendedores asignados.
- Ver rutas.
- Ver ubicaciones.
- Consultar visitas.
- Consultar ventas.
- Revisar indicadores.
- Reasignar rutas cuando tenga permiso.

No podrá modificar configuraciones globales salvo autorización expresa.

## 6.3 Vendedor

Usuario que realiza visitas de campo.

Podrá:

- Iniciar y cerrar su jornada.
- Ver su ruta.
- Consultar clientes asignados.
- Registrar visitas.
- Registrar resultados.
- Registrar ventas.
- Consultar su actividad del día.

No podrá ver información de otros vendedores salvo que el negocio lo habilite.

## 6.4 Superadministrador de plataforma

Usuario interno encargado de administrar múltiples empresas dentro del SaaS.

Podrá:

- Crear empresas.
- Configurar planes.
- Suspender o reactivar cuentas.
- Consultar métricas técnicas.
- Gestionar soporte.
- Acceder a información únicamente cuando exista autorización y trazabilidad.

---

# 7. Reglas generales de negocio

## RN-001. Aislamiento por empresa

Cada empresa deberá visualizar únicamente su propia información.

## RN-002. Propiedad de la información

Los clientes, rutas, visitas, ventas y usuarios pertenecerán a una empresa específica.

## RN-003. Jornada activa

El vendedor solo podrá ser rastreado mientras tenga una jornada activa.

## RN-004. Ubicación visible

El sistema deberá informar de manera visible al vendedor cuando la ubicación esté siendo utilizada.

## RN-005. Geocerca

El botón o flag para registrar una visita se habilitará únicamente cuando el vendedor se encuentre dentro del radio permitido respecto al cliente.

## RN-006. Radio configurable

El radio permitido deberá ser configurable por empresa.

Valor sugerido inicial:

- Mínimo: 30 metros.
- Valor por defecto: 100 metros.
- Máximo para configuración ordinaria: 500 metros.

## RN-007. Registro fuera de geocerca

En el MVP, una visita fuera de geocerca no podrá marcarse normalmente.

Opcionalmente, un usuario autorizado podrá registrar una excepción con:

- Motivo obligatorio.
- Fecha y hora.
- Distancia respecto al cliente.
- Usuario que autorizó.
- Evidencia, si corresponde.

## RN-008. Una visita por evento

Cada marcaje deberá generar un registro independiente, incluso si el vendedor visita varias veces al mismo cliente durante el día.

## RN-009. Inicio y cierre de visita

Una visita deberá contar con:

- Fecha y hora de inicio.
- Coordenadas de inicio.
- Fecha y hora de cierre.
- Coordenadas de cierre.
- Duración.
- Resultado.

## RN-010. Resultado obligatorio

El vendedor deberá seleccionar el resultado de la visita antes de finalizarla.

Ejemplos:

- Venta realizada.
- Cliente cerrado.
- Cliente ausente.
- No interesado.
- Solicita nueva visita.
- Sin stock.
- Problema con precio.
- Crédito no aprobado.
- Dirección incorrecta.
- Otro.

## RN-011. Venta asociada

Toda venta deberá estar asociada a:

- Empresa.
- Vendedor.
- Cliente.
- Fecha y hora.
- Visita, cuando la venta se origine durante una visita.
- Uno o más productos o conceptos.
- Monto total.

## RN-012. Edición de ventas

Una venta podrá editarse únicamente durante el periodo permitido por la empresa.

Valor sugerido:

- Hasta el cierre de jornada, o
- Hasta 24 horas después de su registro.

Toda modificación deberá quedar registrada en auditoría.

## RN-013. Eliminación lógica

Clientes, vendedores, rutas y ventas no deberán eliminarse físicamente cuando tengan historial relacionado.

Se utilizará eliminación lógica o estado inactivo.

## RN-014. Ruta diaria

Cada ruta deberá pertenecer a:

- Una fecha.
- Un vendedor.
- Una empresa.
- Una secuencia de clientes.

## RN-015. Clientes duplicados

El sistema deberá advertir posibles duplicados usando:

- Código de cliente.
- Documento.
- Teléfono.
- Dirección.
- Proximidad geográfica.
- Nombre comercial.

## RN-016. Ubicación desactualizada

El administrador deberá visualizar la hora de la última ubicación recibida.

La interfaz no deberá mostrar una ubicación antigua como si fuera actual.

## RN-017. Visita no equivale a venta

Una visita podrá finalizar sin venta.

## RN-018. Venta sin visita

La empresa podrá configurar si permite o no ventas sin visita.

Por defecto, las ventas del vendedor de campo deberán asociarse a una visita.

## RN-019. Reasignación de ruta

Una ruta podrá reasignarse antes o durante la jornada.

Toda reasignación deberá quedar registrada.

## RN-020. Horario de rastreo

El rastreo se suspenderá cuando:

- El vendedor cierre su jornada.
- La empresa finalice administrativamente la jornada.
- El usuario cierre sesión; el logout siempre suspende y detiene el rastreo.
- El permiso de ubicación sea revocado.

---

# 8. Requerimientos funcionales

---

## 8.1 Autenticación y seguridad

### RF-AUT-001. Inicio de sesión

El sistema deberá permitir el inicio de sesión mediante correo o nombre de usuario y contraseña.

### RF-AUT-002. Recuperación de contraseña

El sistema deberá permitir recuperar o restablecer la contraseña.

### RF-AUT-003. Control por roles

El sistema deberá restringir las funcionalidades según el rol.

### RF-AUT-004. Gestión de sesión

El sistema deberá cerrar o renovar sesiones de manera segura.

### RF-AUT-005. Bloqueo de usuario

El administrador deberá poder bloquear un usuario sin eliminar su historial.

### RF-AUT-006. Gestión de usuarios de empresa

El administrador de empresa deberá poder listar, invitar, editar, bloquear y
reactivar administradores y supervisores de su propia empresa.

Reglas:

- No existirá registro público.
- No podrá asignar roles de plataforma.
- La activación inicial utilizará un mecanismo temporal de un solo uso.
- Bloquear un usuario conservará historial y revocará su acceso.
- Una empresa activa no podrá quedar sin un administrador utilizable.

---

## 8.2 Gestión de vendedores

### RF-VEN-001. Registro de vendedor

El administrador deberá poder registrar:

- Nombres.
- Apellidos.
- Documento.
- Correo.
- Teléfono.
- Código interno.
- Supervisor.
- Zona.
- Estado.
- Fecha de ingreso.
- Usuario de acceso.

### RF-VEN-002. Edición de vendedor

El administrador deberá poder actualizar la información del vendedor.

### RF-VEN-003. Activación e inactivación

El administrador deberá poder activar o inactivar vendedores.

### RF-VEN-004. Asignación de supervisor

Cada vendedor podrá estar asociado a un supervisor.

### RF-VEN-005. Asignación de territorio

Cada vendedor podrá tener una o más zonas asignadas.

### RF-VEN-006. Catálogo de zonas y territorios

La empresa deberá poder crear, listar, editar e inactivar zonas con código,
nombre y estado. El MVP no exige polígonos geográficos.

### RF-VEN-007. Consulta de vendedores

Administradores y supervisores deberán poder consultar vendedores de forma
paginada y filtrar por estado, supervisor y zona. El supervisor solo verá su
equipo.

---

## 8.3 Gestión de clientes

### RF-CLI-001. Registro manual

El administrador deberá poder registrar un cliente manualmente.

Campos mínimos:

- Código.
- Nombre comercial.
- Razón social, cuando corresponda.
- Documento.
- Dirección.
- Departamento.
- Provincia.
- Distrito.
- Teléfono.
- Contacto.
- Latitud.
- Longitud.
- Estado.
- Segmento.
- Frecuencia de visita.
- Vendedor asignado.
- Observaciones.

### RF-CLI-002. Selección en mapa

El administrador deberá poder seleccionar la ubicación del cliente sobre un mapa.

### RF-CLI-003. Geocodificación

El sistema podrá intentar obtener coordenadas a partir de una dirección.

La coordenada sugerida deberá ser confirmada por el administrador.

### RF-CLI-004. Importación masiva

El sistema deberá permitir importar clientes mediante archivo CSV o Excel.

La importación deberá:

- Validar estructura.
- Informar errores por fila.
- Detectar duplicados.
- Permitir descargar errores.
- Confirmar cantidad de registros válidos.
- Registrar quién realizó la carga.

### RF-CLI-005. Edición de ubicación

El administrador deberá poder corregir las coordenadas.

### RF-CLI-006. Visualización en mapa

El administrador deberá poder visualizar clientes en un mapa.

### RF-CLI-007. Filtros

El sistema deberá permitir filtrar por:

- Zona.
- Distrito.
- Vendedor.
- Estado.
- Segmento.
- Última visita.
- Última venta.
- Frecuencia.
- Clientes sin visita.
- Clientes sin compra.

### RF-CLI-008. Historial del cliente

La ficha del cliente deberá mostrar:

- Datos generales.
- Visitas.
- Ventas.
- Productos comprados.
- Última visita.
- Última venta.
- Vendedor asignado.
- Observaciones.
- Incidencias.
- Próxima visita, cuando corresponda.

### RF-CLI-009. Asignación de cartera

El administrador deberá poder asignar o reasignar clientes a un vendedor,
individual o masivamente, conservando responsable anterior, nuevo responsable,
fecha y actor. La reasignación no modificará visitas, ventas ni rutas
históricas.

---

## 8.4 Gestión de rutas

### RF-RUT-001. Creación manual

El administrador deberá poder crear una ruta seleccionando:

- Fecha.
- Vendedor.
- Clientes.
- Orden de visita.
- Hora estimada.
- Observaciones.

### RF-RUT-002. Generación automática

El sistema deberá poder generar una ruta automática a partir de:

- Vendedor.
- Fecha.
- Zona.
- Lista de clientes.
- Punto de inicio.
- Punto final.
- Horario disponible.
- Duración estimada de visitas.
- Prioridad.
- Ventanas horarias, cuando existan.

### RF-RUT-003. Optimización básica

La ruta automática deberá buscar un orden eficiente de visita considerando, como mínimo:

- Distancia.
- Secuencia.
- Punto de inicio.
- Punto final.
- Cantidad máxima de clientes.

### RF-RUT-004. Reordenamiento

El administrador deberá poder modificar manualmente el orden propuesto.

### RF-RUT-005. Asignación

El administrador deberá poder asignar la ruta a un vendedor.

### RF-RUT-006. Confirmación de publicación

La ruta deberá pasar por estados:

- Borrador.
- Publicada.
- En curso.
- Finalizada.
- Cancelada.

### RF-RUT-007. Notificación

El vendedor deberá recibir una notificación cuando se le asigne o modifique una ruta.

### RF-RUT-008. Ruta ejecutada

El sistema deberá comparar:

- Ruta planificada.
- Orden real de visitas.
- Distancia estimada.
- Distancia recorrida, cuando sea posible.
- Clientes visitados.
- Clientes omitidos.
- Clientes visitados fuera de ruta.

### RF-RUT-009. Reasignación

El administrador podrá reasignar una ruta.

### RF-RUT-010. Copia de ruta

El administrador podrá duplicar una ruta para otra fecha.

### RF-RUT-011. Frecuencia de visitas

El sistema podrá sugerir clientes según frecuencia configurada.

Ejemplos:

- Diario.
- Semanal.
- Quincenal.
- Mensual.
- Personalizado.

### RF-RUT-012. Consulta y versión de ruta

El panel deberá poder listar y consultar rutas autorizadas. El vendedor deberá
consultar su ruta publicada para la fecha operativa de la empresa. Cada
publicación o modificación tendrá una versión que permita detectar una copia
móvil desactualizada.

---

## 8.5 Jornada y ubicación del vendedor

### RF-UBI-001. Inicio de jornada

El vendedor deberá iniciar su jornada desde la aplicación.

El sistema registrará:

- Fecha y hora.
- Coordenadas.
- Dispositivo.
- Usuario.
- Estado de permisos de ubicación.

### RF-UBI-002. Seguimiento durante jornada

Mientras la jornada esté activa, la aplicación enviará ubicaciones periódicas.

### RF-UBI-003. Frecuencia de actualización

Para el MVP la frecuencia será fija: una muestra cada 60 segundos, solo durante
jornada activa, conforme EN-016/ADR-016. Cambiar ese valor requiere ADR
sustituto, actualización de contrato y revisión de Seguridad/Legal.
El servidor acepta como máximo una muestra por ventana UTC de 60 segundos de
`capturedAt` por tenant, usuario y jornada; las adicionales se rechazan por
muestra. Los lotes offline pueden contener ventanas distintas y el control de
abuso agrega todos los dispositivos del mismo ámbito.

### RF-UBI-004. Visualización en tiempo real

El administrador podrá visualizar:

- Ubicación más reciente.
- Hora de actualización.
- Estado del vendedor.
- Ruta asignada.
- Cliente actual o próximo.
- Precisión GPS.

### RF-UBI-005. Estados del vendedor

Estados sugeridos:

- Sin jornada.
- Disponible.
- En traslado.
- Dentro de geocerca.
- En visita.
- En pausa.
- Sin conexión.
- Ubicación desactualizada.
- Jornada finalizada.

### RF-UBI-006. Historial de recorrido

El administrador podrá consultar el recorrido histórico de una jornada.

### RF-UBI-007. Cierre de jornada

El vendedor podrá cerrar su jornada.

El sistema deberá validar:

- Visitas abiertas.
- Ventas pendientes de sincronización.
- Clientes pendientes.
- Observaciones de cierre, cuando sean obligatorias.

### RF-UBI-008. Privacidad

El sistema no deberá recopilar ubicación después del cierre de jornada. La
política EN-016/ADR-016 fija captura cada 60 segundos solo durante jornada
activa, aviso visible y detención ante cierre, revocación o indisponibilidad.
El logout siempre detiene el rastreo. Las muestras inválidas no se persisten ni
se usan para geocerca; el historial exacto aceptado se retiene 90 días.

---

## 8.6 Gestión de visitas

### RF-VIS-001. Detección de proximidad

El sistema deberá calcular la distancia entre el vendedor y el cliente.

### RF-VIS-002. Habilitación del flag

El flag o botón “Registrar visita” se habilitará cuando:

- Exista una jornada activa.
- El cliente pertenezca a la ruta o esté permitido.
- El vendedor se encuentre dentro del radio configurado.
- La precisión GPS sea aceptable.
- No exista otra visita activa.

### RF-VIS-003. Visita iniciada

Al iniciar la visita se guardará:

- Cliente.
- Vendedor.
- Fecha y hora.
- Coordenadas.
- Distancia al cliente.
- Precisión GPS.
- Ruta asociada.
- Dispositivo.

### RF-VIS-004. Una visita activa

El vendedor no podrá tener más de una visita activa simultáneamente.

### RF-VIS-005. Cierre de visita

Para finalizar deberá registrar:

- Resultado.
- Comentario, cuando corresponda.
- Venta o motivo de no venta.
- Próxima acción, cuando corresponda.

### RF-VIS-006. Evidencia opcional

La empresa podrá habilitar:

- Fotografía.
- Firma.
- Nombre del contacto.
- Código de validación.
- Escaneo QR.

### RF-VIS-007. Visita no planificada

La empresa podrá permitir visitas no planificadas.

Estas deberán quedar identificadas como “fuera de ruta”.

### RF-VIS-008. Corrección administrativa

Un administrador autorizado podrá corregir una visita.

Toda corrección deberá registrar:

- Valor anterior.
- Valor nuevo.
- Motivo.
- Usuario.
- Fecha y hora.

### RF-VIS-009. Visitas pendientes

El vendedor y el administrador deberán visualizar los clientes pendientes.

### RF-VIS-010. Duración

El sistema calculará automáticamente la duración.

---

## 8.7 Gestión de ventas

### RF-VTA-001. Registro de venta

El vendedor deberá poder registrar una venta asociada al cliente.

### RF-VTA-002. Datos mínimos

La venta deberá incluir:

- Cliente.
- Vendedor.
- Fecha y hora.
- Visita.
- Número o código interno.
- Productos o conceptos.
- Cantidad.
- Precio unitario.
- Descuento.
- Importe.
- Total.
- Observaciones.

### RF-VTA-003. Catálogo

El sistema deberá permitir seleccionar productos desde un catálogo.

### RF-VTA-004. Venta simple

Para un MVP reducido, la empresa podrá registrar únicamente:

- Concepto.
- Cantidad.
- Monto total.

### RF-VTA-005. Validación de importes

El sistema deberá validar:

- Cantidad mayor que cero.
- Precio no negativo.
- Descuento dentro del límite.
- Total calculado correctamente.

### RF-VTA-006. Venta del día

El administrador podrá consultar ventas del día por:

- Empresa.
- Vendedor.
- Cliente.
- Zona.
- Producto.
- Ruta.

### RF-VTA-007. Histórico

El administrador podrá consultar ventas históricas.

### RF-VTA-008. Ficha de cliente

La ficha del cliente deberá mostrar su historial de ventas.

### RF-VTA-009. Ficha de vendedor

La ficha del vendedor deberá mostrar:

- Venta del día.
- Venta acumulada.
- Ticket promedio.
- Clientes compradores.
- Conversión de visitas.
- Cumplimiento de meta, cuando exista.

### RF-VTA-010. Anulación

La anulación de una venta requerirá permiso y motivo obligatorio.

### RF-VTA-011. Exportación

El sistema deberá permitir exportar ventas a Excel o CSV.

### RF-VTA-012. Sincronización offline

Las ventas registradas sin conexión deberán almacenarse localmente y sincronizarse después.

El sistema deberá prevenir duplicados mediante un identificador único generado en el dispositivo.

---

## 8.8 Dashboard y reportes

### RF-REP-001. Dashboard general

El administrador visualizará:

- Vendedores con jornada activa.
- Vendedores sin conexión.
- Vendedores en visita.
- Visitas planificadas.
- Visitas realizadas.
- Visitas pendientes.
- Ventas del día.
- Monto vendido.
- Clientes compradores.
- Conversión visita a venta.

### RF-REP-002. Reporte por vendedor

Deberá mostrar:

- Clientes programados.
- Clientes visitados.
- Clientes omitidos.
- Visitas fuera de ruta.
- Ventas.
- Monto.
- Ticket promedio.
- Tiempo promedio por visita.
- Hora de inicio.
- Hora de cierre.
- Distancia estimada y recorrida, cuando esté disponible.

### RF-REP-003. Reporte por cliente

Deberá mostrar:

- Última visita.
- Última compra.
- Frecuencia.
- Vendedor.
- Ventas acumuladas.
- Productos.
- Resultado de visitas.
- Días sin compra.

### RF-REP-004. Reporte de cobertura

Deberá mostrar:

- Porcentaje de clientes visitados.
- Clientes no visitados.
- Cobertura por zona.
- Cobertura por vendedor.
- Cobertura por periodo.

### RF-REP-005. Exportación

Los reportes deberán exportarse a Excel o CSV.

---

## 8.9 Auditoría

### RF-AUD-001. Registro de acciones

El sistema deberá registrar acciones relevantes:

- Inicio de sesión.
- Creación y edición de cliente.
- Cambio de coordenadas.
- Creación y edición de rutas.
- Reasignaciones.
- Inicio y cierre de visita.
- Registro y edición de ventas.
- Anulaciones.
- Cambios de configuración.

### RF-AUD-002. Datos auditables

Cada registro deberá incluir:

- Empresa.
- Usuario.
- Acción.
- Entidad.
- Identificador.
- Fecha y hora.
- Dirección IP, cuando aplique.
- Dispositivo.
- Valor anterior.
- Valor nuevo.

---

# 9. Requerimientos no funcionales

## RNF-001. Disponibilidad

La plataforma deberá buscar una disponibilidad mensual mínima de 99,5 %, excluyendo mantenimientos programados.

## RNF-002. Rendimiento

Operaciones comunes deberán responder idealmente en menos de 3 segundos bajo condiciones normales.

## RNF-003. Escalabilidad

La arquitectura deberá soportar múltiples empresas y crecimiento progresivo de usuarios.

## RNF-004. Seguridad

La información deberá transmitirse mediante HTTPS.

## RNF-005. Contraseñas

Las contraseñas deberán almacenarse usando hash seguro y nunca en texto plano.

## RNF-006. Control de acceso

Toda operación deberá validar empresa, usuario, rol y permisos.

## RNF-007. Protección de datos

La plataforma deberá contemplar consentimiento, finalidad, retención y acceso controlado a datos personales y de ubicación.

## RNF-008. Auditoría

Las operaciones críticas deberán ser trazables.

## RNF-009. Copias de seguridad

Se deberán realizar copias de seguridad automáticas.

## RNF-010. Recuperación

Deberá existir un procedimiento documentado de restauración.

## RNF-011. Compatibilidad móvil

La aplicación deberá operar en versiones de Android definidas por el proyecto.

Recomendación inicial:

- Android 10 o superior.

## RNF-012. Intermitencia

La aplicación móvil deberá tolerar pérdida temporal de conexión.

## RNF-013. Consistencia

La sincronización no deberá duplicar visitas ni ventas.

## RNF-014. Observabilidad

El sistema deberá contar con:

- Logs.
- Métricas.
- Alertas.
- Trazabilidad de errores.
- Identificador de correlación.

## RNF-015. Privacidad por diseño

La aplicación deberá recopilar únicamente la información necesaria para la operación.

## RNF-016. Zona horaria

Todas las operaciones deberán guardar fecha y hora de forma consistente.

La presentación al usuario deberá utilizar la zona horaria configurada para la empresa.

## RNF-017. Idioma

La primera versión estará disponible en español.

---

# 10. Historias de usuario y criterios de aceptación

---

## ÉPICA 1. Acceso y usuarios

### HU-000. Provisionar administrador inicial de empresa

**Como** superadministrador de plataforma<br>
**Quiero** provisionar el administrador inicial de una empresa activa<br>
**Para** que la empresa pueda administrar sus usuarios y su operación.

**Criterios de aceptación:**

1. El administrador inicial queda asociado a una empresa activa y al rol Administrador.
2. Solo un superadministrador autorizado puede realizar la provisión.
3. La cuenta se activa mediante un token temporal de un solo uso; no existe
   contraseña predeterminada.
4. La contraseña final se almacena exclusivamente mediante hash seguro.
5. La operación es auditable sin exponer secretos ni datos personales completos.

**Nota de dependencia:** el catálogo de roles debe existir antes de crear usuarios. El bootstrap del primer superadministrador se realiza mediante un enabler y ADR con procedimiento controlado; no se expone como registro público.

---

### HU-001. Iniciar sesión

**Como** usuario registrado  
**Quiero** iniciar sesión  
**Para** acceder a las funciones correspondientes a mi rol.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Dado un usuario activo, cuando ingrese credenciales válidas, entonces accederá al sistema.
2. Dado un usuario inactivo, cuando intente ingresar, entonces el acceso será rechazado.
3. Dadas credenciales inválidas, el sistema mostrará un mensaje sin revelar información sensible.
4. La sesión deberá asociarse a la empresa del usuario.

---

### HU-002. Crear vendedor

**Como** administrador  
**Quiero** crear vendedores  
**Para** asignarles rutas y controlar su actividad.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. El administrador podrá registrar los datos obligatorios.
2. El correo o usuario no podrá repetirse dentro de la misma empresa.
3. El vendedor deberá quedar activo o inactivo según selección.
4. La creación deberá registrarse en auditoría.

---

### HU-003. Gestionar usuarios de empresa

**Como** administrador de empresa<br>
**Quiero** invitar, editar, bloquear y reactivar administradores y supervisores<br>
**Para** delegar la operación sin depender del soporte de plataforma.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Solo podrá gestionar usuarios de su empresa.
2. No podrá asignar roles de plataforma.
3. El invitado activará su cuenta mediante un enlace de un solo uso.
4. El bloqueo revocará acceso y conservará historial.
5. No podrá dejar a la empresa sin ningún administrador utilizable.
6. Las acciones quedarán auditadas.

---

### HU-004. Gestionar zonas y equipo

**Como** administrador<br>
**Quiero** crear zonas y asignar supervisores/vendedores<br>
**Para** organizar la operación antes de registrar carteras y rutas.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Podrá crear, editar e inactivar zonas sin borrar referencias históricas.
2. Podrá consultar vendedores por supervisor, zona y estado.
3. Un supervisor solo podrá acceder a los vendedores de su equipo.
4. Todas las relaciones pertenecerán a la misma empresa.

---

## ÉPICA 2. Clientes

### HU-010. Registrar cliente

**Como** administrador  
**Quiero** registrar un cliente con su ubicación  
**Para** incluirlo en rutas de campo.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se deberán registrar nombre, dirección y coordenadas.
2. El administrador podrá seleccionar el punto sobre el mapa.
3. El sistema deberá advertir posibles duplicados.
4. El cliente deberá quedar disponible para asignación.

---

### HU-011. Importar clientes

**Como** administrador  
**Quiero** importar clientes desde Excel o CSV  
**Para** evitar registrarlos uno por uno.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. El sistema deberá proporcionar una plantilla.
2. El archivo deberá validarse antes de confirmar la carga.
3. Las filas inválidas deberán indicar el error.
4. Los registros válidos podrán importarse.
5. El resultado deberá indicar insertados, rechazados y duplicados.

---

### HU-012. Consultar historial del cliente

**Como** administrador o supervisor  
**Quiero** revisar el historial de un cliente  
**Para** conocer sus visitas y compras.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se mostrarán visitas ordenadas por fecha.
2. Se mostrarán ventas ordenadas por fecha.
3. Se mostrará última visita y última venta.
4. Se podrá filtrar por periodo.

---

### HU-013. Asignar cartera de clientes

**Como** administrador<br>
**Quiero** asignar o reasignar clientes a un vendedor<br>
**Para** planificar rutas y medir cobertura sobre una cartera vigente.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Cliente y vendedor deberán pertenecer a la misma empresa.
2. La operación individual y masiva informará rechazos o conflictos.
3. Se conservará el historial de responsable anterior y nuevo.
4. Visitas, ventas y rutas históricas no cambiarán de propietario.
5. Los filtros y sugerencias usarán la asignación vigente.

---

## ÉPICA 3. Rutas

### HU-020. Crear ruta manual

**Como** administrador  
**Quiero** seleccionar clientes y ordenar una ruta  
**Para** programar la jornada de un vendedor.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se deberá seleccionar fecha y vendedor.
2. Se podrán agregar clientes.
3. Se podrá cambiar el orden.
4. La ruta podrá guardarse como borrador.
5. La ruta publicada deberá aparecer en la aplicación del vendedor.

---

### HU-021. Generar ruta automática

**Como** administrador  
**Quiero** generar una ruta automáticamente  
**Para** reducir el tiempo de planificación.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. El administrador seleccionará vendedor, fecha y clientes.
2. El sistema propondrá un orden.
3. El orden podrá modificarse.
4. La ruta no se publicará sin confirmación.
5. El sistema mostrará distancia y duración estimada cuando la información esté disponible.

---

### HU-022. Reasignar ruta

**Como** administrador  
**Quiero** reasignar una ruta  
**Para** responder a ausencias o cambios operativos.

**Prioridad:** Should Have

**Criterios de aceptación:**

1. La ruta podrá reasignarse a un vendedor activo.
2. El vendedor anterior y el nuevo deberán quedar registrados.
3. El nuevo vendedor deberá recibir una notificación.
4. Las visitas ya realizadas no deberán perderse.

---

### HU-023. Consultar ruta y detectar actualizaciones

**Como** usuario autorizado<br>
**Quiero** consultar una ruta y su versión vigente<br>
**Para** planificar desde el panel o ejecutar desde el móvil sin usar una copia
desactualizada.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Administrador y supervisor verán únicamente rutas autorizadas.
2. El vendedor solo verá sus rutas publicadas.
3. La fecha del día usará la zona horaria de la empresa.
4. El detalle incluirá estado, versión y secuencia completa.
5. La aplicación detectará una modificación o reasignación posterior a la
   descarga.

---

## ÉPICA 4. Jornada y seguimiento

### HU-030. Iniciar jornada

**Como** vendedor  
**Quiero** iniciar mi jornada  
**Para** recibir mi ruta y habilitar el seguimiento.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. La aplicación solicitará permiso de ubicación.
2. Se guardará hora y coordenada de inicio.
3. El estado cambiará a jornada activa.
4. El vendedor verá su ruta asignada.
5. El administrador verá al vendedor como activo.

---

### HU-031. Ver vendedores en mapa

**Como** administrador o supervisor  
**Quiero** ver a los vendedores en un mapa  
**Para** conocer su ubicación durante la jornada.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se mostrará la última ubicación disponible.
2. Se mostrará la hora de actualización.
3. Se diferenciará ubicación actual de ubicación desactualizada.
4. Se podrá seleccionar un vendedor para ver detalle.
5. No se mostrarán ubicaciones fuera de la jornada.

---

### HU-032. Consultar recorrido

**Como** supervisor  
**Quiero** revisar el recorrido realizado  
**Para** comparar la ruta planificada con la ejecución.

**Prioridad:** Should Have

**Criterios de aceptación:**

1. Se mostrará el recorrido por fecha.
2. Se mostrarán puntos de visita.
3. Se mostrarán clientes omitidos.
4. Se mostrará la secuencia real.

---

## ÉPICA 5. Visitas

### HU-040. Habilitar marcaje por proximidad

**Como** vendedor  
**Quiero** que el botón de visita se habilite al acercarme al cliente  
**Para** registrar una visita válida.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Dado que el vendedor está fuera de la geocerca, el botón estará deshabilitado.
2. Dado que el vendedor está dentro de la geocerca, el botón se habilitará.
3. Se mostrará la distancia aproximada al cliente.
4. Se validará la precisión GPS.
5. Al iniciar se guardarán coordenadas, fecha y hora.

---

### HU-041. Finalizar visita

**Como** vendedor  
**Quiero** cerrar una visita con su resultado  
**Para** registrar lo ocurrido.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. No se podrá cerrar sin resultado.
2. Algunos resultados podrán requerir comentario.
3. Se registrará hora y ubicación de cierre.
4. Se calculará duración.
5. La visita deberá aparecer inmediatamente o tras sincronización en el panel.

---

### HU-042. Registrar visita sin conexión

**Como** vendedor  
**Quiero** registrar una visita sin internet  
**Para** continuar trabajando en zonas con mala señal.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. La aplicación guardará la visita localmente.
2. La visita deberá indicar estado pendiente de sincronización.
3. Se sincronizará cuando vuelva la conexión.
4. La sincronización no deberá duplicar registros.
5. Se mantendrán fecha, hora y coordenadas originales.

---

### HU-043. Ver visitas realizadas

**Como** administrador  
**Quiero** consultar las visitas realizadas  
**Para** validar el cumplimiento de las rutas.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se podrá filtrar por fecha, vendedor, cliente y zona.
2. Se mostrará inicio, fin, duración y resultado.
3. Se mostrará si fue planificada o fuera de ruta.
4. Se mostrará distancia al cliente al marcar.
5. Se podrá acceder a la ficha completa.

---

### HU-044. Autorizar excepción de geocerca

**Como** administrador con permiso especial<br>
**Quiero** autorizar una excepción limitada<br>
**Para** atender una incidencia sin alterar la evidencia original.

**Prioridad:** Should Have — deshabilitada por defecto

**Criterios de aceptación:**

1. La empresa deberá tener la capacidad habilitada.
2. La autorización quedará limitada a vendedor, cliente y ventana temporal.
3. Exigirá motivo y conservará ubicación, distancia y precisión originales.
4. Será de un solo uso y rechazará replay o expiración.
5. La operación completa quedará auditada.

---

## ÉPICA 6. Ventas

### HU-049. Gestionar catálogo de productos

**Como** administrador<br>
**Quiero** mantener un catálogo de productos<br>
**Para** habilitar el registro detallado de ventas cuando la empresa lo use.

**Prioridad:** Should Have — MVP condicionado

**Criterios de aceptación:**

1. Código y precio serán válidos y tenant-bound.
2. Un producto usado se inactivará lógicamente.
3. Mobile podrá sincronizar una versión disponible offline.
4. Un producto inactivo no se usará en ventas nuevas y seguirá visible en el
   histórico.

---

### HU-050. Registrar venta

**Como** vendedor  
**Quiero** registrar una venta durante la visita  
**Para** actualizar inmediatamente mi gestión comercial.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. La venta quedará asociada al cliente.
2. La venta quedará asociada al vendedor.
3. La venta quedará asociada a la visita.
4. Se calculará el total.
5. La venta podrá guardarse sin internet.
6. El administrador podrá verla después de la sincronización.

**Decisión de alcance:** MOB-020 (venta simple) es el flujo Must Have. Catálogo
y venta detallada son Should Have hasta que Producto confirme el modelo
comercial.

---

### HU-051. Ver ventas del día

**Como** administrador  
**Quiero** ver las ventas del día  
**Para** hacer seguimiento al resultado comercial.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se mostrará total vendido.
2. Se mostrará cantidad de ventas.
3. Se podrá agrupar por vendedor.
4. Se podrá agrupar por cliente.
5. Se podrá filtrar por zona.
6. Se mostrará la hora de la última actualización.

---

### HU-052. Ver histórico por cliente

**Como** administrador o supervisor  
**Quiero** revisar las ventas históricas de un cliente  
**Para** analizar su comportamiento de compra.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se mostrará fecha, vendedor, monto y detalle.
2. Se podrá filtrar por periodo.
3. Se mostrará venta acumulada.
4. Se mostrará ticket promedio.
5. Se podrá exportar.

---

### HU-053. Ver resultados por vendedor

**Como** supervisor  
**Quiero** consultar las ventas de cada vendedor  
**Para** medir su desempeño.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se mostrará monto vendido.
2. Se mostrará cantidad de clientes compradores.
3. Se mostrará conversión de visitas a ventas.
4. Se mostrará ticket promedio.
5. Se podrá comparar con otros periodos.

---

## ÉPICA 7. Dashboard

### HU-060. Consultar dashboard diario

**Como** administrador  
**Quiero** visualizar un resumen diario  
**Para** conocer el estado de la operación.

**Prioridad:** Must Have

**Criterios de aceptación:**

1. Se mostrarán vendedores activos.
2. Se mostrarán visitas programadas.
3. Se mostrarán visitas realizadas.
4. Se mostrarán visitas pendientes.
5. Se mostrarán ventas y monto.
6. Los datos deberán respetar permisos y filtros.

---

# 11. Matriz de prioridades

| Prioridad | Significado |
|---|---|
| Must Have | Necesario para lanzar el MVP |
| Should Have | Importante, pero puede entrar después del núcleo |
| Could Have | Deseable si existe capacidad |
| Won't Have Now | Fuera de alcance de la fase actual |

## Must Have

- Autenticación.
- Roles.
- Gestión de vendedores.
- Gestión de clientes.
- Importación de clientes.
- Coordenadas de clientes.
- Ruta manual.
- Ruta automática básica.
- Asignación de rutas.
- Inicio y cierre de jornada.
- Seguimiento de ubicación.
- Geocerca.
- Inicio y cierre de visita.
- Registro de resultado.
- Registro de venta.
- Histórico por cliente.
- Ventas por vendedor.
- Dashboard básico.
- Offline para visitas y ventas.
- Auditoría básica.

## Should Have

- Recorrido histórico.
- Reasignación de rutas.
- Evidencias.
- Visitas no planificadas.
- Frecuencia de visita.
- Notificaciones push.
- Exportaciones avanzadas.
- Metas de venta.
- Comparaciones por periodo.

## Could Have

- Predicción de compra.
- Priorización inteligente.
- Optimización con tráfico.
- Reconocimiento de voz.
- Firma.
- QR del establecimiento.
- Comisiones.
- Cobranza.
- Integración con ERP.
- Inventario.
- Facturación.

---

# 12. Flujo principal de operación

## 12.1 Configuración inicial

1. El operador ejecuta el bootstrap controlado del superadministrador.
2. El superadministrador inicia sesión.
3. Se crea la empresa.
4. Se invita al administrador inicial.
5. El administrador activa su cuenta e inicia sesión.
6. El administrador configura parámetros.
7. Se crean zonas.
8. Se invitan supervisores.
9. Se registran vendedores.
10. Se registran o importan clientes.
11. Se verifican coordenadas.
12. Se asignan zonas, equipo y cartera de clientes.

## 12.2 Planificación de ruta

1. El administrador selecciona fecha y vendedor.
2. Selecciona clientes.
3. Solicita generación automática.
4. El sistema propone el orden.
5. El administrador revisa y modifica.
6. Publica la ruta.
7. El vendedor recibe la notificación.
8. La aplicación consulta y descarga la versión publicada.

## 12.3 Inicio de jornada

1. El vendedor inicia sesión.
2. La aplicación valida permisos.
3. El vendedor inicia jornada.
4. El sistema registra ubicación.
5. Se activa seguimiento.
6. Se muestra la ruta.

## 12.4 Visita

1. El vendedor se desplaza.
2. La aplicación calcula distancia.
3. Al ingresar en la geocerca, se habilita el flag.
4. El vendedor inicia visita.
5. Se registra ubicación y hora.
6. Atiende al cliente.
7. Registra venta o motivo de no venta.
8. Finaliza visita.
9. Se actualiza la ruta.

## 12.5 Supervisión

1. El administrador abre el mapa.
2. Consulta ubicaciones.
3. Revisa visitas.
4. Revisa pendientes.
5. Revisa ventas.
6. Contacta al vendedor si existe incidencia.

## 12.6 Cierre de jornada

1. El vendedor finaliza visitas abiertas.
2. Sincroniza datos pendientes.
3. Revisa su resumen.
4. Cierra jornada.
5. Se detiene el seguimiento.
6. El sistema genera resumen diario.

---

# 13. Estados principales

## 13.1 Estado de ruta

- Borrador.
- Publicada.
- En curso.
- Finalizada.
- Parcial.
- Cancelada.

## 13.2 Estado de punto de ruta

- Pendiente.
- En traslado.
- Disponible para marcar.
- En visita.
- Visitado con venta.
- Visitado sin venta.
- Omitido.
- Cancelado.
- Reprogramado.

## 13.3 Estado de visita

- Iniciada.
- Finalizada.
- Pendiente de sincronización.
- Sincronizada.
- Corregida.
- Anulada.

## 13.4 Estado de venta

- Borrador local.
- Pendiente de sincronización.
- Registrada.
- Editada.
- Anulada.

## 13.5 Estado de vendedor

- Inactivo.
- Sin jornada.
- Disponible.
- En traslado.
- En visita.
- Pausa.
- Sin conexión.
- Ubicación desactualizada.
- Jornada finalizada.

---

# 14. Modelo de datos conceptual

## 14.1 Empresa

- id
- nombre
- documento
- estado
- zona_horaria
- radio_geocerca
- frecuencia_ubicacion
- configuración

## 14.2 Usuario

- id
- empresa_id, nulo únicamente para `PLATFORM_SUPERADMIN`
- rol_id
- nombre
- correo
- contraseña_hash
- estado
- activación_expira_en
- último_acceso

## 14.3 Vendedor

- id
- empresa_id
- usuario_id
- supervisor_id
- código
- documento
- teléfono
- estado

## 14.4 Cliente

- id
- empresa_id
- código
- nombre
- documento
- dirección
- distrito
- provincia
- departamento
- latitud
- longitud
- segmento
- frecuencia
- vendedor_asignado_id
- estado

## 14.5 Ruta

- id
- empresa_id
- vendedor_id
- fecha
- estado
- origen
- versión
- punto_inicio
- punto_fin
- distancia_estimada
- duración_estimada

## 14.6 RutaDetalle

- id
- ruta_id
- cliente_id
- orden
- hora_estimada
- estado
- prioridad

## 14.7 Jornada

- id
- empresa_id
- vendedor_id
- fecha
- inicio
- fin
- coordenadas_inicio
- coordenadas_fin
- estado

## 14.8 Ubicación

- id
- jornada_id
- vendedor_id
- latitud
- longitud
- precisión
- velocidad
- capturada_en
- recibida_en
- identificador_dispositivo
- origen
- estado_sincronización

## 14.9 Visita

- id
- empresa_id
- jornada_id
- ruta_id
- ruta_detalle_id
- cliente_id
- vendedor_id
- inicio
- fin
- coordenadas_inicio
- coordenadas_fin
- distancia_inicio
- distancia_fin
- resultado
- observación
- estado
- fuera_de_ruta
- excepción_geocerca_id

## 14.10 Venta

- id
- empresa_id
- visita_id
- cliente_id
- vendedor_id
- fecha_hora
- código
- subtotal
- descuento
- total
- observación
- estado
- identificador_dispositivo
- editada_en

## 14.11 VentaDetalle

- id
- venta_id
- producto_id
- descripción
- cantidad
- precio_unitario
- descuento
- importe

## 14.12 Producto

- id
- empresa_id
- código
- nombre
- unidad
- precio
- estado

## 14.13 Auditoría

- id
- empresa_id
- usuario_id
- acción
- entidad
- entidad_id
- valor_anterior
- valor_nuevo
- fecha_hora
- ip
- dispositivo

## 14.14 ZonaTerritorio

- id
- empresa_id
- código
- nombre
- descripción
- estado

## 14.15 VendedorZona

- vendedor_id
- zona_id
- vigente_desde
- vigente_hasta

## 14.16 AsignaciónCliente

- id
- empresa_id
- cliente_id
- vendedor_id
- responsable_anterior_id
- vigente_desde
- vigente_hasta
- actor_id
- motivo

---

# 15. Validaciones importantes

## 15.1 Ubicación

- Latitud entre -90 y 90.
- Longitud entre -180 y 180.
- Precisión de hasta 50 m.
- Fecha de ubicación con antigüedad máxima de 5 min al validarla el servidor.
- Prohibir coordenadas nulas para iniciar una visita.
- Rechazar muestras inválidas sin persistirlas, publicarlas ni usarlas en
  geocerca; solo se admite telemetría técnica sanitizada sin coordenadas.
- Admitir como máximo 2 min de adelanto respecto del reloj servidor; un exceso
  devuelve `LOCATION_TIMESTAMP_IN_FUTURE` sin efectos.
- Rechazar exceso de cadencia con `LOCATION_FREQUENCY_EXCEEDED` y
  `mocked=true` con `LOCATION_MOCKED`. Si `mocked` está ausente, la integridad
  es `UNKNOWN` y no habilita visita geolocalizada. No hay sanción automática.

## 15.2 Geocerca

El backend calculará y validará distancia/geocerca con PostGIS, SRID y unidades
documentadas. Mobile podrá usar Haversine únicamente como ayuda de UX offline;
el cálculo local no sustituye la validación del servidor al sincronizar.

## 15.3 Sincronización

Cada registro móvil deberá tener:

- UUID generado en dispositivo.
- Fecha de creación local.
- Estado de sincronización.
- Número de reintentos.
- Fecha de última sincronización.

## 15.4 Ventas

- Total igual a suma de detalles.
- No permitir cantidades negativas.
- No permitir descuentos mayores al máximo.
- No permitir productos inactivos.
- No permitir ventas duplicadas por reintento.

---

# 16. Consideraciones técnicas recomendadas

## 16.1 Arquitectura inicial

Se recomienda un monolito modular con separación clara por dominios:

- Seguridad.
- Empresas.
- Usuarios.
- Clientes.
- Rutas.
- Geolocalización.
- Visitas.
- Ventas.
- Reportes.
- Auditoría.

No se recomienda iniciar con microservicios salvo que exista una necesidad demostrada.

## 16.2 Backend

Opciones sugeridas:

- Java con Spring Boot.
- Java con Micronaut.
- PostgreSQL.
- PostGIS para consultas geográficas.
- Redis para presencia o ubicación reciente, cuando sea necesario.
- WebSocket o Server-Sent Events para actualización del mapa.
- Cola para procesos asíncronos.

## 16.3 Frontend administrativo

- React, Angular o Vue.
- Mapa interactivo.
- Dashboard.
- Diseño responsive.

## 16.4 Aplicación móvil

Opciones:

- Flutter.
- React Native.
- Android nativo.

Para GPS continuo, almacenamiento offline y control de segundo plano, Flutter o Android nativo pueden resultar más adecuados que una PWA.

## 16.5 Mapas

Se deberá abstraer el proveedor de mapas para evitar dependencia rígida.

Posibles proveedores:

- Google Maps.
- Mapbox.
- HERE.
- OpenStreetMap con servicios complementarios.

## 16.6 Optimización de rutas

Fases recomendadas:

1. Ordenamiento por cercanía.
2. Optimización con restricciones.
3. Ventanas horarias.
4. Capacidad diaria.
5. Priorización comercial.
6. Tráfico.
7. Reoptimización durante jornada.

---

# 17. Seguridad y privacidad

## 17.1 Principios

- Recopilar solo información necesaria.
- Informar al vendedor cuando la ubicación esté activa.
- Rastrear únicamente durante la jornada.
- Restringir acceso por rol.
- Registrar consultas y modificaciones sensibles.
- Definir política de retención.
- Proteger información de clientes y trabajadores.

## 17.2 Permisos

El vendedor deberá autorizar el uso de ubicación requerido por el sistema operativo.

Si el permiso es rechazado:

- No podrá iniciar seguimiento.
- No podrá marcar visita geolocalizada.
- Se mostrará una explicación clara.

La revocación de permiso, GPS o servicio disponible suspende inmediatamente el
rastreo y muestra un estado degradado recuperable; el logout siempre lo detiene.

## 17.3 Retención

Para el MVP, EN-016/ADR-016 define 90 días y purga física para historial exacto
de ubicación aceptado; Redis conserva última ubicación por un máximo de 15 min
y la cola local cifrada la conserva solo hasta confirmación o resolución.
El vencimiento usa `min(capturedAt, receivedAt)` y abarca copias/backups; las
claves se segmentan para crypto-erasure, el backup móvil del SO excluye base y
clave, todo restore se cuarentena/purga antes de exposición y Mobile limpia y
compacta almacenamiento tras acuse.

Permanece pendiente definir cuánto tiempo conserva:

- Historial de ubicación.
- Visitas.
- Ventas.
- Auditoría.

## 17.4 Acceso

Los supervisores solo deberán acceder a vendedores bajo su responsabilidad.
El administrador de empresa solo accede a su tenant; el vendedor a sus propios
datos. El rol de plataforma no obtiene acceso operativo transversal. Toda
consulta valida empresa, identidad, rol, equipo y recurso.
Las consultas sensibles, soporte excepcional, cambios de política y solicitudes
de eliminación requieren trazabilidad sin coordenadas; el soporte además exige
justificación, temporalidad y autorización por recurso.

---

# 18. Indicadores clave del producto

## 18.1 Actividad

- Vendedores activos.
- Jornadas iniciadas.
- Hora promedio de inicio.
- Tiempo en campo.
- Tiempo en visitas.
- Tiempo en traslado.

## 18.2 Cobertura

- Clientes programados.
- Clientes visitados.
- Porcentaje de cobertura.
- Clientes omitidos.
- Visitas fuera de ruta.
- Frecuencia cumplida.

## 18.3 Ventas

- Venta total.
- Venta por vendedor.
- Venta por cliente.
- Venta por zona.
- Venta por producto.
- Ticket promedio.
- Clientes compradores.
- Conversión de visitas a venta.

## 18.4 Rutas

- Distancia estimada.
- Distancia real.
- Desviación.
- Visitas por hora.
- Tiempo promedio entre clientes.
- Cumplimiento de secuencia.

## 18.5 Calidad de datos

- Clientes sin coordenadas.
- Ubicaciones con baja precisión.
- Visitas pendientes de sincronización.
- Ventas pendientes.
- Duplicados detectados.

---

# 19. Propuesta de épicas y orden de desarrollo

## Épica A. Base SaaS y seguridad

- Empresas.
- Usuarios.
- Roles.
- Permisos.
- Autenticación.
- Auditoría básica.

## Épica B. Vendedores y clientes

- CRUD vendedores.
- CRUD clientes.
- Coordenadas.
- Importación.
- Mapa de clientes.

## Épica C. Rutas

- Creación manual.
- Generación automática básica.
- Publicación.
- Asignación.
- Estados.

## Épica D. Aplicación móvil y jornada

- Inicio de sesión.
- Inicio de jornada.
- Ruta asignada.
- GPS.
- Sincronización.

## Épica E. Visitas

- Geocerca.
- Flag de visita.
- Inicio y cierre.
- Resultado.
- Visitas pendientes.
- Offline.

## Épica F. Ventas

- Catálogo.
- Venta.
- Detalle.
- Histórico.
- Sincronización.

## Épica G. Supervisión

- Mapa en tiempo real.
- Estados.
- Recorrido.
- Ruta planificada frente a ejecutada.

## Épica H. Dashboard y reportes

- Indicadores.
- Filtros.
- Exportaciones.
- Historial por cliente.
- Resultados por vendedor.

---

# 20. Propuesta de sprints

La duración sugerida es de dos semanas. El orden detallado, IDs, dependencias y
criterios de salida se mantienen en `docs/stories/sprint-map.md` y
`docs/stories/dependency-map.md`.

## Sprint 0. Fundaciones y decisiones

- Infraestructura local, seguridad base, roles y bootstrap.
- ADR de autenticación, mapas, offline, privacidad, notificaciones y rutas.
- Outbox, reintentos y DLQ.

## Sprint 1. Empresa, identidad y acceso utilizable

- Login de plataforma.
- Empresa, activación del administrador y gestión de usuarios.
- Login/sesión web y móvil.
- Auditoría base, suspensión y aislamiento.

## Sprint 2. Equipo, zonas, clientes y cartera

- Zonas, supervisores y vendedores.
- Consulta de equipo.
- Clientes, coordenadas, duplicados y cartera.

## Sprint 3. Importación y configuración operativa

- Geocerca/tracking configurables antes del trabajo de campo.
- Plantilla, proceso asíncrono, resultado y errores de importación.

## Sprint 4. Planificación y entrega de rutas

- Borrador, consulta, copia, sugerencias y optimización.
- Publicación, reasignación, notificación y descarga móvil versionada.

## Sprint 5. Jornada y tracking en vivo

- Permisos, inicio/cierre, captura, cola local y presencia.
- Mapa en vivo, estado stale y degradación ante Redis/red.

## Sprint 6. Recorrido histórico

- Persistencia, consulta y visualización de una jornada como histórico.

## Sprint 7. Visitas y ejecución de ruta

- Geocerca, check-in/check-out, resultados y offline.
- Pendientes, consulta, corrección y comparación planificada/ejecutada.
- Fuera de ruta y excepción de geocerca solo si se habilitan.

## Sprint 8. Ventas e histórico comercial

- Venta simple, sync, anulación y consultas como alcance base.
- Catálogo/venta detallada y edición dentro de ventana como alcance condicionado.
- Histórico por cliente y resultados por vendedor.

## Sprint 9. Dashboard, reportes y estabilización

- Dashboard, resumen móvil, exportaciones y consulta de auditoría.
- Backup/restore, retención, rendimiento, resiliencia, seguridad y regresión.

---

# 21. Definition of Ready

Una historia estará lista para entrar a sprint cuando:

- El objetivo esté claro.
- El usuario esté identificado.
- Existan criterios de aceptación.
- Las dependencias estén resueltas.
- Los diseños estén disponibles, cuando correspondan.
- Los datos requeridos estén definidos.
- Las reglas de negocio estén confirmadas.
- La historia pueda estimarse.
- No existan dudas críticas.

---

# 22. Definition of Done

Una historia se considerará terminada cuando:

- El código esté desarrollado.
- Existan pruebas unitarias.
- Existan pruebas de integración cuando apliquen.
- Pase revisión de código.
- Pase validaciones de seguridad.
- Cumpla criterios de aceptación.
- Esté desplegada en ambiente de pruebas.
- Haya sido validada funcionalmente.
- La documentación esté actualizada.
- No existan defectos críticos.
- La auditoría esté implementada cuando corresponda.
- La historia haya sido aprobada por Producto.

---

# 23. Pruebas mínimas

## 23.1 Pruebas funcionales

- Inicio de sesión.
- Roles.
- Creación de cliente.
- Importación.
- Coordenadas.
- Generación de ruta.
- Publicación.
- Inicio de jornada.
- Seguimiento.
- Geocerca.
- Inicio de visita.
- Fin de visita.
- Venta.
- Histórico.
- Dashboard.

## 23.2 Pruebas de campo

- GPS con buena señal.
- GPS con baja precisión.
- Sin internet.
- Cambio entre Wi-Fi y datos.
- Aplicación en segundo plano.
- Reinicio del teléfono.
- Batería baja.
- Permiso de ubicación revocado.
- Hora del dispositivo incorrecta.
- Múltiples visitas.
- Sincronización duplicada.

## 23.3 Pruebas de seguridad

- Acceso entre empresas.
- Escalamiento de privilegios.
- Modificación de identificadores.
- Sesiones vencidas.
- Ataques de fuerza bruta.
- Validación de archivos.
- Inyección.
- Exposición de datos.
- Acceso a ubicaciones no autorizadas.

---

# 24. Riesgos del proyecto

## R-001. Consumo de batería

El seguimiento frecuente puede consumir batería.

**Mitigación:** ajustar frecuencia según movimiento y estado.

## R-002. Mala señal

El vendedor puede trabajar sin conexión.

**Mitigación:** arquitectura offline-first.

## R-003. GPS falso

El usuario puede intentar falsificar ubicación.

**Mitigación:** detectar anomalías, precisión, saltos, velocidad y señales del dispositivo.

## R-004. Coordenadas incorrectas

La dirección del cliente puede estar mal geocodificada.

**Mitigación:** validación manual en mapa.

## R-005. Rechazo del vendedor

La aplicación puede percibirse como vigilancia.

**Mitigación:** limitar rastreo a jornada, informar claramente y aportar beneficios operativos.

## R-006. Costos de mapas

El uso intensivo puede incrementar costos.

**Mitigación:** cache, cuotas, abstracción de proveedor y optimización de llamadas.

## R-007. Personalización excesiva

Cada cliente puede solicitar reglas diferentes.

**Mitigación:** configuración por empresa y control formal de cambios.

## R-008. Sincronización duplicada

Los reintentos pueden generar duplicados.

**Mitigación:** UUID e idempotencia.

---

# 25. Control de cambios

Cualquier requerimiento nuevo deberá registrar:

- Identificador.
- Descripción.
- Solicitante.
- Justificación.
- Impacto funcional.
- Impacto técnico.
- Impacto en costos.
- Impacto en fechas.
- Prioridad.
- Decisión.
- Versión objetivo.

Ningún cambio se considerará incluido automáticamente por haber sido mencionado en una reunión o conversación informal.

## CR-001. Refinamiento secuencial del backlog

- **Solicitante:** Cliente/propietario del producto.
- **Descripción:** Corregir dependencias, capacidades sin consumidor y orden de
  sprints; completar onboarding, usuarios, zonas, cartera, consulta de rutas y
  pruebas E2E faltantes.
- **Justificación:** Evitar sprints con pantallas vacías o flujos que no pueden
  ser utilizados de extremo a extremo.
- **Impacto funcional:** Se agregan HUs de soporte al flujo ya declarado y se
  hacen condicionadas las variantes de venta detallada, excepción y edición.
- **Impacto técnico:** Nuevos contratos/ADR antes de implementar consumidores.
- **Impacto en costos/fechas:** Debe reestimarse con el backlog de 172 HUs y 10
  enablers; no implica compromiso automático de fecha.
- **Prioridad:** Must Have para el flujo base.
- **Decisión:** Aprobado para refinamiento; enablers pendientes requieren su
  aprobación específica.
- **Versión objetivo:** 1.1 / MVP.

---

# 26. Criterios de aceptación del MVP

El MVP se considerará funcional cuando una empresa pueda completar el siguiente flujo:

1. Iniciar desde una instalación sin usuarios de negocio.
2. Autenticar al superadministrador provisionado de forma controlada.
3. Crear una empresa e invitar a su administrador inicial.
4. Activar la cuenta e iniciar sesión como administrador.
5. Crear zonas, supervisor y vendedores.
6. Asignar equipo y cartera de clientes sin cruce de tenant.
7. Registrar o importar clientes.
8. Ubicar clientes en mapa.
9. Crear automáticamente una ruta.
10. Publicar y descargar la versión vigente de la ruta.
11. Iniciar jornada desde el móvil.
12. Enviar ubicaciones durante la jornada.
13. Visualizar al vendedor en el panel con hora de actualización.
14. Llegar a un cliente.
15. Habilitar el flag dentro de geocerca.
16. Iniciar y finalizar la visita.
17. Registrar y sincronizar una venta simple sin duplicarla.
18. Visualizar la visita desde administración.
19. Visualizar la venta del día.
20. Consultar histórico por cliente.
21. Consultar resultados por vendedor.
22. Revisar el resumen y cerrar jornada.
23. Detener el seguimiento después del cierre.
24. Demostrar aislamiento, auditoría, recuperación y seguridad del flujo.

---

# 27. Entregables esperados

- Código fuente.
- Base de datos.
- Backend.
- Panel administrativo.
- Aplicación móvil.
- Documentación de despliegue.
- Documentación de APIs.
- Manual de administrador.
- Manual de vendedor.
- Plan de pruebas.
- Evidencia de pruebas.
- Configuración de ambientes.
- Scripts de migración.
- Política de backups.
- Registro de versiones.

---

# 28. Aprobación funcional

La aprobación de cada módulo se realizará contra:

- Requerimientos funcionales.
- Reglas de negocio.
- Historias de usuario.
- Criterios de aceptación.
- Diseños aprobados.
- Casos de prueba.

La aprobación de una funcionalidad no implicará la aceptación automática de funcionalidades no documentadas.

---

# 29. Próximas decisiones necesarias

Antes de iniciar desarrollo deberán definirse:

1. Nombre final del producto.
2. Sectores objetivo.
3. Cantidad estimada de vendedores por empresa para volumen y rendimiento.
4. Países iniciales.
5. Distribución Android/iOS del piloto; la aplicación se implementa en Flutter.
6. Proveedor de mapas, geocodificación y navegación — EN-014.
7. Radio, precisión y antigüedad de geocerca — EN-016: 100 m, 50 m y 5 min.
8. Frecuencia y política de ubicación — EN-016: cada 60 s, solo jornada activa.
9. Datos obligatorios del cliente.
10. Si el piloto habilita venta detallada; la venta simple es el mínimo
    obligatorio.
11. Si el piloto habilita catálogo/productos/precios — historias condicionadas.
12. Si se permitirá venta sin visita; por defecto no.
13. Si se permitirán visitas fuera de ruta o excepciones; por defecto no.
14. Si se requerirá fotografía o firma.
15. Tiempo de retención de ubicaciones — EN-016: 90 días y purga física.
16. Si el piloto habilita edición de venta; la anulación auditada sigue siendo
    el flujo base.
17. Permisos finos sobre los roles base definidos en EN-011.
18. Definiciones y timestamp de corte de métricas del dashboard.
19. Modelo comercial.
20. Alcance del piloto.

Las decisiones de arquitectura asociadas no se resolverán dentro de una HU de
implementación: deben cerrar su enabler/ADR antes de planificar la historia
dependiente.

---

# 30. Recomendación de primera versión comercial

Para evitar un producto excesivamente grande, la primera versión comercial debería centrarse en:

- Distribuidoras con 5 a 30 vendedores.
- Clientes geolocalizados.
- Rutas diarias.
- Seguimiento durante jornada.
- Geocerca.
- Visitas.
- Registro simple de venta.
- Histórico.
- Dashboard.
- Exportación.

Inventario, facturación, cobranza, comisiones e inteligencia comercial deberán incorporarse después de validar la adopción del flujo principal.

---

# 31. Resumen ejecutivo

El producto se define como una plataforma SaaS para gestionar vendedores de campo.

El núcleo funcional está compuesto por cuatro elementos:

1. **Planificación:** clientes, puntos y rutas.
2. **Supervisión:** ubicación, jornada y recorrido.
3. **Ejecución:** geocerca, visitas y resultados.
4. **Resultado comercial:** ventas e histórico.

El MVP deberá demostrar que la empresa puede controlar la cobertura de clientes, validar visitas y conocer las ventas realizadas por cada vendedor y cliente.

La arquitectura y el alcance deberán priorizar simplicidad, trazabilidad, operación offline, privacidad y capacidad de crecimiento.
