---
title: "Model Context Protocol (MCP) — Cómo los Agentes de IA Usan Herramientas"
description: >-
  Model Context Protocol (MCP) es el estándar abierto de Anthropic para que los
  agentes de IA descubran y llamen herramientas externas. Cómo funciona,
  consideraciones de seguridad y el soporte MCP de OpenLegion.
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol: El Estándar Abierto para Herramientas de Agentes de IA

**Model Context Protocol** (MCP) es el estándar abierto que Anthropic publicó en noviembre de 2024 que permite a los agentes de IA descubrir y llamar herramientas externas — bases de datos, sistemas de archivos, APIs, servicios internos — sin escribir código pegamento a medida. Los servidores MCP exponen capacidades; los clientes MCP (runtimes de agente, IDEs, asistentes) las consumen. El protocolo es deliberadamente mínimo, lo que es también su trampa en producción: los despliegues deben superponer autenticación, sandboxing y presupuestos por herramienta antes de ser seguros para ejecutar.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es el Model Context Protocol?**
> El Model Context Protocol es un estándar abierto basado en JSON-RPC, publicado originalmente por Anthropic, que define cómo los agentes de IA (clientes) descubren y llaman capacidades expuestas por herramientas (servidores). Es el equivalente del ecosistema de agentes de IA a LSP para editores o USB para hardware: un protocolo, muchas implementaciones.

## TL;DR

- **MCP es el puerto USB del ecosistema de agentes** — un protocolo que permite que cualquier runtime de agente conforme use cualquier servidor de herramientas conforme sin escribir código pegamento personalizado.
- **Anthropic publicó MCP en noviembre de 2024**; los principales adoptantes durante 2025 incluyen OpenAI, Microsoft Copilot, Cursor, Zed, Continue y la mayoría de frameworks de agentes.
- **MCP define cuatro tipos primitivos**: herramientas (llamadas estilo función), recursos (datos de solo lectura), prompts (plantillas reutilizables) y sampling (llamadas LLM iniciadas por el servidor de vuelta al cliente).
- **El transporte es JSON-RPC sobre stdio o HTTP/SSE**. Stdio es la forma local dominante; HTTP/SSE está ganando para servidores MCP remotos.
- **El MCP de producción requiere tres capas que la mayoría de tutoriales omiten**: autenticación, sandboxing y aplicación de presupuesto en llamadas a herramientas.

## Cómo Funciona MCP

Un cliente MCP (un runtime de agente o asistente de IA) se conecta a uno o más servidores MCP. En la conexión, el cliente solicita una lista de capacidades — ¿qué herramientas, recursos y prompts ofrece este servidor? Cada herramienta anuncia un esquema JSON para sus argumentos. El LLM del agente ve la lista de herramientas como parte de su contexto y elige llamadas a herramientas en consecuencia. El cliente enruta las llamadas al servidor correcto, ordena el JSON y devuelve resultados.

El transporte es JSON-RPC 2.0. Dos transportes son comunes: stdio (el cliente lanza el servidor como subproceso y se comunica sobre stdin/stdout — el predeterminado en Claude Desktop) y HTTP con Server-Sent Events para servidores remotos que viven al otro lado de una frontera de red.

El protocolo mismo es intencionalmente mínimo. La complejidad está en lo que exponen los servidores MCP: un servidor de sistema de archivos da a un agente acceso de lectura y escritura a un directorio; un servidor Postgres da acceso de consulta; un servidor de Slack da capacidades de envío de mensajes y lectura de canales. El mismo agente puede conectarse a múltiples servidores concurrentemente.

## Servidores MCP vs Clientes MCP

**Los servidores MCP** son el lado de las herramientas. Cualquiera puede escribir uno — Anthropic publica SDKs de referencia en Python y TypeScript. A mediados de 2026 hay miles de servidores comunitarios cubriendo GitHub, Notion, Linear, Postgres, AWS, automatización de navegador y más. Los servidores tienden a ser pequeños (unos pocos cientos de líneas) porque el protocolo hace la mayor parte del trabajo.

**Los clientes MCP** son runtimes de agente, IDEs y asistentes. Claude Desktop fue el cliente de referencia. Cursor, Zed, Continue, Windsurf y la mayoría de frameworks de agente añadieron soporte de cliente MCP durante 2025. Un único cliente MCP típicamente soporta múltiples conexiones concurrentes a servidores — un agente hablando a un servidor de sistema de archivos, un servidor de base de datos y un servidor de Slack simultáneamente.

La idea clave: el LLM no habla MCP directamente. El cliente renderiza la lista de herramientas MCP como definiciones de función dentro del prompt del LLM; el LLM emite una llamada a función; el cliente mapea la llamada al servidor MCP correcto y reenvía la petición JSON-RPC.

## Consideraciones de Seguridad para MCP en Producción

MCP es un protocolo de *exposición de capacidades* — no un protocolo de autorización ni auditoría. Los despliegues de producción necesitan añadir las partes que MCP intencionalmente deja fuera:

- **Autenticación**: la mayoría de servidores MCP corren sin autenticar localmente. Un despliegue multi-tenant necesita credenciales por agente y fronteras de autenticación por servidor.
- **Sandboxing**: un servidor MCP de sistema de archivos con acceso amplio a rutas es funcionalmente root en el anfitrión. Ejecute servidores MCP en contenedores; no monte volúmenes sensibles a ciegas.
- **Aplicación de presupuesto**: las llamadas a herramientas no son gratis. Un agente llamando a un servidor MCP de web scraping en bucle puede acumular un coste serio. Los presupuestos por agente deben cubrir invocaciones de herramientas, no solo tokens LLM.
- **Logs de auditoría**: MCP en sí no estandariza el registro de llamadas. Los runtimes de producción necesitan registrar cada llamada al servidor con argumentos, forma de respuesta y temporización para revisión de [seguridad de agentes de IA](/learn/ai-agent-security) y respuesta a incidentes.

La integración MCP de referencia de Claude Desktop monta servidores como subprocesos del anfitrión con los permisos de sistema de archivos del usuario del anfitrión. Eso funciona para configuraciones de desarrollador de un único usuario; no es seguro para producción.

## Cómo Integra OpenLegion MCP

OpenLegion es un cliente MCP por defecto. Los agentes en el runtime auto-descubren servidores MCP configurados para su flota, ven la lista de herramientas en su ventana de contexto y llaman a herramientas MCP a través de la misma ruta con proxy de bóveda y compuerta ACL que las skills integradas. El mesh aplica las capas de grado producción que MCP deja fuera:

- Cada servidor MCP corre en su propio namespace sandboxed; el agente nunca obtiene acceso stdio directo al proceso del servidor.
- Las ACLs por agente controlan qué servidores MCP puede llamar un agente dado.
- Cada llamada a herramienta cuenta contra el presupuesto por agente; un agente excediendo su tope es cortado tanto si el gasto vino de LLMs como de herramientas MCP.
- El mesh registra cada llamada MCP en el log de trazas — la misma telemetría cubierta en [observabilidad de agentes de IA](/learn/ai-agent-observability).

El resultado: obtiene la amplitud del ecosistema MCP sin heredar sus supuestos de confianza por defecto.

## La Postura de OpenLegion

MCP es el estándar más importante del ecosistema de agentes desde OpenAPI — colapsa lo que de otro modo sería trabajo de integración N × M (cada framework de agente por cada herramienta) en N + M servidores y clientes. Pero el minimalismo intencional del protocolo significa que los equipos de producción tienen que reconstruir la infraestructura aburrida — autenticación, sandboxing, presupuestos, auditoría — que los sistemas propietarios habían empaquetado. Los frameworks que tratan MCP como "solo añadir agua" sin superponer esas preocupaciones envían agentes inseguros por defecto. Elija una [plataforma de agentes de IA](/learn/ai-agent-platform) que tome MCP lo suficientemente en serio como para restringirlo.

## CTA

**Despliegue agentes compatibles con MCP con controles de grado producción integrados.**
[Empezar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es el Model Context Protocol?

El Model Context Protocol (MCP) es un estándar abierto JSON-RPC introducido por Anthropic en noviembre de 2024 que permite a los agentes de IA descubrir y llamar herramientas externas a través de una interfaz uniforme. Los servidores MCP exponen capacidades (herramientas, recursos, prompts); los clientes MCP (runtimes de agente, IDEs, asistentes) las consumen. Los principales adoptantes durante 2025 incluyen OpenAI, Microsoft Copilot, Cursor, Zed y la mayoría de frameworks de agente.

### ¿Quién creó MCP y es abierto?

Anthropic creó MCP y lo lanzó bajo una especificación abierta con SDKs de referencia en Python y TypeScript. La especificación está gobernada por la comunidad vía GitHub, y no hay licenciamiento ni lock-in propietario. Cualquiera puede escribir un servidor o cliente MCP, y los principales proveedores de LLM envían herramientas compatibles con MCP.

### ¿Cuál es la diferencia entre un servidor MCP y un cliente MCP?

Un servidor MCP expone capacidades — un servidor Postgres expone herramientas de consulta, un servidor de sistema de archivos expone lectura y escritura de archivos, un servidor de Slack expone envío de mensajes. Un cliente MCP es el lado consumidor — típicamente un runtime de agente, un IDE o un asistente de IA. Un cliente puede conectarse a muchos servidores concurrentemente; un servidor puede ser reutilizado por muchos clientes.

### ¿Es MCP seguro por defecto?

No — y eso es intencional. MCP es un protocolo de exposición de capacidades, no un protocolo de autorización. Las implementaciones de referencia (Claude Desktop, los ejemplos del SDK) ejecutan servidores sin autenticar como subprocesos del anfitrión con los permisos de sistema de archivos del usuario. Los despliegues de producción deben añadir autenticación, sandboxing, presupuestos por herramienta y logging de auditoría encima de MCP en sí.

### ¿Cómo se compara MCP con OpenAI function calling?

OpenAI function calling es un patrón de un único proveedor para permitir que un LLM llame a funciones definidas en la petición de la API — no estandariza cómo se descubren, empaquetan o comparten las herramientas entre sistemas. MCP es un estándar abierto entre proveedores para el mismo problema a nivel de ecosistema. Los dos son complementarios: los servidores MCP exponen capacidades; un cliente MCP puede renderizarlas como definiciones de función en formato OpenAI cuando llama a modelos GPT, o como formato de tool-use de Anthropic cuando llama a Claude.

### ¿Puedo usar MCP con cualquier proveedor de LLM?

Sí. MCP es agnóstico al LLM — el cliente renderiza las definiciones de herramienta MCP a cualquier formato que el LLM subyacente espere (uso de herramienta Anthropic, function calling de OpenAI, declaraciones de función de Gemini). Los runtimes como OpenLegion que soportan más de 100 proveedores vía LiteLLM adaptan automáticamente las herramientas MCP a la convención de llamada de cada proveedor.
