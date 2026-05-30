---
title: Mastra代替プラットフォーム — セキュリティファーストAIエージェン基盤
description: Mastraはデュアルライセンス、専有ee/ディレクトリの山のRBAC、CVE-2025-61685による認証情報漏洩を持つTypeScriptフレームワーク。Mastra代替を比較。
slug: /comparison/mastra
primary_keyword: mastra 代替
secondary_keywords:
  - openlegion vs mastra
  - mastra セキュリティ
  - mastra typescript エージェント
  - mastra エンタープライズ
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---
# Mastra代替: セキュリティファースト基盤 vs TypeScriptフレームワーク

MastraはGatsbyチームによる24,329のGitHubスターを持つTypeScriptエージェントフレームワークです——しかしCVE-2025-61685（CVSS 6.5）はCursor IDEのプロンプトインジェクション経由で`~/.aws`の認証情報ファイルを公開し、RBACとAuthはApache 2.0では利用不可な専有`ee/`ディレクトリに閃かれており、オープンリダイレクトとOAuth CSRFの脆弱性が2026年5月現在も未修正です。セキュリティ重視チームに必要なMastra代替にはバウルトプロキシ隔離が必要です。

<!-- SCHEMA: DefinitionBlock -->

> **Mastraとは？**
> MastraはKepler Software（Gatsby開発チーム）によるオープンソースTypeScriptエージェントフレームワークで、2024年8月にリリースされ24,329のGitHubスターを持ちます。デュアルライセンスの下でJavaScriptおよびTypeScript開発者向けにワークフローオーケストレーション、ツール呼び出し、RAGプリミティブを提供します。
## Mastra代替を求める理由

### CVE-2025-61685: MCP Docsサーバー経由の認証情報漏洩

CVE-2025-61685（CVSS 6.5、2025年9月24日）は`@mastra/mcp-docs-server`バージョン≤0.13.8のディレクトリトラバーサル脆弱性です。Liran Talにより発見され、Cursor IDEからのプロンプトインジェクションにより`readMdxContent`のバリデーションをバイパスし、指定ディレクトリ外のファイルシステムパスにアクセスできます。

実質的な被害範囲は限定的ですが開発者マシンには深刻です：`~/.aws/credentials`、`~/.config/`（サービスアカウントトークン）、`~/.cursor/`（IDE設定）が公開されます。Mastraはバージョン0.17.0で修正しました。≤0.13.8のチームは引き続き脆弱性に暴露されています。

### デュアルライセンス: `ee/`ペイウォール山のセキュリティ機能

MastraのApache 2.0ライセンスはコアフレームワークに限定されます。Auth統合、RBAC、アダプターアクセス制御を含む`ee/`ディレクトリは専有財産です。

**RBACはエンタープライズ機能です。** 特定のエージェントの権限を制御するには`ee/`アップグレードが必要です。

**Auth統合は専有財産です。** `ee/`ディレクトリはWorkOS AuthKit（`@workos/authkit-session`）と`better-auth` OAuthフローを含みます。

### エンタープライズ Authスタックの未マージPRs

**CVE-2026-42565（CVSS 4.3）**: `@workos/authkit-session`のオープンリダイレクト。信頼できるドメインリダイレクトチェーン経由のフィッシングを可能にします。

**GHSA-wxw3-q3m9-c3jr（CVSS 5.3）**: `better-auth`のOAuth CSRF。OAuthコールバック処理に未修正のCSRF脆弱性があります。
## OpenLegionの見解: 3つの構造的セキュリティギャップ

**設計による認証情報漏洩。** Mastraエージェントは環境変数として認証情報を受け取ります。CVE-2025-61685は周辺のツールチェーンがエージェントコードがクリーンであっても認証情報にアクセスできることを示しました。OpenLegionのバウルトプロキシはネットワーク層で認証情報を注入します。エージェントプロセスは平文APIキーを受け取ることはありません。

**セキュリティのエンタープライズアップグレード。** RBAC、アダプターアクセス制御、Auth統合は専有`ee/`ティアが必要です。OpenLegionのバウルトプロキシとブラックボード権限は全ユーザーへのコア機能です。

**有料ティアに未修正のAuth脆弱性。** CVE-2026-42565とGHSA-wxw3-q3m9-c3jrはエンタープライズ`ee/`ディレクトリのAuth依存進にあります。OpenLegionのZero CVE実績（2026年5月時点）は認証情報をエージェントが保持しないアーキテクチャを反映しています。

## Mastra vs OpenLegion: 比較表

| **項目** | **Mastra** | **OpenLegion** |
|---|---|---|
| **言語サポート** | TypeScriptのみ | Python（エージェント）; 任意言語のツールインターフェース |
| **ライセンス** | Apache 2.0 (コア) + 専有`ee/` | BSL 1.1 → 4年後Apache 2.0 |
| **GitHubスター** | 24,329 (2026年5月) | プレリリース |
| **認証情報モデル** | 環境変数 — エージェントがキーを保持 | バウルトプロキシ — エージェントはキーを保持しない |
| **エージェント隔離** | プロセスレベル | 必須Dockerコンテナ |
| **RBAC** | 専有`ee/`ティアのみ | エージェントごとブラックボード権限 (全ユーザー) |
| **CVE履歴** | CVE-2025-61685 (CVSS 6.5) + 2つのオープンPR | 0 CVE報告 |
| **Auth** | WorkOS AuthKit / better-auth (`ee/`のみ) | バウルトプロキシ (Auth層不要) |
| **ブッジェット制御** | なし | エージェントごと日次/月次上限 |
| **マルチエージェント** | ワークフローオーケストレーション | Blackboard + pub/sub + mesh handoff |
| **オープンIssues** | 433 (2026年5月26日) | プレリリース |

## TypeScriptのみ: 実務上の意味

MastraはTypeScript-firstの設計で現在TypeScriptのみです。PythonドライバーヒーロやPython ML/データインフラが必要なチームには適していません。OpenLegion、LangGraph、CrewAI、AutoGenは全てPythonをネイティブにサポートしています。

TypeScriptフルスタックのチームにとってMastraの開発者体験は優れています。ツールスキーマの型推論、Node.jsエコシステムとの密接な統合、馴染みの`async/await`パターンが自然な開発体験を提供します。

## セキュリティアーキテクチャ: バウルトプロキシ vs 環境変数

Mastraエージェントは`process.env`経由でLLM APIキーとサービス認証情報を受け取ります。CVE-2025-61685は`@mastra/mcp-docs-server`のディレクトリトラバーサルが`~/.aws/credentials`に到達できることを示しました。

OpenLegionのバウルトプロキシはエージェントとLLMプロバイダーの間のネットワーク層に位置します。エージェントプロセスは認証情報文字列を受け取ることはありません。詳しい分析は[AIエージェントセキュリティ: 認証情報隔離とコンテナハードニング](/learn/ai-agent-security)を参照してください。

## Mastra代替としてのOpenLegion

### OpenLegionプラットフォームの提供内容

Blackboard状態、pub/subイベント、mesh handoffによるマルチエージェント協調。バウルトプロキシ認証情報注入。Docker層別隔離・非ルート実行。日次/月次予算上限。LiteLLM経由の100+LLMプロバイダー。

**正直なトレードオフ**: TypeScript SDKなし—Pythonのみ。Mastraの24,329スターより小さいコミュニティ。

[AIエージェントプラットフォームがフレームワークを超えて提供するもの](/learn/ai-agent-platform)も専覧しています。また[OpenLegion vs LangGraph](/comparison/langgraph)、[OpenLegion vs CrewAI](/comparison/crewai)、[OpenLegion vs AutoGen](/comparison/autogen)もご覧ください。[AIエージェントフレームワーク比較2026](/learn/ai-agent-frameworks)で全体像を確認できます。

<!-- SCHEMA: FAQPage -->

## よくある質問

### Mastraとは何ですか。誰が作ったのですか？

MastraはKepler Software（Gatsby開発チーム）による24,329のGitHubスターを持つTypeScriptエージェントフレームワークで、2024年8月から開発されています。デュアルライセンスの下でTypeScript開発者向けにワークフローオーケストレーション、ツール呼び出し、RAGプリミティブを提供します。

### CVE-2025-61685とは？

CVE-2025-61685（CVSS 6.5、2025年9月24日）は`@mastra/mcp-docs-server`≤0.13.8のディレクトリトラバーサル脆弱性でLiran Talが発見しました。Cursor IDEからのプロンプトインジェクションにより`readMdxContent`のバリデーションをバイパスし、`~/.aws/credentials`、`~/.config/`、`~/.cursor/`ファイルを公開します。Mastraはバージョン0.17.0で修正しました；≤0.13.8でMCP docsサーバーが有効なチームは露出し続けます。

### MastraにフリーティアのRBACはありますか？

いいえ。RBAC、アダプターアクセス制御、Auth統合はMastraの専有`ee/`ディレクトリにあり、Apache 2.0オープンソースライセンスでは利用できません。OpenLegionはエージェントごとのブラックボード権限とバウルトプロキシ隔離を全ユーザーへのコアプラットフォーム機能として提供します。

### 2026年5月時点でのMastraの未修正セキュリティ問題は？

Mastraのエンタープライズ認証スタックに2つのセキュリティPRが未マージのまま残っています：CVE-2026-42565（CVSS 4.3、`@workos/authkit-session`のオープンリダイレクト）とGHSA-wxw3-q3m9-c3jr（CVSS 5.3、`better-auth`のOAuth CSRF）。2026年5月26日時点でどちらもマージされていません。

### TypeScript開発者はOpenLegionを使えますか？

OpenLegionエージェントはPythonのみです。TypeScriptチームはPythonエージェントを実行するか、OpenLegion APIを呼び出すTypeScriptツールを構築する必要があります——ネイティブTypeScript SDKはありません。セキュリティ隔離要件が言語の好みを上回る場合にOpenLegionが適切な選択肢です。

### MastraはProduction利用に十分安定していますか？

Mastraは24,329のGitHubスターと2024年8月からの活発な開発を持ち、2026年5月26日時点で433のオープンイシューがあります。本番環境でMastraを採用するチームは安定版リリースに固定し、`@mastra/mcp-docs-server`を0.17.0+にアップグレードし、エンタープライズAuth機能に頼る前にCVE-2026-42565とGHSA-wxw3-q3m9-c3jrの上流修正を計画する必要があります。

## 始めましょう

OpenLegionは無料でお試しいただけます。[app.openlegion.aiで始める](https://app.openlegion.ai)か[プラットフォームドキュメントを読む](https://docs.openlegion.ai)。TypeScriptフレームワークを評価中ですか？[OpenLegion vs LangGraph — セキュリティアーキテクチャとCVE履歴の比較](/comparison/langgraph)をご覧ください。
