---
title: "Gestão de credenciais para agentes IA: Arquitetura vault-proxy"
description: "Arquitetura vault-proxy para agentes IA: injete segredos no servidor, isole por agente, audite cada acesso e evite o antipadrão env-var que expôs chaves nos CVE-2024-34359 e CVE-2025-29927."
slug: /learn/credential-management-ai-agents
primary_keyword: credential management ai agents
last_updated: "2026-06-11"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-security
  - /learn/model-context-protocol
  - /learn/ai-agent-orchestration
  - /learn/multi-agent-systems
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
---

# Gestão de credenciais para agentes IA: Arquitetura vault-proxy

A gestão de credenciais para agentes IA é o conjunto de práticas de infraestrutura que regulam como agentes autônomos obtêm, usam, rotacionam e liberam chaves de API e segredos sem que as credenciais apareçam na memória do agente, nos logs ou nas janelas de contexto. Os agentes quebram os padrões convencionais de credenciais: funcionam de forma autônoma, podem ser comprometidos via injeção de prompt e operam em frotas onde um segredo compartilhado multiplica a superfície de exfiltração. CVE-2024-34359 (llama-cpp-python, CVSS 9,6) e CVE-2025-29927 (Next.js, CVSS 9,1) demonstraram como implantações de IA expõem segredos quando as fronteiras de segurança falham.

<!-- SCHEMA: DefinitionBlock -->
A gestão de credenciais para agentes IA é o conjunto de práticas e padrões de infraestrutura que regulam como agentes autônomos obtêm, usam, rotacionam e liberam chaves de API, tokens e segredos sem que essas credenciais apareçam na memória do agente, nos logs ou nas janelas de contexto.

## Por que os padrões convencionais de credenciais falham em frotas de agentes

### O problema do arquivo .env em escala

Variáveis de ambiente funcionam bem para aplicações de processo único. Para frotas de agentes, o modelo falha imediatamente. Um arquivo `.env` compartilhado em uma frota de 10 agentes significa que 10 processos em execução mantêm cada segredo na memória. Cada processo gera logs, saídas de erro e rastreamentos de depuração, todas superfícies potenciais de exposição de credenciais. Se qualquer um desses 10 agentes for comprometido por um ataque de injeção de prompt que o instrua a imprimir seu ambiente, cada credencial no `.env` compartilhado vaza simultaneamente.

O multiplicador N-agentes é o problema central: cada agente adicional na frota adiciona outra superfície de exposição para cada credencial compartilhada. Uma frota de 20 agentes com 5 chaves de API no `.env` cria 100 pontos potenciais de exposição de credenciais antes de considerar agregação de logs, relatórios de erros ou ferramentas de depuração que podem capturar snapshots do ambiente.

### O histórico de CVEs sobre segredos em texto simples em aplicações de IA

Dois CVEs documentam o custo real do manuseio inseguro de segredos em sistemas de IA implantados:

**CVE-2024-34359** (llama-cpp-python, CVSS 9,6 Crítico): injeção de template Jinja2 no lado do servidor via renderização sem sandbox de metadados de modelo no `llama-cpp-python`. O campo de template de chat de um arquivo `.gguf` maliciosamente criado era renderizado via `jinja2.Environment` sem sandbox, permitindo execução remota de código. Qualquer aplicação que carregue modelos não confiáveis, incluindo pipelines de agentes que baixam modelos de fontes externas, está no escopo. O problema estrutural é que o código de carregamento de modelos confiava no conteúdo externo sem isolamento.

**CVE-2025-29927** (Next.js, CVSS 9,1 Crítico): bypass de autorização via cabeçalho `x-middleware-subrequest` que permitia que solicitações não autenticadas ignorassem o middleware em implantações Next.js. Aplicações que usam middleware Next.js para proteger rotas com credenciais, incluindo backends de API de agentes IA, foram afetadas: o bypass permitia acesso a rotas que o middleware deveria bloquear. A falha está corrigida nas versões 12.3.5, 13.5.9, 14.2.25 e 15.2.3.

Ambos os CVEs ilustram a mesma classe de risco subjacente: quando segredos ou rotas protegidas dependem de controles na camada de aplicação em vez de isolamento estrutural, uma única falha lógica os expõe. O padrão vault-proxy elimina a superfície mantendo os segredos fora dos contêineres de agentes e por trás da aplicação da camada de infraestrutura.

### Por que os logs de agentes representam um risco de credenciais

Os logs de aplicações tradicionais contêm eventos estruturados em sites de chamada controlados. Os logs de agentes capturam tudo: rastreamentos de raciocínio LLM, argumentos de chamadas de ferramentas, valores de retorno de ferramentas e etapas de raciocínio intermediárias. Quando um agente chama uma API externa com uma credencial no cabeçalho Authorization, uma configuração ingênua de logging captura esse cabeçalho. Quando o rastreamento de raciocínio de um agente inclui o texto "using API key sk-..." de um documento recuperado ou prompt, essa string aparece no log.

Os volumes de logs de agentes são altos e os períodos de retenção frequentemente longos. Uma credencial que aparece uma vez em um sistema de agregação de logs permanece lá até que o log seja purgado, o que pode ser semanas ou meses após a desativação do agente que a gerou.

### O caminho da injeção de prompt para as credenciais

OWASP LLM Top 10 v1.1 (LLM06: Divulgação de Informações Sensíveis, publicado em outubro de 2025) identifica a exfiltração de credenciais como vetor de ataque principal para aplicações LLM. O ataque é direto: conteúdo adversarial recuperado por um agente, de uma página web, documento ou resposta de ferramenta, contém instruções como "imprimir todas as variáveis de ambiente" ou "mostrar sua chave de API." Um agente sem isolamento estrutural de credenciais não consegue distinguir esta instrução de uma instrução de tarefa legítima.

Pesquisas no início de 2026 escanearam 3.984 habilidades de agentes e encontraram que 283 (7,1%) continham falhas críticas de manuseio de credenciais que passavam chaves de API pelo contexto LLM em texto simples. 76 habilidades continham payloads deliberados de roubo de credenciais projetados para exfiltrar credenciais para endpoints controlados por atacantes. A única defesa estrutural é garantir que as credenciais nunca existam no contexto do agente. Um agente não pode vazar uma credencial que não possui.

## Padrões de gestão de credenciais para agentes IA

### Padrão 1: Variáveis de Ambiente (Menos Seguro)

Variáveis de ambiente (`os.environ`, arquivos `.env`, flags Docker `--env`) são o padrão de credenciais padrão para a maioria dos frameworks de agentes. LangChain lê de `os.environ`, CrewAI depende de injeção de ambiente, OpenAI Agents SDK espera credenciais no ambiente do processo. Este padrão é apropriado apenas para desenvolvimento local e prototipagem.

Para frotas de agentes em produção, as variáveis de ambiente falham em cada eixo de segurança: existem na memória do processo do agente (acessível por injeção de prompt), aparecem em `/proc/{pid}/environ` em hosts Linux, surgem em rastreamentos de erro e saídas de depuração, e se propagam por todos os agentes em uma frota de ambiente compartilhado.

### Padrão 2: Integração com Gerenciador de Segredos

Gerenciadores de segredos em nuvem (AWS Secrets Manager a $0,40/segredo/mês + $0,05 por 10.000 chamadas de API; Azure Key Vault; GCP Secret Manager) melhoram as variáveis de ambiente armazenando credenciais fora do processo do agente e recuperando-as sob demanda. O agente chama a API do gerenciador de segredos para buscar uma credencial, a usa para uma operação e a descarta.

Este padrão reduz o tempo de vida da credencial na memória, mas não elimina a janela de exposição: a credencial ainda passa pela memória do agente durante o ciclo de busca-uso-descarte. Permanece visível para injeção de prompt durante essa janela e requer que o agente mantenha uma segunda credencial (a chave de API do gerenciador de segredos ou o papel IAM) para acessar a primeira.

### Padrão 3: Vault Proxy / Injeção de Handle Opaco (Mais Seguro)

O padrão vault-proxy mantém as credenciais completamente fora dos contêineres de agentes. O agente mantém um handle opaco, uma string de referência como `$CRED{stripe_key}`, que identifica uma credencial sem resolvê-la. Quando o agente faz uma chamada de API que inclui o handle, o vault proxy intercepta a solicitação, resolve o handle para a credencial real, a injeta na camada de rede e encaminha a solicitação autenticada. O agente nunca vê a credencial em texto simples.

Este é o mesmo princípio que a injeção do lado do agente do HashiCorp Vault (35.763 estrelas, BSL, v2.0.2 lançado em 5 de junho de 2026), incorporado diretamente na camada de orquestração do agente. Com 700+ servidores MCP no ecossistema (junho de 2026), o padrão de handle `$CRED{}` elimina a proliferação de `.env` por servidor: uma referência de handle na configuração do agente cobre os requisitos de credenciais de qualquer servidor MCP.

Um contêiner de agente totalmente comprometido, executando instruções arbitrárias do atacante, tem acesso zero a credenciais porque nenhuma credencial existe dentro do alcance do contêiner.

### Padrão 4: Identidade de Carga de Trabalho e Federação OIDC

A identidade de carga de trabalho (federação OIDC, SPIFFE/SPIRE, contas de serviço IAM em nuvem) elimina completamente as chaves de API de longa duração para acesso a serviços em nuvem. Cada contêiner de agente recebe um token de identidade de curta duração trocado por uma credencial de provedor de nuvem em tempo de execução. A credencial tem um TTL delimitado, tipicamente 15 minutos a 1 hora, após o qual expira e um novo token deve ser emitido.

A identidade de carga de trabalho é o padrão correto para frotas de agentes executando em infraestrutura em nuvem onde credenciais de provedor de nuvem (chaves de API AWS, chaves de conta de serviço GCP) são necessárias. Requer que a plataforma de orquestração gerencie a emissão de identidade e a atualização de tokens, mas elimina completamente o problema de rotação de chaves estáticas. Para arquiteturas de [sistemas multi-agente](/learn/multi-agent-systems) que abrangem múltiplas contas ou provedores de nuvem, a federação de identidade de carga de trabalho é o único modelo de credenciais escalável.

## A visão da OpenLegion: o padrão de handle $CRED{}

Todo grande framework de agentes IA trata a gestão de credenciais como o problema da aplicação hospedeira. LangChain e LangGraph leem de `os.environ`. CrewAI depende de injeção de ambiente. OpenAI Agents SDK espera credenciais no ambiente do processo. AutoGen herda o ambiente do processo Python. Nenhum desses frameworks fornece isolamento estrutural de credenciais; deixam a gestão de credenciais para o operador, o que na prática significa arquivos `.env` e variáveis de ambiente compartilhadas.

O vault-proxy da OpenLegion é integrado à camada de orquestração do agente. Os agentes referenciam credenciais como handles opacos `$CRED{nome}`. O host mesh resolve os handles no lado do servidor e injeta credenciais na fronteira de rede. Nenhum contêiner de agente recebe uma credencial em texto simples. A injeção de prompt não pode exfiltrar o que não está presente.

Infisical (27.296 estrelas, plataforma de segredos TypeScript open source com núcleo sob licença MIT) captou $2,8M em financiamento inicial em 2023, sinalizando demanda de mercado por gestão de segredos nativa para desenvolvedores. A OpenLegion incorpora a mesma capacidade diretamente no agente runtime, sem necessidade de implantação separada de gestão de segredos.

| **Dimensão** | **OpenLegion** | **LangChain/LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **AutoGen** |
|---|---|---|---|---|---|
| **Armazenamento de credenciais** | Vault (handles opacos) | Ambiente / .env | Ambiente / .env | Ambiente / .env | Ambiente / .env |
| **Padrão de acesso do agente** | Handle $CRED{} -- nunca resolvido no contêiner | os.environ leitura direta | os.environ leitura direta | os.environ leitura direta | os.environ leitura direta |
| **Texto simples no contexto do agente?** | Nunca | Sim -- na leitura de os.environ | Sim -- na leitura de os.environ | Sim -- na leitura de os.environ | Sim -- na leitura de os.environ |
| **Suporte de rotação** | Nativo vault; rotação a quente sem reinicialização | Manual; requer reinicialização | Manual; requer reinicialização | Manual; requer reinicialização | Manual; requer reinicialização |
| **Escopo por agente** | Aplicado no nível mesh por lista de permissões | Não aplicado | Não aplicado | Não aplicado | Não aplicado |
| **Trilha de auditoria** | Cada resolução de handle registrada com ID do agente | Nenhuma nativa | Nenhuma nativa | Nenhuma nativa | Nenhuma nativa |

Para equipes avaliando a superfície total de exposição de credenciais de seu stack atual, o [modelo de ameaças de segurança de agentes IA](/learn/ai-agent-security) cobre o vazamento de credenciais como uma das seis categorias de ameaças documentadas, juntamente com injeção de prompt, escape de sandbox e abuso de orçamento.

## Rotação de segredos para frotas de agentes IA

### Arrendamentos de credenciais com TTL delimitado

Chaves de API estáticas, credenciais sem expiração, são as piores credenciais para frotas de agentes. Uma chave estática vazada permanece válida indefinidamente. A rotação de chaves requer coordenar todos os agentes que usam a chave, potencialmente durante tarefas ativas.

Os arrendamentos de credenciais com TTL delimitado resolvem ambos os problemas. A credencial é emitida com uma janela de expiração, 1 hora é comum para sessões interativas de agentes; 15 minutos para operações de alta sensibilidade. Quando o arrendamento expira, o vault emite automaticamente uma credencial nova. A credencial antiga é inválida após a expiração, limitando o valor de qualquer cópia vazada. As tarefas de agentes que abrangem múltiplas janelas de arrendamento recebem renovações transparentes sem interrupção.

O motor de segredos dinâmicos do HashiCorp Vault gera credenciais de curta duração para bancos de dados, provedores de nuvem e backends personalizados sob demanda. Cada credencial é única para o agente solicitante e expira após um TTL configurável. CVE-2026-39829 (golang/crypto, junho de 2026) corrigiu uma vulnerabilidade de DoS na análise de chave pública SSH causada por tamanhos de módulo RSA ilimitados; o Vault v2.0.2 abordou isso limitando chaves RSA a 8.192 bits. Mesmo infraestrutura vault construída especificamente para essa finalidade entrega CVEs, razão pela qual as camadas de abstração entre agentes e segredos brutos importam mesmo ao usar o Vault diretamente.

### Rotação a quente sem reinicialização do agente

A rotação tradicional de segredos de aplicações exige reiniciar o processo para adotar a nova credencial. As frotas de agentes não podem tolerar reinicializações forçadas: agentes podem estar no meio de uma tarefa, mantendo estado de trabalho perdido na reinicialização, ou coordenando com outros agentes em uma transferência de múltiplas etapas.

A rotação a quente injeta a nova credencial no vault sem tocar o contêiner de agente em execução. A próxima chamada de API do agente através do vault proxy usa a nova credencial de forma transparente. Do ponto de vista do agente, o handle `$CRED{nome}` ainda resolve; apenas o segredo subjacente mudou.

A rotação a quente exige que os agentes nunca armazenem credenciais em cache localmente. O padrão de handle `$CRED{}` aplica isso estruturalmente: os handles são resolvidos no momento da chamada, não na inicialização, portanto o cache local do valor resolvido nunca é possível.

### Escopo de rotação por agente

Em uma frota de credenciais compartilhadas, rotacionar uma credencial afeta todos os agentes que a usam. Um evento de rotação requer coordenação em toda a frota, criando um gargalo de coordenação e uma janela onde alguns agentes usam a credencial antiga e outros a nova.

O escopo de credenciais por agente torna a rotação ortogonal: rotacionar as credenciais do Agente A não afeta o Agente B, porque o Agente B mantém seu próprio escopo de credenciais separado. Isso só é alcançável quando a camada de orquestração aplica o escopo por agente em vez de depender de arquivos `.env` compartilhados. Para designs de [fluxos de trabalho agênticos](/learn/agentic-workflows) que encadeiam múltiplos agentes especializados, o escopo de rotação por agente é essencial para a higiene de credenciais sem tempo de inatividade.

## Isolamento de credenciais entre agentes

### Atribuição de credenciais por agente

Cada agente em uma frota deve manter apenas as credenciais que sua tarefa específica requer. Um agente de web scraping precisa de acesso a uma credencial de cliente HTTP, mas não de uma string de conexão de banco de dados. Um agente de análise de dados precisa de acesso de leitura a um data warehouse, mas não de tokens de escrita para APIs externas. Um agente de publicação precisa de acesso de escrita a um CMS, mas não de acesso a bancos de dados internos.

A atribuição de credenciais por agente requer que a camada de orquestração aplique o escopo, não o agente em si. Um agente que solicita uma credencial para a qual não está autorizado deve receber uma negação na fronteira do vault, não silenciosamente receber a credencial porque estava presente em um `.env` compartilhado.

OWASP LLM06 (Divulgação de Informações Sensíveis) observa especificamente que credenciais de agentes super-provisionadas são um fator contribuinte para incidentes de vazamento de credenciais: os agentes recebem mais acesso do que sua tarefa requer, portanto quando comprometidos, o raio de explosão é maior do que o necessário.

### Escopo de credenciais do servidor de ferramentas MCP

Os servidores de ferramentas do Model Context Protocol frequentemente requerem suas próprias credenciais, chaves de API para os serviços que fazem proxy. Com 700+ servidores MCP no ecossistema (junho de 2026), o problema de gestão de credenciais na camada MCP não é mais teórico: cada servidor é um vetor potencial de proliferação de `.env`. Na OpenLegion, as credenciais do servidor MCP são armazenadas no mesmo vault e injetadas pelo mesmo padrão proxy. O servidor de ferramentas MCP recebe solicitações autenticadas do proxy mesh em vez de credenciais brutas do agente.

Isso impede que um servidor MCP malicioso seja usado como vetor de coleta de credenciais. Um servidor MCP comprometido encontra apenas referências de handles em solicitações recebidas, não chaves brutas. Para o modelo completo de endurecimento da [segurança do Model Context Protocol](/learn/model-context-protocol), consulte o guia dedicado.

### Revogar credenciais na aposentadoria do agente

Quando um agente conclui sua tarefa ou é arquivado, suas credenciais devem ser revogadas imediatamente. Credenciais estáticas que sobrevivem ao agente associado criam acessos órfãos: chaves válidas sem trilha de auditoria associada, pertencentes a um processo que não está mais em execução.

A revogação de credenciais na aposentadoria do agente requer que a camada de orquestração rastreie eventos do ciclo de vida do agente e acione revogações no vault. O mesh da OpenLegion gerencia isso automaticamente: quando um agente é arquivado, o mesh revoga todos os handles de credenciais associados ao escopo desse agente. Para sistemas de [orquestração de agentes IA](/learn/ai-agent-orchestration) que gerenciam o ciclo de vida do agente programaticamente, a revogação de credenciais deve ser um evento de ciclo de vida de primeira classe, não uma reflexão operacional posterior.

## Trilhas de auditoria e registro de acesso a credenciais

### O que registrar (e o que não registrar)

Cada evento de acesso a credenciais deve produzir uma entrada de log contendo: o ID do agente que resolveu o handle, o nome do handle (não o valor resolvido), o timestamp, o endpoint externo visado pela solicitação autenticada e o resultado (sucesso ou falha de autorização). O que não registrar: o valor real da credencial, a string secreta resolvida ou qualquer derivado da credencial em texto simples. O nome do handle é suficiente para fins de auditoria e forenses.

### Correlacionar o uso de credenciais com as ações do agente

As trilhas de auditoria de agentes diferem das trilhas de auditoria de aplicações tradicionais: o caminho do código é não-determinístico. Uma aplicação tradicional segue um grafo de chamadas fixo; um agente pode tomar qualquer ação dependendo de seu prompt, saídas de ferramentas e raciocínio LLM. Os logs de auditoria de agentes devem capturar cada chamada de ferramenta e seus argumentos, não apenas acessos a credenciais, para reconstruir o contexto completo em torno de um evento suspeito de uso de credenciais.

O orquestrador da OpenLegion registra chamadas de ferramentas e resoluções de credenciais em um fluxo de eventos unificado. Uma análise forense pode reproduzir a sequência: tarefa recebida -> chamada LLM -> ferramenta selecionada -> credencial resolvida -> API externa chamada -> resposta recebida. Esta é a arquitetura correta para implantações de agentes IA em ambientes regulados ou de alto risco.

### Requisitos de auditoria para ambientes regulados

Para serviços financeiros, saúde e outros setores regulados, os logs de auditoria de credenciais de agentes devem atender a requisitos específicos: imutabilidade (logs não podem ser alterados após a criação), resistência a adulteração (integridade dos logs é verificável), conformidade com período de retenção (logs retidos pela duração requerida) e controles de acesso (apenas pessoal autorizado pode ler logs de auditoria). Esses requisitos se mapeiam diretamente para a arquitetura vault-proxy: o host mesh gera entradas de log de auditoria à medida que as credenciais são resolvidas, as grava em um armazenamento somente de acréscimo e assina as entradas para resistência a adulteração. Os contêineres de agentes nunca têm acesso ao armazenamento de logs de auditoria. Para decisões de [plataforma de agentes IA](/learn/ai-agent-platform), a arquitetura do log de auditoria é uma consideração de conformidade chave junto com a escolha do backend de segredos.

## Escolhendo um backend de segredos para sua plataforma de agentes

### HashiCorp Vault

HashiCorp Vault (35.763 estrelas, BSL, v2.0.2 lançado em 5 de junho de 2026) é o sistema de gerenciamento de segredos open source de referência. Ele fornece geração dinâmica de segredos, arrendamentos com TTL delimitado, políticas de acesso de granularidade fina, registro de auditoria abrangente e uma arquitetura de plugins para motores de segredos personalizados. Nota: a HashiCorp migrou da licença Apache 2.0 aprovada pela OSI para BSL (Business Source License) em agosto de 2023; BSL não é uma licença open source aprovada pela OSI e restringe o uso comercial por concorrentes do Vault.

O Vault é a escolha certa quando você precisa de um sistema autônomo de gerenciamento de segredos compartilhado por vários serviços. O overhead operacional não é trivial: o Vault requer sua própria implantação, configuração de alta disponibilidade e procedimentos de desbloqueio. Para frotas de agentes onde o Vault já está implantado como infraestrutura, integrar a gestão de credenciais de agentes ao motor de políticas do Vault é direto.

### Infisical

Infisical (27.296 estrelas, núcleo sob licença MIT, TypeScript open source) fornece uma plataforma de segredos nativa para desenvolvedores com interface web, CLI e SDK para gerenciamento de segredos, rotação e trilhas de auditoria. Captou $2,8M em financiamento inicial em 2023 e se posiciona como uma alternativa mais leve ao HashiCorp Vault para equipes que desejam gerenciamento de segredos sem a complexidade operacional do Vault ou as restrições de licença BSL.

Para frotas de agentes que ainda não executam o Vault, o Infisical vale a pena avaliar como backend de segredos. Seu design SDK-first se integra de forma limpa com os runtimes de agentes Python, e seu escopo por ambiente se mapeia naturalmente aos requisitos de escopo por agente.

### Nativo de Nuvem (AWS/Azure/GCP)

AWS Secrets Manager ($0,40/segredo/mês + $0,05 por 10.000 chamadas de API), Azure Key Vault e GCP Secret Manager fornecem armazenamento gerenciado de segredos com integração nativa aos sistemas IAM de cada provedor de nuvem. Se sua frota de agentes é executada inteiramente dentro de um único provedor de nuvem, o gerenciamento de segredos nativo de nuvem evita o overhead operacional de executar o Vault ou Infisical separadamente.

A limitação: os gerenciadores de segredos nativos de nuvem requerem credenciais IAM de nuvem para acesso, o problema da credencial de bootstrap. Um novo contêiner de agente precisa de alguma credencial para se autenticar no AWS Secrets Manager antes de poder recuperar suas credenciais operacionais. A identidade de carga de trabalho OIDC resolve esse problema de bootstrap para implantações nativas de nuvem.

<!-- SCHEMA: FAQPage -->
## Perguntas frequentes

### O que é gestão de credenciais para agentes IA?

A gestão de credenciais para agentes IA é o conjunto de práticas de infraestrutura que regulam como agentes autônomos obtêm, usam, rotacionam e liberam chaves de API, tokens e segredos. Os agentes diferem das aplicações tradicionais porque funcionam de forma autônoma, podem ser comprometidos via injeção de prompt, produzem logs detalhados e operam como frotas de múltiplas instâncias, tudo o que cria vetores de exposição de credenciais que os padrões convencionais de variáveis de ambiente não abordam. OWASP LLM Top 10 v1.1 (2025) lista a Divulgação de Informações Sensíveis (LLM06) como ameaça top-10, com exfiltração de credenciais como vetor de ataque principal.

### Quais CVEs se relacionam ao vazamento de credenciais de agentes IA?

CVE-2024-34359 (llama-cpp-python, CVSS 9,6) documentou uma vulnerabilidade de injeção de template Jinja2 no lado do servidor no pipeline de carregamento de modelos: o template de chat de um arquivo `.gguf` criado era renderizado sem sandbox, permitindo execução remota de código em qualquer aplicação que carregasse modelos não confiáveis. CVE-2025-29927 (Next.js, CVSS 9,1) demonstrou que o cabeçalho `x-middleware-subrequest` poderia ignorar a autorização de middleware em aplicações Next.js, incluindo backends de agentes IA que usavam middleware para proteger rotas com credenciais. Ambos os CVEs remontam a controles de segurança na camada de aplicação falhando sob entrada maliciosa; a solução estrutural é manter os segredos completamente fora dos contêineres de agentes.

### Como o padrão vault-proxy evita o vazamento de credenciais?

O vault proxy intercepta chamadas de API dos agentes, resolve handles de credenciais opacos para segredos reais na camada de rede e retorna a resposta autenticada sem que a credencial entre no contêiner ou na janela de contexto do agente. O agente mantém um handle como `$CRED{stripe_key}` que identifica o segredo sem resolvê-lo. Um contêiner de agente totalmente comprometido executando instruções arbitrárias do atacante ainda tem acesso zero a credenciais brutas, porque nenhuma credencial existe dentro do alcance do contêiner.

### Por que o isolamento de credenciais por agente é importante em sistemas multi-agente?

Em um sistema multi-agente, o raio de explosão de cada agente se comprometido é delimitado pelas credenciais que mantém. Se cada agente compartilha um único arquivo `.env` com todos os segredos, comprometer qualquer agente expõe todas as credenciais para todos os sistemas downstream. O escopo de credenciais por agente, aplicado na camada de orquestração e não no próprio código do agente, significa que um agente de pesquisa comprometido não pode acessar os tokens de escrita do agente de publicação ou as credenciais de banco de dados do agente de dados. OWASP LLM06 identifica explicitamente credenciais de agentes super-provisionadas como fator contribuinte para incidentes de vazamento de credenciais.

### O que o OWASP diz sobre gestão de credenciais para agentes IA?

OWASP Top 10 para Aplicações LLM v1.1 (publicado em outubro de 2025) lista a Divulgação de Informações Sensíveis como LLM06, identificando a exfiltração de credenciais como vetor de ataque principal para aplicações LLM. A orientação recomenda evitar armazenamento de credenciais em texto simples no contexto do agente, implementar escopo de credenciais com mínimo privilégio e usar controles da camada de infraestrutura em vez de depender do código do agente para proteger segredos. Injeção de prompt, OWASP LLM01 e o principal risco, é o vetor de ataque mais comum para acionar a divulgação de credenciais em agentes implantados.

### Como a OpenLegion gerencia credenciais para agentes executando servidores MCP?

Na OpenLegion, as credenciais do servidor de ferramentas MCP são armazenadas no vault e injetadas pelo mesmo padrão proxy que as credenciais dos agentes. O servidor MCP recebe solicitações autenticadas do proxy mesh em vez de credenciais brutas do agente; o agente nunca mantém as chaves de API upstream do servidor MCP. Com 700+ servidores MCP no ecossistema (junho de 2026), isso elimina a proliferação de `.env` por servidor: uma configuração de vault cobre todos os requisitos de credenciais MCP, e um servidor MCP comprometido não pode coletar credenciais brutas de solicitações recebidas.

### O que é rotação de segredos e por que os agentes IA precisam dela?

A rotação de segredos é a prática de substituir uma credencial por uma nova em uma base programada ou acionada, invalidando a antiga. Os agentes IA precisam de rotação porque operam por períodos prolongados (horas a dias), são alvos potenciais de exfiltração durante toda essa janela e não podem ser facilmente reiniciados no meio de uma tarefa para adotar credenciais rotacionadas. Os arrendamentos de credenciais com TTL delimitado expiram automaticamente após uma janela configurável (tipicamente 1 hora), e o padrão vault-proxy suporta rotação a quente, injetando o novo segredo sem tocar o contêiner de agente em execução, portanto a rotação é transparente para o agente.

## Construindo frotas de agentes sem exposição de credenciais

O problema de gestão de credenciais em frotas de agentes IA é arquitetônico: se as credenciais existem em contêineres de agentes, podem vazar. CVE-2024-34359 e CVE-2025-29927 demonstram que mesmo equipes bem equipadas executando frameworks importantes entregam essa exposição. O padrão vault-proxy resolve isso estruturalmente: as credenciais nunca entram em contêineres de agentes, portanto injeção de prompt, escape de contêiner ou exfiltração de logs não podem recuperá-las.

O vault-proxy da OpenLegion é integrado ao mesh de agentes. Configure uma credencial uma vez com `$CRED{nome}`, atribua-a aos agentes que precisam dela e o mesh gerencia injeção, renovação TTL, escopo por agente e registro de auditoria. Sem implantação separada de vault, sem coordenação de arquivos `.env`, sem procedimentos de rotação manual.

[Proteja sua frota de agentes com isolamento de credenciais vault-proxy na OpenLegion](https://openlegion.ai)
