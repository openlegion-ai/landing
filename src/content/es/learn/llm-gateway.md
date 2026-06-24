---
title: "LLM Gateway: enrutamiento, autenticación y control de costes para agentes IA"
description: "Un LLM gateway enruta las solicitudes de agentes IA entre proveedores de modelos, aplica límites de tasa, inyecta credenciales sin exponerlas al código agente y atribuye costes de tokens por agente."
slug: /learn/llm-gateway
primary_keyword: llm gateway
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /comparison/litellm
  - /learn/ai-agent-mcp-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-monitoring
  - /learn/llm-cost-optimization
  - /learn/ai-agent-security
---

# LLM Gateway: enrutamiento, autenticación y control de costes para agentes IA

Un LLM gateway es un reverse-proxy HTTP posicionado entre los procesos de agentes IA y los endpoints de proveedores de modelos aguas arriba, operando como el plano de datos para todo el tráfico de inferencia saliente. Resuelve handles de claves opacas en la capa de red antes del reenvío, aplica cuotas de limitación por tenant mediante contadores de ventana deslizante, emite telemetría de gasto OpenTelemetry por solicitud y abre disyuntores cuando la latencia P99 aguas arriba supera los umbrales configurados — sin requerir ningún cambio en el código de aplicación del agente. Cualquier flota que ejecute tres o más consumidores de inferencia concurrentes debería desplegar uno.

<!-- SCHEMA: DefinitionBlock -->

> Un **LLM gateway** es un reverse-proxy HTTP situado en el plano de datos entre los procesos de agentes IA y los endpoints de proveedores de modelos, proporcionando resolución de claves opacas en la capa de red, aplicación de cuotas por tenant mediante contadores de ventana deslizante, telemetría de gasto OpenTelemetry por solicitud y conmutación por error con disyuntores — todo como primitivas de infraestructura invisibles para el código de aplicación.

## El problema del plano de datos en la inferencia multi-agente

Sin un plano de datos de inferencia dedicado, cada proceso agente gestiona sus propias conexiones aguas arriba: resolución de claves desde el estado del entorno, sin cuota por proceso, sin telemetría por solicitud y sin visibilidad sobre si el endpoint aguas arriba está degradado. Con dos agentes es manejable. Con veinte, produce cuatro modos de fallo distintos.

### Exfiltración de claves mediante introspección del entorno

Cada proceso agente que mantiene una clave de proveedor en texto plano en su entorno está a una instrucción adversa de filtrarla. La superficie de ataque es el propio entorno del proceso: `os.environ`, `/proc/self/environ` en hosts Linux, trazas de error detalladas que serializan el estado del proceso, y configuraciones de log de depuración que capturan cabeceras HTTP salientes incluyendo campos Authorization.

Los ataques de inyección de prompt que causan que los agentes hagan eco del estado del entorno son una clase de ataque documentada contra agentes que mantienen claves en texto plano (OWASP LLM01:2025). La corrección estructural no es una mejor validación de entrada: es eliminar completamente la clave en texto plano del proceso agente. Un LLM gateway que resuelve handles opacos (`$CRED{openai}`) en la capa de red antes de que se escriba la cabecera Authorization significa que el proceso agente nunca mantiene material que pueda ser exfiltrado.

OpenLegion implementa esto a nivel de infraestructura: los handles `$CRED{}` se resuelven en el límite del host mesh. Los contenedores de agentes son estructuralmente incapaces de alcanzar el valor resuelto — no porque se les indique que no lo hagan, sino porque la resolución ocurre fuera de su espacio de direcciones.

### Agotamiento de cuotas por limitación de claves compartidas

Los proveedores de modelos aguas arriba limitan a nivel de clave API. En una flota donde veinte procesos agente comparten una clave, un único proceso emitiendo solicitudes a 10 veces su tasa esperada — ya sea mediante una tormenta de reintentos, un bucle descontrolado o una carga útil de inyección de prompt que causa llamadas de inferencia ilimitadas — puede llevar la clave a territorio de limitación para los otros diecinueve.

Un gateway aplica cuotas por tenant utilizando un contador de ventana deslizante indexado en el identificador de agente. Cuando el contador de un agente alcanza el techo configurado, el gateway responde con HTTP 429: no se envía ninguna solicitud aguas arriba, no se consume ninguna cuota del proveedor, y los agentes hermanos no se ven afectados.

La cuota por agente es también la medida de mitigación estructural para OWASP LLM10:2025 (Consumo no acotado) — el patrón donde instrucciones adversas causan que un agente emita llamadas de inferencia ilimitadas.

### Observabilidad aguas arriba ausente

Sin un plano de datos de inferencia, la telemetría por solicitud requiere instrumentación dentro de cada proceso agente. Esto es tanto redundante como inconsistente. Un gateway emite registros de log OTLP OpenTelemetry por solicitud en la capa de red, capturando: identificador de agente, endpoint aguas arriba, nombre del modelo, recuento de tokens de entrada, recuento de tokens de salida, tokens de cache-hit, estado de respuesta HTTP y duración de la solicitud.

El registro de gasto por solicitud — `tokens_entrada × precio_por_1k_entrada + tokens_salida × precio_por_1k_salida` — se acumula en un libro mayor de gastos por agente. Este libro mayor soporta techos de gasto diarios y mensuales, así como alertas de anomalías de gasto.

### Degradación aguas arriba invisible

Los endpoints de proveedores se degradan. La latencia de cola P99 en GPT-4o durante eventos de capacidad puede alcanzar 12 segundos (benchmark de infraestructura de OpenLegion, junio de 2026). Sin un disyuntor en el plano de datos, cada agente de la flota absorbe esta degradación en cada solicitud.

Un gateway con un disyuntor rastrea tasas de error y latencia P99 por endpoint. Cuando se supera un umbral de fallo configurable — por ejemplo, cinco respuestas 5xx consecutivas o P99 superando 8 segundos en una ventana de 30 segundos — el circuito se abre: las solicitudes posteriores se redirigen inmediatamente al endpoint de respaldo configurado.

El benchmark de junio de 2026 de OpenLegion midió la topología GPT-4o primario → Claude 3.5 Sonnet de respaldo: P99 bajó de 12 segundos a 3,1 segundos (3,9×) sin ninguna modificación del código del agente.

## Arquitectura del gateway: plano de datos vs. plano de control

### El plano de datos: aplicación por solicitud

Cada solicitud de inferencia atraviesa el plano de datos en secuencia:

1. **Terminación TLS**: el proceso agente se conecta al gateway mediante TLS. Para despliegues mTLS, el agente también presenta un certificado. mTLS elimina la necesidad de tokens de autenticación por solicitud entre agente y gateway.

2. **Resolución de identidad de carga de trabajo**: el gateway mapea la carga de trabajo conectada a una identidad de tenant. En despliegues mTLS, el SPIFFE SVID incrustado en el certificado cliente porta la identidad.

3. **Resolución de handle opaco**: el gateway inspecciona la cabecera Authorization saliente en busca de patrones de handles `$CRED{}`. Los handles coincidentes se resuelven contra el store de secretos del gateway.

4. **Verificación de cuota**: el gateway incrementa el contador de ventana deslizante del tenant. Si el contador supera el techo, el gateway devuelve 429 con cabeceras `Retry-After`. No se abre ninguna conexión aguas arriba.

5. **Verificación del disyuntor**: el gateway evalúa el estado del circuito del endpoint objetivo. Si el circuito está abierto, la solicitud se redirige inmediatamente al respaldo.

6. **Despacho aguas arriba**: el gateway abre una conexión desde su propio pool al endpoint aguas arriba y transmite la respuesta de vuelta.

7. **Emisión de telemetría**: al completar la respuesta, el gateway escribe un registro de log OTLP.

Sobrecarga total en el camino caliente: 0,7–2,1 ms. En el camino frío (cache miss): 2,6–6,6 ms. Con latencia de inferencia del proveedor de 500 ms–30 s, la sobrecarga del camino caliente es inferior al 0,5 % del tiempo de ida y vuelta total.

### El plano de control: configuración y política

El plano de control rige el comportamiento del plano de datos. Responsabilidades clave:

**Configuración de identidad de tenant y cuota**, **Topología de endpoints**, **Ámbito de permiso de handles**: qué identidades de tenant pueden resolver qué handles. Un tenant con ámbito `openai:read` puede resolver `$CRED{openai}` pero no `$CRED{anthropic}`. Esto previene el movimiento lateral entre tenants.

**Política de auditoría**: qué campos aparecen en los registros de log OTLP.

La API del plano de control no debería ser accesible desde redes del lado del agente. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, parcheado en v1.83.0) demostró qué ocurre cuando la ruta de escritura de configuración del plano de control es accesible por red sin autorización suficiente.

## Topologías de despliegue

### Entrada centralizada

Un único clúster de gateway maneja todo el tráfico de inferencia saliente de la flota de agentes. Adecuado para flotas de hasta aproximadamente 50 agentes donde la simplicidad operativa tiene prioridad.

### Patrón sidecar

Cada contenedor de agente ejecuta un proceso gateway en su interfaz loopback. El dominio de fallo es un contenedor de agente. Adecuado para flotas grandes (50+ agentes) donde el aislamiento de fallos por agente es la prioridad.

### Proxy nativo al mesh

En OpenLegion, el proxy de inferencia es un servicio mesh. El modelo nativo al mesh gestiona la identidad de carga de trabajo de forma nativa: cada contenedor de agente recibe una identidad emitida por el mesh en el momento del arranque.

## La posición de OpenLegion

El conjunto de características del LLM gateway — mTLS, aplicación de cuota de ventana deslizante, telemetría de gasto OTLP, conmutación por error con disyuntor — no es infraestructura opcional para flotas multi-agente. Es el plano de datos mínimo viable.

Tres mediciones de las pruebas de infraestructura de OpenLegion de junio de 2026 cuantifican lo que está en juego:

**Latencia de cola P99 sin conmutación por error**: 12 segundos en despliegues solo con GPT-4o durante eventos de capacidad del proveedor. Con Claude 3.5 Sonnet como respaldo de disyuntor: 3,1 segundos. La mejora de 3,9× no requirió ningún cambio en el código de aplicación del agente.

**Superficie de exfiltración de claves**: en una flota de 20 agentes donde todos mantienen claves en texto plano, un único agente comprometido por inyección de prompt (OWASP LLM01:2025) puede exfiltrar claves. En una flota mediada por gateway con resolución de handle opaco, el mismo agente comprometido no mantiene material que pueda ser exfiltrado.

**Cobertura OWASP LLM**: la aplicación de cuota por tenant en el gateway aborda LLM10:2025 (Consumo no acotado). La aplicación de ámbito de handle aborda LLM06:2025 (Agencia excesiva).

Para equipos que evalúan [patrones de gestión de credenciales para agentes IA](/learn/credential-management-ai-agents), la resolución de handle opaco del gateway es la implementación a nivel de despliegue del patrón vault-proxy descrito allí.

## Comparación de LLM gateways

| **Capacidad** | **Auto-hospedado (LiteLLM)** | **OpenAI nativo** | **OpenLegion mesh proxy** |
|---|---|---|---|
| **Modelo de resolución de claves** | Store de claves Postgres | Servicio gestionado | Handle opaco → vault en capa de red |
| **Identidad de carga de trabajo mTLS** | No soportado | No soportado | SPIFFE SVID por contenedor agente |
| **Aplicación de cuota** | Basado en configuración, por clave | Límites por org | Contador de ventana deslizante, por tenant |
| **Conmutación por error con disyuntor** | Basado en plugin | No disponible | Nativo, con sonda half-open |
| **Telemetría de gasto OTLP** | Parcial | No exportada | Por solicitud, todos los campos |
| **Aislamiento del plano de control** | Manual; expuesto por defecto | Gestionado | Solo subred mesh privada |
| **Historial CVE (2024–2026)** | GHSA-53mr-6c8q-9789 + otros | Ninguno público | Ninguno |

## Seleccionar un gateway para su flota

### mTLS vs. autenticación por bearer token

mTLS (mutual TLS) autentica tanto el cliente (agente) como el servidor (gateway) en la capa de handshake TLS, antes de que se intercambie ningún payload HTTP. El certificado cliente porta un SPIFFE SVID — una identidad de carga de trabajo verificable criptográficamente. No se transmite ningún bearer token en cabeceras.

Para flotas multi-agente en producción, mTLS con SVIDs emitidos por SPIFFE es el modelo de autenticación correcto. Elimina completamente la superficie de gestión de tokens.

### Contadores de cuota de ventana deslizante vs. ventana fija

Los contadores de ventana fija se reinician en límites de reloj. Un agente puede hacer burst al doble de su tasa nominal. Los contadores de ventana deslizante mantienen un recuento continuo sobre un intervalo de tiempo continuo sin límites de reloj que explotar. Para cargas de trabajo de inferencia, la aplicación de ventana deslizante es el modelo correcto.

### Requisitos de granularidad de telemetría

Los registros OTLP por solicitud son el mínimo para una observabilidad de flota útil. Evalúe si el gateway proporciona estos campos en cada registro: `agent_id`, `model_id`, `input_tokens`, `output_tokens`, `cache_tokens`, `upstream_latency_ms`, `upstream_status`. Los gateways que agregan telemetría no pueden soportar la detección de anomalías de gasto por agente.

## Comenzar

**Despliega flotas de inferencia multi-agente con identidad de carga de trabajo mTLS, aplicación de cuota de ventana deslizante y telemetría de gasto OTLP por solicitud.**
[Comenzar en OpenLegion](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai) | [Comparar LiteLLM vs OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué es un LLM gateway?

Un LLM gateway es un reverse-proxy HTTP posicionado en el plano de datos entre los procesos de agentes IA y los endpoints de proveedores de modelos aguas arriba. Resuelve handles de claves opacas en la capa de red (los procesos agente nunca mantienen claves en texto plano), aplica límites de cuota de ventana deslizante por tenant antes del despacho aguas arriba, emite telemetría de gasto OpenTelemetry por solicitud y abre disyuntores cuando los endpoints aguas arriba superan los umbrales configurados. Estas funciones operan como primitivas de infraestructura que no requieren cambios en el código de aplicación del agente.

### ¿Necesito un LLM gateway si solo uso un proveedor de modelos?

Las flotas de un solo proveedor se benefician de tres funciones del gateway: resolución de handle opaco, aplicación de cuota por tenant y telemetría de gasto OTLP por solicitud. La sobrecarga del camino caliente es de 0,7–2,1 ms — negligible frente a la latencia de inferencia del proveedor de 500 ms a 30 segundos.

### ¿Cómo funciona la conmutación por error con disyuntor en un LLM gateway?

El gateway rastrea tasas de error y latencia P99 por endpoint dentro de ventanas de observación deslizantes. Cuando se supera un umbral de fallo configurable — por ejemplo, cinco respuestas 5xx consecutivas, o P99 superando 8 segundos en una ventana de 30 segundos — el circuito se abre: todas las solicitudes posteriores se reenvían inmediatamente al endpoint de respaldo configurado. Después de un período de enfriamiento, el gateway despacha una sonda half-open al primario. Una sonda exitosa cierra el circuito; una sonda fallida reinicia el enfriamiento. El benchmark de junio de 2026 de OpenLegion midió una reducción de P99 de 12 segundos a 3,1 segundos en una topología GPT-4o → Claude 3.5 Sonnet.

### ¿Qué es mTLS y por qué importa para los LLM gateways?

mTLS (mutual TLS) autentica tanto el proceso agente que se conecta como el gateway en la capa de handshake TLS, antes de que se intercambie ningún payload HTTP. El agente presenta un certificado cliente portando un SPIFFE SVID — una identidad de carga de trabajo verificable criptográficamente. No se transmite ningún bearer token en cabeceras HTTP; no se necesita emitir, distribuir ni rotar ningún token. La identidad de carga de trabajo derivada del SVID impulsa la aplicación del ámbito de handle.

### ¿Cuál es la diferencia entre la aplicación de cuota de ventana deslizante y ventana fija?

Los contadores de ventana fija se reinician en límites de reloj. Un agente puede hacer burst al doble de su tasa nominal solicitando a máxima velocidad en los últimos segundos de una ventana y los primeros segundos de la siguiente. Los contadores de ventana deslizante mantienen un recuento continuo sin límites de reloj que explotar. Para cargas de trabajo de inferencia, la aplicación de ventana deslizante es el modelo correcto.

### ¿En qué se diferencia la telemetría OTLP por solicitud del reporting de gasto agregado?

Los registros OTLP OpenTelemetry por solicitud capturan campos individuales en cada llamada de inferencia: identificador de agente, variante de modelo, tokens de entrada, tokens de salida, tokens de cache-hit, latencia aguas arriba y estado HTTP. Estos registros se acumulan en libros mayores de gasto por agente que soportan techos de presupuesto diarios y mensuales, así como la detección de anomalías de gasto. Los informes de gasto agregados no pueden soportar la detección de anomalías.

### ¿Qué no debería exponer el plano de control del gateway a las redes del lado del agente?

El plano de control gestiona la configuración de cuotas, la topología de endpoints, los ámbitos de permiso de handles y la política de auditoría. Debería desplegarse en una subred privada sin ruta de acceso externa. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, parcheado en v1.83.0) documentó autorización insuficiente en la API de gestión. Las redes del lado del agente solo deberían alcanzar el puerto del plano de datos del gateway.

### ¿Cómo calibrar los umbrales del disyuntor para mi flota?

Recopile histogramas de latencia P50, P95 y P99 por endpoint de proveedor durante dos a cuatro semanas de tráfico de producción. El umbral de apertura del disyuntor debería fijarse en un valor P99 claramente degradado respecto al SLA normal del proveedor — típicamente 2–3× el P99 mediano. El período de enfriamiento antes de la sonda half-open debería superar el tiempo de recuperación típico del proveedor — 30–60 segundos es una línea base razonable.
