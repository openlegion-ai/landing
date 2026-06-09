---
title: Flujo de trabajo agentivo - Patrones, seguridad y diseño en producción
description: Un flujo de trabajo agentivo es un proceso de IA de múltiples pasos donde los agentes eligen herramientas de forma autónoma, delegan subtareas y se adaptan según los resultados intermedios. Patrones clave, modos de fallo y diseño seguro.
slug: /learn/agentic-workflows
primary_keyword: flujo de trabajo agentivo
secondary_keywords:
  - patrones flujo trabajo agentivo
  - seguridad flujo trabajo agentivo
  - react loop agente ia
  - plan and execute ia
  - diseño flujo trabajo agente ia
date_published: "2026-05"
last_updated: "2026-05-27"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /comparison/langgraph
  - /comparison/crewai
---

# Flujo de trabajo agentivo: Patrones, seguridad y diseño en producción

Un flujo de trabajo agentivo es un proceso de IA de múltiples pasos en el que uno o más agentes deciden de forma autónoma qué herramientas llamar, cuándo delegar subtareas a otros agentes y cómo adaptar su enfoque según los resultados intermedios. A diferencia de un pipeline fijo donde cada paso está codificado y se ejecuta exactamente una vez, un flujo de trabajo agentivo es dinámico: el agente lee su entorno, razona sobre el estado y elige la siguiente acción. Esa autonomía es la función. También es la superficie de ataque.

OpenLegion es una plataforma de agentes de IA orientada a la seguridad que trata el diseño de flujos de trabajo agentivos como una disciplina de ingeniería: cada paso se ejecuta en un contenedor aislado, las credenciales nunca están presentes en el proceso del agente, y cada bucle de iteración tiene una condición de parada estricta aplicada a nivel de infraestructura.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es un flujo de trabajo agentivo?**
> Un flujo de trabajo agentivo es un proceso de IA de múltiples pasos en el que agentes autónomos seleccionan herramientas, delegan subtareas y actualizan su plan de ejecución basándose en resultados intermedios, en contraste con los pipelines estáticos donde cada paso está fijado en el momento del diseño.

## TL;DR

- **Cuatro patrones fundamentales**: bucle ReAct, plan-y-ejecución, bucle de reflexión, fan-out paralelo. Cada uno tiene modos de fallo distintos.
- **ReAct** (Reason + Act, Yao et al. 2023) es el patrón más ampliamente implementado, usado en LangGraph, OpenAI Agents SDK, AutoGen y OpenLegion.
- **Vector de ataque principal**: inyección de prompt a través de resultados de herramientas (OWASP LLM Top 10 2025, LLM02). Una página web o documento malicioso puede secuestrar la siguiente acción del agente.
- **Los bucles descontrolados no son casos extremos**: un bucle de reflexión o ReAct sin condición de parada estricta funcionará hasta que se agote su presupuesto.
- **Medidas OpenLegion**: presupuesto de pasos por agente (límite de iteración estricto), aislamiento por contenedor (un paso comprometido no puede acceder a credenciales de otros agentes), cero telemetría.
- **Presupuesto de pasos vs. presupuesto de tokens**: ambos importan. Los presupuestos de tokens limitan el gasto; los presupuestos de pasos limitan los bucles de razonamiento no acotados.

## Qué hace diferente a un flujo de trabajo agentivo de un pipeline

Un pipeline tradicional ejecuta una secuencia fija: paso 1, paso 2, paso 3. El desarrollador define cada transición en el momento del diseño. El sistema es determinista: la misma entrada produce el mismo camino de ejecución.

Un flujo de trabajo agentivo introduce un punto de decisión en cada paso. El agente lee el estado actual, elige una acción (llamar a una herramienta, delegar a otro agente, producir una respuesta final o volver a iterar) y actualiza el estado. El camino de ejecución lo determina en tiempo de ejecución el modelo, no el desarrollador.

Esta distinción tiene implicaciones directas en seguridad. En un pipeline fijo, el radio de impacto de un paso comprometido se limita a las salidas de ese paso. En un flujo de trabajo agentivo, un paso comprometido puede instruir al agente para que realice acciones adicionales: llamar a APIs externas, exfiltrar datos, generar salidas maliciosas que afecten pasos posteriores. La [guía de seguridad de agentes de IA](/learn/ai-agent-security) cubre el modelo de amenazas completo; esta página se centra en cómo la elección del patrón de flujo de trabajo afecta la superficie de ataque.

## Los cuatro patrones fundamentales de los flujos de trabajo agentivos

### Patrón 1: Bucle ReAct (Reason + Act)

**Qué es.** Introducido por Yao et al. (2023), ReAct entrelaza trazas de razonamiento con llamadas de acción en un único bucle. En cada paso, el modelo produce un Pensamiento (razonamiento sobre el estado actual), una Acción (llamada a herramienta o delegación) y una Observación (el resultado de la herramienta). El bucle continúa hasta que el modelo produce una respuesta final.

**Dónde se usa.** ReAct es el bucle por defecto en LangGraph, OpenAI Agents SDK, chat de grupo AutoGen y OpenLegion. Es el patrón de flujo de trabajo agentivo más ampliamente desplegado.

**Modos de fallo:**
- **Bucle no acotado**: sin un límite de iteración estricto, un agente ReAct puede iterar indefinidamente.
- **Inyección de prompt a través de la observación**: el paso de Observación es la superficie de ataque principal. OWASP LLM02 (Inyección de prompt) es el principal riesgo para los flujos de trabajo basados en ReAct.
- **Inflación de la ventana de contexto**: las largas cadenas ReAct acumulan tripletes pensamiento/acción/observación en el contexto.

**Medida OpenLegion**: presupuesto de pasos por agente (número máximo de iteraciones aplicado por el orquestador) más aislamiento por contenedor.

### Patrón 2: Plan-y-ejecución

**Qué es.** Un agente Planificador produce una descomposición completa de tareas de antemano. Uno o más agentes Ejecutores llevan a cabo cada paso del plan, sin volver a planificar entre pasos.

**Ventajas sobre ReAct.** Separar la planificación de la ejecución reduce significativamente el costo en tokens: el razonamiento intensivo ocurre una sola vez en el Planificador. También hace que el camino de ejecución sea inspeccionable antes de ejecutarse.

**Modos de fallo:**
- **Deriva del plan**: si un Ejecutor encuentra un resultado inesperado a mitad del plan, puede continuar con el plan obsoleto.
- **Punto único de fallo del Planificador**: una inyección de prompt que corrompe la salida del Planificador afecta a cada paso de Ejecución subsiguiente.
- **Sin replanificación adaptativa**: el plan-y-ejecución puro no puede manejar tareas donde los resultados intermedios cambian materialmente lo que deben hacer los pasos siguientes.

**Medida OpenLegion**: el Planificador y los Ejecutores corren en contenedores separados. Radio de impacto limitado a la salida del contenedor del Planificador.

### Patrón 3: Bucle de reflexión

**Qué es.** Un agente (o un agente Crítico separado) evalúa su propia salida e itera hasta alcanzar un umbral de calidad. Común en generación de contenido, escritura de código y tareas de análisis.

**Modos de fallo:**
- **Iteración descontrolada sin condición de parada**: si el Crítico siempre puede encontrar algo que mejorar, el bucle funciona indefinidamente.
- **Errores autoreforzantes**: un modelo que malentiende la tarea generará críticas que refuerzan el malentendido.
- **Amplificación de costos**: un bucle de reflexión de 10 rondas cuesta 10 veces la generación base.

**Medida OpenLegion**: el presupuesto de pasos por agente impone un número máximo de reflexiones a nivel de infraestructura.

### Patrón 4: Fan-out paralelo

**Qué es.** Múltiples agentes ejecutan subtareas independientes simultáneamente. Un agente de Síntesis espera a que todas las ramas paralelas se completen y luego fusiona los resultados.

**Modos de fallo:**
- **Amplificación de costos**: N agentes paralelos cuestan N veces el equivalente en serie.
- **Envenenamiento de la síntesis**: una salida de rama maliciosa puede corromper el resultado fusionado.
- **Conflictos de concurrencia y estado compartido**: CVE-2025-64168 (Agno, CVSS 7.1) lo demostró: una condición de carrera en el estado de sesión compartido bajo concurrencia asíncrona exponía los datos de un usuario a otro.

**Medida OpenLegion**: cada agente paralelo corre en su propio contenedor Docker aislado. No hay estado mutable compartido entre ramas.

## Diseño de seguridad para flujos de trabajo agentivos

### Amenaza 1: Inyección de prompt a través de resultados de herramientas

Los resultados de herramientas son el principal vector de inyección en los flujos de trabajo agentivos. OWASP LLM02 (Inyección de prompt) es el principal riesgo para las aplicaciones LLM en el Top 10 de 2025. Para los flujos de trabajo agentivos, el riesgo se amplifica porque los agentes tienen acceso a herramientas, por lo que una instrucción inyectada puede causar acciones en el mundo real.

OpenLegion aplica saneamiento Unicode en la ingestión de resultados de herramientas (56 puntos de control para overrides bidi, caracteres de etiqueta y caracteres de ancho cero) más aislamiento por contenedor para acotar el radio de impacto de cualquier inyección exitosa.

### Amenaza 2: Amplificación de llamadas a herramientas

Un agente que llama a una herramienta costosa en un bucle ReAct sin presupuesto de pasos puede realizar cientos de llamadas a herramientas antes de que el desarrollador lo note. Los incidentes del mundo real incluyen agentes que corrieron durante la noche generando miles de llamadas a APIs de terceros, desencadenando facturas inesperadas y suspensiones por límite de tasa.

OpenLegion aplica ambos: presupuesto de tokens por agente (techo de gasto) y presupuesto de pasos por agente (techo de iteraciones). Cualquier límite detiene al agente cuando se alcanza.

### Amenaza 3: Exposición de credenciales durante la delegación

En frameworks donde los agentes comparten un proceso Python, el Agente B tiene acceso por defecto a las variables de entorno del Agente A. Un paso de delegación comprometido puede exponer todas las credenciales disponibles para el flujo de trabajo.

OpenLegion usa inyección de credenciales por proxy vault a través del Mesh Host. El contenedor del Agente B recibe solo las credenciales explícitamente asignadas en la matriz ACL del fleet, no las credenciales del Agente A.

### Amenaza 4: Recursión no acotada y auto-spawning

Un flujo de trabajo agentivo que permite a los agentes crear sub-agentes sin límite puede ser manipulado hacia una recursión exponencial. OpenLegion lo limita: el permiso `can_spawn` requiere autorización explícita del administrador, la profundidad de sub-agentes está acotada por la configuración del mesh, y las plantillas de fleet definen un número máximo de agentes.

## Presupuesto de pasos vs. presupuesto de tokens: por qué necesita ambos

Los presupuestos de tokens limitan el gasto total por agente por día. Son necesarios pero no suficientes. Un presupuesto de tokens no evita que un bucle ReAct ejecute 500 iteraciones usando herramientas baratas. Un presupuesto de pasos limita el número de iteraciones de razonamiento o llamadas a herramientas, independientemente del costo en tokens.

OpenLegion implementa ambos: presupuesto de tokens aplicado por el Cost Tracker en la Zona 2, y presupuesto de pasos aplicado por el orquestador a nivel de infraestructura.

## Diseñar flujos de trabajo agentivos para producción

### Elegir el patrón correcto para la tarea

| Tipo de tarea | Patrón recomendado | Por qué |
|---|---|---|
| **Investigación abierta** | Bucle ReAct con presupuesto de pasos | Necesita selección adaptativa de herramientas; acotar el bucle |
| **Tarea estructurada de múltiples pasos** | Plan-y-ejecución | Plan inspeccionable; reduce costo en tokens |
| **Generación sensible a la calidad** | Bucle de reflexión con límite de pasos | Autocorrección; parada estricta previene bucles descontrolados |
| **Recopilación de datos en paralelo** | Fan-out + síntesis | Subtareas independientes; aislamiento por agente |
| **Procesamiento de documentos largos** | Fan-out + fusión secuencial | Paraleliza el procesamiento por fragmentos |

### Definir condiciones de parada antes del despliegue

Cada bucle en un flujo de trabajo agentivo necesita una condición de parada explícita aplicada a nivel de infraestructura. Si el modelo decide cuándo parar, una inyección de prompt puede evitar que se detenga.

### Validar salidas en los límites de pasos

Cada límite de paso es una oportunidad para validar que la salida coincide con el esquema esperado antes de pasarla al siguiente paso. La coordinación fleet-modelo de OpenLegion aplica validadores de salida en cada punto de transferencia. Ver la [guía de orquestación de agentes de IA](/learn/ai-agent-orchestration) para detalles de implementación.

### Limitar permisos al mínimo necesario

Cada agente debería tener solo las herramientas y permisos que necesita para su paso específico. Los agentes con exceso de permisos amplían el radio de impacto de cualquier compromiso. La matriz ACL por agente en la configuración fleet de OpenLegion impone permisos mínimos a nivel del orquestador.

## Frameworks de flujos de trabajo agentivos: comparación de soporte de patrones

| Framework | ReAct | Plan-y-ejecución | Reflexión | Fan-Out | Presupuesto pasos | Aislamiento contenedor |
|---|---|---|---|---|---|---|
| **OpenLegion** | Sí | Sí | Sí | Sí | Sí (estricto) | Sí (obligatorio) |
| **LangGraph** | Sí | Sí | Sí | Sí | No integrado | No |
| **CrewAI** | Sí (Flows) | Sí (Crews) | Limitado | Sí (parallel) | No | No (solo CodeInterpreter) |
| **OpenAI Agents SDK** | Sí | Limitado | Limitado | Sí (handoffs) | No | No |
| **AutoGen** | Sí | Sí | Sí | Sí (group chat) | No | Docker solo para código |

Para una comparación detallada de seguridad y arquitectura de estos frameworks, ver la [comparación de frameworks de agentes de IA](/learn/ai-agent-frameworks).

## La perspectiva de OpenLegion

Los flujos de trabajo agentivos son donde la deuda de seguridad de la mayoría de los frameworks se vuelve visible en producción. Los bucles ReAct sin presupuestos de pasos han generado facturas de API sorpresa de cinco y seis cifras. CVE-2025-64168 (Agno, CVSS 7.1, octubre 2025) demostró que los flujos de trabajo agentivos concurrentes que comparten un proceso Python pueden exponer el estado de sesión de un usuario a otro bajo alta carga asíncrona. OWASP LLM02 (Inyección de prompt, Top 10 2025) identifica la inyección a través de resultados de herramientas como el principal vector de ataque contra los flujos de trabajo agentivos basados en ReAct.

OpenLegion aborda tres propiedades arquitectónicamente: presupuestos de pasos estrictos (número máximo de iteraciones aplicado por el orquestador), aislamiento por contenedor por agente (no hay estado mutable compartido entre ramas paralelas) e inyección de credenciales por proxy vault (las transferencias de delegación se enrutan a través de la Zona 2). Estas no son opciones de configuración: son la arquitectura por defecto.

La compensación: OpenLegion tiene aproximadamente 59 estrellas de GitHub frente a LangGraph con aproximadamente 25.200 y CrewAI con aproximadamente 44.600. Para una comparación de cómo se implementan estos patrones en los frameworks, ver la [comparación de frameworks de agentes de IA](/learn/ai-agent-frameworks).

## CTA

**Construya flujos de trabajo agentivos con condiciones de parada estrictas, no esperadas.**
[Comenzar](https://app.openlegion.ai) | [Documentación](https://docs.openlegion.ai) | [Aprender: Orquestación de agentes de IA](/learn/ai-agent-orchestration)

---

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué es un flujo de trabajo agentivo?

Un flujo de trabajo agentivo es un proceso de IA de múltiples pasos donde uno o más agentes seleccionan herramientas de forma autónoma, delegan subtareas a otros agentes y adaptan su plan de ejecución basándose en resultados intermedios. A diferencia de los pipelines estáticos con pasos fijos, el camino de ejecución de un flujo de trabajo agentivo lo determina en tiempo de ejecución el razonamiento del modelo. Los cuatro patrones fundamentales son el bucle ReAct, el plan-y-ejecución, el bucle de reflexión y el fan-out paralelo, cada uno con modos de fallo e implicaciones de seguridad distintos.

### ¿Qué es el patrón ReAct en los flujos de trabajo agentivos?

ReAct (Reason + Act) fue introducido por Yao et al. en 2023 y entrelaza trazas de razonamiento con llamadas a herramientas en un único bucle. En cada paso, el modelo produce un Pensamiento (razonamiento), una Acción (llamada a herramienta) y una Observación (resultado de la herramienta). ReAct es el patrón de flujo de trabajo agentivo por defecto en LangGraph, OpenAI Agents SDK, AutoGen y OpenLegion. Sus principales modos de fallo son la iteración no acotada y la inyección de prompt a través de resultados de herramientas.

### ¿Cómo prevenir bucles descontrolados en los flujos de trabajo agentivos?

La única forma fiable de prevenir bucles descontrolados es aplicar una condición de parada a nivel de infraestructura, sin depender de que el modelo se detenga por sí mismo. Se requieren dos controles: un presupuesto de pasos (número máximo de iteraciones o llamadas a herramientas, aplicado por el orquestador) y un presupuesto de tokens (gasto máximo, aplicado por el cost tracker). Los presupuestos de tokens solos no detienen los bucles de alta frecuencia con herramientas baratas. Los presupuestos de pasos solos no limitan los costos altos de LLM por iteración. OpenLegion aplica ambos por agente como límites estrictos.

### ¿Qué es el plan-y-ejecución en los flujos de trabajo agentivos?

El plan-y-ejecución divide un flujo de trabajo agentivo en dos fases: un agente Planificador produce una descomposición completa de tareas de antemano, y uno o más agentes Ejecutores llevan a cabo cada paso sin volver a planificar. Esto reduce el costo en tokens en comparación con ReAct (razonamiento intensivo una vez frente a cada paso) y hace que el camino de ejecución sea inspeccionable antes de ejecutarse. El principal modo de fallo es la deriva del plan: si un Ejecutor encuentra un resultado inesperado, puede continuar con un plan obsoleto en lugar de señalar la discrepancia.

### ¿Cuál es el principal riesgo de seguridad en los flujos de trabajo agentivos?

El principal vector de ataque es la inyección de prompt a través de resultados de herramientas (OWASP LLM02, Top 10 2025). Cuando un agente lee una página web, archivo, registro de base de datos o respuesta de API externa, ese contenido llega como entrada de confianza. Un documento malicioso puede contener instrucciones que redirigen al agente hacia acciones no intencionadas. Las medidas incluyen saneamiento Unicode en la ingestión de resultados de herramientas, validación de esquema de salida en los límites de pasos y aislamiento por contenedor para acotar el radio de impacto de cualquier inyección exitosa.

### ¿Cómo funciona el fan-out paralelo en los flujos de trabajo agentivos?

El fan-out paralelo hace que múltiples agentes trabajen simultáneamente en subtareas independientes y luego fusiona los resultados en un paso de Síntesis. Reduce el tiempo de reloj para tareas que se descomponen en flujos de trabajo independientes. Los modos de fallo son la amplificación de costos (N agentes cuestan N veces más), el envenenamiento de la síntesis (una salida de rama maliciosa corrompiendo el resultado fusionado) y los conflictos de estado compartido en frameworks donde los agentes concurrentes comparten estado de proceso mutable. OpenLegion hace correr cada agente paralelo en un contenedor Docker aislado con su propio estado, previniendo conflictos de estado compartido y acotando cada rama de forma independiente.

### ¿Qué es la deriva del plan en los flujos de trabajo agentivos?

La deriva del plan ocurre en los flujos de trabajo plan-y-ejecución cuando los agentes Ejecutores encuentran resultados intermedios inesperados pero continúan ejecutando el plan original en lugar de señalar la discrepancia. Las medidas incluyen puntos de control explícitos de validación del plan, puertas de aprobación humana en los pasos críticos del plan y protocolos de transferencia estructurados que muestran las discrepancias antes de continuar. La coordinación fleet-modelo de OpenLegion soporta puntos de control con intervención humana a través de integraciones de canales en cualquier punto de transferencia.

### ¿En qué se diferencia el diseño de flujo de trabajo agentivo de la orquestación de agentes de IA?

El diseño de flujo de trabajo agentivo se centra en la anatomía a nivel de paso: qué patrón (ReAct, plan-y-ejecución, reflexión, fan-out), qué condiciones de parada, cómo se validan los resultados de herramientas y cómo se delimitan las credenciales en cada paso. La orquestación de agentes de IA se centra en la coordinación a nivel de fleet: cómo se secuencian múltiples flujos de trabajo, cómo los agentes se transfieren trabajo entre sí, cómo se gestiona el estado compartido en un sistema multiagente. La [guía de orquestación de agentes de IA](/learn/ai-agent-orchestration) cubre las primitivas de coordinación a nivel de fleet que operan sobre los patrones de flujo de trabajo descritos aquí.
