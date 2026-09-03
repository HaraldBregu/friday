# Kucedr Configured Demo MCP Server

A dependency-free local MCP server demonstrating both server configuration values and tool inputs.

## Required server values

Edit the `env` object in `mcp.json` before uploading to change:

- `DEMO_COMPANY`
- `DEMO_CURRENCY` — an ISO 4217 currency code such as `EUR`, `USD`, or `GBP`
- `DEMO_TAX_RATE` — a numeric percentage stored as a string
- `DEMO_SIGN_OFF`

The included values are non-secret examples. Do not commit real credentials to this manifest.

## Install and test

1. Open **Settings → MCP**.
2. Choose **Upload local**.
3. Select this `configured-demo-server` folder.
4. Click **Test Kucedr Configured Demo**. Kucedr should report three tools.

## Tools and call-time inputs

- `configuration_summary` reads the server values and requires no arguments.
- `create_quote` requires `customer`, `item`, `quantity`, and `unitPrice`.
- `compose_customer_message` requires `recipient`, `subject`, and `body`.

All tools are local, read-only demonstrations and require approval before execution.
