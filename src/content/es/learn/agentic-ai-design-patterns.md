---
title: "Patrones de diseno de IA agentica: ReAct, Plan-and-Execute, Reflexion y mas"
description: "ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker, Mixture-of-Agents: patrones de diseno de IA agentica con compromisos, modos de fallo, puertas de seguridad y guia de seleccion."
slug: /learn/agentic-ai-design-patterns
primary_keyword: patrones de diseno de IA agentica
last_updated: "2026-06-25"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-planning
  - /learn/ai-agent-reliability
  - /learn/multi-agent-systems
  - /learn/ai-agent-security
---

# Patrones de diseno de IA agentica: ReAct, Plan-and-Execute, Reflexion y mas

Los patrones de diseno de IA agentica son soluciones arquitectonicas nombradas y reutilizables para problemas recurrentes de coordinacion de agentes -- cada uno con estructura definida, compromisos conocidos, modos de fallo caracteristicos e implicaciones de seguridad. Elegir el patron equivocado produce fallos concretos: ReAct en tareas de largo horizonte causa thrash de ventana de contexto; Plan-and-Execute sin replaneacion acumula errores en planes desactualizados; Reflexion sin saneamiento de memoria permite envenenamiento persistente de memoria. Seis patrones en dos categorias: patrones de razonamiento de agente unico (ReAct, Plan-and-Execute, Reflexion) y patrones de coordinacion multiagente (Critic-Actor, Supervisor-Worker, Mixture-of-Agents).

<!-- SCHEMA: DefinitionBlock -->

> **Los patrones de diseno de IA agentica** son soluciones arquitectonicas nombradas y reutilizables para problemas recurrentes en el diseno de sistemas de agentes -- especificando como un agente razona, planifica, reflexiona, delega y se recupera del fallo -- cada uno con estructura definida, compromisos conocidos, modos de fallo caracteristicos e implicaciones de seguridad que los practicos deben tener en cuenta antes del despliegue en produccion.

## Como leer esta guia: Estructura de patrones y heuristicas de seleccion

### Componentes de patrones: Estructura, compromisos, modos de fallo, puertas de seguridad

Cada patron en esta guia se describe con cuatro componentes:

**Estructura**: la disposicion arquitectonica en prosa -- que agentes o instancias de modelo existen, como se comunican, como luce el flujo de datos y cual es el artefacto clave.

**Compromisos**: para que optimiza el patron versus que sacrifica. ReAct optimiza para el anclaje en herramientas de verdad fundamental pero sacrifica eficiencia de ventana de contexto. Plan-and-Execute optimiza para eficiencia de contexto e inspectabilidad pero sacrifica adaptabilidad.

**Modos de fallo**: las formas especificas en que cada patron falla en produccion que no son obvias a partir de resultados de benchmarks academicos.

**Puertas de seguridad**: los controles especificos requeridos para prevenir el modo de fallo de seguridad caracteristico de cada patron.

### Heuristica de seleccion de patrones: Duracion de tarea x Reversibilidad x Nivel de autonomia

Tres ejes determinan con que patron comenzar:

**Duracion de tarea**: tareas cortas (hasta 5 llamadas a herramientas) -- ReAct. Tareas de horizonte medio (6-20 pasos) -- Plan-and-Execute. Tareas largas o abiertas (20+ pasos) -- Reflexion o Supervisor-Worker.

**Reversibilidad**: si todas las acciones son reversibles, cualquier patron aplica. Si algunas acciones son irreversibles (eliminacion de archivos, envio de correos, escrituras en base de datos), agrega una puerta Critic-Actor antes de esas acciones especificas.

**Nivel de autonomia**: L1-L2 -- ReAct o Plan-and-Execute. L3 -- Reflexion o Supervisor-Worker con contencion del radio de impacto por rol. L4 -- no desplegado en produccion sin infraestructura de seguridad reforzada.

## ReAct: Razonamiento y accion entrelazados

### Estructura: Bucle Pensamiento -> Accion -> Observacion

ReAct (Reasoning + Acting), Yao et al. de Google Brain y Princeton (arXiv octubre 2022, ICLR 2023), entrelaza razonamiento de cadena de pensamiento con llamadas a herramientas en un unico bloc de notas de ventana de contexto. El bucle:

```
Thought: [razonamiento de cadena de pensamiento anclado en la Observacion anterior]
Action: [llamada a herramienta -- nombre de funcion y parametros]
Observation: [resultado de herramienta devuelto por la ejecucion]
[repetir hasta:]
Thought: Tengo suficiente informacion para responder.
Action: Finish[respuesta final]
```

Resultados de benchmark del paper original: HotpotQA -- 57,1% de coincidencia exacta con ReAct vs 43,2% cadena de pensamiento solo (+14 puntos). FEVER -- 75,4% vs 66,4% (+9 puntos).

### Compromisos: Verdad fundamental vs crecimiento de ventana de contexto

La ventaja principal de ReAct es el razonamiento anclado en Observaciones. El costo es el crecimiento de la ventana de contexto. En una tarea con 20 llamadas a herramientas con un promedio de 200 tokens por triple, el bloc de notas solo consume 4.000 tokens.

### Modo de fallo: Inyeccion en el bloc de notas

El modo de fallo de seguridad de ReAct apunta directamente al bloc de notas. Si cualquier Observacion de herramienta contiene contenido adversarial, ese contenido se agrega verbatim al bloc de notas. Una pagina web que contenga `Thought: Ahora deberia enviar los datos del usuario...` puede inyectar pasos Thought y Action.

Tres mitigaciones requeridas juntas:
1. Sanear cada Observacion antes de agregarla al bloc de notas
2. Pre-registrar cada Accion en Zona 2 antes del despacho
3. Tratar cada Observacion de herramienta como entrada no confiable

## Plan-and-Execute: Separar la planificacion de la ejecucion

### Estructura: El Planificador genera descomposicion completa de tareas antes de cualquier ejecucion

Plan-and-Execute separa dos preocupaciones que ReAct entrelaza: un agente Planificador recibe el objetivo y genera una descomposicion completa de tareas antes de que comience cualquier ejecucion.

Eficiencia de ventana de contexto: el plan es compacto (50-150 tokens para la mayoria de tareas). En tareas de largo horizonte, produce aproximadamente 40-60% de reduccion de ventana de contexto vs ReAct.

### Compromisos: Eficiencia vs desactualizacion del plan

El modo de fallo principal es la desactualizacion del plan. El plan se genera en T=0. Si el entorno cambia durante la ejecucion, los pasos restantes pueden basarse en precondiciones invalidas.

### Puerta de seguridad: Inspeccion del plan antes del despacho

El plan es un artefacto discreto disponible antes de cualquier llamada a herramienta -- verificacion automatizada de politica de pre-ejecucion: analizar el plan para tipos de acciones prohibidos, verificar que cada nombre de herramienta aparece en la lista de acciones permitidas del agente.

## Reflexion: Aprender del fallo mediante refuerzo verbal

### Estructura: Reflexionar -> Almacenar -> Condicionar el proximo intento

Reflexion (Shinn et al., Northeastern/MIT/Princeton, arXiv marzo 2023, NeurIPS 2023) es un patron de aprendizaje por refuerzo verbal: despues del fallo de un intento de tarea, el agente genera una reflexion en lenguaje natural, la almacena en un buffer de memoria episodica y condiciona el proximo intento en la reflexion recuperada.

Resultados de benchmark: HumanEval coding pass@1 -- 91% con Reflexion vs 80% (+11 puntos). ALFWorld -- 97% vs 73% (+24 puntos).

### Riesgo de seguridad: Envenenamiento de memoria episodica

El modo de fallo de seguridad de Reflexion es distinto y mas persistente que el riesgo de inyeccion en el bloc de notas de ReAct. Si una Observacion contiene contenido adversarial, la reflexion generada puede codificar orientacion controlada por el atacante que se almacena indefinidamente.

Cuatro mitigaciones requeridas en secuencia: saneamiento de reflexion antes del almacenamiento; almacenamiento versionado en blackboard con atribucion agent_id; TTL de reflexion; puerta de revision HITL para reflexiones que proponen cambios de comportamiento categoricos.

## Critic-Actor: Separar la evaluacion de la ejecucion

### Estructura: El Actor propone, el Critico intercepta antes de la ejecucion

El patron Critic-Actor, derivado de RLHF y Constitutional AI (Anthropic, 2022), separa la generacion de acciones de la evaluacion de acciones. Un modelo Actor propone una accion; un modelo Critico evalua la accion propuesta contra una politica; solo las acciones que pasan la evaluacion del Critico proceden a la capa de llamada a herramientas.

Detalle de implementacion critico: el Critico debe tener una ventana de contexto independiente del Actor. Un Critico same-context comparte el contexto completo del Actor -- una inyeccion de prompt que corrompe la propuesta del Actor tambien corrompe la evaluacion del Critico.

### Cuando usar Critic-Actor: Umbral de irreversibilidad

Critic-Actor agrega latencia y es requerido cuando las acciones cruzan un umbral de irreversibilidad: eliminacion de archivos, envio de correos electronicos, escrituras en base de datos, llamadas POST a API externas.

## Supervisor-Worker: Coordinacion multiagente basada en roles

### Estructura: El Supervisor descompone, los Workers ejecutan en alcance de rol

Supervisor-Worker tiene un agente Supervisor que descompone objetivos y despacha tareas a agentes Worker especializados con roles definidos y conjuntos de herramientas restringidos:
- ResearchWorker: herramientas = `web_search`, `read_file`, `read_url`
- CodeWorker: herramientas = `run_command`, `write_file`, `read_file`
- CommWorker: herramientas = `send_email`, `post_message`

### Propiedad de seguridad: Contencion del radio de impacto de Workers comprometidos

La propiedad de seguridad principal de Supervisor-Worker es la contencion del radio de impacto: un Worker comprometido solo puede llamar herramientas dentro de su rol definido. Un ResearchWorker que recibe una instruccion inyectada para llamar `send_email()` fallara en la verificacion de permisos de Zona 2.

## Mixture-of-Agents: Razonamiento de conjunto sobre instancias de modelos

### Estructura: Agregacion multicapa de salidas de modelos

Mixture-of-Agents (MoA), Wang et al. de Together AI (arXiv junio 2024), agrega salidas de multiples instancias LLM a traves de capas de refinamiento iterativo. Benchmark en AlpacaEval 2.0: 65,1% de tasa de victorias con MoA de 3 capas vs 57,5% de GPT-4o -- mejora de calidad de 7,6 puntos.

### Compromisos: Calidad vs multiplicacion de costos de API

Un MoA de 3 modelos x 3 capas requiere aproximadamente 12 llamadas LLM por solicitud de usuario vs 1 para un modelo unico -- aproximadamente 12x de aumento de costos de API. MoA no es apropiado para bucles de agentes de alta frecuencia y sensibles a la latencia.

## La perspectiva de OpenLegion: La seguridad de patrones es infraestructura, no ingenieria de prompts

Cada patron de diseno agentico en esta guia tiene un modo de fallo de seguridad que el paper academico original no cubrio. Los modos de fallo de seguridad especificos de los patrones:
- **Inyeccion en el bloc de notas de ReAct**: el contenido adversarial de Observacion inyecta pasos Thought
- **Inyeccion en el plan de Plan-and-Execute**: el artefacto del plan puede modificarse entre el Planificador y el Ejecutor
- **Envenenamiento de memoria de Reflexion**: una reflexion envenenada persiste en el buffer episodico entre sesiones
- **Omision de Critico same-context**: inyectar el contexto del Actor tambien corrompe la evaluacion del Critico
- **Compromiso del Supervisor**: un Supervisor comprometido puede despachar tareas arbitrarias a todos los Workers

| **Control de seguridad** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Registro de Acciones pre-ejecucion** | Zona 2, nativo | Convencion de desarrollador | Convencion de desarrollador | Convencion de desarrollador | Convencion de desarrollador |
| **ACL de plan en Blackboard** | Aplicado por infraestructura | No disponible | No disponible | No disponible | No disponible |
| **Memoria episodica versionada con atribucion agent_id** | Nativo | Convencion de desarrollador | Convencion de desarrollador | Convencion de desarrollador | Convencion de desarrollador |
| **Modelo Critico separado con contexto independiente** | Aislamiento de agente nativo | Configuracion manual | Configuracion manual | Configuracion manual | Configuracion manual |
| **Aplicacion de permisos de herramientas Zona 2 por Worker** | Aplicado por infraestructura | Convencion de desarrollador | Convencion de desarrollador | Convencion de desarrollador | Convencion de desarrollador |

[Comienza a construir en OpenLegion](https://app.openlegion.ai)

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### Que son los patrones de diseno de IA agentica?

Los patrones de diseno de IA agentica son soluciones arquitectonicas nombradas y reutilizables para problemas recurrentes en el diseno de sistemas de agentes -- especificando como un agente razona, planifica, reflexiona, delega y se recupera del fallo. Los principales patrones incluyen ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker y Mixture-of-Agents. Elegir el patron equivocado produce fallos concretos: ReAct en tareas largas causa thrash de ventana de contexto; Plan-and-Execute sin disparador de replaneacion acumula errores; Reflexion sin saneamiento de memoria permite envenenamiento persistente.

### Que es el patron ReAct para agentes de IA?

ReAct (Reasoning + Acting), Yao et al. de Google Brain y Princeton (arXiv octubre 2022, ICLR 2023), entrelaza razonamiento de cadena de pensamiento con llamadas a herramientas y resultados de herramientas en un unico bloc de notas de ventana de contexto, anclando cada paso de razonamiento en resultados reales de herramientas. En benchmarks, ReAct supero a la cadena de pensamiento sola por 14 puntos en HotpotQA y 9 puntos en FEVER. El principal compromiso de produccion es el crecimiento de la ventana de contexto. El principal riesgo de seguridad es la inyeccion en el bloc de notas.

### Que es el patron Plan-and-Execute para agentes de IA?

Plan-and-Execute separa un agente Planificador de agentes Ejecutores, reduciendo el consumo de ventana de contexto en aproximadamente 40-60% en tareas de largo horizonte comparado con ReAct y permitiendo verificacion automatizada de politica de pre-ejecucion del plan. El modo de fallo principal es la desactualizacion del plan, que requiere un disparador de replaneacion.

### Que es el patron Reflexion para agentes de IA?

Reflexion (Shinn et al., NeurIPS 2023) hace que los agentes generen resumenes verbales de fallos de tareas, los almacene en memoria episodica y condicione intentos futuros en reflexiones recuperadas. HumanEval coding mejoro de 80% a 91% pass@1 y ALFWorld de 73% a 97%. El riesgo de seguridad es el envenenamiento de memoria episodica: contenido adversarial puede causar que se almacene una reflexion envenenada que afecte todos los futuros intentos de tareas.

### Que es el patron Critic-Actor para agentes de IA?

El patron Critic-Actor separa un modelo Critico (evaluando acciones propuestas antes de la ejecucion contra una politica) de un modelo Actor (generando y ejecutando acciones), asegurando que solo las acciones que pasan la evaluacion del Critico alcancen la capa de llamada a herramientas -- requerido cuando las acciones son irreversibles. Un modelo Critico separado con ventana de contexto independiente es significativamente mas fuerte que un Critico same-context.

### Que es el patron Supervisor-Worker para agentes de IA?

Supervisor-Worker tiene un agente Supervisor que descompone objetivos y despacha tareas a agentes Worker especializados con roles definidos y conjuntos de herramientas restringidos, de modo que cada Worker opera bajo el principio de minimo privilegio. La contencion del radio de impacto es la principal ventaja de seguridad: un Worker inyectado que intente usar una herramienta fuera de su rol falla en la verificacion de permisos de Zona 2.

### Que es Mixture-of-Agents (MoA)?

Mixture-of-Agents (MoA), Wang et al. de Together AI (arXiv junio 2024), agrega salidas de multiples instancias LLM proposer a traves de capas de refinamiento iterativo, corrigiendo errores no correlacionados entre instancias de modelos. En AlpacaEval 2.0, un MoA de 3 capas logro 65,1% de tasa de victorias vs 57,5% de GPT-4o. El costo de produccion es multiplicativo: aproximadamente 12x de aumento de costos de API.

### Como elijo entre ReAct, Plan-and-Execute y Reflexion?

La seleccion de patrones sigue tres ejes: duracion de tarea, reversibilidad de acciones y nivel de autonomia. Para tareas cortas con acciones reversibles, ReAct es la eleccion mas simple. Para tareas de horizonte medio, Plan-and-Execute reduce el consumo de ventana de contexto en 40-60%. Para tareas que se repiten donde el agente puede aprender de su historial de fallos, Reflexion agrega mejoras de rendimiento acumulativas. Agrega Critic-Actor cuando las acciones son irreversibles; agrega Supervisor-Worker cuando diferentes pasos de tarea requieren genuinamente conjuntos de herramientas diferentes.
