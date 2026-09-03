---
title: "Automation"
description: "Periodic health checks run against a checklist you define. Cron schedules persist and reconcile, but running their prompts is still landing."
category: "Automation"
sourcePath: "automation.md"
order: 50
---

Kucedr has two background surfaces: periodic health checks, which work today, and cron schedules, which persist but do not yet execute an agent request.

## Health Checks

**Available.** `HEALTH.md` defines a checklist Kucedr runs in the background.

- Intervals of Off, 1 minute, 30 minutes, or 1 hour.
- Runs are skipped while the main or health agent is busy.
- Optional daily time windows, or inclusive start and end dates.
- Runs can use an isolated `health` session so they do not mix into your main transcript.
- Heading-only or empty checklists are skipped.
- A response of exactly `HEALTH_OK` is treated as healthy. Anything else is logged as needing attention.

The Health screen reads, edits, and saves the checklist and configuration. The agent tool can additionally update light-context, isolated-session, skip-when-busy, active-hours, and include-reasoning fields.

**Partial.** The runtime currently applies interval, busy checks, active hours and dates, and isolated-session behavior. The stored target, direct policy, light context, include-reasoning, provider, and model fields are not yet read by the health runner. Health runs use the agent's normal active model regardless of what the Health screen shows.

## Task Scheduler

**Partial.** Kucedr persists cron schedule records with:

- A name and optional description.
- A cron expression.
- Enabled or paused state.
- A debug-message or agent-prompt action.
- Created and updated timestamps.
- A provider and model selection reserved for scheduled work.

Create, update, pause, resume, delete, get, list, and run-now operations all work against those records, and startup reconciliation reloads and reschedules everything you saved.

**What does not work yet:** the cron callback logs debug actions and creates trigger metadata, but its agent-action branch is an empty no-op. Scheduled prompts and **Run now** do not execute an agent request. Treat the scheduler as durable storage for schedules, not as autonomous execution.

Schedules are created and managed through conversation and the `/task_list`, `/create_task`, and `/delete_task` slash commands rather than through Settings forms. The Tasks settings screen selects the task provider and model and lists each schedule's name, prompt, cron expression, and enabled state.
