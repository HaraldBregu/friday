# Gmail SMTP MCP Server

Local MCP server for sending email through Gmail SMTP.

## Setup

Configure the client that launches this server to provide:

- `GMAIL_SMTP_USER`: Required. Full Gmail or Google Workspace email address.
- `GMAIL_SMTP_PASSWORD`: Required. Gmail app password.
- `GMAIL_SMTP_HOST`: Optional. Defaults to `smtp.gmail.com`.
- `GMAIL_SMTP_PORT`: Optional. Defaults to `587`.
- `GMAIL_SMTP_SECURE`: Optional. Use `true` for SSL on port `465`; use `false` for STARTTLS on port `587`.

Credentials are intentionally not stored in `mcp.json`.

## Tool

### `send_email`

Sends one email through Gmail SMTP.

Required arguments:

- `from`: Sender address, usually the same Gmail or Workspace account.
- `to`: Recipient address or array of recipient addresses.
- `subject`: Email subject.

Content arguments:

- `text`: Plain text body.
- `html`: HTML body.

At least one of `text` or `html` is required.

Optional arguments:

- `cc`
- `bcc`
- `reply_to`
