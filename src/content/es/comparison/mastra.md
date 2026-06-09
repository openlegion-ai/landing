---
title: Alternativa a Mastra — Plataforma de Agentes IA con Seguridad Primero
description: Mastra es un framework TypeScript con licencia dual, RBAC tras directorio ee/ propietario y CVE-2025-61685 exponiendo credenciales. Compara alternativas a Mastra.
slug: /comparison/mastra
primary_keyword: alternativa a mastra
secondary_keywords:
  - openlegion vs mastra
  - mastra seguridad
  - mastra framework agente typescript
  - mastra enterprise edition
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---

# Alternativa a Mastra: Plataforma con Seguridad Primero vs Framework TypeScript

Mastra es un framework de agentes TypeScript con 24.329 estrellas GitHub del equipo de Gatsby — pero CVE-2025-61685 (CVSS 6.5) expone archivos de credenciales `~/.aws` vía inyección de prompts en Cursor IDE, el RBAC y la auth están bloqueados tras un directorio `ee/` propietario no disponible bajo Apache 2.0, y dos PRs no fusionadas dejan vulnerabilidades de redirección abierta y CSRF OAuth sin parchear en la pila de auth enterprise (mayo 2026). Una alternativa a Mastra para equipos orientados a seguridad necesita aislamiento por vault proxy, no credenciales en variables de entorno.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es Mastra?**
> Mastra es un framework de agentes TypeScript open source de Kepler Software (el equipo detrás de Gatsby) con 24.329 estrellas GitHub, lanzado en agosto de 2024. Ofrece orquestación de workflows, llamadas a herramientas y primitivas RAG para desarrolladores JavaScript y TypeScript bajo licencia dual — Apache 2.0 para el núcleo y licencia propietaria para el directorio `ee/` enterprise que contiene auth, RBAC y aplicación de permisos de adaptadores.

## Por qué los desarrolladores buscan una alternativa a Mastra

### CVE-2025-61685: Exposición de archivos de credenciales vía servidor MCP Docs

CVE-2025-61685 (CVSS 6.5, CWE-548, 24 de septiembre de 2025) es una vulnerabilidad de traversal de directorios en `@mastra/mcp-docs-server` versiones ≤0.13.8. Descubierta por Liran Tal, la vulnerabilidad permite inyección de prompts vía Cursor IDE para eludir las protecciones de traversal de rutas en `readMdxContent` vía `findNearestDirectory`, alcanzando rutas del sistema de archivos fuera del directorio de docs previsto.

El radio de explosión práctico es estrecho pero severo para las máquinas de desarrollo: el traversal expone `~/.aws/credentials`, `~/.config/` (tokens de cuenta de servicio) y `~/.cursor/` (configuración IDE). Cualquier desarrollador ejecutando una versión afectada de `@mastra/mcp-docs-server` con Cursor IDE está expuesto a la lectura de archivos de credenciales mediante prompts maliciosos.

Mastra parcheó la vulnerabilidad en la versión 0.17.0. Los equipos que aún ejecutan ≤0.13.8 con el servidor MCP docs activo siguen expuestos.

### Licencia dual: funcionalidades de seguridad tras el paywall `ee/`

La licencia Apache 2.0 de Mastra cubre el framework principal. El directorio `ee/` — que contiene integraciones de auth, RBAC y aplicación de permisos de adaptadores — es propietario y no está disponible bajo la licencia open source. Esto crea tres brechas concretas:

**El RBAC es un add-on enterprise.** El control de acceso basado en roles para permisos de agentes no está disponible sin la edición enterprise. Los equipos que necesitan restringir lo que agentes específicos pueden hacer deben pagar por la actualización `ee/`.

**Los permisos de adaptadores están bloqueados.** El control granular sobre adaptadores (conexiones de base de datos, integraciones API, acceso a herramientas) requiere el tier propietario.

**Las integraciones de auth son propietarias.** El directorio `ee/` incluye la integración WorkOS AuthKit (`@workos/authkit-session`) y flujos OAuth `better-auth`. El núcleo open source no tiene primitivas de auth.

### PRs de seguridad sin fusionar en la pila de auth enterprise

Dos vulnerabilidades de seguridad en las dependencias de auth enterprise de Mastra permanecen abiertas al 26 de mayo de 2026:

**CVE-2026-42565 (CVSS 4.3)**: Redirección abierta en `@workos/authkit-session`. Un atacante puede crear una URL de redirección que eluda la validación de origen, permitiendo phishing vía cadenas de redirección de dominios de confianza.

**GHSA-wxw3-q3m9-c3jr (CVSS 5.3)**: CSRF OAuth en `better-auth`. Una vulnerabilidad CSRF sin parchear en el manejo del callback OAuth puede permitir a un atacante asociar su sesión con la cuenta de una víctima.
## Perspectiva de OpenLegion: Tres brechas de seguridad estructurales

Mastra es un framework TypeScript bien diseñado con verdaderas fortalezas para equipos JS/TS. Pero tres brechas de seguridad estructurales se acumulan para equipos que despliegan agentes en producción:

**Exposición de credenciales por diseño.** Los agentes Mastra reciben credenciales como variables de entorno. CVE-2025-61685 demostró que la toolchain circundante puede alcanzar esas credenciales mediante traversal de rutas. El vault proxy de OpenLegion inyecta credenciales en la capa de red: ningún proceso de agente recibe jamás una clave API en texto plano, haciendo la exfiltración tipo `~/.aws` estructuralmente imposible.

**La seguridad como actualización enterprise.** RBAC, permisos de adaptadores e integraciones de auth requieren el tier propietario `ee/`. Los permisos de blackboard de OpenLegion y el vault proxy son características core disponibles para todos los usuarios.

**Vulnerabilidades de auth sin parchear en el tier de pago.** CVE-2026-42565 y GHSA-wxw3-q3m9-c3jr están en las dependencias de auth del directorio enterprise `ee/`. El historial CVE cero de OpenLegion (mayo 2026) refleja una arquitectura donde las credenciales nunca son mantenidas por los agentes.

## Mastra vs OpenLegion: Comparación lado a lado

| **Dimensión** | **Mastra** | **OpenLegion** |
|---|---|---|
| **Soporte de lenguajes** | Solo TypeScript | Python (agentes); interfaces de herramientas para cualquier lenguaje |
| **Licencia** | Apache 2.0 (núcleo) + `ee/` propietario | PolyForm Perimeter License 1.0.1 |
| **Estrellas GitHub** | 24.329 (mayo 2026) | Pre-lanzamiento |
| **Modelo de credenciales** | Variables de entorno — agentes mantienen claves | Vault proxy — agentes nunca mantienen claves |
| **Aislamiento de agentes** | Nivel de proceso, sin frontera de contenedor | Contenedores Docker obligatorios por agente |
| **RBAC** | Solo tier propietario `ee/` | Permisos de blackboard por agente (todos los usuarios) |
| **Historial CVE** | CVE-2025-61685 (CVSS 6.5) + 2 PRs abiertas | 0 CVEs reportados |
| **Auth** | WorkOS AuthKit / better-auth (solo `ee/`) | Vault proxy (sin capa de auth necesaria) |
| **Controles de presupuesto** | Ninguno integrado | Límites diarios/mensuales por agente |
| **Multi-agente** | Orquestación de workflows, llamadas a herramientas | Blackboard + pub/sub + handoff mesh |
| **Issues abiertas** | 433 (26 mayo 2026) | Pre-lanzamiento |

## Solo TypeScript: Lo que significa en la práctica

### Sin soporte de Python, Go o Java

Mastra es TypeScript-first por diseño y actualmente solo TypeScript. Para equipos con bases de código políglotas o infraestructura Python ML/datos existente, adoptar Mastra significa reescribir la lógica de agentes en TypeScript o aceptar que la coordinación de agentes no puede abarcar lenguajes.

Esto no es una brecha temporal — es una elección arquitectural. Para equipos Python-first, Mastra no es una opción viable independientemente de la postura de seguridad. OpenLegion, LangGraph, CrewAI y AutoGen soportan Python nativamente.

Para tiendas JS/TS donde todo el stack ya es TypeScript, la experiencia de desarrollador de Mastra es genuinamente excelente. La inferencia de tipos nativa para esquemas de herramientas y los patrones `async/await` familiares hacen que el desarrollo de agentes se sienta natural para el lenguaje.

## Arquitectura de seguridad: Vault Proxy vs Variables de entorno

### Cómo Mastra maneja las credenciales

Los agentes Mastra reciben claves API LLM y credenciales de servicio a través de variables de entorno. Las credenciales existen en `process.env` y son accesibles a cualquier código que se ejecute en el proceso del agente, incluyendo callbacks de herramientas y manejadores de servidor MCP.

CVE-2025-61685 demostró el riesgo concreto: un traversal de directorio en `@mastra/mcp-docs-server` podía alcanzar `~/.aws/credentials` porque el entorno del proceso era accesible desde el mismo contexto de ejecución que el servidor vulnerable.

### Cómo OpenLegion maneja las credenciales

El vault proxy de OpenLegion se sitúa en la capa de red entre los agentes y los proveedores LLM. El host mesh intercepta las llamadas API, recupera la credencial apropiada del vault, la inyecta en el encabezado de la solicitud y la reenvía al proveedor. El proceso del agente nunca recibe una cadena de credencial.

Esto hace que la exfiltración de credenciales en el patrón de ataque CVE-2025-61685 sea estructuralmente imposible. Para un análisis más profundo, ver [Seguridad de agentes IA: aislamiento de credenciales y endurecimiento de contenedores](/learn/ai-agent-security).

## OpenLegion como alternativa a Mastra

### Lo que OpenLegion proporciona

Coordinación multi-agente vía estado blackboard, eventos pub/sub y handoff mesh. Inyección de credenciales vía vault proxy donde ningún proceso de agente mantiene claves API. Aislamiento Docker por agente con ejecución no-root y no-new-privileges. Límites de presupuesto diarios y mensuales por agente. 100+ proveedores LLM vía LiteLLM. Plantillas de flota para despliegues de topología de agentes repetibles.

Para equipos evaluando [lo que una plataforma de agentes IA proporciona más allá de un framework](/learn/ai-agent-platform), la comparación de plataformas cubre el panorama completo de compromisos.

### Compromisos honestos

Sin SDK TypeScript — solo Python. Los equipos TypeScript no pueden usar OpenLegion sin agentes Python o una capa de puente. Comunidad más pequeña que las 24.329 estrellas de Mastra. Sin visualización de workflow integrada.

### Quién debería considerar OpenLegion sobre Mastra

**Equipos Python-first o políglotas** donde el soporte solo TypeScript es un bloqueador.

**Equipos donde el aislamiento de credenciales es un requisito estricto** — revisiones de seguridad que exigen que los agentes no puedan mantener claves API en texto plano.

**Equipos que necesitan RBAC sin actualización enterprise** — despliegues multi-agente donde restringir lo que los agentes específicos pueden acceder es un requisito básico.

**Equipos bloqueados por la postura CVE abierta de Mastra** — si CVE-2025-61685 y las dos PRs de auth sin fusionar crean un riesgo inaceptable.

Ver también: [OpenLegion vs LangGraph — orquestación con estado e historial CVE comparados](/comparison/langgraph), [OpenLegion vs CrewAI — coordinación de agentes basada en roles](/comparison/crewai) y [OpenLegion vs AutoGen — patrones multi-agente](/comparison/autogen). Para un panorama completo, ver [Comparación de frameworks de agentes IA 2026](/learn/ai-agent-frameworks).

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué es Mastra y quién lo construyó?

Mastra es un framework de agentes TypeScript con 24.329 estrellas GitHub desarrollado por Kepler Software — el equipo detrás de Gatsby — desde agosto de 2024. Ofrece orquestación de workflows, llamadas a herramientas, primitivas RAG y coordinación multi-agente para desarrolladores TypeScript bajo licencia dual: Apache 2.0 para el núcleo y licencia propietaria para el directorio `ee/` enterprise.

### ¿Qué es CVE-2025-61685 en Mastra?

CVE-2025-61685 (CVSS 6.5, 24 de septiembre de 2025) es un traversal de directorios en `@mastra/mcp-docs-server` ≤0.13.8, descubierto por Liran Tal. La inyección de prompts vía Cursor IDE elude las protecciones en `readMdxContent` vía `findNearestDirectory`, exponiendo `~/.aws/credentials`, `~/.config/` y `~/.cursor/`. Mastra parcheó en la versión 0.17.0; los equipos que ejecutan ≤0.13.8 con el servidor MCP docs activo siguen expuestos.

### ¿Tiene Mastra RBAC en el tier gratuito?

No. El RBAC, los permisos de adaptadores y las integraciones de auth se encuentran en el directorio `ee/` propietario de Mastra, no disponible bajo la licencia Apache 2.0 open source. OpenLegion proporciona permisos de blackboard por agente y aislamiento vault proxy a todos los usuarios como características core de la plataforma.

### ¿Cuáles son los problemas de seguridad sin parchear de Mastra en mayo de 2026?

Dos PRs de seguridad permanecen abiertas en la pila de auth enterprise de Mastra: CVE-2026-42565 (CVSS 4.3, redirección abierta en `@workos/authkit-session`) y GHSA-wxw3-q3m9-c3jr (CVSS 5.3, CSRF OAuth en `better-auth`). Ambas afectan el directorio enterprise `ee/`. Ninguna fue fusionada al 26 de mayo de 2026.

### ¿Pueden los desarrolladores TypeScript usar OpenLegion?

Los agentes OpenLegion son solo Python. Los equipos TypeScript necesitarían ejecutar agentes Python o construir herramientas TypeScript que llamen a las APIs de OpenLegion — no hay SDK TypeScript nativo. OpenLegion es la elección correcta cuando los requisitos de aislamiento de seguridad superan las preferencias de lenguaje.

### ¿Es Mastra suficientemente estable para producción?

Mastra tiene 24.329 estrellas GitHub y desarrollo activo desde agosto de 2024, con 433 issues abiertas al 26 de mayo de 2026. Los equipos que adoptan Mastra para producción deberían fijar versiones estables, actualizar `@mastra/mcp-docs-server` a 0.17.0+ y planificar correcciones upstream para CVE-2026-42565 y GHSA-wxw3-q3m9-c3jr antes de depender de las características de auth enterprise.

## Empezar

OpenLegion es gratuito para probar. [Comenzar en app.openlegion.ai](https://app.openlegion.ai) o [leer la documentación de la plataforma](https://docs.openlegion.ai). ¿Ya evaluando frameworks TypeScript? Ver [OpenLegion vs LangGraph — arquitectura de seguridad e historial CVE comparados](/comparison/langgraph) para una comparación de alternativa nativa Python.
