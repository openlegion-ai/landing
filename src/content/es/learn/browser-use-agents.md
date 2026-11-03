---
title: "Agentes Browser Use — Cómo los agentes de IA controlan la web"
description: "Los agentes browser use permiten a la IA navegar por sitios web de forma autónoma, rellenar formularios y extraer datos. Funcionamiento, riesgos de seguridad y ejecución segura en contenedores aislados."
slug: /learn/browser-use-agents
primary_keyword: browser use agents
secondary_keywords:
  - ai browser automation
  - browser agent python
  - web agent llm
  - headless browser ai agent
  - browser use security
date_published: 2026-05
last_updated: 2026-05-30
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/model-context-protocol
---

# Agentes Browser Use: Cómo los agentes de IA navegan y controlan la web

Los agentes browser use son sistemas de IA que controlan de forma autónoma un navegador web — navegando por URLs, haciendo clic en botones, rellenando formularios, extrayendo contenido y gestionando la autenticación — sin intervención humana en cada paso. Son la categoría de herramientas de agentes de IA de más rápido crecimiento en 2026, impulsados por frameworks como browser-use (96.282 estrellas en GitHub a mayo de 2026).

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es un agente browser use?**
> Un agente browser use es un agente de IA que controla programáticamente un navegador web headless o con interfaz, utilizando traversal del DOM, análisis del árbol de accesibilidad, grounding por captura de pantalla y selección de acciones guiada por LLM para completar tareas web de forma autónoma.

## Cómo funcionan los agentes browser use

### Percepción: DOM, árbol de accesibilidad y grounding por captura de pantalla

Un agente navegador necesita entender el estado actual de la página antes de actuar. Se utilizan tres estrategias de percepción.

**La extracción del DOM** analiza la estructura HTML bruta de la página. Es rápida y eficiente en tokens, pero falla en contenido renderizado en canvas y SPAs complejas.

**El árbol de accesibilidad** lee la capa de accesibilidad integrada del navegador, proporcionando una vista estructurada y semántica de la página. Es el método de percepción principal utilizado por browser-use.

**El grounding por captura de pantalla** captura una imagen de la página y la pasa a un LLM con capacidad de visión. Maneja páginas donde el DOM y el árbol de accesibilidad son poco fiables, pero cuesta significativamente más tokens por paso.

### Acción: clics, escritura, navegación y envío de formularios

El espacio de acción de un agente navegador es amplio: navegar a una URL, hacer clic en un elemento, escribir texto, presionar una tecla, desplazarse, seleccionar en un desplegable, subir un archivo o cambiar de pestaña. Cada acción cambia el estado de la página.

## La biblioteca browser-use

### 96.282 estrellas en menos de 7 meses

browser-use (GitHub: browser-use/browser-use) alcanzó 96.282 estrellas y 10.802 forks en mayo de 2026, lanzado el 31 de octubre de 2024. La biblioteca abstrae la gestión de sesiones Playwright, la extracción del árbol de accesibilidad y la serialización de acciones.

### Backend Playwright: cómo browser-use controla Chromium

browser-use envuelve la biblioteca de automatización Playwright de Microsoft. Añade una capa de agente: extraer el árbol de accesibilidad, convertirlo a un formato eficiente en tokens y traducir las decisiones de acción del LLM en comandos Playwright.

### Integración LLM: GPT-4o, Claude, Gemini como capa de razonamiento

browser-use es agnóstico en cuanto a LLM en la capa de razonamiento. Soporta OpenAI, Anthropic, Google y cualquier endpoint de API compatible con OpenAI.

## La perspectiva de OpenLegion: los agentes navegador son la herramienta de mayor riesgo

Los agentes navegador son la categoría de herramientas de mayor riesgo en la IA agéntica. Un agente navegador que puede hacer clic, rellenar formularios y seguir redirecciones tiene la misma superficie de ataque que un humano con acceso completo a internet.

### La demo de robo de credenciales en 150 segundos

Investigación públicamente documentada en 2025 demostró que un agente navegador podía ser manipulado para robar credenciales en 150 segundos mediante instrucciones ocultas en una página web. La defensa es arquitectónica: si la credencial no existe en el contexto o memoria del proceso del agente, la inyección no puede extraerla. En OpenLegion las credenciales viven en una bóveda y se inyectan fuera del modelo, que solo llega a retener un identificador, así que nunca aparecen en la ventana de contexto del agente.

### OWASP LLM08 Excessive Agency y permisos del navegador

El top 10 LLM OWASP 2025 clasifica Excessive Agency (LLM08) como categoría de riesgo principal. Los agentes navegador son el riesgo canónico: un agente con permiso para navegar, leer, rellenar formularios y hacer clic puede realizar compras, enviar mensajes, eliminar cuentas y exfiltrar datos.

### Cómo OpenLegion sandboxea las acciones del agente (sandbox + aprobaciones)

OpenLegion no incluye automatización de navegador en el lanzamiento, y el código que un agente escribe corre en un sandbox sin acceso a red por defecto. Cuatro propiedades enmarcan cómo se contiene el trabajo: sin estado de sesión compartido, resistencia a huellas digitales como propiedad del navegador, credenciales guardadas en bóveda y aprobaciones antes de actuar sobre contenido no confiable.

## Patrones de arquitectura para agentes navegador

### Headless vs. headed

El **modo headless** es más rápido y funciona en entornos de servidor, pero es detectable por sistemas de protección anti-bots. Camoufox se ejecuta en modo headless pero parchea las APIs JavaScript que atacan los scripts de detección headless.

### Manejo de CAPTCHA

Tres enfoques: navegadores de comportamiento (resistencia a huellas), servicios de resolución ($1–3 por 1.000 resoluciones) y fallback human-in-the-loop. El equivalente de OpenLegion es su muro de aprobación: el trabajo se detiene en la app cuando un propietario o administrador debe decidir.

### Inyección de credenciales: bóveda de credenciales vs. cookies hardcodeadas

**Peor**: credenciales directamente en instrucciones. **Malo**: variables de entorno (accesibles vía `os.environ`). **Correcto**: inyección desde la bóveda, fuera del modelo.

## Agentes Browser Use: comparación de arquitecturas

| **Dimensión** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **Backend de ejecución** | Ninguno en el lanzamiento — sin automatización de navegador | Playwright (Chromium) | Playwright | Cloud Chromium |
| **Aislamiento de sesión** | Ejecución en sandbox por tarea — estructural | Proceso compartido | Depende de la implementación | Cloud managed |
| **Manejo de credenciales** | Guardadas en bóveda, inyectadas fuera del modelo | Pasa por ventana de contexto | Implementación manual | Managed |
| **Soporte CAPTCHA** | No aplica — sin automatización de navegador | Ninguno integrado | Ninguno integrado | Servicio de resolución |
| **Sandboxing contenedor** | Ejecución de tarea en sandbox, sin red por defecto | Ninguno | Ninguno | Cloud sandbox |
| **Estrellas GitHub** | — | 96.282 (mayo 2026) | N/A | ~9.000 |
| **Licencia** | PolyForm Perimeter 1.0.1 (motor) | MIT | Apache 2.0 | MIT |

## Cuándo usar agentes navegador (y cuándo no)

**Casos de uso legítimos**: investigación web y extracción de datos, automatización de formularios para sus propios servicios, monitoreo y pruebas. **Casos de uso que requieren controles adicionales**: sesiones autenticadas, sitios financieros. **Casos de uso a evitar sin sandboxing estricto**: URLs no confiables proporcionadas por usuarios.

## Empieza con acciones de agente seguras en OpenLegion

**Ejecuta agentes con credenciales guardadas en bóveda, una ejecución en sandbox por tarea y aprobaciones antes de actuar.**
[Empezar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai) | [Ver la plataforma](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué son los agentes browser use?

Los agentes browser use son sistemas de IA que controlan de forma autónoma un navegador web mediante traversal del DOM, análisis del árbol de accesibilidad y selección de acciones guiada por LLM. La biblioteca browser-use (96.282 estrellas GitHub, licencia MIT, lanzada en octubre de 2024) es la implementación open source más adoptada.

### ¿Cómo funciona la biblioteca browser-use?

browser-use envuelve Playwright de Microsoft para dar a un LLM una vista estructurada del árbol de accesibilidad del navegador, luego convierte las decisiones de acción del LLM en comandos Playwright. Soporta GPT-4o, Claude, Gemini y LLMs compatibles, tiene licencia MIT y requiere unas 20 líneas de Python para un agente funcional.

### ¿Cuáles son los riesgos de seguridad de los agentes browser use?

Tres riesgos principales: inyección de prompt vía contenido web (una demo de 2025 mostró robo de credenciales en 150 segundos), fuga de credenciales (si las cookies de sesión están en la memoria del proceso del agente) y excessive agency (OWASP LLM08:2025). También se ha demostrado exfiltración por previsualización de enlace en cero clics.

### ¿Cómo se ejecutan agentes navegador de forma segura?

Se requieren cuatro controles: aislamiento de contenedores, credenciales guardadas en bóveda, controles de egress de red y límites de presupuesto por agente. OpenLegion no incluye automatización de navegador en el lanzamiento, pero aplica los mismos cuatro controles a cada acción de agente: una ejecución en sandbox por tarea, credenciales en bóveda, sin red desde el código en sandbox y un presupuesto de créditos por agente.

### ¿Qué es Camoufox y lo usa OpenLegion?

Camoufox es un navegador headless basado en Firefox que parchea las APIs JavaScript para presentar perfiles de hardware realistas en lugar de firmas headless. OpenLegion no ejecuta Camoufox, ni ninguna otra automatización de navegador, en el lanzamiento; su aislamiento viene de una ejecución en sandbox por tarea sin acceso a red por defecto.

### ¿Cuál es la diferencia entre browser-use y Playwright para agentes IA?

Playwright es una biblioteca de automatización de bajo nivel sin concepto de agente IA. browser-use añade una capa de agente: convierte el estado del navegador a formato legible por LLM, traduce acciones LLM a comandos Playwright y gestiona la descomposición de tareas multi-paso entre páginas.

### ¿Pueden los agentes browser use manejar inicio de sesión y sesiones autenticadas?

Sí, pero el manejo de sesiones autenticadas es una de las operaciones de mayor riesgo. OpenLegion guarda las credenciales en una bóveda y las inyecta fuera del modelo, que solo retiene un identificador.

### ¿Cómo manejan los agentes navegador los CAPTCHA?

Tres enfoques: navegadores de comportamiento (resistencia a huellas), servicios de resolución ($1–3 por 1.000, latencia 10–60 segundos) y fallback human-in-the-loop. OpenLegion no tiene automatización de navegador en el lanzamiento; su equivalente human-in-the-loop es un muro de aprobación donde decide un propietario o administrador.
