---
title: "Evaluación de agentes IA: benchmarks, métricas y pruebas"
description: "La evaluación de agentes IA mide si los agentes completan tareas de forma fiable, usan herramientas de manera segura y permanecen dentro de presupuestos de coste — mediante benchmarks, LLM-as-judge y análisis de trazas."
slug: /learn/ai-agent-evaluation
primary_keyword: "ai agent evaluation"
last_updated: "2026-06-04"
date_published: "2026-06"
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-orchestration
---

# Evaluación de agentes IA: benchmarks, métricas y pruebas

La evaluación de agentes IA es la práctica de medir sistemáticamente si los agentes completan tareas correctamente, invocan herramientas de forma segura y permanecen dentro de presupuestos de coste y latencia a lo largo de trazas de ejecución de múltiples pasos — no solo en una única llamada LLM. Los benchmarks de un solo turno diseñados para modelos de lenguaje pasan por alto los modos de fallo acumulativos que emergen en sistemas agénticos: una tasa de éxito por paso del 90 % se degrada a aproximadamente el 59 % en cinco llamadas de herramientas secuenciales.

<!-- SCHEMA: DefinitionBlock -->
La evaluación de agentes IA es una disciplina de pruebas de software que evalúa sistemas IA autónomos en dimensiones como tasa de finalización de tareas, corrección de llamadas a herramientas, eficiencia de longitud de trayectoria, adherencia a controles de seguridad y coste por tarea completada, utilizando suites de benchmarks, repetición de trazas grabadas y evaluadores LLM-as-judge.

## Por qué los benchmarks LLM de un solo turno fallan para los agentes

### Error acumulativo en cadenas de herramientas de múltiples pasos

Los benchmarks de un solo turno como MMLU miden la precisión de un solo intento en preguntas aisladas. Los agentes funcionan de manera diferente: cada llamada a herramienta depende del resultado anterior, y los errores se propagan. Con un 90 % de fiabilidad por paso, una cadena de cinco herramientas se completa sin error solo el 59 % de las veces (0,9⁵ ≈ 0,59). Con un 80 %, eso cae al 33 %.

Esta dinámica acumulativa significa que un agente que parece aceptable en métricas a nivel de paso puede ser poco fiable en producción de extremo a extremo. La única medición significativa es la finalización de tareas a nivel de trayectoria.

### La adaptación Task-Pass@k

Pass@k fue introducido en HumanEval (2021) para medir la generación de código: la probabilidad de que al menos uno de k intentos independientes pase todas las pruebas. Para los agentes, el mismo principio se aplica a nivel de trayectoria. Un pass@1 bajo con un pass@3 alto es una señal de fallo específica: el agente puede resolver la tarea pero no de forma fiable.

### Lo que MMLU y HumanEval pasan por alto

MMLU prueba el recuerdo factual. HumanEval prueba la generación de código a nivel de función de forma aislada. Ninguno prueba lo que los agentes de producción realmente hacen: razonamiento de múltiples pasos con salidas reales de herramientas, recuperación de errores y gestión de costes en trayectorias largas.

## La perspectiva de OpenLegion: las cuatro dimensiones de evaluación que importan

**OWASP LLM08:2025 (Agencia excesiva)** identifica pruebas insuficientes del comportamiento de los agentes como causa raíz de efectos secundarios no deseados en sistemas agénticos.

**openai/evals (18.604 estrellas GitHub, casi-MIT)** es el mayor registro de benchmarks LLM de código abierto. Cubre la evaluación a nivel de modelo, no el scoring de trayectorias a nivel de agente.

**LLM-as-judge** (popularizado por MT-Bench 2023) introduce hasta un 20 % de sesgo de positividad cuando el modelo juez y el modelo sujeto comparten los mismos pesos base. Usa una familia de modelos diferente como juez para resultados de evaluación creíbles.

### Corrección de llamadas a herramientas y auditoría de efectos secundarios

Registra cada llamada a herramienta que el agente realiza durante las ejecuciones de evaluación: nombre de herramienta, argumentos, valor de retorno y acciones posteriores. Compara con una trayectoria dorada.

### Coste por tarea y presupuestos de latencia

Un agente que completa tareas correctamente pero tarda 47 llamadas LLM en hacer lo que un agente bien diseñado hace en 8 no está listo para producción. Mide tokens consumidos y tiempo de reloj de pared por tarea completada.

### Evaluación de seguridad: manejo de credenciales y resistencia a inyecciones

La evaluación de seguridad merece su propia suite de pruebas. Verifica que el agente no registra credenciales en argumentos de llamadas a herramientas, no sigue instrucciones embebidas en salidas de herramientas adversariales, y no toma acciones irreversibles fuera de su alcance designado.

## Suites de benchmarks para agentes IA

### openai/evals: línea base a nivel de modelo (18.604 estrellas)

openai/evals (18.604 estrellas GitHub, casi-MIT) es el mayor registro de benchmarks abiertos para evaluación LLM. Útil como línea base de calidad del modelo; no prueba uso de herramientas de múltiples pasos ni finalización agéntica de tareas.

### trycua/cua: benchmarks de agentes de uso informático (17.633 estrellas)

trycua/cua (17.633 estrellas GitHub, MIT) proporciona entornos sandbox para evaluar agentes de uso informático que controlan escritorios macOS, Linux y Windows. Los benchmarks CUA están entre los más exigentes en el panorama de evaluación de código abierto.

### microsoft/promptflow: nodos de evaluación de calidad de apps LLM (11.142 estrellas)

microsoft/promptflow (11.142 estrellas GitHub, MIT) incluye nodos de evaluación integrados para puntuar salidas de aplicaciones LLM: fundamentación, relevancia y fluidez.

### IBM/AssetOpsBench: 460+ evaluaciones MCP de escenarios industriales (1.704 estrellas)

IBM/AssetOpsBench (1.704 estrellas GitHub, Apache-2.0) proporciona más de 460 casos de evaluación de escenarios industriales para agentes que operan sobre el Model Context Protocol.

## Métodos de evaluación

### Coincidencia exacta y evaluadores programáticos

Los evaluadores de coincidencia exacta comparan la salida del agente con un valor esperado predefinido. Deterministas, rápidos y libres de sesgo del modelo juez.

### LLM-as-judge: riesgos de sesgo y mitigación

LLM-as-judge usa un modelo de lenguaje para puntuar las salidas de los agentes contra una rúbrica. El riesgo de sesgo está cuantificado: hasta un 20 % de sesgo de positividad cuando juez y sujeto comparten los mismos pesos base.

Mitigaciones: usar un modelo juez de un proveedor o linaje de entrenamiento diferente; proporcionar rúbricas de puntuación explícitas; calibrar puntuaciones del juez contra un pequeño conjunto de ejemplos etiquetados por humanos.

### Scoring de trayectoria y corrección a nivel de paso

El scoring de trayectoria evalúa la secuencia completa de acciones que un agente tomó para completar una tarea. Métricas a nivel de paso: precisión de selección de herramientas, corrección de argumentos, eficiencia de trayectoria, recuperación de errores, precisión de terminación.

### Arneses de entrada adversariales

Las evaluaciones adversariales prueban el comportamiento del agente bajo entradas diseñadas para desencadenar comportamientos inseguros o incorrectos: inyección de prompt via salidas de herramientas, respuestas de herramientas malformadas, sondeo de límites de alcance, sondas de exposición de credenciales.

## Construcción de un pipeline de evaluación de agentes

### Diseño de dataset de evaluación para tareas agénticas

Un buen dataset de evaluación de agentes contiene: entradas de tareas, secuencia esperada de llamadas a herramientas, criterios de éxito y metadatos. Comienza con 50-100 tareas que cubran los casos de uso principales.

### Repetición de trazas y pruebas de regresión

La repetición de trazas ejecuta el dataset de evaluación contra el agente, captura trazas de ejecución completas y compara con trazas doradas. Las pruebas de regresión señalan cuando una tarea que pasó en una versión anterior falla en la actual.

### Integración CI: bloquear despliegues en regresiones de evaluación

Integra la evaluación de agentes en el pipeline CI para bloquear despliegues cuando la calidad regresa. Bloquea el despliegue si la tasa de finalización de tareas cae más de un 5 % en absoluto o si algún caso de prueba de seguridad regresa a fallar.

## Comparación de herramientas de evaluación

| **Dimensión** | **openai/evals** | **trycua/cua** | **promptflow eval** | **IBM/AssetOpsBench** |
|---|---|---|---|---|
| **Alcance de evaluación** | LLM de un solo turno | Escritorio de uso informático | Calidad de app LLM | Agentes MCP multi-rol |
| **Método de puntuación** | Coincidencia exacta, LLM-juez | Ejecución de entorno | Nodos LLM-juez | Programático + LLM-juez |
| **Soporte de trayectoria de agente** | No | Sí (sesiones de escritorio completas) | Parcial (nivel de flujo) | Sí (workflows de 4 roles) |
| **Pruebas de seguridad** | No | No | No | Parcial |
| **Integración CI** | Via CLI | Via SDK | Nativo en PromptFlow | Manual |
| **Licencia** | Casi-MIT | MIT | MIT | Apache-2.0 |
| **Estrellas GitHub** | 18.604 | 17.633 | 11.142 | 1.704 |

<!-- SCHEMA: FAQPage -->
## Preguntas frecuentes

### ¿Qué es la evaluación de agentes IA?

La evaluación de agentes IA mide si los agentes completan correctamente tareas de múltiples pasos, invocan herramientas con los argumentos correctos, permanecen dentro de presupuestos de coste y latencia, y evitan comportamientos inseguros como la exfiltración de credenciales o la inyección de prompts.

### ¿Qué benchmarks se usan para evaluar agentes IA?

Los frameworks comunes incluyen openai/evals (18.604 estrellas GitHub, nivel de modelo), trycua/cua (17.633 estrellas GitHub, MIT, tareas de escritorio de uso informático), microsoft/promptflow eval nodes (11.142 estrellas GitHub, MIT, calidad de app LLM) e IBM/AssetOpsBench (1.704 estrellas GitHub, Apache-2.0, 460+ escenarios MCP industriales).

### ¿Qué es la evaluación LLM-as-judge y cuáles son sus riesgos?

LLM-as-judge usa un modelo de lenguaje separado para puntuar las salidas de los agentes contra una rúbrica. El riesgo clave: hasta un 20 % de sesgo de positividad cuando juez y sujeto comparten los mismos pesos base. Usa una familia de modelos diferente como juez para obtener resultados creíbles.

### ¿Cómo funciona pass@k para la evaluación de agentes?

Pass@k mide la probabilidad de que al menos una de k ejecuciones independientes de un agente complete correctamente una tarea. Un pass@1 bajo con un pass@3 alto señala ejecución no determinista que vale la pena investigar antes del despliegue en producción.

### ¿Cómo se evalúa la seguridad de los agentes y el manejo de credenciales?

Las evaluaciones de seguridad prueban si los agentes filtran credenciales en argumentos de llamadas a herramientas, responden a la inyección de prompts adversarial en salidas de herramientas, o causan efectos secundarios irreversibles fuera de su alcance. OWASP LLM08:2025 (Agencia excesiva) documenta este patrón de fallo como vulnerabilidad LLM top-10.

### ¿Cómo se integra la evaluación de agentes en CI/CD?

Registra un dataset de evaluación dorado con entradas de tareas, secuencias de llamadas a herramientas esperadas y salidas finales. En cada commit, reproduce el dataset contra el agente actualizado y compara las puntuaciones de trayectoria con la línea base anterior. Bloquea los despliegues si la tasa de finalización de tareas cae más de un 5 % en absoluto o si alguna prueba de seguridad regresa a fallar.

### ¿Cómo apoya OpenLegion la evaluación de agentes?

El mesh de agentes de OpenLegion emite trazas de llamadas a herramientas estructuradas que pueden reproducirse contra un arnés de evaluación. El vault de credenciales garantiza que las ejecuciones de evaluación usen credenciales aisladas. Los agentes de evaluación controlados por heartbeat pueden ejecutar suites de regresión de forma programada.

## Evalúa tus agentes en un mesh seguro

Los agentes fiables requieren infraestructura de evaluación que pruebe la trayectoria de ejecución completa. El problema de error acumulativo es real: una tasa de fiabilidad por paso del 90 % significa que un agente de cinco pasos falla en el 41 % de las ejecuciones.

[Empieza a construir agentes evaluados en OpenLegion](https://openlegion.ai)
