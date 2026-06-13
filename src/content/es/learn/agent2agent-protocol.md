---
title: "Protocolo Agent2Agent: Seguridad A2A, arquitectura y comparación con MCP"
description: "El protocolo Agent2Agent (A2A) permite a los agentes de IA delegar tareas entre frameworks. Aprende sobre la arquitectura, el modelo de seguridad, el ciclo de vida de tareas y la comparación con MCP."
slug: /learn/agent2agent-protocol
primary_keyword: protocolo agent2agent
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/model-context-protocol
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/ai-agent-frameworks
---

# Protocolo Agent2Agent: Arquitectura, seguridad y comparación con MCP

Agent2Agent (A2A) es un protocolo abierto, lanzado por Google Cloud en abril de 2025 y donado a la Linux Foundation, que permite a los agentes de IA construidos sobre diferentes frameworks y proveedores comunicarse, delegar tareas e intercambiar resultados a través de una interfaz HTTP/JSON estandarizada. Mientras MCP resuelve el problema del acceso a herramientas (un LLM llamando a APIs externas), A2A resuelve el problema de coordinación: un agente delegando una subtarea completa a un agente par especializado con su propio bucle de razonamiento, memoria y herramientas. El repositorio GitHub a2aproject/A2A cuenta con contribuciones de más de 50 organizaciones, incluidas Salesforce, Atlassian y SAP.

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent (A2A) es un protocolo HTTP/JSON abierto para la interoperabilidad de agentes de IA, mantenido por la Linux Foundation, que estandariza cómo los agentes autónomos anuncian capacidades, delegan tareas e intercambian resultados entre diferentes frameworks y proveedores.

## ¿Qué es el protocolo Agent2Agent (A2A)?

A2A surgió de una brecha concreta en el ecosistema de agentes de IA: la comunicación de modelo a herramienta tenía un estándar (MCP, lanzado en noviembre de 2024), pero la comunicación de agente a agente no. Cuando un agente orquestador necesita delegar una subtarea a un par especializado, no existía un formato de cable estandarizado para esa delegación.

Google Cloud anunció A2A el 9 de abril de 2025, junto con un grupo inicial de más de 50 socios tecnológicos que contribuyen a la especificación. A diferencia de muchos estándares impulsados por proveedores, A2A fue donado a la Linux Foundation para una gobernanza neutral.

El protocolo es HTTP/JSON en su núcleo. Un agente compatible con A2A expone un pequeño conjunto de puntos de conexión: una tarjeta de agente (manifiesto de capacidades), un punto de envío de tareas, un punto de consulta de estado y un punto de streaming SSE para tareas de larga duración.

Para contexto sobre el problema de coordinación multi-agente que A2A aborda, consulta [arquitectura de sistemas multi-agente](/learn/multi-agent-systems) y [patrones de orquestación de agentes de IA](/learn/ai-agent-orchestration).

## La arquitectura del protocolo A2A

A2A define tres conceptos principales: tarjetas de agente (descubrimiento de capacidades), el ciclo de vida de tareas (seguimiento de delegación con estado) y modos de entrega (streaming SSE y push por webhook).

### Tarjetas de agente: publicidad de capacidades y riesgo de enumeración

Una tarjeta de agente es un documento JSON servido en una URL conocida (`/.well-known/agent.json`) que describe lo que puede hacer un agente. Una tarjeta de agente mínima incluye:

```json
{
  "name": "web-research-agent",
  "description": "Investiga temas usando búsqueda web y devuelve resúmenes estructurados",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "Investigar tema",
      "description": "Buscar un tema en la web y devolver un resumen estructurado",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

Las tarjetas de agente permiten el descubrimiento dinámico de capacidades, pero conllevan un riesgo de seguridad: en el perfil base de A2A, las tarjetas de agente no están autenticadas por defecto, exponiendo toda la superficie de habilidades a la enumeración sin autenticación.

Los despliegues en producción deben servir tarjetas de agente solo tras autenticación o restringirlas a segmentos de red internos. El [modelo de amenaza de seguridad para agentes de IA](/learn/ai-agent-security) cubre la enumeración de capacidades como vector de ataque de reconocimiento.

### Ciclo de vida de tareas: cinco estados de enviado a completado

A2A define un ciclo de vida de cinco estados:

1. **submitted** - Tarea recibida por el agente remoto; aún no tomada para procesamiento
2. **working** - El agente remoto está procesando activamente la tarea (puede transmitir progreso por SSE)
3. **input-required** - El agente remoto necesita aclaración antes de continuar (punto de control humano)
4. **completed** - Tarea finalizada; artefacto de resultado disponible para recuperación
5. **failed** - Tarea fallida; detalles del error en el objeto de estado de tarea

El estado `input-required` es el mecanismo de A2A para los puntos de control humanos en pipelines autónomos largos.

### Entrega de tareas push vs pull: SSE y webhooks

A2A admite dos modos de entrega:

**SSE (Server-Sent Events):** El agente delegante abre una conexión persistente. SSE es el mecanismo principal para tareas de larga duración que requieren progreso incremental.

**Push por webhook:** El agente delegante proporciona una URL de devolución de llamada en el momento del envío. Preferible en entornos sin servidor donde no se puede mantener una conexión SSE persistente.

## A2A vs MCP: capas diferentes, problemas diferentes

A2A y MCP son complementarios, no competidores. Operan en diferentes capas de la pila de agentes y resuelven diferentes problemas de coordinación.

| **Dimensión** | **MCP** | **A2A** |
|---|---|---|
| **Propósito** | Acceso a herramientas - un LLM llama a APIs externas | Coordinación de agentes - un agente delega a otro |
| **Comunicación** | Llamada a herramienta sincrónica dentro de un turno de razonamiento | Delegación de tarea asíncrona; el agente receptor tiene su propio bucle |
| **Auth (defecto)** | Requerida - los servidores MCP autentican clientes | Opcional en el perfil base - anónimo permitido |
| **Descubrimiento** | Manifiesto del servidor MCP (lista de herramientas) | Tarjeta de agente (JSON: habilidades + requisitos de auth) |
| **Estado** | Sin estado por llamada a herramienta | Con estado, ciclo de vida de 5 estados |
| **Streaming** | No en la especificación principal | SSE en tiempo real; webhook push para asíncrono |
| **Amenaza principal** | Envenenamiento de herramientas (OWASP LLM07:2025) | Inyección de payload de tarea, enumeración de tarjeta de agente |

### Cuando un agente necesita una herramienta (MCP)

MCP es la elección correcta cuando un agente individual necesita llamar a una capacidad externa dentro de un turno de razonamiento. La herramienta no tiene su propio bucle de razonamiento; ejecuta una función y devuelve un valor.

### Cuando un agente necesita otro agente (A2A)

A2A es la elección correcta cuando una tarea requiere la capacidad de razonamiento completa de un agente par. El agente receptor tiene su propio modelo, memoria, acceso a herramientas y bucle de razonamiento multi-paso.

### Usar MCP y A2A juntos en el mismo sistema

Un sistema multi-agente en producción típicamente usa ambos. El agente orquestador usa A2A para delegar a agentes especialistas. Cada especialista usa MCP para sus llamadas a herramientas.

## Autenticación y modelo de seguridad de A2A

El modelo de seguridad de A2A tiene una brecha crítica: el perfil base hace la autenticación opcional. La inyección de prompt a través del payload de tarea A2A es una clase de ataque documentada.

La superficie de ataque en sistemas A2A:

**1. Inyección de payload de tarea:** La descripción de la tarea y los datos de entrada son controlados por el usuario.

**2. Enumeración de tarjeta de agente:** Las tarjetas de agente no autenticadas exponen toda la superficie de habilidades.

**3. Supuestos de confianza inter-agente:** Un agente delegante que confía en resultados de un par sin validación es vulnerable a inyección de relé.

**4. Delegación anónima:** Sin autenticación obligatoria, cualquier llamador en la red puede enviar tareas a un agente A2A.

## La opinión de OpenLegion: A2A es un formato de cable, no un modelo de seguridad

A2A está bien diseñado como formato de cable. El modelo de seguridad se queda corto para los requisitos de producción.

El enfoque de OpenLegion para la comunicación entre agentes aplica lo que el perfil base de A2A deja opcional:

1. **Cada llamada entre agentes pasa por el vault de credenciales.** No hay modo de delegación anónima.

2. **Saneamiento del payload de tarea en 56 puntos de estrangulamiento de red.** El contenido controlado por el usuario se sanea para ataques unicode antes de llegar al contexto LLM.

3. **Contratos de handoff tipados validados por el orquestador.** Los payloads de inyección de relé se bloquean en el límite.

4. **Los manifiestos de capacidades de agentes requieren autenticación.** La superficie de habilidades no está expuesta a llamadores anónimos.

## Implementar A2A: guía técnica

### Esquema de tarjeta de agente

Una tarjeta de agente en producción debe incluir explícitamente los requisitos de autenticación:

```json
{
  "name": "data-analysis-agent",
  "description": "Analiza conjuntos de datos estructurados y devuelve resúmenes estadísticos",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "Analizar conjunto de datos",
      "description": "Ejecutar análisis estadístico en un conjunto de datos proporcionado",
      "inputModes": ["data"],
      "outputModes": ["text", "data", "file"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "required": true
  }
}
```

### Envío de tareas y consulta de estado

El envío de tareas es un POST a `/tasks/send`. La consulta de estado usa `GET /tasks/{task_id}`. Consultar con retroceso exponencial (1s, 2s, 4s, 8s, máx 30s). Las tareas de larga duración (>60s) deben cambiar a SSE.

### Streaming de tareas de larga duración con SSE

Para tareas de más de 30 segundos, usar SSE via `POST /tasks/sendSubscribe`. El flag `"final": true` señala la finalización de la tarea. Implementar reconexión SSE con el encabezado `Last-Event-ID`.

<!-- SCHEMA: FAQPage -->
## Preguntas frecuentes

### ¿Qué es el protocolo Agent2Agent (A2A)?

Agent2Agent (A2A) es un protocolo HTTP/JSON abierto para la interoperabilidad de agentes de IA, lanzado por Google Cloud en abril de 2025 y donado a la Linux Foundation. Estandariza cómo los agentes autónomos anuncian capacidades, delegan tareas e intercambian resultados. Más de 50 organizaciones, incluidas Salesforce, Atlassian y SAP, han contribuido al protocolo desde su lanzamiento.

### ¿Cuál es la diferencia entre A2A y MCP?

MCP resuelve el acceso a herramientas: un agente llamando a una API externa dentro de un único turno de razonamiento. A2A resuelve la coordinación de agentes: un agente delegando una subtarea completa a un agente par con su propio bucle de razonamiento. MCP requiere autenticación por defecto; el perfil base de A2A la hace opcional. Ambos protocolos son complementarios.

### ¿Qué son las tarjetas de agente A2A?

Las tarjetas de agente son documentos JSON servidos en `/.well-known/agent.json` que describen las capacidades de un agente, los modos de entrada/salida aceptados y los requisitos de autenticación. Por defecto en el perfil base A2A, se sirven sin autenticación. Los despliegues en producción deben requerir autenticación para acceder a las tarjetas de agente.

### ¿Es seguro el protocolo A2A?

El perfil base de A2A tiene brechas de seguridad significativas. La autenticación es opcional por defecto. La inyección de prompt a través del payload de tarea A2A es un riesgo de producción real. Los despliegues de A2A en producción deben implementar explícitamente el perfil de autenticación extendido y sanear todo el contenido del payload antes del LLM.

### ¿Qué es el ciclo de vida de tareas A2A?

A2A define cinco estados: submitted (recibido, aún no procesado), working (procesamiento activo, puede transmitir progreso SSE), input-required (el agente remoto necesita aclaración), completed (resultado disponible) y failed (tarea fallida con detalles). El estado `input-required` es el mecanismo de puntos de control humanos de A2A.

### ¿Qué empresas apoyan A2A?

A2A fue lanzado en abril de 2025 con más de 50 organizaciones contribuyentes, incluidas Salesforce, Atlassian y SAP. Google Cloud lideró la especificación inicial y cedió la gobernanza a la Linux Foundation. El protocolo apunta a plataformas de IA empresarial.

### ¿Cómo implementa OpenLegion la comunicación entre agentes?

La arquitectura mesh de OpenLegion implementa la coordinación entre agentes con autenticación obligatoria en cada llamada. Cada handoff entre agentes pasa por el vault de credenciales. El contenido del payload se sanea en 56 puntos de estrangulamiento de red. Los contratos de handoff tipados son validados por el orquestador. Estos controles se ejecutan en la capa de infraestructura, fuera del código del agente.

## Construir sistemas multi-agente con autenticación en cada llamada

A2A proporciona el formato de cable para la interoperabilidad de agentes. El modelo de seguridad debe construirse encima o aplicarse mediante la capa de infraestructura.

Consulta [seguridad de agentes de IA y modelo de amenaza](/learn/ai-agent-security) o [arquitectura de sistemas multi-agente](/learn/multi-agent-systems).

[Ejecuta sistemas multi-agente donde cada llamada agente a agente esté autenticada, registrada y con credenciales aisladas por defecto - empieza en OpenLegion](https://app.openlegion.ai)
