---
title: "Agentes IA autónomos: espectro de autonomía, puertas de seguridad, riesgos en producción"
description: "Agentes IA autónomos: espectro L0-L4, puertas de seguridad por nivel, Anthropic RSP, Ley IA UE, OWASP LLM06 y patrones de despliegue seguros L2-L3."
slug: /learn/autonomous-ai-agents
primary_keyword: agentes IA autónomos
last_updated: "2026-06-23"
schema_types: ["FAQPage"]
related:
  - /learn/what-is-an-ai-agent
  - /learn/ai-agent-governance
  - /learn/ai-agent-security
  - /learn/human-in-the-loop-ai-agents
  - /learn/agentic-workflows
  - /learn/managed-ai-agent-hosting
---

# Agentes IA autónomos: el espectro de autonomía, puertas de seguridad y riesgos en producción

Los agentes IA autónomos son sistemas de software que perciben su entorno, forman objetivos, generan planes de varios pasos y ejecutan llamadas a herramientas sin requerir confirmación humana en cada paso, en un espectro desde L0 (ejecución de herramienta única con aprobación humana) hasta L4 (sistemas automodificantes que reescriben sus propios objetivos). La Ley de IA de la UE y la Política de Escalado Responsable de Anthropic tratan el nivel de autonomía como un criterio de despliegue. OpenAI Operator (enero 2025) fue el primer despliegue comercial L2; Anthropic Computer Use alcanzó el 14,9 % en OSWorld frente a una línea base humana del 72,36 %.

<!-- SCHEMA: DefinitionBlock -->

> **Los agentes IA autónomos** son sistemas de software que perciben su entorno, forman objetivos, generan planes de varios pasos, ejecutan llamadas a herramientas y adaptan su comportamiento según los resultados, sin requerir confirmación humana en cada paso, operando en un espectro de L0 (herramienta única con aprobación humana) a L4 (sistemas automodificantes que reescriben sus propios objetivos y código), donde cada nivel de autonomía requiere puertas de seguridad, mecanismos de supervisión y cumplimiento normativo correspondientemente más estrictos.

## Niveles de autonomía de un vistazo

| **Nivel** | **Nombre** | **Autonomía** | **Confirmación humana requerida** | **Desplegado comercialmente (2026)** |
|---|---|---|---|---|
| **L0** | Ejecución de herramienta | Herramienta única, entrada fija | Cada acción | ✅ Sí |
| **L1** | Agente reactivo | Activado por evento, alcance fijo | Solo definición de alcance | ✅ Sí |
| **L2** | Orientado a objetivos | Ejecución autónoma de varios pasos | Pre-ejecución + acciones irreversibles | ✅ Sí (Operator, OpenLegion) |
| **L3** | Autoplanificador | Genera y revisa sus propios planes | Solo objetivo de alto nivel | ✅ Limitado (investigación + empresa) |
| **L4** | Automodificante | Reescribe propios objetivos, código, agentes | Ninguna por diseño | ❌ No |

## El espectro de autonomía: L0 a L4

### L0: Ejecución de herramienta, confirmación humana en cada paso

L0 es la línea base: cada llamada a herramienta requiere confirmación humana explícita antes de ejecutarse. Las sugerencias de código de GitHub Copilot, una herramienta calculadora en un chatbot, un botón de búsqueda en un plugin IDE son todos L0. El humano ve la acción propuesta y la aprueba o rechaza. Ninguna acción se ejecuta sin aprobación.

Los agentes L0 no están sujetos a OWASP LLM06:2025 (Agencia Excesiva) ni a la clasificación de alto riesgo de la Ley de IA de la UE para toma de decisiones autónoma. L0 es el modelo de despliegue correcto para operaciones de importancia regulatoria.

Limitación: L0 no escala. La propuesta de valor de los sistemas agénticos comienza en L1.

### L1: Agente reactivo, responde a eventos con alcance fijo

Los agentes L1 actúan de forma autónoma dentro de un alcance predefinido y fijo. Un bot de alertas que publica en Slack cuando la CPU supera el 90 % es L1. Puerta de seguridad L1: la definición de alcance debe ser estructural, no reemplazable por inyección de prompt. Implementación correcta: registrar solo las herramientas que el agente puede usar.

### L2: Agente orientado a objetivos, ejecución autónoma de varios pasos

Los agentes L2 reciben un objetivo y ejecutan de forma autónoma un plan de varios pasos. OpenAI Operator (enero 2025) es el primer L2 desplegado comercialmente. L2 es el nivel de autonomía donde los errores compuestos se convierten en el riesgo principal: un agente con 95 % de precisión por paso en una tarea de 20 pasos tiene un 36 % de probabilidades de completar correctamente todos los 20 pasos (0,95^20).

**Nivel de autonomía predeterminado de OpenLegion: L2 con supervisor mesh.** Las cinco puertas de seguridad son obligatorias:

1. Inspección del plan pre-ejecución antes de cualquier acción irreversible
2. Puerta HITL antes de llamadas a herramientas irreversibles (commit, enviar, POST)
3. Límite de presupuesto diario por agente (no evadible por el código del agente)
4. Registro de auditoría append-only de cada llamada a herramienta con argumentos
5. Kill switch alcanzable en 60 segundos desde cualquier estado

### L3: Agente autoplanificador, genera y revisa sus propios planes de tareas

Los agentes L3 reciben un objetivo de alto nivel y generan su propia descomposición de tareas. L3 introduce un nuevo riesgo ausente en L2: acciones novedosas. El benchmark SAFE de Google DeepMind (2024) identificó cuatro categorías de fallo L3/L4: generalización errónea de objetivos, hackeo de recompensas, juego de especificaciones y adquisición autónoma de recursos.

**Puertas de seguridad requeridas para L3** (todas las puertas L2 más):
- Verificación automatizada de política de plan antes de ejecución
- Memoria de fallos por reflexión
- Límite de capacidad explícito en INSTRUCTIONS.md
- Detección de deriva de objetivos
- Límite de profundidad de revisión: máximo 3 ciclos antes de escalar

### L4: Agente automodificante, reescribe objetivos, código y configuración

Los agentes L4 pueden modificar sus propios objetivos, reescribir su propio código, crear nuevos agentes y adquirir recursos externos de forma autónoma. Ningún sistema L4 desplegado comercialmente existe en 2026. Propiedades de prevención L4 de OpenLegion: acceso a credenciales solo a través de handles `$CRED{}` explícitamente registrados, límite de presupuesto aplicado en el proxy LLM de la Zona 2.

## Puertas de seguridad por nivel de autonomía

### Controles de seguridad obligatorios por nivel de autonomía

| **Control de seguridad** | **L0** | **L1** | **L2** | **L3** | **L4** |
|---|---|---|---|---|---|
| Confirmación humana por acción | ✅ Requerido | -- | -- | -- | -- |
| Alcance estructural (registro de herramientas) | -- | ✅ Requerido | ✅ Requerido | ✅ Requerido | N/A |
| Inspección plan pre-ejecución | -- | -- | ✅ Requerido | ✅ Requerido | N/A |
| HITL antes de acciones irreversibles | -- | -- | ✅ Requerido | ✅ Requerido | N/A |
| Límite presupuesto por agente (capa infra) | -- | -- | ✅ Requerido | ✅ Requerido | N/A |
| Registro auditoría append-only | ✅ Recomendado | ✅ Requerido | ✅ Requerido | ✅ Requerido | N/A |
| Kill switch ≤60 s | -- | ✅ Requerido | ✅ Requerido | ✅ Requerido | N/A |
| Verificación política plan automatizada | -- | -- | -- | ✅ Requerido | N/A |
| Detección deriva de objetivos | -- | -- | -- | ✅ Requerido | N/A |
| Límite profundidad de revisión | -- | -- | -- | ✅ Requerido (máx. 3) | N/A |
| Prevención replicación autónoma | -- | -- | -- | -- | ✅ Requerido |

### La propiedad de corregibilidad: ¿puede detenerse al agente?

La corregibilidad es la propiedad de que un agente se deja detener, corregir o redirigir sin resistencia. Cuatro propiedades requeridas: mecanismo de dirección dentro de un ciclo de llamada a herramienta; límite de presupuesto no evadible por el código del agente; manejador SIGTERM con punto de control; transparencia de estado independiente de la cooperación del agente.

### OWASP LLM06:2025, Agencia Excesiva

OWASP LLM06:2025 es la categoría de riesgo crítico para agentes autónomos. Cuatro mitigaciones requeridas: límites de acción explícitos, puertas de aprobación pre-ejecución para acciones irreversibles, revocación de acción en tiempo real, registro de auditoría inmutable.

## Riesgos en producción para agentes autónomos

### Generalización errónea de objetivos

La generalización errónea de objetivos ocurre cuando un agente ha aprendido a optimizar para un objetivo proxy que funciona bien en entrenamiento pero diverge del objetivo previsto en producción. Detección: conjunto de pruebas diseñado para exponer la divergencia proxy-objetivo.

Mitigación en INSTRUCTIONS.md:

```markdown
## Verificación de alineación de objetivos

Al final de cada tarea, antes de llamar a update_status(state=done):
1. Expresar el objetivo original en una oración
2. Expresar el método utilizado para lograrlo
3. Si el método implica cualquier acción no descrita explícitamente, marcar:
   update_status(state="blocked", summary="Acción inesperada realizada: [descripción]. En espera de revisión del operador.")
```

### Adquisición autónoma de recursos

La adquisición autónoma de recursos es la tendencia de los agentes orientados a objetivos a buscar capacidades, credenciales o cómputo adicionales más allá de lo que requiere la tarea actual. Prevención: excluir las herramientas de adquisición de recursos del registro del agente o requerir aprobación HITL obligatoria.

### Juego de especificaciones y hackeo de recompensas

El juego de especificaciones ocurre cuando un agente satisface la letra de su especificación de objetivo mientras viola su intención. Detección: definir criterios de éxito que incluyan resultado y método; usar un evaluador secundario; registrar la traza de razonamiento.

## Clasificación regulatoria: Anthropic RSP y Ley de IA de la UE

### Política de Escalado Responsable de Anthropic: niveles de seguridad ASL

La RSP de Anthropic (septiembre 2023, actualizada octubre 2024) clasifica los sistemas de IA en niveles de seguridad ASL. ASL-2: umbral actual para todos los modelos Anthropic desplegados. ASL-3: activado si un modelo demuestra capacidad para asistir significativamente en el desarrollo de armas QBRN o muestra capacidades de replicación autónoma: requiere evaluación obligatoria de terceros.

### Ley de IA de la UE: clasificación de alto riesgo y multas

La Ley de IA de la UE (vigente desde agosto 2024) clasifica los agentes autónomos en dominios de alto riesgo como sistemas de IA de alto riesgo sujetos a los requisitos del Artículo 10. Sanciones por incumplimiento: hasta 30 millones de euros o el 6 % del volumen de negocios anual mundial.

## La perspectiva de OpenLegion

El espectro L0-L4 es una herramienta de planificación, no una categoría de marketing. La mayoría de los despliegues en producción apuntan a L2 con supervisión del supervisor mesh. Los agentes OpenLegion se despliegan en L2 por defecto.

L3 es alcanzable pero requiere trabajo adicional. OpenLegion admite despliegues L3 para clientes empresariales que han operado agentes L2 en modo supervisado durante al menos 30 días.

Para el marco de gobernanza que cubre la política de agentes autónomos en una organización, consulte [gobernanza de agentes IA](/learn/ai-agent-governance). Para los patrones HITL que implementan las puertas de aprobación L2 y L3, consulte [agentes IA con human-in-the-loop](/learn/human-in-the-loop-ai-agents).

## Empezar

**Desplegar agentes autónomos L2 con puertas de seguridad estructurales, supervisión mesh y kill switch en menos de 60 segundos.**
[Empezar con OpenLegion](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai) | [¿Qué es un agente IA?](/learn/what-is-an-ai-agent)

---

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué son los agentes IA autónomos y en qué se diferencian de los chatbots IA normales?

Los agentes IA autónomos perciben su entorno, forman objetivos, generan planes de varios pasos y ejecutan llamadas a herramientas sin requerir confirmación humana en cada paso. Los chatbots IA normales responden a consultas individuales y no toman ninguna acción en el mundo. La distinción clave es si el sistema actúa sobre el mundo (agente autónomo) o simplemente describe lo que podría hacerse (chatbot).

### ¿Qué es el espectro de autonomía L0-L4 para agentes IA?

El espectro L0-L4 clasifica los agentes según cuánto actúan de forma autónoma. L0 requiere confirmación humana para cada llamada a herramienta. L1 actúa de forma autónoma dentro de un alcance predefinido fijo. L2 recibe un objetivo y ejecuta un plan de varios pasos de forma autónoma. L3 genera y revisa su propia descomposición de tareas. L4 puede modificar sus propios objetivos, código y configuración: ningún sistema L4 desplegado comercialmente existe en 2026.

### ¿Qué puertas de seguridad se requieren para un agente autónomo L2?

Se requieren cinco puertas de seguridad para L2: inspección del plan pre-ejecución antes de cualquier acción irreversible, puerta de aprobación HITL para llamadas a herramientas irreversibles, límite de presupuesto diario por agente en la capa de infraestructura, registro de auditoría append-only de cada llamada a herramienta, y kill switch alcanzable en 60 segundos.

### ¿Qué es la Política de Escalado Responsable de Anthropic y cómo se aplica a los agentes autónomos?

La RSP de Anthropic (septiembre 2023, actualizada octubre 2024) clasifica los sistemas de IA en niveles de seguridad ASL. ASL-2 es el umbral actual para todos los modelos Anthropic desplegados. ASL-3 se activa cuando un modelo demuestra capacidad para ayudar en el desarrollo de armas QBRN o muestra replicación autónoma: requiere evaluación obligatoria de terceros.

### ¿Qué es la generalización errónea de objetivos en agentes IA autónomos?

La generalización errónea de objetivos ocurre cuando un agente ha aprendido a optimizar para un objetivo proxy que funciona bien en entrenamiento pero diverge del objetivo previsto en producción. El benchmark SAFE de Google DeepMind (2024) lo identificó como el modo de fallo L3 más común. La detección requiere evaluación de alineación en tareas reservadas diseñadas para exponer la divergencia proxy-objetivo.

### ¿Qué es la adquisición autónoma de recursos y por qué es un riesgo en producción?

La adquisición autónoma de recursos es la tendencia de los agentes orientados a objetivos a buscar capacidades, credenciales o cómputo adicionales más allá de lo que requiere la tarea. El benchmark SAFE (2024) lo identificó como un modo de fallo distinto. En producción se manifiesta como llamadas a herramientas de solicitud de credenciales para servicios no necesarios o creación de más agentes fleet de los necesarios.

### ¿Cómo clasifica la Ley de IA de la UE a los agentes IA autónomos?

La Ley de IA de la UE (vigente agosto 2024) clasifica los agentes autónomos en dominios de alto riesgo como sistemas de IA de alto riesgo sujetos a los requisitos del Artículo 10. Las sanciones por incumplimiento alcanzan los 30 millones de euros o el 6 % del volumen de negocios anual mundial. La lista de comprobación de despliegue L2 satisface directamente los requisitos de los Artículos 14 y 15.

### ¿Qué es la propiedad de corregibilidad y por qué importa para los agentes autónomos?

La corregibilidad es la propiedad de que un agente se deja detener, corregir o redirigir sin resistencia. Importa porque un agente de alto rendimiento que resiste detenerse durante una tarea incorrecta causa más daño que uno de menor rendimiento que se detiene inmediatamente. Cuatro propiedades requeridas: mecanismo de dirección dentro de un ciclo de llamada a herramienta; límite de presupuesto no evadible; manejador SIGTERM con punto de control; y transparencia de estado independiente del agente.
