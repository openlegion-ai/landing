---
title: "Patrones de transferencia de agentes: enrutamiento de tareas entre agentes IA"
description: "Los patrones de transferencia de agentes definen cómo los agentes IA transfieren tareas, contexto y credenciales: transferencia push, despacho pull, enrutamiento por puntero blackboard y transferencia en streaming para sistemas multi-agente."
slug: /learn/agent-handoff-patterns
primary_keyword: "agent handoff patterns"
last_updated: "2026-06-14"
schema_types:
  - FAQPage
related:
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/agentic-workflows
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-observability
---

# Patrones de transferencia de agentes: enrutamiento de tareas entre agentes IA

Los patrones de transferencia de agentes son los protocolos por los cuales un agente IA transfiere una tarea, el contexto acumulado y la autoridad de ejecución a otro agente. Determinan qué datos cruzan el límite, qué se descarta y si las credenciales viajan con la tarea. La mayoría de los fallos de transferencia no son fallos de enrutamiento; son pérdidas de contexto o fugas de credenciales que solo se manifiestan cuando un agente posterior falla silenciosamente o un agente comprometido exfiltra datos sensibles de la carga útil.

<!-- SCHEMA: DefinitionBlock -->
Un patrón de transferencia de agentes es un patrón de diseño de software que rige cómo un agente IA autónomo delega una tarea a un agente par o especialista, especificando el contrato de datos para la transferencia de contexto, el mecanismo de enrutamiento para la entrega de tareas y las garantías de aislamiento que evitan fugas de credenciales o contexto entre agentes.

## Los cuatro patrones de transferencia canónicos

### Transferencia push: el llamador despierta directamente al llamado

En la transferencia push, el agente llamador construye una carga útil con el contexto de tarea y notifica directamente al agente receptor, típicamente llamando a una función, enviando un mensaje o invocando una API que despierta al llamado. El llamador controla exactamente qué datos recibe el llamado, cuándo los recibe y qué agente maneja la tarea.

La transferencia push es el patrón utilizado por la primitiva `handoff()` del SDK de OpenAI Agents (27 133 estrellas GitHub, MIT). El llamador puede opcionalmente pasar una función `input_filter` que elimina o transforma campos de contexto antes de la transferencia. Sin `input_filter`, la ventana de contexto completa pasa al llamado, incluido cualquier contenido sensible acumulado.

**Fortalezas**: baja latencia, control directo sobre el enrutamiento, fácil de rastrear en herramientas de observabilidad.  
**Riesgos**: el llamador debe eliminar explícitamente las credenciales y el contexto sensible; el acoplamiento estrecho entre llamador y llamado requiere cambios al agregar o eliminar agentes especialistas.

### Despacho pull: el llamado reclama desde una cola compartida

En el despacho pull, el agente llamador escribe una tarea en una cola compartida o bandeja de entrada sin notificar directamente a ningún agente específico. Los agentes llamados monitorean la cola y reclaman tareas que coincidan con sus capacidades. Esto permite el equilibrio de carga en un pool de workers y desacopla al llamador del conocimiento de qué agente específico manejará el trabajo.

El despacho pull reduce la exposición de credenciales: el mensaje de cola solo contiene una descripción de tarea y un puntero de clave de salida, no el contexto completo del llamador.

**Fortalezas**: escalado horizontal, acoplamiento laxo, equilibrio de carga natural.  
**Riesgos**: la profundidad de cola puede crecer sin límite bajo carga; las garantías de orden dependen de la semántica de la cola; la observabilidad requiere correlacionar IDs de tareas.

### Enrutamiento blackboard: aislamiento de contexto basado en punteros

En la transferencia por puntero blackboard, el llamador escribe su salida en una clave nombrada en un almacén persistente compartido, por ejemplo `output/researcher/task_abc123`, y envía al llamado solo el nombre de la clave. El llamado lee la clave y recupera exactamente los campos que necesita. Las credenciales crudas, los scratchpads intermedios y el contexto completo del llamador nunca aparecen en el mensaje de transferencia.

La función `hand_off()` de OpenLegion implementa este patrón de forma nativa: escribe datos de salida en `output/{agent_id}/{handoff_id}` en el blackboard, crea una entrada de tarea en la bandeja de entrada del destinatario con un puntero a esa clave, y despierta al destinatario. Las credenciales almacenadas en el vault se inyectan por el mesh en el momento de ejecución.

**Fortalezas**: máximo aislamiento de credenciales, el llamado lee solo lo que necesita, pista de auditoría completa mediante el historial de versiones de clave.  
**Riesgos**: añade una operación de lectura; requiere un almacén compartido fiable con controles de acceso apropiados.

### Transferencia en streaming: transferencia de contexto incremental

En la transferencia en streaming, el contexto se transfiere token a token o fragmento a fragmento a medida que el agente llamador lo genera, en lugar de esperar la salida completa. Esto minimiza la latencia de extremo a extremo en pipelines en tiempo real.

La transferencia en streaming conlleva el mayor riesgo de exposición de credenciales: el flujo puede incluir contenido sensible generado a mitad del razonamiento antes de que el llamador haya podido filtrarlo.

**Fortalezas**: menor latencia de extremo a extremo, colaboración multi-agente en tiempo real.  
**Riesgos**: el más difícil de asegurar, el más complejo de observar, requiere que el llamado maneje contexto parcial con elegancia.

## La opinión de OpenLegion: por qué la pérdida de contexto y las fugas de credenciales son los verdaderos bugs de transferencia

La mayoría de los fallos de transferencia multi-agente caen en dos categorías: bugs de pérdida de contexto y bugs de fuga de credenciales. Ambos son prevenibles por diseño.

**Cifras sobre pérdida de contexto**: las evaluaciones de compresión de contexto LLM muestran que la truncación ingenua en el límite de transferencia degrada las tasas de finalización de tareas en comparación con la resumización estructurada. La solución no es una ventana de contexto más grande, sino una carga útil de transferencia estructurada con campos explícitos para el trabajo completado, el trabajo restante y los hallazgos clave.

**Fuga de credenciales**: OWASP LLM06:2025 (Divulgación de Información Sensible) cubre explícitamente la exfiltración de credenciales mediante el paso de mensajes entre agentes como una de las 10 principales vulnerabilidades LLM.

### El problema de pérdida de contexto: qué se descarta en el límite

La causa raíz de la pérdida de contexto es la discrepancia entre lo que sabe el agente llamador y lo que comunica la carga útil de transferencia. Las cargas útiles estructuradas lo evitan: el llamador rellena explícitamente campos: objetivo de tarea, trabajo completado hasta ahora, subtareas pendientes, hallazgos clave y puntero de clave de salida.

### Exfiltración de credenciales mediante cargas útiles de transferencia (OWASP LLM06:2025)

`transfer_to_agent()` de Google ADK pasa el objeto `Session` completo, incluido el historial de conversación, al agente receptor, creando una transferencia de contexto de hasta 32 000 tokens por defecto. Los equipos deben auditar sus implementaciones de transferencia contra la [seguridad de agentes IA: aislamiento de credenciales y defensa contra inyección de prompts](/learn/ai-agent-security).

### El patrón puntero blackboard como valor predeterminado seguro

El patrón puntero blackboard elimina la exposición de credenciales a nivel de protocolo en lugar de depender del filtrado en la capa de aplicación. Las credenciales almacenadas en el vault de OpenLegion nunca se inyectan en el contexto del agente.

## Cómo los principales frameworks implementan la transferencia

### SDK OpenAI Agents: handoff() con input_filter (27 133 estrellas)

openai/openai-agents-python (27 133 estrellas GitHub, licencia MIT) implementa handoff() como un patrón push. El parámetro `input_filter` se añadió en v0.0.5 (marzo 2025) y requiere opt-in explícito.

```python
from agents import Agent, handoff, RunContextWrapper

def strip_credentials(ctx: RunContextWrapper, input_data: ResearchInput) -> ResearchInput:
    return ResearchInput(task=input_data.task, context=input_data.context)

researcher = Agent(
    name="researcher",
    handoffs=[handoff(writer_agent, input_filter=strip_credentials)]
)
```

### Google ADK: transfer_to_agent() y transferencia del objeto Session (20 100 estrellas)

google/adk-python (20 100 estrellas GitHub, Apache-2.0) implementa la transferencia mediante `transfer_to_agent()`, que pasa el objeto `Session` completo incluyendo el historial de conversación. El agente receptor recibe todo y debe descartar explícitamente el historial irrelevante.

### LangGraph: Command(goto=) con estado tipado compartido

LangGraph (langchain-ai/langgraph, Apache-2.0) implementa el enrutamiento de agentes mediante `Command(goto='nombre_nodo')` con actualizaciones de estado opcionales. El estado es un dict tipado compartido entre todos los nodos del grafo. El modelo de estado compartido de LangGraph no proporciona aislamiento de credenciales entre nodos.

```python
from langgraph.types import Command

def researcher_node(state: AgentState) -> Command:
    result = researcher.invoke(state)
    return Command(
        goto="writer",
        update={"research_output": result, "completed_steps": state["completed_steps"] + ["research"]}
    )
```

### OpenLegion: hand_off() con puntero blackboard y entrega en bandeja de entrada

La función `hand_off()` de OpenLegion implementa la transferencia por puntero blackboard de forma nativa.

```python
hand_off(
    to="writer",
    summary="Investigación completa: langchain-alternative, 2847 palabras de material fuente",
    data='{"topic": "langchain-alternative", "sources_key": "research/langchain-alt-sources", "word_count_target": 3000}'
)
```

## Contratos de datos de transferencia

### Qué incluir: resumen de tarea, clave de salida, historial relevante

Una carga útil de transferencia bien diseñada es una especificación estructurada, no un volcado de transcripción. Incluir:

- **Resumen de tarea** (máximo 200 palabras): qué debe lograr el llamado
- **Puntero de clave de salida**: la clave blackboard donde se almacena la salida del llamador
- **Resumen del trabajo completado**: qué se ha hecho ya, formulado como hechos
- **Subtareas pendientes**: los elementos específicos de los que el llamado es responsable
- **Parámetros estructurados**: cualquier entrada tipada que requiera la tarea del llamado

### Qué excluir: credenciales crudas, ventanas de contexto completas, scratchpads intermedios

Excluir de las cargas útiles de transferencia:
- **Claves API, tokens y credenciales**: deben inyectarse por el mesh en el momento de ejecución
- **Transcripciones completas de conversación**: truncar a resúmenes relevantes
- **Scratchpads de razonamiento intermedio**: la cadena de pensamiento del llamador no es útil para el llamado
- **Datos que el rol del llamado no requiere**: aplicar mínimo privilegio al contexto

## Mecanismos de enrutamiento de transferencia

### Enrutamiento estático: IDs de agentes codificados en duro

El enrutamiento estático envía cada transferencia de un tipo dado a un agente nombrado específico. Simple de implementar, fácil de rastrear. Falla cuando el agente destino no está disponible, está sobrecargado o es reemplazado.

### Enrutamiento dinámico: especialista seleccionado por LLM

El enrutamiento dinámico utiliza una llamada LLM para seleccionar el agente especialista apropiado según las características de la tarea. Ofrece flexibilidad pero añade latencia e introduce la posibilidad de errores de enrutamiento.

### Enrutamiento condicional: escalada basada en reglas

El enrutamiento condicional aplica reglas deterministas para seleccionar el agente destino. Más predecible que el enrutamiento LLM, pero requiere definición explícita de reglas para cada condición de enrutamiento.

### Manejo de fallbacks y timeouts

Cada transferencia debe definir qué ocurre cuando el llamado no responde dentro de una ventana de timeout. Opciones:
- **Reintentar con el mismo llamado**: apropiado cuando el fallo es probablemente transitorio
- **Redirigir a un agente alternativo**: apropiado cuando el llamado principal está persistentemente no disponible
- **Escalar al operador**: apropiado cuando la tarea requiere juicio humano
- **Escribir el fallo en el blackboard y continuar**: apropiado cuando la tarea posterior es opcional

## Comparación de seguridad y fiabilidad de los patrones de transferencia

| **Dimensión** | **Transferencia push** | **Despacho pull** | **Enrutamiento blackboard** | **Transferencia streaming** |
|---|---|---|---|---|
| **Mecanismo de enrutamiento** | Llamada de despertar directa al llamado | Cola compartida / reclamación en bandeja de entrada | Escritura de clave + vigilancia del llamado | Flujo de tokens incremental |
| **Aislamiento de contexto** | El llamador controla la carga útil; input_filter requerido | Solo mensaje de cola | El más alto: el llamado lee solo la clave nombrada | El más bajo: el contexto completo cruza el límite |
| **Riesgo de exposición de credenciales** | Medio: depende del opt-in input_filter | Bajo: la cola solo tiene puntero de tarea | Muy bajo: credenciales nunca en la carga útil | Alto: el flujo puede incluir contexto sensible |
| **Observabilidad** | Evento de traza único por transferencia | Profundidad de cola + eventos de reclamación | Historial de versiones de clave + eventos de bandeja de entrada | Rastreo a nivel de tokens requerido |
| **Latencia** | La más baja | Baja (overhead de lectura de cola) | Baja (overhead de lectura blackboard) | La más baja de extremo a extremo (streaming) |
| **Mejor para** | Delegación especializada estrechamente acoplada | Pools de workers con carga equilibrada | Pipelines asíncronos desacoplados | Colaboración en tiempo real |

<!-- SCHEMA: FAQPage -->
## Preguntas frecuentes

### ¿Qué es un patrón de transferencia de agentes?

Un patrón de transferencia de agentes es un protocolo para transferir una tarea de un agente IA a otro, especificando qué datos de contexto cruzan el límite, cómo se notifica al agente receptor y qué garantías de aislamiento evitan fugas de credenciales o memoria. Los cuatro patrones canónicos son la transferencia push, el despacho pull, el enrutamiento por puntero blackboard y la transferencia en streaming, cada uno con diferentes compromisos de seguridad, latencia y observabilidad.

### ¿Cómo implementa el SDK OpenAI Agents la transferencia?

El SDK OpenAI Agents (27 133 estrellas GitHub, MIT) implementa handoff() como un patrón push. El agente llamador invoca handoff() con un agente destino y una función opcional input_filter que elimina campos del contexto antes de la transferencia. El parámetro input_filter se añadió en v0.0.5 (marzo 2025) y requiere opt-in explícito; sin él, la ventana de contexto completa pasa al llamado.

### ¿Cómo implementa Google ADK la transferencia de agentes?

Google ADK (20 100 estrellas GitHub, Apache-2.0) usa transfer_to_agent(), que pasa el objeto Session completo incluyendo el historial de conversación al agente receptor. Esto crea una transferencia de contexto de hasta 32 000 tokens por defecto. El agente receptor recibe el historial completo y debe descartar explícitamente el contexto previo irrelevante.

### ¿Qué es el patrón de transferencia por puntero blackboard y por qué es más seguro?

En la transferencia por puntero blackboard, el llamador escribe su salida en una clave nombrada en un almacén compartido (como output/agent-id/task-id), luego envía al llamado solo el puntero de clave, no los datos mismos. El llamado lee solo los campos que necesita. Las credenciales nunca aparecen en el mensaje de transferencia, eliminando el vector de exfiltración OWASP LLM06:2025. La función hand_off() de OpenLegion implementa este patrón de forma nativa.

### ¿Qué riesgos de seguridad existen en la transferencia de agentes?

El riesgo principal es la exfiltración de credenciales: los frameworks que incluyen variables de entorno, tokens bearer o claves API en el objeto de contexto pasado durante la transferencia los exponen al agente receptor, que puede estar comprometido. OWASP LLM06:2025 identifica esto como una vulnerabilidad LLM top 10. El riesgo secundario es el envenenamiento de contexto.

### ¿Cómo manejar los fallos de transferencia y los timeouts?

Los pipelines de transferencia robustos definen un timeout y un camino de fallback: reintentar con el mismo llamado, redirigir a un especialista alternativo, escalar a un operador humano o escribir un registro de fallo en el blackboard. El agente llamador debe rastrear los IDs de transferencia y monitorear los eventos de finalización de tarea.

### ¿Qué datos incluir en una carga útil de transferencia?

Incluir: un resumen conciso de tarea (menos de 200 palabras), un puntero a la clave de datos de salida en el almacén compartido, hechos del trabajo completado, subtareas pendientes y cualquier parámetro estructurado requerido por el rol del llamado. Excluir: credenciales API crudas, transcripciones completas de conversación, scratchpads de razonamiento intermedio y cualquier dato que el rol del llamado no necesite.

## Transferencia segura de agentes en OpenLegion

El límite de transferencia es el origen de la mayoría de los problemas de fiabilidad multi-agente. La pérdida de contexto degrada la calidad de las tareas posteriores, y las fugas de credenciales en la carga útil crean riesgos de exfiltración que crecen con la longitud del pipeline.

La transferencia por puntero blackboard de OpenLegion resuelve ambos problemas a nivel de protocolo. `hand_off()` escribe salidas en una clave nombrada, entrega solo un puntero a la bandeja de entrada del destinatario y se basa en la inyección de credenciales mediante proxy de vault. El destinatario lee exactamente lo que necesita, nada más.

Para la capa de monitoreo que detecta fallos que el protocolo de transferencia pasa por alto, ver [observabilidad de agentes: rastrear transferencias a través de etapas de pipeline](/learn/ai-agent-observability). Para la capa de framework que determina qué patrón de transferencia elegir, ver [comparación de frameworks de agentes IA para despliegues en producción](/learn/ai-agent-frameworks).

[Construir pipelines multi-agente seguros en OpenLegion →](https://openlegion.ai)
