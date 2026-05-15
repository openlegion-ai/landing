---
title: "OpenLegion vs nanobot — Comparativa Detallada (2026)"
description: >-
 OpenLegion vs nanobot: framework security-first vs alternativa ultraligera a
 OpenClaw. Manejo de credenciales, aislamiento y preparación para producción
 comparados.
slug: /comparison/nanobot
primary_keyword: openlegion vs nanobot
secondary_keywords:
 - nanobot alternative
 - nanobot security
 - nanobot vulnerability
 - lightweight ai agent framework
 - openclaw alternative python
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /comparison/nanoclaw
 - /comparison/picoclaw
 - /comparison/zeroclaw
 - /comparison/openclaw
---

# OpenLegion vs nanobot: Lo Que una Vulnerabilidad CVSS 10.0 Enseña Sobre Seguridad de Agentes

nanobot es probablemente el caso de estudio más instructivo en el espacio de seguridad de agentes de IA. Creado por un laboratorio académico de investigación a principios de 2026, destila las más de 430.000 líneas de OpenClaw en aproximadamente 4.000 líneas de Python — una reducción del 99% de código que ganó 218 puntos en Hacker News (la recepción más fuerte de cualquier alternativa Claw) y aproximadamente 20.000-26.000 estrellas en GitHub.

Entonces, dentro de las semanas posteriores al lanzamiento, los investigadores de seguridad divulgaron una **vulnerabilidad crítica (CVSS 10.0)**: el bridge de WhatsApp de nanobot vinculaba su servidor WebSocket a 0.0.0.0:3001 sin ninguna autenticación. Cualquiera en la red podía secuestrar sesiones de WhatsApp. Siguieron vulnerabilidades críticas adicionales — inyección de comandos shell, bypass de path traversal y un fallo de ejecución remota de código heredado de una dependencia LiteLLM.

nanobot es una herramienta educativa bienintencionada que accidentalmente se convirtió en un caso de estudio de por qué el código ligero solo no equivale a código seguro. OpenLegion existe para hacer estructural esta lección.

OpenLegion es un [framework de agentes de IA](/learn/ai-agent-platform) security-first con aislamiento obligatorio por contenedor Docker, gestión de credenciales por proxy de bóveda, aplicación de presupuesto por agente y coordinación tipo flota (blackboard + pub/sub + handoff).

<!-- SCHEMA: DefinitionBlock -->

> **¿Cuál es la diferencia entre OpenLegion y nanobot?**
> nanobot es una reimplementación en Python de ~4.000 líneas de OpenClaw enfocada en simplicidad educativa y legibilidad. Soporta más de 11 proveedores LLM y más de 8 canales de mensajería pero ha sufrido una vulnerabilidad crítica del bridge de WhatsApp (CVSS 10.0, secuestro de sesión WhatsApp no autenticado), inyección shell, path traversal y vulnerabilidades RCE de LiteLLM. OpenLegion es un framework Python security-first con aislamiento obligatorio por contenedor Docker por agente, gestión de credenciales por proxy de bóveda donde los agentes nunca ven claves API, aplicación de presupuesto por agente y coordinación tipo flota (blackboard + pub/sub + handoff). nanobot optimiza para aprendizaje y simplicidad; OpenLegion optimiza para seguridad de producción.

## TL;DR

| Dimensión | OpenLegion | nanobot |
|---|---|---|
| **Enfoque principal** | Infraestructura de seguridad de producción | Simplicidad educativa |
| **Lenguaje** | Python | Python (~4.000 líneas) |
| **Aislamiento de agente** | Contenedor Docker por agente, no-root | Flag `restrict_to_workspace` (nivel aplicación) |
| **Seguridad de credenciales** | Proxy de bóveda — los agentes nunca ven las claves | Archivo de config (`~/.nanobot/config.json`) |
| **Controles de presupuesto** | Corte estricto diario/mensual por agente | Ninguno integrado |
| **Orquestación** | Coordinación tipo flota (blackboard + pub/sub + handoff) | Agente único con sub-agentes en segundo plano |
| **Proveedores LLM** | 100+ vía LiteLLM | 11+ (OpenRouter, Anthropic, OpenAI, DeepSeek, etc.) |
| **Canales de mensajería** | 5 | 8+ (Telegram, Discord, WhatsApp, Feishu, DingTalk, etc.) |
| **Multi-agente** | Plantillas de flota con ACLs por agente | Spawn de sub-agentes (sin orquestación de flota) |
| **Memoria** | Persistente por agente con búsqueda vectorial | Recuperación basada en grep (deliberadamente evita RAG) |
| **Estrellas GitHub** | ~59 | ~20.000-26.000 |
| **Licencia** | BSL 1.1 | MIT |
| **CVEs conocidos** | 0 | **vulnerabilidad crítica del bridge de WhatsApp (CVSS 10.0)** + 3 parches críticos adicionales |
| **Origen** | Independiente | Laboratorio académico de investigación |

## Elija nanobot si...

**Quiere aprender cómo funcionan los agentes de IA.** nanobot es un esqueleto didáctico. Con 4.000 líneas con estructura clara, es la mejor base de código para entender el bucle central de agente: abstracción de proveedor, despacho de herramientas, recuperación de memoria y gateways de chat. DataCamp publicó un tutorial completo. Los creadores lo diseñaron explícitamente para legibilidad educativa.

**Necesita soporte de plataformas asiáticas de mensajería.** nanobot tiene soporte de primera clase para Feishu (Lark), DingTalk, QQ y plataformas adyacentes a WeChat — canales que ningún framework orientado a Occidente cubre bien. Si su despliegue apunta a mensajería empresarial china, el ecosistema de nanobot está posicionado de forma única.

**Quiere ejecutar agentes en una Raspberry Pi.** nanobot es lo suficientemente ligero para computadoras de placa única. Combinado con Ollama para inferencia local, obtiene operación de agente totalmente offline.

**Valora la simplicidad sobre la infraestructura.** Config JSON, memoria basada en grep (sin base de datos vectorial requerida) y pip install. Sin Docker, sin coordinación tipo flota, sin configuración de bóveda. De instalación a agente corriendo en menos de cinco minutos.

**El impulso comunitario le importa.** El lanzamiento de 218 puntos en HN de nanobot, Discord activo, integración con DataCamp y ~20.000+ estrellas representan inversión comunitaria significativa y un gran pool de contribuidores corrigiendo problemas rápidamente (el CVSS 10.0 fue parcheado en días).

## Elija OpenLegion si...

**La seguridad debe ser arquitectónica, no opcional.** El flag `restrict_to_workspace` de nanobot es el mecanismo primario de aislamiento — un booleano que puede desactivarse. Sus claves API viven en un archivo JSON config en texto plano. Su servidor WebSocket fue enviado sin autenticación. Estos no son casos extremos oscuros; son decisiones arquitectónicas fundamentales que produjeron un CVSS 10.0 dentro de semanas. OpenLegion hace que las configuraciones inseguras sean estructuralmente imposibles: el aislamiento por contenedor es obligatorio, el proxy de bóveda es la única ruta de credenciales y la coordinación tipo flota está acotada por detección de bucles de herramienta por agente.

**No puede permitirse un CVSS 10.0 en producción.** La vulnerabilidad crítica del bridge de WhatsApp permitió a atacantes adyacentes a la red no autenticados secuestrar sesiones de WhatsApp conectándose al servidor WebSocket desprotegido de nanobot en el puerto 3001. Las vulnerabilidades adicionales de inyección shell y path traversal fueron encontradas por un único investigador de seguridad en una única auditoría. La arquitectura de proxy de bóveda de OpenLegion significa que no hay credenciales para secuestrar — los agentes llaman a través de un proxy que inyecta claves en la capa de red.

**Necesita control de coste por agente.** nanobot no tiene aplicación de presupuesto. Con soporte de 11+ proveedores y la capacidad de spawn de sub-agentes en segundo plano, el gasto API incontrolado se acumula silenciosamente. OpenLegion aplica límites diarios y mensuales por agente con corte automático estricto.

**Necesita coordinación auditable de flota multi-agente.** nanobot soporta spawn de sub-agentes, pero la orquestación es LLM-driven y no determinista. La coordinación tipo flota de OpenLegion define registros explícitos de handoff, acceso a herramientas y dependencias por agente — auditable antes del despliegue.

**Necesita probar postura de seguridad a stakeholders.** El historial de CVEs de nanobot lo hace una venta difícil a equipos de seguridad, revisores de cumplimiento o adquisición empresarial. La arquitectura de proxy de bóveda, aislamiento obligatorio por contenedor y ACLs por agente de OpenLegion proporcionan controles de seguridad demostrables.

## Comparación del Modelo de Seguridad

### Dónde viven los secretos

**nanobot** almacena claves API en `~/.nanobot/config.json` — un archivo JSON en texto plano en disco. El archivo de config fue inicialmente escrito con permisos 0644 (legible por todo el mundo); esto fue parcheado posteriormente a 0600. En runtime, las claves se cargan en la memoria del proceso Python. Cualquier código ejecutándose dentro del proceso del agente puede leerlas.

**OpenLegion** almacena credenciales en una bóveda a la que los agentes no pueden acceder. Las llamadas API se enrutan a través de un proxy de bóveda que inyecta credenciales en la capa de red. Sin archivos de config con claves en texto plano, sin variables de entorno con secretos, sin archivos de credenciales montados. El proceso del agente nunca retiene claves API.

### Modelo de aislamiento

**nanobot** usa un flag `restrict_to_workspace` que limita las operaciones de archivo al directorio del workspace. Esta es una comprobación a nivel de aplicación en el código Python — si un agente logra ejecución arbitraria de código (lo que la vulnerabilidad de inyección shell demostró ser posible), la restricción de workspace puede ser eludida. No se aplica aislamiento a nivel de SO.

**OpenLegion** usa aislamiento por contenedor Docker por agente. Cada agente corre en un contenedor separado con ejecución no-root, sin acceso al socket Docker, no-new-privileges y límites de recursos por contenedor. Incluso si un agente logra ejecución arbitraria de código dentro de su contenedor, no puede acceder a otros agentes, al sistema anfitrión ni a almacenes de credenciales.

### El registro de CVEs

**nanobot** ha acumulado problemas de seguridad significativos en su breve existencia:

- **Vulnerabilidad crítica del bridge de WhatsApp (CVSS 10.0):** Bridge WebSocket de WhatsApp vinculado a 0.0.0.0:3001 sin autenticación. Los atacantes adyacentes a la red podían secuestrar sesiones. Descubierta por investigadores de seguridad.
- **Inyección de comandos shell (Media):** Entrada de usuario no saneada pasada a ejecución shell.
- **Bypass de path traversal (Media):** `restrict_to_workspace` podía ser eludido.
- **RCE LiteLLM vía `eval()` (Crítica):** Heredada de dependencia. Ejecución remota de código a través de entrada construida.
- **Envenenamiento de sesión (parcheado el 26 de febrero de 2026):** Manipulación de historial de mensajes.

**OpenLegion** no tiene CVEs reportados a partir de v0.1.0. Su arquitectura hace varias de las clases de vulnerabilidad de nanobot estructuralmente imposibles: el proxy de bóveda elimina la exposición de credenciales, el aislamiento Docker previene escapes de path traversal y la coordinación tipo flota previene ejecución shell arbitraria sin concesiones explícitas de herramienta.

### Controles de presupuesto

**nanobot** no tiene límites de gasto integrados. Los sub-agentes en segundo plano pueden hacer llamadas API sin topes.

**OpenLegion** aplica límites diarios y mensuales por agente con corte automático estricto.

## El Ecosistema de nanobot: Qué Hace Mejor

### El esqueleto didáctico

La mayor contribución de nanobot es educativa. El bucle central de agente — recibir mensaje, recuperar contexto, llamar al LLM, despachar herramientas, devolver respuesta — está expuesto en Python limpio y legible. La elección deliberada de usar recuperación de memoria basada en grep en lugar de RAG hace transparente el mecanismo de recuperación. La config JSON es legible por humanos. Cada decisión arquitectónica prioriza la comprensión sobre la sofisticación.

Para estudiantes, investigadores y desarrolladores que aprenden cómo funcionan los agentes de IA internamente, nanobot es posiblemente el mejor punto de partida.

### Integración de plataformas asiáticas

El soporte de canales de nanobot incluye Feishu (Lark), DingTalk, QQ y Matrix — plataformas que dominan la comunicación empresarial china. Ningún otro framework en el ecosistema OpenClaw proporciona cobertura comparable. El origen académico del proyecto probablemente explica este enfoque, y representa valor genuino para equipos operando en mercados asiáticos.

### Compatibilidad de skills ClawHub

nanobot integra con el ecosistema de skills ClawHub, dándole acceso a skills de agente contribuidas por la comunidad. El formato de documentación SKILL.md se comparte entre nanobot, PicoClaw y otros proyectos de la familia Claw.

### La cultura de respuesta rápida

Cuando se divulgó la vulnerabilidad crítica del bridge de WhatsApp, el equipo de nanobot la parcheó en días. La corrección de envenenamiento de sesión aterrizó el 26 de febrero. La inyección shell y el path traversal fueron abordados rápidamente. La capacidad de respuesta de la comunidad es genuinamente impresionante — pero también destaca que los problemas no debieron haberse enviado en primer lugar.

### Trampas comunes en producción

**El problema fundamental es arquitectónico.** nanobot fue diseñado como herramienta de enseñanza que se volvió popular para producción. Su modelo de seguridad — restricción de workspace a nivel de aplicación, config en texto plano, sin aislamiento de red — es apropiado para experimentación local pero peligroso en producción. El CVSS 10.0 no fue un bug en código complejo; fue un servidor WebSocket sin autenticación. Este es el tipo de descuido que las restricciones de seguridad arquitectónica previenen.

**Riesgo de cadena de dependencias.** El RCE LiteLLM (vía `eval()`) demuestra que incluso las bases de código mínimas heredan vulnerabilidades de sus dependencias. Las ~4.000 líneas de nanobot son auditables, pero el árbol completo de dependencias no.

**Sin modelo de seguridad de red.** nanobot no tiene concepto de políticas de red, controles de ingress o aislamiento de service mesh. Los agentes pueden hacer conexiones salientes arbitrarias. Combinado con acceso shell, esto crea una amplia superficie de ataque.

### Qué cubre OpenLegion de forma diferente

La arquitectura de OpenLegion previene las clases de vulnerabilidad de nanobot por diseño:

- **Vulnerabilidad crítica del bridge de WhatsApp (servicio de red no autenticado):** Los agentes OpenLegion corren en contenedores Docker sin puertos expuestos por defecto. El acceso de red se concede explícitamente por agente.
- **Inyección shell:** La coordinación tipo flota de OpenLegion requiere concesiones explícitas de herramienta. El acceso shell no está disponible a menos que se habilite específicamente en la ACL del agente.
- **Path traversal:** El aislamiento por contenedor Docker con montajes de solo lectura y sin socket Docker elimina el path traversal como vector de ataque significativo.
- **Exposición de credenciales:** El proxy de bóveda significa que no existen credenciales en el entorno del agente para robar.
- **RCE de dependencia:** El aislamiento por contenedor limita el radio de explosión — incluso si una dependencia tiene un RCE, el atacante está contenido dentro de un contenedor sandboxed sin credenciales.

## Compensaciones de Hosting vs Self-Host

**nanobot** está diseñado para autoalojamiento local. pip install, config JSON y un agente corriendo en minutos. No existe servicio alojado. La naturaleza ligera significa que cualquier sistema Linux, macOS o incluso una Raspberry Pi puede alojarlo.

**OpenLegion** requiere Python, SQLite y Docker. La plataforma alojada (próximamente) ofrecerá instancias VPS por usuario a 19$/mes. El requisito de Docker añade sobrecarga de infraestructura pero proporciona la capa de aislamiento que hace seguro el despliegue de producción.

## Para Quién Es

**nanobot** es para estudiantes, investigadores y desarrolladores individuales que quieren entender la arquitectura de agentes de IA a través de una base de código limpia y legible. También es valioso para equipos apuntando a plataformas de mensajería asiáticas (Feishu, DingTalk, QQ). El usuario ideal corre nanobot localmente para tareas personales y no lo expone a redes no confiables.

**OpenLegion** es para equipos de ingeniería desplegando agentes en entornos donde los incidentes de seguridad tienen consecuencias de negocio. El usuario ideal necesita demostrar aislamiento de credenciales, control de coste y trazas de auditoría a stakeholders — y no puede arriesgar un CVSS 10.0 en producción.

## La Compensación Honesta

nanobot prueba que se puede reconstruir un runtime de agente de IA en 4.000 líneas. Ese logro es real y valioso para el ecosistema. Pero la vulnerabilidad crítica del bridge de WhatsApp prueba que simplicidad y seguridad no son lo mismo. Una base de código de 4.000 líneas con un CVSS 10.0 es menos segura que una base de código de ~77.000 líneas con restricciones arquitectónicas que hacen esa clase de vulnerabilidad imposible.

Si quiere aprender cómo funcionan los agentes, lea el código fuente de nanobot. Si quiere desplegar agentes de forma segura, use un framework donde las configuraciones inseguras no puedan ocurrir.

Para el panorama completo, consulte nuestra [comparativa de frameworks de agentes de IA](/learn/ai-agent-frameworks).

## CTA

**Despliegue agentes con seguridad que es arquitectónica, no aspiracional.**
[Empezar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai) | [Ver todas las comparativas](/comparison)

---

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es nanobot?

nanobot es una reimplementación en Python de ~4.000 líneas de OpenClaw creada por un laboratorio académico de investigación. Soporta más de 11 proveedores LLM y más de 8 canales de mensajería (incluyendo plataformas asiáticas como Feishu, DingTalk y QQ). Lanzó el 2 de febrero de 2026 y tiene aproximadamente 20.000-26.000 estrellas en GitHub. Recibió la recepción más fuerte en Hacker News de cualquier alternativa a OpenClaw (218 puntos, 111 comentarios).

### OpenLegion vs nanobot: ¿cuál es la diferencia?

nanobot es un esqueleto didáctico educativo — mínimo, legible y diseñado para aprendizaje. OpenLegion es un framework de seguridad de producción. nanobot usa restricción de workspace a nivel de aplicación y config JSON en texto plano; OpenLegion usa aislamiento por contenedor Docker y credenciales por proxy de bóveda. nanobot ha sufrido una vulnerabilidad crítica del bridge de WhatsApp (CVSS 10.0) más tres vulnerabilidades críticas adicionales; OpenLegion no tiene CVEs reportados a partir de v0.1.0 y una arquitectura que hace estas clases de vulnerabilidad estructuralmente imposibles.

### ¿Es OpenLegion una alternativa a nanobot?

Sí. Ambos son frameworks de agentes de IA basados en Python, pero sirven a propósitos diferentes. nanobot es mejor para aprendizaje y experimentación local. OpenLegion es una alternativa para equipos que necesitan seguridad de grado producción — aislamiento de credenciales por proxy de bóveda, aplicación de presupuesto por agente, aislamiento por contenedor Docker y coordinación tipo flota (blackboard + pub/sub + handoff).

### ¿Cómo se compara el manejo de credenciales entre OpenLegion y nanobot?

nanobot almacena las claves API en `~/.nanobot/config.json` (inicialmente legible por todos hasta que fue parcheado). Las claves se cargan en la memoria del proceso Python en runtime. OpenLegion usa un proxy de bóveda — los agentes hacen llamadas API a través de un proxy que inyecta credenciales en la capa de red. Los agentes nunca retienen, leen o tienen acceso a claves API en ninguna forma.

### ¿Cuál es mejor para agentes de IA en producción?

OpenLegion es significativamente más adecuado para producción. nanobot fue diseñado como herramienta de enseñanza y ha acumulado una vulnerabilidad crítica del bridge de WhatsApp (CVSS 10.0), inyección shell, path traversal y vulnerabilidades RCE de dependencias dentro de semanas del lanzamiento. El aislamiento obligatorio por contenedor, credenciales por proxy de bóveda, presupuestos por agente y coordinación tipo flota auditable de OpenLegion abordan las clases exactas de vulnerabilidad que afectaron a nanobot.

### ¿Es nanobot lo mismo que nanobot (Obot AI)?

No. Hay dos proyectos completamente diferentes compartiendo el nombre. El nanobot discutido en esta página es una alternativa a OpenClaw en Python de ~4.000 líneas de un laboratorio académico de investigación. El nanobot de Obot AI es una plataforma de agente MCP basada en Go respaldada por 35M$ de financiación seed del equipo de Rancher Labs. Esta página compara OpenLegion con la versión alternativa a OpenClaw en Python.

### ¿Cuál fue la vulnerabilidad crítica del bridge de WhatsApp de nanobot?

El bridge de WhatsApp de nanobot contenía una vulnerabilidad crítica (CVSS 10.0) donde el servidor WebSocket vinculaba a 0.0.0.0:3001 sin ninguna autenticación. Cualquier atacante adyacente a la red podía conectarse y secuestrar sesiones activas de WhatsApp. Fue parcheada rápidamente pero demuestra el riesgo de desplegar frameworks de agente sin aislamiento de red arquitectónico.

### ¿Puedo migrar de nanobot a OpenLegion?

La config JSON y la configuración de agente de nanobot se reestructurarían como coordinación tipo flota con concesiones explícitas de herramienta, límites de presupuesto y ACLs por agente. Los ajustes de proveedor LLM se transfieren directamente dado que ambos usan configuraciones de proveedor compatibles con LiteLLM. Consulte nuestra página de [orquestación de agentes de IA](/learn/ai-agent-orchestration).

---

## Comparativas Relacionadas

| Texto de Anclaje | Destino |
|---|---|
| OpenLegion vs NanoClaw | /comparison/nanoclaw |
| OpenLegion vs PicoClaw | /comparison/picoclaw |
| OpenLegion vs ZeroClaw | /comparison/zeroclaw |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Comparativa de frameworks de agentes de IA 2026 | /learn/ai-agent-frameworks |
| Análisis de seguridad de agentes de IA | /learn/ai-agent-security |
