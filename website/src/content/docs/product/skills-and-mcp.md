---
title: "Skills And MCP"
description: "Extend Kucedr with local skill folders and Model Context Protocol servers over HTTP or stdio."
category: "Extension"
sourcePath: "skills-and-mcp.md"
order: 30
---

Kucedr can be extended without changing the core app.

## Skills

Skills are local directories under the agent's `skills` folder. Each one must contain a `SKILL.md`.

Validation requires frontmatter `name` and `description`. Names are lowercase alphanumeric or hyphenated identifiers of 1–64 characters; descriptions are capped at 1,024 characters. Importing a skill whose ID already exists replaces that folder.

The Skills settings area can:

- List installed skills with name and description, and open the skills root in your file manager.
- Import one or more skill directories, reporting imported and skipped counts.
- Inspect ID, format, version, category, safety level, visibility, author, required and allowed tools, required connectors, tags, model visibility, folder path, skill-file path, and validation diagnostics.
- Enable or disable a skill, export a skill directory, refresh the catalog, and delete a skill after confirmation.

Only enabled skills can be loaded. Enable and disable is the gate. The safety level and visibility fields are shown for your own review, not enforced as a blocking policy.

The slash menu searches installed skills, and the agent loads a selected skill's `SKILL.md` during a run. The loader returns the skill's directory path; bundled scripts, references, and assets have to be read separately when the run needs them.

## MCP Servers

Kucedr supports the Model Context Protocol, an open standard for connecting external tools and data to AI assistants, over two transports.

| Transport | Configuration |
| --- | --- |
| Remote HTTP | Server ID, name, URL, optional bearer token, optional OAuth client ID and client secret. |
| Local stdio | Server ID, name, command, whitespace-split arguments, optional `KEY=value` environment variables, optional working directory. |

MCP settings provide separate lists for remote and local servers; configured, disabled, and error states with a toggle in both list and detail views; add and edit dialogs (server ID and transport type are fixed after creation); a detail page with ID, status, URL or command, authentication type, timestamps, and last error; and OAuth authorization or reauthorization for HTTP servers without a bearer token.

At the start of each normal agent run, enabled servers connect in parallel, expose their tools to the model as `mcp__<server>__<tool>`, and close when the run ends. Unreachable or unauthenticated servers are skipped for that run rather than failing it.

### Current Limits

- The renderer has no delete control for a configured server.
- A stored `require_approval` field is enforced. It sets a loaded MCP tool's default permission to allow or ask.
- A stored `defer_loading` field is not yet enforced by the tool loader.
- MCP tools are not part of the built-in gated-tool list, so only their own `require_approval` default applies. Review a server before enabling it.
