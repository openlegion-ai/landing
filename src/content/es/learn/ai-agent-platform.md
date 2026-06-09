---
title: "Plataforma de Agentes de IA — Despliegue Agentes Seguros"
description: >-
  OpenLegion es una plataforma gestionada de agentes de IA con aislamiento por
  contenedor, bóveda de credenciales y controles de presupuesto. Aporte sus
  propias claves API de LLM.
slug: /learn/ai-agent-platform
primary_keyword: plataforma de agentes de ia
secondary_keywords:
  - managed ai agent platform
  - self-hosted agent deployment
  - ai agent cost control
  - ai agent credential security
  - production ai agent infrastructure
date_published: 2025-12
last_updated: 2026-03
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /comparison
---

# La Plataforma de Agentes de IA Construida para Producción

La mayoría de equipos empiezan con un framework. Ensamblan nodos de LangGraph o crews de CrewAI, ponen una demo a funcionar y luego chocan con un muro: ¿quién gestiona los contenedores? ¿Dónde van las claves API? ¿Qué impide que un agente descontrolado queme 500$ en tokens de la noche a la mañana?

Una **plataforma de agentes de IA** responde a esas preguntas antes de que escriba su primer agente. OpenLegion es una plataforma gestionada de agentes de IA que viene con aislamiento por contenedor, credenciales con proxy de bóveda, controles de presupuesto por agente y coordinación tipo flota (blackboard + pub/sub + handoff) — todo habilitado por defecto. Aporte sus propias claves API de LLM. Sin recargo en el uso del modelo.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es una plataforma de agentes de IA?**
> Una plataforma de agentes de IA es infraestructura gestionada para desplegar, orquestar y gobernar agentes de IA autónomos en producción. A diferencia de los frameworks crudos, una plataforma maneja aislamiento, gestión de credenciales, controles de coste y observabilidad de modo que los equipos despliegan agentes sin construir DevOps desde cero.

## TL;DR

- **Plataforma, no framework** — OpenLegion gestiona contenedores, credenciales, presupuestos y redes. Usted gestiona la lógica del agente.
- **Credenciales con proxy de bóveda** — Los agentes ejecutan llamadas API a través de un proxy de bóveda. Nunca ven las claves en bruto.
- **Aislamiento por contenedor por agente** — Cada agente corre en su propio contenedor Docker con límites de recursos configurables (por defecto 384MB RAM / 0,15 CPU), ejecución no-root y sin sistema de archivos compartido.
- **Aplicación de presupuesto por agente** — Establezca límites diarios y mensuales de tokens con corte automático estricto. Sin facturas sorpresa.
- **BYO claves API** — Conecte cualquier proveedor de LLM vía LiteLLM (100+ soportados). Paga a los proveedores directamente a sus tarifas publicadas.
- **Coordinación tipo flota auditable** — Coordinación de flota (blackboard + pub/sub + handoff) para enrutamiento de tareas. Sin "agente CEO" tomando decisiones opacas.
- **Extensibilidad compatible con MCP** — Conecte cualquier servidor de herramientas MCP (bases de datos, sistemas de archivos, APIs) junto a más de 50 skills integradas. Auto-descubiertos por los agentes.
- **Memoria persistente del agente** — Los agentes recuerdan entre sesiones con búsqueda vectorial, archivos de workspace y aprendizajes de errores. Contexto gestionado automáticamente.

## Gestionado vs Autoalojado: Cuándo Tiene Sentido Cada Uno

La distinción entre frameworks de agentes de IA y plataformas de agentes de IA importa más en el momento del despliegue. Un framework le da los bloques de construcción — definiciones de agentes, integraciones de herramientas, patrones de conversación. Una plataforma le da la capa de producción: dónde corren los agentes, cómo acceden a credenciales, qué les impide salirse de los rieles.

**Frameworks autoalojados** (LangGraph, CrewAI, AutoGen) le dan el máximo control. Usted posee la infraestructura. Configura los contenedores. Construye el pipeline de credenciales. Esto funciona cuando su equipo tiene capacidad dedicada de DevOps e infraestructura existente con la que los agentes necesitan integrarse profundamente.

**Las plataformas gestionadas de agentes de IA** manejan la capa operativa para que su equipo se centre en la lógica del agente. OpenLegion se sitúa aquí — pero con una diferencia crítica: tiene código disponible bajo PolyForm Perimeter License 1.0.1. Obtiene operaciones de grado plataforma (aislamiento, bóveda, controles de presupuesto) sin lock-in con proveedor en el lado de la infraestructura.

La cuestión no es cuál es "mejor". Es si su equipo debería gastar horas de ingeniería en infraestructura de seguridad de agentes o en los agentes mismos.

### Cuándo tiene sentido autoalojarse

- Tiene requisitos estrictos de residencia de datos que excluyen cualquier servicio gestionado
- Sus agentes necesitan integración profunda con infraestructura on-prem existente
- Su equipo ya opera clústeres de Kubernetes y tiene prácticas maduras de DevOps
- Necesita personalizar el entorno de runtime a un nivel que las plataformas gestionadas no exponen

### Cuándo tiene sentido una plataforma gestionada de agentes de IA

- Necesita agentes en producción en días, no en meses
- Su equipo tiene de 1 a 5 ingenieros y no puede dedicar headcount a infraestructura
- Necesita garantías de [seguridad de agentes de IA](/learn/ai-agent-security) sin construirlas usted mismo
- Quiere controles de coste y trazas de petición sin instrumentar todo manualmente

## El Modelo BYO Claves API — Por Qué Importa

La mayoría de las plataformas de IA gestionadas cobran por token o toman un margen sobre el uso del modelo. Esto crea dos problemas: opacidad de coste y lock-in con proveedor.

OpenLegion toma un enfoque diferente. Usted aporta sus propias claves API de LLM de cualquier proveedor — OpenAI, Anthropic, Google, Mistral o cualquiera de los más de 100 proveedores soportados vía LiteLLM. Sus tokens fluyen directamente al proveedor a sus tarifas publicadas. OpenLegion cobra por plataforma y orquestación, no por acceso a modelos.

Esto importa por tres razones:

**Transparencia de coste.** Ve exactamente lo que cada agente gasta en cada proveedor. Sin recargo oculto. Sin "tokens de plataforma" que oscurezcan costes reales.

**Flexibilidad de proveedor.** Intercambie modelos por agente. Ejecute GPT-4o para razonamiento complejo, Claude para tareas de contexto largo y un modelo Llama local para clasificación de alto volumen — todo en el mismo proyecto, gestionado desde el mismo panel.

**Sin lock-in.** Si deja OpenLegion, sus claves API y configuraciones de modelo se van con usted. No hay una capa de modelo propietaria de la que migrar.

## Para Quién Es

### Desarrolladores en solitario construyendo productos con agentes

Está enviando un producto impulsado por agentes y necesita que sea seguro desde el primer día. OpenLegion le da infraestructura de producción — aislamiento por contenedor, bóveda de credenciales, controles de coste — sin contratar un equipo de DevOps. Empiece con una plantilla de equipo integrada (Dev Team, Sales Pipeline, Content Studio) y personalice desde ahí.

### Equipos de startup enviando rápido

Su equipo tiene de 2 a 10 ingenieros. Necesita agentes en producción este sprint, no el próximo trimestre. La instalación son tres comandos: `git clone`, `./install.sh`, `openlegion start`. El asistente de configuración guiada configura sus claves API, elige una plantilla de equipo y despliega su primera flota de agentes en menos de tres minutos.

### Equipos de seguridad empresariales

Necesita traza de peticiones y observabilidad de flujo, aislamiento de credenciales que sobreviva a un agente comprometido y controles de presupuesto que prevengan costes descontrolados. La arquitectura de OpenLegion está diseñada para entornos que requieren defensa en profundidad. La coordinación tipo flota auditable significa que cada paso de flujo es explícito y trazable — sin toma de decisiones opaca del LLM en el plano de control. Consulte nuestra página de [seguridad de agentes de IA](/learn/ai-agent-security) para el modelo de amenazas completo.

## Preparación para Producción: Qué Maneja OpenLegion vs DIY

| Capacidad | DIY (Solo Framework) | OpenLegion |
|---|---|---|
| **Runtime de agente** | Usted configura Docker, gestiona imágenes, maneja la red | Cada agente aprovisionado automáticamente en contenedor aislado (384MB RAM, 0,15 CPU por defecto, no-root, no-new-privileges) |
| **Gestión de credenciales** | Variables de entorno o integración de bóveda personalizada | Proxy de bóveda con inyección ciega — los agentes nunca ven las claves en bruto |
| **Controles de coste** | Seguimiento manual, sin límites estrictos | Presupuestos diarios/mensuales por agente con corte automático |
| **Orquestación** | Codifique su propia lógica de enrutamiento o use enrutamiento basado en LLM | Coordinación tipo flota (blackboard + pub/sub + handoff) — auditable |
| **Observabilidad** | Integrar LangSmith, Datadog o logging personalizado | Panel integrado con streaming en vivo, gráficos de coste, trazas de petición |
| **Despliegue multi-canal** | Construir integraciones por canal | CLI, Telegram, Discord, Slack, WhatsApp — además de endpoints webhook para integraciones externas |
| **Automatización de navegador** | Configurar Playwright/Puppeteer, gestionar instancias Chrome | Camoufox por agente (Firefox sigiloso) en un contenedor compartido de servicio de navegador, con KasmVNC (puertos 6100..6163), control CDP y auto-recuperación |
| **Extensibilidad de herramientas** | Construir integraciones personalizadas o usar herramientas LangChain | Compatible con MCP — conecte cualquier servidor MCP + 50+ skills integradas, auto-descubiertas |
| **Memoria del agente** | Construir RAG o gestión de estado personalizada | Memoria vectorial persistente por agente con gestión automática de contexto |
| **Failover de modelos** | Lógica de reintento personalizada por proveedor | Cadenas de failover configurables entre proveedores vía LiteLLM |

El resumen: si está evaluando [frameworks de agentes de IA](/learn/ai-agent-frameworks) y se encuentra construyendo más infraestructura que lógica de agente, está resolviendo un problema de plataforma con herramientas de framework. OpenLegion maneja la capa de plataforma para que pueda centrarse en lo que sus agentes hacen realmente.

## Extensibilidad de Herramientas Compatible con MCP

OpenLegion soporta el Model Context Protocol (MCP) para conectar herramientas externas. Cualquier servidor MCP — bases de datos, sistemas de archivos, APIs, servicios internos — puede añadirse vía configuración y ser auto-descubierto por los agentes. Esto se sitúa junto a más de 50 skills integradas que cubren automatización de navegador, operaciones de archivos, peticiones HTTP, búsqueda web, gestión de memoria, ejecución de código y comunicación de mesh.

La integración MCP significa que los agentes no están limitados a capacidades integradas. Conecte un servidor Postgres, una integración GitHub o una API interna personalizada — los agentes descubren las herramientas disponibles automáticamente y las usan dentro de sus límites de permisos.

## Memoria Persistente del Agente

Los agentes en OpenLegion mantienen memoria entre sesiones usando búsqueda vectorial, archivos de workspace y aprendizajes de errores. Cuando un agente encuentra un problema y lo resuelve, la solución se almacena y se recupera en sesiones futuras — reduciendo fallos repetidos y mejorando la calidad de ejecución a lo largo del tiempo.

La memoria está limitada por agente y se almacena en la base de datos SQLite + vectorial aislada de cada agente dentro de su contenedor. La gestión automática de contexto mantiene el uso de tokens eficiente exponiendo solo memorias relevantes para la tarea actual, en lugar de cargar historiales completos de conversación.

## Arquitectura: El Modelo de Confianza de Cuatro Zonas

OpenLegion separa cada despliegue en cuatro zonas de confianza más un nivel operador-o-interno:

**Zona 0 — Entrada Externa No Confiable.** Cualquier cosa que llegue de usuarios o terceros: CLI, Telegram, Discord, Slack, WhatsApp y endpoints webhook. Todas las entradas se validan y sanean vía guardas de inyección de prompt antes de llegar al mesh.

**Zona 1 — Contenedores de Agente Sandboxed (No Confiable).** Cada agente corre como su propia instancia FastAPI en un contenedor Docker dedicado con su propio volumen `/data`, base de datos de memoria y límites estrictos de recursos. Incluso un agente totalmente comprometido no puede acceder a sus claves API, datos de otros agentes o al sistema anfitrión.

**Zona 2 — Mesh Host (Confiable).** El servidor FastAPI que ejecuta el Blackboard (estado compartido vía SQLite + WAL), enrutador de mensajes PubSub, Bóveda de Credenciales (el proxy que maneja la inyección ciega), matriz ACL, Gestor de Contenedores, Rastreador de Costes y Servicio de Navegador (Camoufox por agente en :8500). Este es el cerebro — y es el único componente que toca sus claves API.

**Zona 2.5 — Operador-o-Interno.** Operaciones reservadas del plano de control disponibles para el agente Operador o utilidades internas del mesh — gestión de flota, ediciones de agentes, concesiones de permisos (el Operador no puede conceder `can_spawn` ni `can_use_wallet`).

**Zona 3 — Interno Solo-Loopback.** El nivel más restringido: endpoints que requieren tanto una cabecera `x-mesh-internal: 1` como una IP de origen loopback. Usado solo para llamadas de coordinación interna del mesh.

Esta arquitectura significa que la [orquestación de agentes de IA](/learn/ai-agent-orchestration) y la seguridad no son preocupaciones separadas — son el mismo sistema.

## Empezar

```bash
git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion && ./install.sh
openlegion start # configuración inline en la primera ejecución, luego los agentes se despliegan en contenedores aislados
```

La primera instalación toma 2-3 minutos. Requiere Python 3.10+ y Docker.

## CTA

**¿Listo para desplegar agentes seguros?**
[Empezar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es una plataforma de agentes de IA?

Una plataforma de agentes de IA es infraestructura gestionada que maneja las preocupaciones operativas de ejecutar agentes de IA autónomos: aislamiento por contenedor, gestión de credenciales, controles de coste, orquestación y observabilidad. Se sitúa por encima de frameworks como LangGraph o CrewAI y proporciona la capa de producción que los frameworks le dejan a usted.

### ¿Cuál es la mejor plataforma de agentes de IA para producción?

La mejor plataforma de agentes de IA para producción depende de sus requisitos de seguridad y operativos. Si necesita aislamiento por contenedor integrado, credenciales con proxy de bóveda y controles de presupuesto por agente sin construir infraestructura personalizada, OpenLegion proporciona esto de fábrica. Para equipos profundamente invertidos en el ecosistema Microsoft, Azure AI Agent Service vale la pena evaluar. Para máxima flexibilidad con más esfuerzo DIY, autoalojar LangGraph con LangSmith ofrece observabilidad fuerte.

### ¿Qué es una plataforma empresarial de agentes de IA?

Una plataforma empresarial de agentes de IA añade gobernanza, cumplimiento y controles de seguridad encima de la orquestación básica de agentes. Los requisitos clave incluyen: aislamiento de credenciales (los agentes nunca deberían ver claves API en bruto), trazabilidad de flujo, aplicación de presupuesto para prevenir costes descontrolados, control de acceso basado en roles y opciones de despliegue que soporten requisitos de residencia de datos. La arquitectura de OpenLegion está diseñada para entornos que requieren estos controles.

### ¿Puedo alojar agentes de IA con mis propias claves API?

Sí. OpenLegion usa un modelo BYO (Bring Your Own) de claves API. Conecte sus propias claves de cualquier proveedor de LLM — OpenAI, Anthropic, Google, Mistral y más de 100 otros vía LiteLLM. Sus tokens fluyen directamente al proveedor a sus tarifas publicadas. Aporte sus propias claves API de LLM. Sin recargo en el uso del modelo.

### Agentes de IA gestionados vs autoalojados: ¿cuál es la diferencia?

Las plataformas gestionadas de agentes de IA manejan el aprovisionamiento de contenedores, la bóveda de credenciales, los controles de coste y la observabilidad por usted. Autoalojado significa que despliega un framework (LangGraph, CrewAI, AutoGen) en su propia infraestructura y construye estas capas operativas usted mismo. Gestionado es más rápido a producción y requiere menos inversión en DevOps. Autoalojado da máximo control de infraestructura. OpenLegion ofrece un híbrido: código disponible (PolyForm Perimeter License 1.0.1) que puede autoalojar, con capacidades de plataforma gestionada integradas.

### ¿Cómo se compara OpenLegion con otras plataformas de agentes de IA?

OpenLegion se diferencia en arquitectura security-first. Basado en documentación pública al momento de escribir, ningún otro [framework de agentes de IA](/learn/ai-agent-frameworks) importante proporciona credenciales con proxy de bóveda integradas, aislamiento obligatorio por contenedor por agente o aplicación de presupuesto por agente nativa. Consulte nuestra [comparativa de frameworks](/learn/ai-agent-frameworks) para un desglose detallado a través de OpenClaw, LangGraph, CrewAI, AutoGen y Semantic Kernel.

### ¿Qué licencia usa OpenLegion?

OpenLegion tiene código disponible bajo la licencia PolyForm Perimeter License 1.0.1 y está disponible en [GitHub](https://github.com/openlegion-ai/openlegion). El proyecto también ofrece una plataforma alojada para equipos que quieren infraestructura gestionada sin autoalojarse.

### ¿Qué tan rápido puedo desplegar mi primer agente?

Tres comandos y menos de tres minutos. `git clone`, `./install.sh`, `openlegion start`. El asistente de configuración guiada configura sus claves API, selecciona una plantilla de equipo y aprovisiona su primera flota de agentes aislada automáticamente.

---

## Enlaces Internos a Incluir

| Texto de Anclaje | Destino |
|---|---|
| Plataforma de agentes de IA | /learn/ai-agent-platform |
| Orquestación de agentes de IA | /learn/ai-agent-orchestration |
| Comparativa de frameworks de agentes de IA | /learn/ai-agent-frameworks |
| Seguridad de agentes de IA | /learn/ai-agent-security |
| Alternativa a OpenClaw | /openclaw-alternative |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Documentación | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
