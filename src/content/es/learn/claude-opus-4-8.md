---
title: Claude Opus 4.8 - Capacidades, costo y rendimiento agéntico
description: "Claude Opus 4.8 lanzado el 28 de mayo de 2026: 84% en Online-Mind2Web, modo rápido 3x más barato, flujos de trabajo dinámicos en Claude Code, primer Opus en completar cada caso del benchmark Super-Agent con paridad de costo con GPT-5.5."
slug: /learn/claude-opus-4-8
primary_keyword: claude opus 4.8
secondary_keywords:
  - claude opus 4.8 api
  - claude opus 4.8 benchmarks
  - claude opus 4.8 vs gpt-5.5
  - claude opus 4.8 fast mode
  - claude opus 4.7 vs opus 4.8
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /learn/ai-agent-orchestration
  - /comparison/langgraph
  - /comparison/autogen
---

# Claude Opus 4.8: Rendimiento agéntico, precios del modo rápido y qué cambió desde Opus 4.7

Claude Opus 4.8 es la actualización de Anthropic de la clase Opus del 28 de mayo de 2026. Obtiene 84% en la precisión del agente de navegador Online-Mind2Web, es el primer modelo en completar cada caso de un benchmark Super-Agent con paridad de costo con GPT-5.5, y corrige la regresión de verbosidad de llamadas a herramientas de Opus 4.7. El modo rápido funciona a 2,5x de velocidad y tiene un precio 3x más barato que el modo rápido para modelos Opus anteriores. Los precios estándar de la API no han cambiado con respecto a 4.7. El identificador del modelo de API es `claude-opus-4-8-20260528`.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es Claude Opus 4.8?**
> Claude Opus 4.8 es la actualización de Anthropic de la clase de modelos Opus de mayo de 2026, un modelo de lenguaje grande de nivel frontier optimizado para tareas agénticas de larga duración, razonamiento de múltiples pasos y uso autónomo de herramientas, con un rendimiento mejorado en benchmarks sobre Opus 4.7, correcciones a regresiones de fiabilidad de llamadas a herramientas y un modo rápido (pensamiento extendido a 2,5x la velocidad) con un precio 3x más barato que el modo rápido para modelos Opus anteriores.

## La opinión de OpenLegion: El modelo que cambia la economía agéntica

Opus 4.8 es el modelo que recomendamos para cualquier agente que realice trabajo agéntico sustancial a partir de mayo de 2026. Tres cosas cambiaron desde Opus 4.7 que importan para las flotas de agentes en producción.

Primero: la corrección de fiabilidad de las llamadas a herramientas. Scott Wu (CEO de Cognition / Devin) confirmó públicamente que Opus 4.7 introdujo inconsistencias de verbosidad de comentarios y llamadas a herramientas que degradaron la fiabilidad de ingeniería autónoma de Devin. Opus 4.8 corrige ambas. Para agentes en bucles de uso de herramientas ajustados, esta es la diferencia entre un modelo que requiere correcciones frecuentes y uno que completa tareas de manera limpia.

Segundo: 84% en Online-Mind2Web (superando a GPT-5.5) y el primer barrido completo del benchmark Super-Agent con paridad de costo con GPT-5.5. Online-Mind2Web mide la finalización real de tareas basadas en navegador. El benchmark Super-Agent cubría traducción, investigación profunda, construcción de diapositivas y análisis de principio a fin. Opus 4.8 completó cada caso; GPT-5.5 no lo hizo.

Tercero: modo rápido a 3x menor costo. Databricks informó de un costo de token 61% más barato frente a Opus 4.7 en su agente Genie. Para tareas de larga duración donde antes elegía Sonnet por costo y aceptaba menor calidad, el modo rápido de Opus 4.8 cambia el cálculo.

El anuncio de Anthropic llegó el mismo día que su ronda Serie H de 65.000 millones USD con una valoración post-money de 965.000 millones USD.

OpenLegion soporta el catálogo completo de modelos de la API de Anthropic. Establecer `claude-opus-4-8-20260528` como valor predeterminado de su flota es un solo cambio de configuración. Las llamadas API aisladas por bóveda, los límites de presupuesto por agente y la ejecución aislada en contenedores se aplican automáticamente, [lo que proporciona una plataforma de agentes de IA para ejecutar Opus 4.8 con controles de presupuesto y aislamiento de bóveda](/learn/ai-agent-platform).

## Rendimiento en benchmarks: Lo que muestran los números

### Online-Mind2Web: 84% de precisión del agente de navegador

Online-Mind2Web es un benchmark para la finalización de tareas agénticas basadas en navegador: rellenar formularios, navegar por flujos de múltiples páginas, extraer información de interfaces web en vivo. Claude Opus 4.8 obtuvo 84% en Online-Mind2Web en mayo de 2026, superando tanto a Claude Opus 4.7 como a GPT-5.5. Esta es la puntuación más alta publicada en ese benchmark en la fecha de lanzamiento de Opus 4.8. Para desarrolladores que despliegan agentes de automatización de navegador, este es el número operativo.

### Benchmark Super-Agent: Primer barrido completo con paridad de costo con GPT-5.5

Kay Zhu, co-fundador y CTO, informó que Claude Opus 4.8 es el primer modelo en completar cada caso de principio a fin en su benchmark Super-Agent interno cubriendo: traducción a escala, síntesis de investigación profunda, construcción de presentaciones a partir de datos sin procesar y análisis de múltiples fuentes. GPT-5.5 no completó cada caso. Opus 4.8 logró esto con paridad de costo con GPT-5.5.

### CursorBench: Llamadas a herramientas más eficientes en cada nivel de esfuerzo

El benchmark de codificación interno de Cursor mide la calidad de generación de código y la eficiencia de uso de herramientas. Claude Opus 4.8 supera a los modelos Opus anteriores en cada nivel de esfuerzo en CursorBench: menos tokens desperdiciados en comentarios verbosos significa que más del presupuesto de tokens se destina al trabajo real.

### Legal Agent Benchmark: Primero en superar el estándar all-pass del 10%

Leya (una plataforma de IA jurídica), informado por Niko Grupen (Jefe de Investigación Aplicada), confirmó que Claude Opus 4.8 es el primer modelo en superar el 10% en el estándar all-pass del Legal Agent Benchmark. El estándar all-pass requiere que cada paso en un flujo de trabajo jurídico de múltiples pasos sea correcto: un solo error hace que falle el caso completo.

### Databricks Genie: 61% más barato que Opus 4.7

Databricks informó que Claude Opus 4.8 ofrece un costo de token 61% más barato en comparación con Opus 4.7 para su agente Genie, un agente de IA para análisis de datos y trabajo de conocimiento que utiliza razonamiento multimodal sobre PDFs y diagramas.

## Qué cambió desde Opus 4.7

### Corrección de llamadas a herramientas: La regresión de verbosidad que afectó a Devin y las cargas de trabajo autónomas

Claude Opus 4.7 introdujo una regresión en el comportamiento de las llamadas a herramientas que varios equipos de producción notaron de forma independiente: los agentes producían comentarios en línea excesivos, envolvían las salidas con prosa explicativa innecesaria y ocasionalmente realizaban llamadas a herramientas duplicadas o redundantes.

Scott Wu (CEO de Cognition / Devin) confirmó públicamente que Opus 4.7 tenía "problemas de verbosidad de comentarios y llamadas a herramientas" que Opus 4.8 corrige. Los equipos que habían revertido de Opus 4.7 a Opus 4.6 por la fiabilidad del uso de herramientas deberían reevaluar con Opus 4.8.

### Flujos de trabajo dinámicos en Claude Code

Claude Code obtiene flujos de trabajo dinámicos con Opus 4.8: la capacidad de abordar problemas a gran escala creando, secuenciando y gestionando estructuras de flujo de trabajo de múltiples pasos. Claude Code puede planificar una migración de base de código grande, crear subtareas, ejecutarlas en secuencia mientras rastrea el estado intermedio y adaptar su plan según los resultados en cada paso. Disponible en Claude Code usando Opus 4.8 a partir del 28 de mayo de 2026.

### Modo rápido: 2,5x de velocidad a 3x menor costo

El modo rápido para Claude Opus 4.8 funciona a 2,5x la velocidad del Opus estándar utilizando pensamiento extendido, y tiene un precio 3x más barato que el modo rápido para los modelos Opus anteriores incluido Opus 4.7. Los precios estándar (sin modo rápido) no han cambiado con respecto a Opus 4.7.

El modo rápido se activa a través del parámetro `budget_tokens` en la configuración de pensamiento extendido de la API. Establecer `budget_tokens` en un valor más bajo activa el comportamiento del modo rápido.

## Referencia de la API y precios

### Identificador del modelo

El identificador del modelo de API para Claude Opus 4.8 es `claude-opus-4-8-20260528`. Use esta cadena en el parámetro `model` de cualquier llamada a la API de Anthropic, en el campo de ID de modelo de Amazon Bedrock o en la referencia de modelo de Google Cloud Vertex AI.

### Disponibilidad

Claude Opus 4.8 está disponible a través de tres canales: la API de Anthropic directamente (api.anthropic.com), Amazon Bedrock y Google Cloud Vertex AI. Los tres canales soportan el mismo conjunto de características incluyendo pensamiento extendido y modo rápido.

### Ventana de contexto

Claude Opus 4.8 usa la misma ventana de contexto que Opus 4.7 (200K tokens) y los mismos precios estándar de tokens de entrada/salida. Las mejoras de costo se concentran en el modo rápido.

## Cuándo usar Opus 4.8 vs Sonnet 4 vs Opus 4.7

### Opus 4.8: Tareas agénticas de larga duración, automatización de navegador, codificación a gran escala

Elija Opus 4.8 cuando la calidad de la tarea sea la restricción. Los agentes autónomos de larga duración en bucles de uso de herramientas ajustados se benefician de la corrección de fiabilidad de las llamadas a herramientas. Los agentes de automatización de navegador (Online-Mind2Web: 84%) superan a cualquier otro modelo en este tipo de tarea. El análisis legal y financiero que requiere encadenamiento sin errores es el dominio de Opus 4.8.

Para [frameworks de agentes de IA que acceden a Claude Opus 4.8 a través de la API de Anthropic](/learn/ai-agent-frameworks), el camino de migración es un intercambio de identificador de modelo a `claude-opus-4-8-20260528`.

### Sonnet 4: Pipelines de alto volumen y sensibles a la latencia

Elija Sonnet 4 cuando el volumen y la latencia sean la restricción. Llamadas a la API de alta frecuencia donde el costo por token determina la economía unitaria, pipelines de respuesta en tiempo real donde la latencia es visible para los usuarios finales. Sonnet 4 y el modo rápido de Opus 4.8 ahora ocupan niveles de costo/calidad adyacentes: los equipos deben comparar ambos para su carga de trabajo específica.

### Cuándo Opus 4.7 sigue aplicando

El único caso para quedarse en Opus 4.7: prompts ajustados específicamente a sus patrones de verbosidad. Si su pipeline postprocesa la salida de Opus y se basa en la estructura de comentarios que generó Opus 4.7, quédese en 4.7 hasta que tenga tiempo para adaptarse. Pruebe con Opus 4.8 antes de migrar los prompts de producción.

Para el [diseño de flujos de trabajo agénticos y cómo las mejoras de juicio de Opus 4.8 cambian la fiabilidad de ejecución](/learn/ai-agent-orchestration), la corrección de llamadas a herramientas es el cambio más impactante para flujos de trabajo con cinco o más llamadas a herramientas por tarea.

## OpenLegion y Claude Opus 4.8

OpenLegion soporta `claude-opus-4-8-20260528` como opción de modelo de flota. Establecerlo como predeterminado para un agente es un solo campo en la configuración del agente:

```
model: anthropic/claude-opus-4-8-20260528
```

Todos los controles de seguridad de OpenLegion se aplican automáticamente a las llamadas de Opus 4.8: inyección de credenciales a través del proxy de bóveda (la clave API nunca entra en el contenedor del agente), límites de presupuesto diarios y mensuales por agente (un bucle incontrolado de Opus 4.8 no puede agotar su cuota de API sin alcanzar el límite), aislamiento de contenedores Docker y registro de auditoría completo.

Para comparaciones de múltiples agentes, vea [OpenLegion vs LangGraph al desplegar Opus 4.8 en arquitectura de flota basada en grafos vs plana](/comparison/langgraph) y [OpenLegion vs AutoGen con Opus 4.8 en sistemas multi-agente de proceso compartido vs contenedor aislado](/comparison/autogen).

## Comenzar con Claude Opus 4.8 en OpenLegion

**Establezca `claude-opus-4-8-20260528` como predeterminado de su flota. Aislado por bóveda, con límite de presupuesto, listo para producción.**
[Comenzar a construir](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai) | [Ver la plataforma](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué es Claude Opus 4.8?

Claude Opus 4.8 es la actualización de Anthropic de la clase de modelos Opus, anunciada el 28 de mayo de 2026. Se basa en Claude Opus 4.7 con mejor juicio agéntico, mayor rendimiento en benchmarks de codificación, razonamiento y trabajo de conocimiento profesional, y correcciones a problemas de verbosidad de llamadas a herramientas que afectaban las cargas de trabajo autónomas de Opus 4.7. Introduce flujos de trabajo dinámicos en Claude Code para problemas de múltiples pasos a gran escala y modo rápido a 2,5x la velocidad ahora 3x más barato que el modo rápido para modelos Opus anteriores.

### ¿Cómo se compara Claude Opus 4.8 con GPT-5.5?

En benchmarks relevantes para tareas agénticas, Claude Opus 4.8 supera o iguala a GPT-5.5 en múltiples evaluaciones independientes. En Online-Mind2Web, Opus 4.8 obtuvo 84%, superando a GPT-5.5. En un benchmark Super-Agent interno, Opus 4.8 fue el primer modelo en completar cada caso de principio a fin, superando a GPT-5.5 con paridad de costo. En el Legal Agent Benchmark, Opus 4.8 es el primero en superar el 10% en el estándar all-pass.

### ¿Cuánto más barato es el modo rápido de Claude Opus 4.8 comparado con Opus 4.7?

El modo rápido para Claude Opus 4.8 funciona a 2,5x la velocidad normal usando pensamiento extendido y tiene un precio 3x más barato que el modo rápido para los modelos Opus anteriores incluido Opus 4.7. Los precios estándar de Opus 4.8 (sin modo rápido) no han cambiado con respecto a Opus 4.7. Databricks informó de un costo de token 61% más barato frente a Opus 4.7 para su agente Genie.

### ¿Cuáles eran los problemas de llamadas a herramientas de Opus 4.7 que corrige Opus 4.8?

Claude Opus 4.7 introdujo inconsistencias de verbosidad de comentarios y llamadas a herramientas que redujeron la fiabilidad para cargas de trabajo de ingeniería autónoma. Cognition (fabricantes del agente de codificación autónoma Devin) informó a través del CEO Scott Wu que Opus 4.7 era menos consistente que Opus 4.6, y que Opus 4.8 corrige tanto la regresión de verbosidad de comentarios como las inconsistencias de llamadas a herramientas. Los equipos que usan Opus 4.7 en bucles de uso de herramientas ajustados que observaron salidas más ruidosas o más pasos de corrección de lo esperado deberían probar Opus 4.8 como reemplazo directo.

### ¿Cuál es el identificador de modelo de API de Claude Opus 4.8?

El identificador del modelo de API para Claude Opus 4.8 es `claude-opus-4-8-20260528`. Está disponible a través de la API de Anthropic directamente, Amazon Bedrock y Google Cloud Vertex AI. El modo rápido (pensamiento extendido a 2,5x la velocidad) se activa a través del parámetro `budget_tokens` en la configuración de pensamiento extendido. Los precios estándar son idénticos a Opus 4.7; los precios del modo rápido son 3x más bajos que los del modo rápido para modelos Opus anteriores.

### ¿Qué son los flujos de trabajo dinámicos en Claude Code con Opus 4.8?

Los flujos de trabajo dinámicos es una característica de Claude Code lanzada junto con Opus 4.8 que permite abordar problemas a gran escala creando, secuenciando y gestionando dinámicamente estructuras de flujo de trabajo de múltiples pasos. Claude Code puede planificar una refactorización o migración grande, crear subtareas, ejecutarlas en secuencia mientras rastrea el estado y adaptarse en función de los resultados intermedios. Esto hace que Claude Code sea viable para grandes migraciones de base de código, builds de características completas que abarcan múltiples archivos y servicios, y cambios de múltiples repositorios.
