---
title: "Bucle Agéntico: Cómo los Agentes de IA Perciben, Piensan y Actúan"
description: "El bucle agéntico es el ciclo percibir-pensar-actuar de cada agente de IA. Aprenda la mecánica del bucle, estrategias de terminación y cómo prevenir bucles infinitos."
slug: /learn/agentic-loop
primary_keyword: agentic loop
last_updated: "2026-07-08"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/agentic-ai-design-patterns
  - /learn/ai-agent-planning
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-prompt-injection
  - /learn/ai-agent-cost
---

# Bucle Agéntico: Cómo los Agentes de IA Perciben, Piensan y Actúan

Un bucle agéntico es el ciclo repetitivo percibir-pensar-actuar que impulsa a un agente de IA desde el inicio de la tarea hasta la respuesta final. En cada iteración, el agente lee el contexto — observaciones, resultados de herramientas, memoria — llama a un LLM para razonar sobre los próximos pasos, ejecuta una herramienta o devuelve una respuesta, y luego repite. Los límites de iteración, las condiciones de terminación y el manejo de errores determinan si un agente de producción es fiable o un riesgo — OpenLegion aplica límites estrictos en la capa mesh, convirtiendo los bucles descontrolados en fallos deterministas.

## ¿Qué es un Bucle Agéntico?

<!-- SCHEMA: DefinitionBlock -->

> **Un bucle agéntico** es un modelo de ejecución iterativo en el que un agente de IA observa alternativamente su entorno, razona sobre la siguiente acción usando un modelo de lenguaje, y ejecuta esa acción, repitiendo hasta que se cumpla una condición de terminación: finalización de la tarea, iteraciones máximas o agotamiento del presupuesto.

Cada agente de IA, independientemente del framework, ejecuta alguna variante de este bucle. El bucle es la unidad de ejecución del agente: un solo paso por percibir → pensar → actuar. Una tarea simple (responder una pregunta de una única búsqueda web) se completa en 2–3 iteraciones. Una tarea compleja (investigar un competidor, sintetizar hallazgos, redactar un informe) puede ejecutarse 15–30 iteraciones. El recuento de bucles no está establecido por la tarea — emerge del razonamiento del agente y los resultados de sus llamadas a herramientas.

El bucle tiene tres entradas y una salida por iteración:

| **Entrada/Salida** | **Contenido** | **¿Acumulado entre iteraciones?** |
|---|---|---|
| **Prompt del sistema** | Rol del agente, instrucciones, definiciones de herramientas | No — fijo por ejecución |
| **Historial de conversación** | Todos los turnos anteriores: mensajes de usuario, pensamientos del asistente, llamadas a herramientas, resultados de herramientas | Sí — crece cada iteración |
| **Observación actual** | Resultado de herramienta de la acción anterior (primera iteración: mensaje de usuario inicial) | Sí — se añade cada iteración |
| **Salida** | Siguiente acción: una llamada a herramienta, una solicitud de aclaración o una respuesta final | No — una salida por iteración |

La acumulación de contexto es el principal impulsor de costos del bucle: el historial de conversación crece por una llamada a herramienta y un resultado de herramienta por iteración. A 2.000 tokens por par de iteraciones en una tarea de 20 iteraciones, la última iteración envía 40.000 tokens como contexto de entrada. Los precios del modelo son por token, no por tarea — ver [cómo controlar los costos del bucle agéntico con límites de gasto por agente](/learn/ai-agent-cost).

## Las Tres Fases en Detalle

### Percibir — Leer el Contexto

La fase de percepción ensambla la vista actual del agente del mundo: todo lo que el LLM leerá antes de decidir qué hacer a continuación. Esto incluye:

- **Prompt del sistema:** instrucciones fijas, definiciones de herramientas, rol y restricciones del agente
- **Historial de conversación:** todos los pensamientos anteriores del asistente, llamadas a herramientas y resultados de herramientas en la ejecución actual
- **Nueva observación:** el resultado de la acción tomada en la iteración anterior

La fase de percepción es la principal **superficie de ataque de inyección de prompt** del bucle agéntico. Cada observación extraída de fuentes externas entra en el contexto como texto que el LLM procesará en el siguiente paso de pensar.

CVE-2024-5184 (Synopsys CyRC, junio 2024) demuestra exactamente esto: un ataque de inyección de prompt entregado a través del contenido de respuesta de herramienta que secuestra la siguiente iteración de bucle del agente. Para un tratamiento completo de vectores de inyección y defensas, ver [ataques de inyección de prompt que apuntan a respuestas de herramientas en el bucle agéntico](/learn/ai-agent-prompt-injection).

### Pensar — El Paso de Razonamiento LLM

La fase de pensar es la llamada al LLM: el contexto ensamblado de la fase de percepción se envía al modelo, que genera la siguiente acción. La salida es una de:
- Una **llamada a herramienta** (estructurada: nombre de herramienta + parámetros)
- Una **respuesta final** (texto libre) — el agente cree que la tarea está completa
- Una **solicitud de aclaración** (texto libre dirigido al usuario)

El modelo canónico para la fase de pensar es el **patrón ReAct** (Yao et al., 2022, arXiv:2210.03629): **Re**asoning + **Act**ing entrelazados dentro de la misma salida LLM. El paper ReAct demostró que intercalar el razonamiento explícito con las acciones mejora significativamente la precisión de las tareas del agente en benchmarks que incluyen HotpotQA, FEVER y ALFWorld.

**Costo del paso de pensar:** cada llamada LLM en la fase de pensar se factura a la tarifa por token del proveedor sobre el contexto acumulado completo. Para GPT-4o a $2,50/M tokens de entrada, una ejecución de 20 iteraciones con 2.000 tokens añadidos por iteración cuesta aproximadamente $1,05 en tokens de entrada solo para la ventana de contexto de la última iteración. Ver [planificación de agentes de IA — cómo los agentes descomponen objetivos antes de que comience el bucle](/learn/ai-agent-planning) para estrategias que reducen el recuento de iteraciones.

### Actuar — Ejecución de Herramienta o Respuesta Final

La fase de actuar ejecuta la acción seleccionada en la fase de pensar. Dos casos:

**Llamada a herramienta:** el ejecutor de herramientas del agente recibe la llamada a herramienta estructurada, la enruta a la implementación de herramienta apropiada, y recopila el resultado.

**Respuesta final:** el agente emite una respuesta de texto al llamador. El bucle termina.

El ejecutor de herramientas debe:
1. Validar que el nombre de herramienta solicitado existe en el conjunto de herramientas permitidas del agente
2. Validar que los parámetros se ajustan al esquema de la herramienta
3. Ejecutar la herramienta en un contexto aislado
4. Devolver el resultado sin modificación

Para patrones de implementación de herramientas, requisitos de sandboxing y el modelo de seguridad de ejecución de herramientas, ver [cómo los agentes ejecutan herramientas dentro de cada iteración de bucle](/learn/ai-agent-tool-use).

## Terminación del Bucle — Cuándo los Agentes se Detienen

### Terminación Natural

La terminación natural ocurre cuando el paso de pensar del LLM emite una respuesta final en lugar de una llamada a herramienta.

### Aplicación de max_turns

`max_turns` (terminología OpenAI Agents SDK) o `recursion_limit` (terminología LangGraph) es un límite superior estricto en el número de iteraciones que el bucle ejecutará.

**Valores predeterminados:**
- **OpenAI Agents SDK:** `max_turns = 10` (abril 2026)
- **LangGraph:** `recursion_limit = 25`
- **LangChain AgentExecutor:** `max_iterations = 15`, sin límite de tiempo por defecto
- **AutoGen:** `max_consecutive_auto_reply = 10` por agente

**Configuración de max_turns para producción:** establezca max_turns basado en la medición empírica de su agente específico. Mida el percentil 95 del recuento de iteraciones en 100 tareas representativas; establezca max_turns en P95 + 20% de margen.

### Terminación Basada en Presupuesto

La terminación basada en presupuesto detiene el bucle cuando el agente ha consumido un monto en dólares configurado.

**Modelo de aplicación de OpenLegion:**
- `daily_budget` ($50/día por defecto) y `monthly_budget` ($200/mes por defecto) se configuran por agente en `INSTRUCTIONS.md`
- El enrutador mesh rastrea el gasto acumulado por ID de agente en tiempo real
- Cuando una iteración de bucle excedería el presupuesto diario restante, la solicitud se rechaza en la capa mesh antes de llegar al proveedor LLM

### Terminación Basada en Errores

Tres estrategias: abortar en error, reintentar con backoff, o usar alternativa y continuar.

## Anti-Patrones de Bucle Infinito

El informe de estado de agentes de LangChain 2025 encontró que el **23% de los fallos de agentes fueron causados por bucles infinitos de llamadas a herramientas** — la mayor categoría única de fallos.

### Tormenta de Llamadas a Herramientas

Una tormenta de llamadas a herramientas ocurre cuando el paso de pensar del agente llama repetidamente a la misma herramienta sin progresar hacia la finalización de la tarea. Desencadenantes comunes: especificación de tarea ambigua, validación faltante de resultados de herramientas, razonamiento circular.

### Envenenamiento de Contexto

El envenenamiento de contexto ocurre cuando un resultado de herramienta introduce contenido en el historial de conversación que distorsiona el razonamiento del LLM en iteraciones posteriores. Prevención: preprocesamiento de resultados de herramientas — eliminar HTML, truncar documentos grandes a secciones relevantes, devolver resúmenes estructurados.

### Inyección de Prompt via Respuesta de Herramienta

El desencadenante de bucle infinito más crítico para la seguridad: CVE-2024-5184 (Synopsys CyRC, junio 2024). Una respuesta de herramienta contiene instrucciones inyectadas que redirigen la siguiente iteración del agente a una nueva subtarea.

Defensa: tratar cada resultado de herramienta como entrada no confiable. Para un tratamiento completo de defensas contra la inyección, ver [ataques de inyección de prompt que apuntan a respuestas de herramientas en el bucle agéntico](/learn/ai-agent-prompt-injection).

## La Perspectiva de OpenLegion: Defensa en Profundidad para el Control de Bucles

El control de bucles es una propiedad de seguridad, no solo operativa. Los tres números concretos que definen el problema:

**23% de los fallos de agentes rastreados a bucles infinitos de llamadas a herramientas** (LangChain 2025). La solución no es un límite max_turns más alto. Son condiciones de terminación medibles, verificaciones de progreso explícitas y lógica de disyuntor.

**OpenAI Agents SDK max_turns predeterminado = 10; LangGraph recursion_limit = 25.** Estos son valores predeterminados de punto de partida, no valores de producción. Configure límites de terminación para la distribución de tareas.

**CVE-2024-5184 es una vulnerabilidad de control de bucle, no solo una vulnerabilidad de seguridad.** La superficie de ataque es cada llamada a herramienta externa.

| **Mecanismo de control de bucle** | **OpenLegion** | **LangChain AgentExecutor** | **LangGraph** | **OpenAI Agents SDK** |
|---|---|---|---|---|
| **Límite de iteración** | max_turns en INSTRUCTIONS.md, aplicado en mesh | max_iterations=15 (predeterminado) | recursion_limit=25 | max_turns=10 (predeterminado) |
| **Terminación basada en presupuesto** | daily_budget + monthly_budget por agente, aplicado en capa mesh | No integrado | No integrado | No integrado |
| **Terminación de error** | Error estructurado devuelto al orquestador | Lanza AgentExecutorError | Lanza GraphRecursionError | Lanza MaxTurnsExceeded |
| **Defensa contra inyección** | Llamadas a herramientas proxificadas por vault; autoridad del prompt del sistema | handle_parsing_errors configurable | No integrado | No integrado |
| **Pista de auditoría de bucle** | Cada iteración registrada con agent_id, modelo, llamada a herramienta, costo | LangSmith (opcional) | LangSmith (opcional) | Panel de OpenAI |

Para los patrones que componen múltiples bucles de agentes en sistemas de producción, ver [cómo los flujos de trabajo agénticos componen múltiples bucles en pipelines de producción](/learn/agentic-workflows) y [patrones de diseño de IA agéntica para orquestación de bucles y coordinación de agentes](/learn/agentic-ai-design-patterns).

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es un bucle agéntico?

Un bucle agéntico es el ciclo repetitivo percibir-pensar-actuar que cada agente de IA ejecuta para realizar una tarea. En cada iteración, el agente lee su contexto actual, llama a un modelo de lenguaje para decidir la siguiente acción, ejecuta esa acción y luego repite hasta que se cumpla una condición de terminación: finalización natural, un límite de iteración estricto (max_turns), agotamiento del presupuesto o un error irrecuperable.

### ¿Cuántas iteraciones ejecuta un bucle agéntico?

Las tareas simples típicamente se completan en 2–5 iteraciones. Las tareas complejas ejecutan 10–30 iteraciones o más. Establezca max_turns basado en el recuento de iteraciones P95 empírico para su agente específico en su distribución de tareas específica, medido desde tráfico de producción o staging, y añada un margen del 20% por encima.

### ¿Qué causa un bucle agéntico infinito?

Las tres causas principales de bucle infinito son: tormentas de llamadas a herramientas, envenenamiento de contexto e inyección de prompt via contenido de respuesta de herramienta (CVE-2024-5184). El informe 2025 de LangChain encontró que el 23% de los fallos de agentes fueron causados por bucles infinitos de llamadas a herramientas.

### ¿Qué es el patrón ReAct en bucles agénticos?

ReAct (Reasoning + Acting) es el modelo canónico de bucle agéntico introducido por Yao et al. en 2022 (arXiv:2210.03629). El patrón estructura cada iteración de bucle como una salida LLM de tres partes: un Pensamiento, una Acción y una Observación. El paper ReAct demostró que intercalar el razonamiento explícito con las acciones mejora la precisión de las tareas del agente, evaluado en HotpotQA, FEVER y ALFWorld.

### ¿Cómo afecta la inyección de prompt al bucle agéntico?

La inyección de prompt via contenido de respuesta de herramienta — demostrada por CVE-2024-5184 (Synopsys CyRC, junio 2024) — explota la fase de percepción del bucle agéntico. Cuando una herramienta recupera contenido externo, ese contenido entra en el historial de conversación como resultado de herramienta. Si el contenido contiene instrucciones inyectadas, el LLM puede procesar esas instrucciones en el siguiente paso de pensar. La defensa requiere una jerarquía de instrucciones explícita que aplique la autoridad del prompt del sistema sobre el contenido de resultados de herramientas.

### ¿Cómo previene OpenLegion los bucles agénticos descontrolados?

OpenLegion aplica defensa en profundidad con dos capas de aplicación. Los límites de iteración por agente configurados en INSTRUCTIONS.md se aplican en la capa de aplicación. Los daily_budget y monthly_budget por agente se aplican en la capa del enrutador mesh antes de cada llamada LLM. Cuando una iteración de bucle excedería el presupuesto restante, la solicitud se rechaza en la capa de red. Una inyección de prompt que instruye al agente a ignorar límites de presupuesto no puede anular la verificación de presupuesto del enrutador mesh.

### ¿Cuál es la diferencia entre un bucle agéntico y un flujo de trabajo?

Un bucle agéntico es el ciclo de iteración por agente — el ciclo de ejecución percibir-pensar-actuar repetitivo de un solo agente. Un flujo de trabajo (o flujo de trabajo agéntico) es un pipeline multi-agente donde múltiples agentes, cada uno ejecutando sus propios bucles, se componen en un sistema más grande con lógica de transferencia explícita, orquestación y flujo de datos entre agentes.

## Comenzar con OpenLegion

El bucle agéntico es donde se gana o pierde la fiabilidad del agente. Los valores predeterminados del framework — max_turns=10, recursion_limit=25 — son puntos de partida, no configuraciones de producción.

OpenLegion aplica límites de presupuesto y límites de iteración en la capa mesh — fuera de banda del razonamiento LLM del agente, no anulable por inyección de prompt.

[Comenzar a construir en OpenLegion](https://app.openlegion.ai) — límites de bucle estrictos y aplicación de presupuesto por agente integrados.

Para los patrones que componen múltiples bucles de agentes en sistemas de producción, ver [cómo los flujos de trabajo agénticos componen múltiples bucles en pipelines de producción](/learn/agentic-workflows).
