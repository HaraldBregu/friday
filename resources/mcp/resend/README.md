# Resend Email MCP Server

Local MCP server for sending email through the Resend API.

## Setup

Configure the client that launches this server to provide:

- `RESEND_API_KEY`: Required. Resend API key.
- `RESEND_API_BASE_URL`: Optional. Defaults to `https://api.resend.com`.

The API key is intentionally not stored in `mcp.json`.

## Tool

### `send_email`

Sends one email with Resend `POST /emails`.

Required arguments:

- `from`: Sender address, optionally with a friendly name.
- `to`: Recipient address or array of recipient addresses.
- `subject`: Email subject.

Content arguments:

- `html`: HTML body.
- `text`: Plain text body.
- `template`: Published Resend template object.

At least one of `html`, `text`, or `template` is required. `template` cannot be combined with `html` or `text`.

Optional arguments:

- `cc`
- `bcc`
- `reply_to`
- `headers`
- `attachments`
- `tags`
- `scheduled_at`
- `idempotency_key`
