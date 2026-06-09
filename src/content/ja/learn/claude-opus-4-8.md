---
title: Claude Opus 4.8 - 能力、コスト、エージェント性能
description: "Claude Opus 4.8は2026年5月28日リリース：Online-Mind2Webで84%、高速モードは3倍安価、Claude Codeに動的ワークフロー、GPT-5.5とのコスト同等でSuper-Agentベンチマークの全ケースを完了した初のOpus。"
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

# Claude Opus 4.8：エージェント性能、高速モード価格、Opus 4.7からの変更点

Claude Opus 4.8は、Anthropicによる2026年5月28日のOpusクラスアップグレードです。Online-Mind2Webブラウザエージェント精度で84%を達成し、GPT-5.5とのコスト同等でSuper-Agentベンチマークの全ケースを完了した初のモデルです。Opus 4.7のツール呼び出し冗長性回帰を修正し、高速モードは2.5倍の速度で以前のOpusモデルの高速モードより3倍安価です。標準API価格は4.7から変更なし。APIモデル識別子は`claude-opus-4-8-20260528`です。

<!-- SCHEMA: DefinitionBlock -->

> **Claude Opus 4.8とは何ですか？**
> Claude Opus 4.8は、Anthropicによる2026年5月のOpusモデルクラスのアップグレードです。長時間のエージェントタスク、マルチステップ推論、自律的なツール使用に最適化されたフロンティアレベルの大規模言語モデルで、Opus 4.7に対して改善されたベンチマーク性能、ツール呼び出し信頼性回帰の修正、以前のOpusモデルの高速モードより3倍安価な高速モード（2.5倍速の拡張思考）を特徴とします。

## OpenLegionの見解：エージェント経済を変えるモデル

Opus 4.8は、2026年5月以降、実質的なエージェント作業を行うエージェントに推奨するモデルです。本番エージェントフリートに重要な3つの変更点があります。

第一に：ツール呼び出し信頼性の修正。Scott Wu（Cognition / Devin CEO）はOpus 4.7がコメント冗長性とツール呼び出しの不一致を導入し、Devinの自律エンジニアリング信頼性を低下させたことを公式に確認しました。Opus 4.8は両方を修正します。密なツール使用ループのエージェントにとって、これは頻繁な修正が必要なモデルとクリーンにタスクを完了するモデルの違いです。

第二に：Online-Mind2Webで84%（GPT-5.5を上回る）、GPT-5.5のコスト同等でのSuper-Agentベンチマーク初の完全クリア。Online-Mind2Webは実際のブラウザベースのタスク完了を測定します。Super-Agentベンチマークは翻訳、詳細調査、スライド作成、分析をエンドツーエンドでカバー。Opus 4.8は全ケースを完了。GPT-5.5は完了しませんでした。

第三に：高速モードで3倍のコスト削減。DatabricksはGenieエージェントでOpus 4.7比61%安いトークンコストを報告。以前はコストのためにSonnetを選び品質を妥協していた長時間タスクで、Opus 4.8の高速モードは計算を変えます。

Anthropicの発表は、同日に965億ドルのポストマネー評価額での650億ドルシリーズHと同じ日に行われました。

OpenLegionはAnthropicのAPIモデルカタログ全体をサポートしています。フリートのデフォルトとして`claude-opus-4-8-20260528`を設定することは、単一の設定変更です。ボルト分離APIコール、エージェントごとの予算上限、コンテナ分離実行が自動的に適用されます。[予算管理とボルト分離でOpus 4.8を実行するためにAIエージェントプラットフォームが提供するもの](/learn/ai-agent-platform)。

## ベンチマーク性能：数字が示すもの

### Online-Mind2Web：84%のブラウザエージェント精度

Online-Mind2Webはブラウザベースのエージェントタスク完了ベンチマークです。フォーム入力、マルチページフローのナビゲーション、ライブウェブインターフェイスからの情報抽出。Claude Opus 4.8は2026年5月時点でOnline-Mind2Webで84%を記録し、Claude Opus 4.7とGPT-5.5の両方を上回りました。これはOpus 4.8の発売日時点でのそのベンチマークでの最高公開スコアです。

### Super-Agentベンチマーク：GPT-5.5のコスト同等での初の完全クリア

共同創業者兼CTO Kay Zhuは、Claude Opus 4.8が翻訳スケール、詳細調査統合、生データからのスライドデッキ構築、マルチソース分析をカバーする社内Super-Agentベンチマークの全ケースをエンドツーエンドで完了した初のモデルと報告しました。GPT-5.5は全ケースを完了しませんでした。

### CursorBench：すべての努力レベルでより効率的なツール呼び出し

Cursorの社内コーディングベンチマークは、コード生成品質とツール使用効率を測定します。Claude Opus 4.8はCursorBenchのすべての努力レベルで以前のOpusモデルを上回ります。冗長なコメントへのトークン無駄遣いが減少。

### Legal Agent Benchmark：初の全パス基準10%超え

Leya（法律AIプラットフォーム）の応用研究部長Niko Grupenの報告によると、Claude Opus 4.8はLegal Agent Benchmarkの全パス基準で10%を超えた初のモデルです。全パス基準はマルチステップ法律ワークフローのすべてのステップが正しいことを要求します。

### Databricks Genie：Opus 4.7より61%安価

DatabricksはGenieエージェント（PDFと図表のマルチモーダル推論を使用するデータ分析・知識作業AIエージェント）でOpus 4.7比61%安いトークンコストを報告しました。

## Opus 4.7からの変更点

### ツール呼び出し修正：Devinと自律ワークロードを損なわせた冗長性回帰

Claude Opus 4.7は複数の本番チームが独立して気付いたツール呼び出し行動の回帰を導入しました：エージェントが過度のインラインコメントを生成し、不要な説明的な文章で出力をラップし、時折重複または冗長なツール呼び出しを行いました。

Scott Wu（Cognition / Devin CEO）はOpus 4.7が「コメント冗長性とツール呼び出しの問題」を持っていることを公式に確認し、Opus 4.8がそれを修正しています。ツール使用信頼性のためにOpus 4.7からOpus 4.6にダウングレードしたチームはOpus 4.8で再評価すべきです。

### Claude Codeの動的ワークフロー

Opus 4.8でClaude Codeに動的ワークフローが追加されます。マルチステップワークフロー構造を作成、シーケンス、管理することで大規模な問題に取り組む能力。Claude Codeは大規模なコードベース移行を計画し、サブタスクを作成して順次実行し、中間状態を追跡し、各ステップの結果に基づいてプランを適応させることができます。2026年5月28日からOpus 4.8を使用したClaude Codeで利用可能。

### 高速モード：2.5倍速で3倍安価

Claude Opus 4.8の高速モードは拡張思考を使用して標準Opusの2.5倍の速度で動作し、Opus 4.7を含む以前のOpusモデルの高速モードより3倍安価です。標準（非高速モード）価格はOpus 4.7から変更なし。

高速モードはAPIの拡張思考設定の`budget_tokens`パラメータで有効化されます。

## APIリファレンスと価格

### モデル識別子

Claude Opus 4.8のAPIモデル識別子は`claude-opus-4-8-20260528`です。Anthropic APIコールの`model`パラメータ、Amazon BedrockモデルIDフィールド、またはGoogle Cloud Vertex AIモデル参照でこの文字列を使用してください。

### 可用性

Claude Opus 4.8はAnthropicAPIを直接（api.anthropic.com）、Amazon Bedrock、Google Cloud Vertex AIの3つのチャネルで利用可能です。3つすべてのチャネルが拡張思考と高速モードを含む同じ機能セットをサポートしています。

### コンテキストウィンドウ

Claude Opus 4.8はOpus 4.7と同じコンテキストウィンドウ（200Kトークン）と同じ標準入出力トークン価格を使用します。コスト改善は高速モードに集中しています。

## Opus 4.8 vs Sonnet 4 vs Opus 4.7の使い分け

### Opus 4.8：長時間エージェントタスク、ブラウザ自動化、大規模コーディング

タスク品質が制約のときOpus 4.8を選択します。密なツール使用ループの長時間自律エージェントはツール呼び出し信頼性修正の恩恵を受けます。ブラウザ自動化エージェント（Online-Mind2Web：84%）はこのタスクタイプで他のどのモデルも上回ります。

[Anthropic APIを介してClaude Opus 4.8にアクセスするAIエージェントフレームワーク](/learn/ai-agent-frameworks)の場合、移行パスは`claude-opus-4-8-20260528`へのモデル識別子交換です。

### Sonnet 4：高ボリューム、レイテンシー敏感パイプライン

ボリュームとレイテンシーが制約のときSonnet 4を選択します。トークンあたりのコストがユニット経済を決定する高頻度APIコール、エンドユーザーにレイテンシーが見えるリアルタイム応答パイプライン。

### Opus 4.7が適用される場合

Opus 4.7にとどまる唯一のケース：その冗長性パターンに特化してチューニングされたプロンプト。パイプラインがOpus出力を後処理し、Opus 4.7が生成したコメント構造に依存している場合、適応する時間ができるまで4.7にとどまります。

## OpenLegionとClaude Opus 4.8

OpenLegionは`claude-opus-4-8-20260528`をフリートモデルオプションとしてサポートしています。エージェントのデフォルトとして設定することはエージェント設定の単一フィールドです：

```
model: anthropic/claude-opus-4-8-20260528
```

すべてのOpenLegionセキュリティコントロールがOpus 4.8コールに自動的に適用されます：ボルトプロキシ認証情報インジェクション（APIキーがエージェントコンテナに入らない）、エージェントごとの日次・月次予算上限、Docker コンテナ分離、完全な監査ログ。

詳細な比較については、[グラフベースvsフラットフリートアーキテクチャでのOpus 4.8展開のOpenLegion vs LangGraph](/comparison/langgraph)と[共有プロセスvs分離コンテナマルチエージェントシステムでのOpus 4.8のOpenLegion vs AutoGen](/comparison/autogen)を参照してください。

## OpenLegionでClaude Opus 4.8を始める

**`claude-opus-4-8-20260528`をフリートのデフォルトとして設定。ボルト分離、予算制限付き、本番対応。**
[構築を開始する](https://app.openlegion.ai) | [ドキュメントを読む](https://docs.openlegion.ai) | [プラットフォームを見る](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## よくある質問

### Claude Opus 4.8とは何ですか？

Claude Opus 4.8は2026年5月28日に発表されたAnthropicのOpusモデルクラスのアップグレードです。Claude Opus 4.7をベースに、改善されたエージェント判断、コーディング・推論・専門的知識作業のベンチマーク性能強化、Opus 4.7の自律ワークロードに影響したツール呼び出し冗長性問題の修正が追加されています。大規模なマルチステップ問題のためにClaude Codeに動的ワークフローを導入し、以前のOpusモデルの高速モードより3倍安価な2.5倍速の高速モードを提供します。

### Claude Opus 4.8はGPT-5.5と比べてどうですか？

エージェントタスクに関連するベンチマークにおいて、Claude Opus 4.8は複数の独立した評価でGPT-5.5を上回るか同等です。Online-Mind2WebでOpus 4.8は84%を記録し、GPT-5.5を上回りました。社内Super-Agentベンチマークでは、Opus 4.8がGPT-5.5のコスト同等でエンドツーエンドで全ケースを完了した初のモデルでした。Legal Agent BenchmarkではOpus 4.8が全パス基準で10%を超えた初のモデルです。

### Claude Opus 4.8の高速モードはOpus 4.7と比べてどれくらい安いですか？

Claude Opus 4.8の高速モードは拡張思考を使用して通常の2.5倍の速度で動作し、Opus 4.7を含む以前のOpusモデルの高速モードより3倍安価です。標準Opus 4.8価格（高速モードなし）はOpus 4.7から変更なし。DatabricksはGenieエージェントでOpus 4.7比61%安いトークンコストを報告しました。

### Opus 4.7のツール呼び出し問題とはOpus 4.8が修正するものは何ですか？

Claude Opus 4.7は自律エンジニアリングワークロードの信頼性を低下させたコメント冗長性とツール呼び出しの不一致を導入しました。Cognition（自律コーディングエージェントDevinのメーカー）のCEO Scott Wuを通じて、Opus 4.7がOpus 4.6より一貫性が低く、Opus 4.8がコメント冗長性回帰とツール呼び出しの不一致の両方を修正することを報告しました。

### Claude Opus 4.8のAPIモデル識別子は何ですか？

Claude Opus 4.8のAPIモデル識別子は`claude-opus-4-8-20260528`です。Anthropic API直接、Amazon Bedrock、Google Cloud Vertex AIを通じて利用可能。高速モード（2.5倍速の拡張思考）は拡張思考設定の`budget_tokens`パラメータで有効化。標準価格はOpus 4.7と同一；高速モード価格は以前のOpusモデルの高速モードより3倍低い。

### Opus 4.8を使用したClaude Codeの動的ワークフローとは何ですか？

動的ワークフローはOpus 4.8と共にローンチされたClaude Codeの機能で、マルチステップワークフロー構造を動的に作成、シーケンス、管理することで大規模な問題に取り組むことができます。Claude Codeは大規模なリファクタリングや移行を計画し、サブタスクを作成して順次実行しながら状態を追跡し、中間結果に基づいて適応できます。これにより、大規模なコードベース移行、複数のファイルやサービスにまたがる完全な機能ビルド、複数リポジトリにまたがる変更にClaude Codeが対応可能になります。
