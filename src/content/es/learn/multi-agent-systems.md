---
title: Arquitectura de sistemas multi-agente - Diseño, topología y seguridad
description: La arquitectura de sistemas multi-agente define cómo los agentes autónomos se comunican, coordinan y mantienen límites de confianza. Cubre topologías, protocolos inter-agente y diseño de seguridad en producción.
slug: /learn/multi-agent-systems
primary_keyword: arquitectura de sistemas multi-agente
secondary_keywords:
  - diseño de sistema multi-agente
  - protocolos de comunicación de agentes
  - patrones de topología de agentes
  - protocolo a2a
  - seguridad multi-agente
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /comparison/langgraph
  - /comparison/autogen
---

# Arquitectura de sistemas multi-agente: topologías de diseño, protocolos de comunicación y límites de confianza

Un sistema multi-agente es una red de agentes de IA autónomos que coordinan para cumplir tareas que ningún agente individual puede manejar. Las decisiones arquitectónicas tomadas en el tiempo de diseño, a saber, topología, protocolo de comunicación, modelo de compartición de estado y ubicación de límites de confianza, determinan si el sistema escala graciosamente o falla catastróficamente en producción. Una topología en estrella con estado compartido crea un único punto de falla; el acoplamiento apretado entre agentes significa que un componente comprometido puede pivotar hacia otros; la memoria de proceso compartida crea condiciones de carrera que aparecen como CVEs.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es un sistema multi-agente?**
> Un sistema multi-agente es una red de dos o más agentes de IA autónomos que se comunican, coordinan y actúan colectivamente para cumplir tareas más allá de la capacidad de cualquier agente individual, definido por su topología (cómo están conectados los agentes), su protocolo de comunicación (cómo los agentes intercambian información), su modelo de compartición de estado y su ubicación de límites de confianza.

## Propiedades arquitectónicas fundamentales

### Autonomía de agentes vs coordinación: la tensión fundamental

Cada agente en un sistema multi-agente tiene su propia ventana de contexto, conjunto de herramientas y proceso de decisión. La arquitectura resuelve esta tensión: el acoplamiento suelto preserva la autonomía; el acoplamiento apretado crea condiciones de carrera. CVE-2025-64168 (Agno, CVSS 7.1, octubre 2025) es un ejemplo de producción: bajo alta concurrencia asíncrona, el session_state compartido entre agentes fue asignado a la sesión de usuario incorrecta.

## Patrones de topología multi-agente

### Topología en estrella: hub-and-spoke con un agente supervisor

La topología en estrella crea un único punto de falla: si el supervisor es comprometido mediante inyección de prompts de un resultado de herramienta, puede emitir instrucciones maliciosas a todos los agentes trabajadores.

### Topología de malla: comunicación de agente par a par

En la topología de malla, los agentes se comunican directamente sin un coordinador central. En una malla completa de N agentes, hay N*(N-1)/2 canales de comunicación potenciales, cada uno una superficie de ataque potencial.

### Topología jerárquica: equipos anidados y delegación de sub-agentes

El riesgo: un coordinador de nivel medio comprometido puede emitir instrucciones maliciosas a todos los agentes que gestiona.

### Topología plana/flota: agentes del mismo rango coordinando a través de un bus compartido

La topología de flota plana utiliza agentes del mismo rango que se comunican exclusivamente a través de un bus de mensajes compartido (blackboard) sin llamadas directas de agente a agente. Este es el modelo de flota de OpenLegion: un agente comprometido solo puede afectar lo que escribe en el blackboard.

## Protocolos de comunicación inter-agente

### A2A: el estándar abierto de Google para comunicación de agentes entre frameworks

A2A (Agent-to-Agent), lanzado por Google en abril de 2025, estandariza la comunicación inter-agente entre diferentes frameworks. A2A define tres primitivos: descubrimiento de capacidades, delegación de tareas y resultados en streaming. A mediados de 2026, A2A es compatible con más de 50 socios tecnológicos. OpenLegion soporta A2A para la coordinación de agentes entre frameworks.

### MCP: estandarización del acceso a herramientas entre agentes

Model Context Protocol (MCP), lanzado por Anthropic en noviembre de 2024, estandariza cómo los agentes acceden a herramientas externas. A mediados de 2026, MCP cuenta con más de 1.000 servidores comunitarios. MCP también introduce riesgos de seguridad: las descripciones de herramientas pueden ser envenenadas para inyectar instrucciones maliciosas en el contexto del agente.

### Patrón blackboard: estado persistente compartido como medio de comunicación

El patrón blackboard enruta toda la comunicación inter-agente a través de un almacén de datos persistente compartido. OpenLegion implementa el patrón blackboard usando SQLite con modo WAL para acceso concurrente, combinado con mensajería pub/sub.

## Opinión de OpenLegion: por qué la arquitectura es una decisión de seguridad

La mayoría de los fallos de sistemas multi-agente son fallos arquitectónicos. El estado compartido entre agentes crea condiciones de carrera: CVE-2025-64168 (Agno, CVSS 7.1, octubre 2025). El acoplamiento apretado amplifica el radio de explosión de la inyección de prompts: la investigación de COLM 2025 mostró una tasa de éxito de ataque del 97 % contra AutoGen Magentic-One.

El modelo de confianza de cuatro zonas de OpenLegion: los agentes de Zona 1 (contenedores sandbox) no pueden comunicarse directamente. Todos los mensajes inter-agente se enrutan a través del Mesh Host de Zona 2.

## Límites de confianza en sistemas multi-agente

### Por qué proceso compartido = radio de explosión compartido

Cuando varios agentes se ejecutan en el mismo proceso Python, comparten el heap, el entorno y el intérprete. Una inyección de prompt exitosa en el Agente A puede leer las variables del Agente B. El aislamiento por contenedor por agente elimina este problema.

## Modos de fallo comunes en la arquitectura multi-agente

### Condiciones de carrera en estado compartido: CVE-2025-64168 como caso de estudio

CVE-2025-64168 (Agno, CVSS 7.1, CWE-362 + CWE-668, octubre 2025, parcheado en Agno v2.2.2) reveló una condición de carrera en la capa de gestión de session_state de Agno. Bajo alta concurrencia asíncrona, session_state fue asignado a la sesión incorrecta.

### Amplificación de inyección de prompts en sistemas fuertemente acoplados

La investigación publicada en COLM 2025 demostró una tasa de éxito de ataque del 97 % contra Magentic-One (el sistema multi-agente de AutoGen) mediante archivos locales maliciosos.

## Sistemas multi-agente en OpenLegion

OpenLegion implementa topología de flota plana con separación de confianza de cuatro zonas. Los agentes se ejecutan en contenedores Docker aislados (Zona 1), se comunican exclusivamente a través del blackboard del Mesh Host (Zona 2), acceden a credenciales a través del Vault Proxy (Zona 4) y nunca se comunican directamente entre sí.

## CTA

**Coordinación multi-agente con garantías de seguridad arquitectónicas.**
[Comenzar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai) | [Ver la plataforma](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué es una arquitectura de sistema multi-agente?

Una arquitectura de sistema multi-agente define cómo múltiples agentes de IA autónomos están estructurados para comunicarse, coordinar y mantener límites de confianza. Especifica la topología, el protocolo de comunicación, el modelo de compartición de estado y la ubicación de los límites de confianza.

### ¿Cuál es la diferencia entre topología en estrella y topología de flota plana?

En una topología en estrella, un agente supervisor central coordina a todos los demás, creando un único punto de falla. En una topología de flota plana (usada por OpenLegion), los agentes del mismo rango coordinan a través de un bus de mensajes compartido sin comunicación directa de agente a agente.

### ¿Qué es el protocolo A2A para sistemas multi-agente?

A2A (Agent-to-Agent) es un protocolo abierto de comunicación inter-agente lanzado por Google en abril de 2025. Estandariza cómo los agentes descubren las capacidades de otros, delegan tareas e intercambian resultados en streaming. OpenLegion soporta A2A para la coordinación de agentes entre frameworks.

### ¿Qué causa condiciones de carrera en sistemas multi-agente?

Las condiciones de carrera ocurren cuando múltiples agentes leen y escriben estado compartido concurrentemente sin sincronización adecuada. CVE-2025-64168 en el framework Agno (CVSS 7.1, octubre 2025) es un ejemplo documentado.

### ¿Cómo se propaga la inyección de prompts en un sistema multi-agente?

En sistemas multi-agente fuertemente acoplados, una inyección de prompts exitosa en un agente puede propagarse a otros. La investigación en COLM 2025 demostró una tasa de éxito del 97 % contra AutoGen Magentic-One. Las mitigaciones arquitectónicas incluyen el aislamiento por contenedor por agente y la comunicación mediada por bus.

### ¿Qué es el patrón blackboard en sistemas multi-agente?

El patrón blackboard es una arquitectura de coordinación multi-agente donde los agentes se comunican leyendo y escribiendo en un almacén de datos persistente compartido en lugar de llamarse directamente. OpenLegion implementa el patrón blackboard usando SQLite con modo WAL, combinado con mensajería pub/sub.
