# LLM Wiki

Friday's LLM Wiki is a persistent knowledge-compilation layer inside the existing assistant. It preserves source evidence, incrementally maintains interlinked Markdown pages, and gives the normal agent focused wiki tools without replacing its model client, loop, prompt builder, memory, RAG, IPC, or response pipeline.

## Enable and configure the wiki

Open **Settings → Assistant → LLM Wiki** and configure:

- a text-model provider and model;
- a raw source folder;
- a generated wiki folder;
- optional scheduled generation;
- global enablement, automatic answer filing, review policy, and startup linting.

The stored settings are equivalent to:

```yaml
enabled: true
providerId: openai
modelId: gpt-5
sourcePath: /path/to/wiki/raw
targetPath: /path/to/wiki/data
autoFileAnswers: false
requireReviewForMajorChanges: true
retrievalPriority: wiki_first
lintOnStartup: false
schedule:
  enabled: false
  cronExpression: 0 3 * * *
```

When `enabled` is `false`, the main assistant receives no wiki tools, scheduling stops, and existing assistant behavior continues unchanged. Stored sources and generated pages remain available on disk.

## Architecture and integration

```text
Main agent loop
  -> existing native-tool list
  -> wiki tools, only for enabled main sessions
  -> WikiService
       -> immutable source registry
       -> staged transaction and validation
       -> Markdown repository and index
       -> wiki-first retrieval
       -> review, lint, and audit services
```

Ingest uses Friday's existing `LlmModel`. The source and relevant current pages are operation-specific context; the full wiki, schema, index, and log are never appended to every chat request. Retrieved source text is untrusted evidence, not executable instructions.

## Storage

The default layout below the Friday application-data directory is:

```text
├── settings/
│   └── wiki.json                    # wiki configuration
└── wiki/
    ├── raw/                         # configured ingest inbox
    ├── evidence/documents/          # checksum-addressed immutable snapshots
    │   └── source-<checksum>/
    ├── data/                        # generated Markdown wiki
    │   ├── AGENTS.md
    │   ├── index.md
    │   ├── log.md
    │   ├── sources/
    │   ├── entities/
    │   ├── concepts/
    │   ├── topics/
    │   ├── projects/
    │   ├── comparisons/
    │   ├── syntheses/
    │   └── questions/
    ├── state/
    │   ├── source-registry.json
    │   ├── page-manifest.json
    │   ├── pending-review.json
    │   ├── failed-operations.json
    │   └── operations.json
    ├── config/
    │   ├── schema.yaml
    │   ├── page-types.yaml
    │   └── review-policy.yaml
    └── state.json                  # backward-compatible processed-path state
```

Custom generated wiki folders keep their managed evidence and policy directories beside that target. Source and target folders must be separate and non-nested.

## Source evidence

Supported ingest formats are Markdown, text, JSON, CSV, and log files. Registration:

1. reads the original bytes without modifying them;
2. rejects credential-like filenames and high-confidence secret content;
3. calculates SHA-256 over the complete bytes;
4. derives a stable `source-<checksum>` ID;
5. writes an exclusive immutable snapshot;
6. records media type, original name, relative paths, timestamps, status, archive path, and operation ID.

Identical bytes deduplicate across retries and paths. If a file's bytes change, the new version receives a new source ID while the previous snapshot remains evidence. Wiki maintenance never deletes raw evidence.

## Page and claim schema

Generated pages use YAML frontmatter and one H1:

```yaml
---
id: concept-agent-memory
title: Agent memory
page_type: concept
status: active
summary: Durable compiled knowledge for assistants.
created_at: 2026-08-06T14:00:00.000Z
updated_at: 2026-08-06T14:10:00.000Z
source_ids:
  - source-0123456789abcdef
aliases:
  - Persistent memory
related:
  - '[[Knowledge retrieval]]'
confidence: medium
review_status: auto_generated
claims:
  - id: claim-memory-reduces-repeated-work
    statement: Persistent compiled knowledge reduces repeated synthesis work.
    evidence:
      - sourceId: source-0123456789abcdef
        locator: Section 3.2
        evidenceType: direct
    confidence: medium
    status: supported
contradictions: []
open_questions: []
---
```

Claims, evidence, contradictions, relationships, open questions, and change history are also rendered in the Markdown body so human readers can audit them without parsing YAML.

## Ingest workflow

`ingest_wiki_source` accepts an optional path relative to the configured source folder. Without a path, the compiler processes every pending supported source.

```text
register and archive source
  -> build focused existing-page context
  -> request a structured change set from the configured model
  -> merge claims, evidence, links, contradictions, and prior synthesis
  -> stage the complete target wiki
  -> rebuild index and append the operation log
  -> validate metadata, IDs, claims, source references, links, and index coverage
  -> atomically replace the target or roll back
  -> mark source and operation state
```

An operation ID is stable for the source checksum. Retrying identical bytes does not duplicate the source, source page, claims, or log event.

### Example ingest

Place `memory-report.md` in the configured raw folder, then ask Friday:

```text
Ingest memory-report.md into the wiki.
```

The model can select:

```json
{
	"relativePath": "memory-report.md"
}
```

The result reports processed/skipped sources, created/updated pages, claims, contradictions, review items, operation IDs, and completion time.

### Generation progress and limits

The settings screen reports the current source and whether Friday is preparing, generating, saving, or cancelling it. **Cancel** aborts the active model request and leaves already completed sources integrated.

To prevent an unresponsive provider from blocking the entire run indefinitely:

- sources remain sequential so each update sees the latest committed wiki;
- each source may update at most eight pages;
- model output is limited to 4,000 tokens per source;
- each model request times out after two minutes;
- timeout and cancellation roll back only the active source operation.

An unchanged source is skipped on later runs without another model call.

## Query workflow

Use `query_wiki` for grounded answer context. Retrieval order is:

1. exact title;
2. exact alias;
3. index and page metadata;
4. wiki full text;
5. linked-page traversal;
6. immutable raw evidence when requested or confidence is low;
7. the independent `search_knowledge` RAG tool when the wiki is insufficient;
8. external search only when the user permits it.

Tool results distinguish `wiki_page` synthesis from `raw_source` evidence and include unresolved contradictions and limitations.

### Example query and saved analysis

```text
Compare compiled wiki memory with raw-source RAG. Verify exact claims against primary evidence, then save the comparison.
```

Friday can first call:

```json
{
	"query": "compiled wiki memory versus raw source RAG",
	"includeRaw": true
}
```

After answering, it can call `save_wiki_analysis` with a title, summary, reusable content, page type, and integrated source IDs. The service checks exact titles and aliases before creating a page, so a matching comparison is incrementally updated instead of duplicated.

Automatic answer filing remains off by default. Casual conversation, temporary status, formatting-only output, unsourced speculation, and credential-like content are not valid durable analyses.

## Contradictions and review

Automatic ingest can add or preserve a contradiction only as `unresolved`. It cannot silently settle competing claims. Other supported states are:

- `explained-by-scope`;
- `explained-by-time`;
- `source-corrected`;
- `superseded`;
- `resolved-by-review`.

Major rewrites of established synthesis or comparison pages are staged as review items. Each item records the proposed update, reason, evidence source IDs, affected pages, risk, and rollback note. `review_wiki_changes` always invokes Friday's interactive approval UI before approval or rejection is executed. Approved contradiction changes may transition out of `unresolved`; ordinary ingest may not.

Use `get_recent_wiki_activity` to see recent log entries and pending review IDs.

## Lint and maintenance

`lint_wiki` returns structured critical findings, warnings, suggestions, auto-fixable items, review-required items, and the number fixed. Checks include:

- required metadata, page types, duplicate page IDs, aliases, links, reciprocal links, orphans, and index drift;
- missing or unsupported claim evidence and invalid source IDs;
- unresolved contradictions and duplicate claim statements;
- integrated sources without page coverage and oversized pages.

Automatic repair is intentionally narrow: `rebuild_wiki_index` and `lint_wiki` with `autoFix` rebuild `index.md` transactionally. Interpretive merges, renames, deletions, contradiction resolution, and source removal are never automatic.

Scheduled generation runs lint after ingest. Startup lint is optional.

## Audit and observability

Every ingest, saved analysis, lint, repair, or review has an operation record and status:

```text
pending -> planning -> executing -> validating
        -> completed | awaiting_review | failed | rolled_back
```

`data/log.md` is chronological and append-only with headings in the form `## [YYYY-MM-DD] operation | title`. Failed operations are stored separately without appending partial page changes. Application logs record IDs, counts, duration-related tool events, model token usage, validation errors, review state, and rollbacks; they do not record complete source bodies.

In-process counters cover ingest success/failure, created/updated pages, claims, contradictions, queries, raw fallbacks, lint findings, pending reviews, and rollbacks.

## Security and privacy

- Wiki paths are normalized and generated page paths reject traversal and reserved files.
- Source and generated content are untrusted model context and cannot override system or tool policy.
- Credential-like files and high-confidence embedded secrets fail closed.
- Exact per-run capability allowlists prevent wiki tools from appearing in task, health, or messaging-channel runs unless a trusted caller explicitly grants their tool IDs.
- Raw archive paths are not returned in query results.
- Interpretive or destructive knowledge changes continue through the review queue.
- The current application is scoped to one local OS user. Multi-user or tenant deployments require a separate wiki root and authorization boundary per tenant before enabling these tools.

## Migration

No destructive migration is required from the earlier scheduled wiki compiler:

1. existing `sourcePath`, `targetPath`, pages, `index.md`, `log.md`, settings, and path-to-checksum state remain valid;
2. missing settings receive compatibility defaults;
3. an already-processed source is archived and registered without forcing a model recompile;
4. legacy pages remain readable and gain the expanded metadata when next updated;
5. legacy `wiki/settings.json` values are copied once to `settings/wiki.json` without deleting the legacy file;
6. new registry and policy files are created alongside existing data.

Back up the application-data `wiki/` directory before changing paths or review policy in a production profile.

## Rollback

To stop using the subsystem, turn off **Enable wiki knowledge**. This removes wiki tools from new main-agent runs and stops scheduling without deleting evidence or pages.

Failed operations automatically restore the previous complete generated directory and record the rollback. For a successful operation that must be reverted later, restore the generated wiki directory and state JSON files from Git, cloud sync, or a filesystem backup; immutable evidence snapshots do not need to be replaced. Friday does not yet keep permanent post-commit page versions after the transaction backup is released.

Code rollback is additive: revert the wiki commits or install an earlier Friday build. Existing Markdown and evidence files are ordinary local data and can remain in place for a later re-enable.

## Known limitations

- Deterministic retrieval is keyword, metadata, alias, and link based. Wiki pages are not automatically inserted into the destructive Pinecone RAG rebuild.
- Supported raw ingest is currently text-oriented; PDFs, office documents, audio, and images require normalized text derivatives.
- The wiki is local-user scoped, not multi-tenant.
- Automatic link repair is limited to index rebuilding; missing reciprocal links are reported for a later safe-fix pass.
- Successful-operation historical versioning depends on external filesystem, Git, or cloud backups.
