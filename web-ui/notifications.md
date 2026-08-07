# Notifications

Notifications route DAG-run events to team destinations without hard-coding Microsoft Teams or Slack webhooks, email recipients, Telegram chats, or webhook endpoints in every DAG file.

Use notifications for ordinary message delivery: Microsoft Teams, Slack, Google Chat, email, Telegram, or custom webhooks. Use [Incident Routing](/web-ui/incidents) only for systems that manage an incident lifecycle, such as PagerDuty or SolarWinds Incident Response.

![Notification rules in light mode](/notification-rules-light.png)

## Mental Model

Notifications have two parts:

- **Channels** are reusable destinations, such as Microsoft Teams, Slack, email, Telegram, or a generic webhook.
- **Rules** decide which DAG-run events are sent to which channels.

Rules can be configured at three levels:

| Level | What It Means |
| --- | --- |
| **Global** | Default notification rules for every DAG. |
| **Workspace** | Optional override for DAGs in one workspace. |
| **DAG** | Optional override for one DAG. |

Dagu uses the most specific configured scope:

```text
DAG override -> workspace override -> Global default
```

If a scope is set to inherit, Dagu keeps looking at the next broader scope. If a scope is configured, that scope is authoritative. A configured scope with no routes intentionally sends no notifications.

## Events

The Web UI lets you route these DAG-run events:

| Event | Typical Use |
| --- | --- |
| **Failed** | Page the team when a run finishes in failure. |
| **Aborted** | Notify operators when a run is stopped. |
| **Rejected** | Surface queue, concurrency, or policy rejections. |
| **Waiting** | Ask for approval or manual intervention. |
| **Succeeded** | Notify only when successful completion matters. |

New rules default to the operational events: **Failed**, **Aborted**, **Rejected**, and **Waiting**. **Succeeded** is opt-in to avoid noisy channels.

When a DAG has DAG-level auto retry remaining, Dagu does not send the **Failed** notification for the intermediate failed attempt. The failure notification is sent only after the retry budget is exhausted and the DAG run is finally failed.

## Channels

Open **Notifications > Channels** to create destinations before adding rules.

| Channel Type | Use It For |
| --- | --- |
| **Slack** | Send messages through a Slack incoming webhook. |
| **Microsoft Teams** | Send MessageCard notifications through a Teams Workflow or legacy incoming webhook. |
| **Email** | Send to one or more recipients through the configured SMTP transport. |
| **Generic Webhook** | POST a structured payload to an incident system, chat relay, or internal service. |
| **Telegram** | Send messages through a Telegram bot token and chat ID, optionally targeting a forum topic. |

For Google Chat or another service without a dedicated channel type, use a generic webhook and customize its JSON body to match the receiver's payload format.

Channel secrets such as webhook URLs, HMAC secrets, SMTP passwords, and bot tokens are stored encrypted. The UI shows redacted previews after save.

### Microsoft Teams

Dagu sends Teams notifications as MessageCards. This format works with current Teams Workflows and legacy Microsoft 365 connector URLs, and provides useful notification preview text without requiring a card-format setting in Dagu.

To create a Teams channel:

1. Open **Workflows** in Microsoft Teams and choose an incoming-webhook template for a chat or channel.
2. Select the destination and authentication options, then save the Workflow.
3. Copy the generated webhook URL. See [Microsoft's incoming-webhook setup guide](https://support.microsoft.com/en-US/Workflows/send-messages-in-teams-using-incoming-webhooks) for the complete Teams steps.
4. In Dagu, open **Notifications > Channels**, select **Add**, and choose **Microsoft Teams**.
5. Paste the HTTPS webhook URL and optionally customize the message template.
6. Save the channel and use **Send test** before adding it to notification rules.

Teams webhook URLs must use HTTPS. Dagu encrypts the URL at rest and shows only a redacted preview after it is saved. Editing a channel without entering another URL preserves the saved value.

The default Teams message includes <code v-pre>{{run.link}}</code>. Configure [`public_url`](#dag-run-links) when recipients should be able to open the DAG run from Teams.

### Telegram Forum Topics

To send notifications to a specific topic in a Telegram forum group, set the optional **Topic ID** on the Telegram channel. Dagu sends this value as Telegram's `message_thread_id`.

The topic ID must be a positive integer. Leave it blank for regular chats or to keep the existing Telegram delivery behavior. To find the ID, inspect a Bot API update for a message posted in the topic and use the message's [`message_thread_id`](https://core.telegram.org/bots/api#message).

After saving the channel, use the **Test** action to confirm that the bot can post to the selected chat and topic.

### Email Delivery

Email has two layers:

- **Email Delivery** configures the SMTP transport: host, port, username, password, and default sender.
- **Email channels** configure recipients, subject/body templates, and whether to attach logs.

Configure SMTP once on the Channels page, then reuse email channels from Global, workspace, or DAG rules.

## Rules

Open **Notifications > Rules** to connect events to channels.

### Global Rules

Use Global rules for organization-wide defaults such as:

- failed production workflows go to `#platform-alerts`
- waiting workflows notify approvers
- rejected runs send to an operations webhook

Every DAG inherits Global rules unless a workspace or DAG override is configured.

### Workspace Rules

Select a named workspace in the Web UI, then open **Notifications > Rules**.

Workspace rules can either:

- **Inherit Global**: use the Global rules as-is.
- **Configure Workspace**: replace Global rules for DAGs in that workspace.

Use workspace overrides when teams have separate channels, such as `data`, `ops`, or `production`.

### DAG Overrides

Open a DAG, then use the **Notifications** tab for per-DAG exceptions.

Keep DAG notifications inherited for most workflows. Configure a DAG override only when one workflow needs a different destination or event set from its workspace.

## Message Templates

Each channel can customize the message text. Templates use simple <code v-pre>{{token}}</code> replacement.

Common tokens:

| Token | Value |
| --- | --- |
| <code v-pre>{{dag.name}}</code> or <code v-pre>{{dagName}}</code> | DAG name |
| <code v-pre>{{run.id}}</code> or <code v-pre>{{dagRunId}}</code> | DAG run ID |
| <code v-pre>{{run.status}}</code> or <code v-pre>{{status}}</code> | Run status |
| <code v-pre>{{run.error}}</code> or <code v-pre>{{error}}</code> | Error message, when present |
| <code v-pre>{{run.failed_steps}}</code> | Comma-separated failed steps |
| <code v-pre>{{run.partially_succeeded_steps}}</code> | Comma-separated partially succeeded steps |
| <code v-pre>{{run.aborted_steps}}</code> | Comma-separated aborted steps |
| <code v-pre>{{run.succeeded_steps}}</code> | Comma-separated succeeded steps |
| <code v-pre>{{run.path}}</code> or <code v-pre>{{runPath}}</code> | Relative Web UI path for the DAG run |
| <code v-pre>{{run.url}}</code> or <code v-pre>{{runUrl}}</code> | Absolute Web UI URL for the DAG run, when `public_url` is configured |
| <code v-pre>{{run.link}}</code> or <code v-pre>{{runLink}}</code> | `Run: ...` line when an absolute run URL is available |
| <code v-pre>{{run.startedAt}}</code> | Run start time |
| <code v-pre>{{run.finishedAt}}</code> | Run finish time |
| <code v-pre>{{run.attemptId}}</code> or <code v-pre>{{attemptId}}</code> | Attempt ID |
| <code v-pre>{{workspace}}</code> | Workspace name, when present |
| <code v-pre>{{worker.id}}</code> | Worker ID, when present |
| <code v-pre>{{event.type}}</code> or <code v-pre>{{eventType}}</code> | Notification event type |
| <code v-pre>{{event.observedAt}}</code> | Time the event was observed |

The step-list tokens render as an empty string when no step has that status. For fan-out steps, each entry identifies the individual item or child run, such as `process[customer-a]` or `deploy[child-workflow (ENV=production)]`.

Example Microsoft Teams, Slack, or Telegram message:

```text
DAG {{dag.name}} {{run.status}}
Run: {{run.id}}
Workspace: {{workspace}}
Error: {{run.error}}
Failed steps: {{run.failed_steps}}
{{run.link}}
```

Email channels also support separate subject and body templates.

## DAG Run Links

Default notification messages include a DAG-run link when Dagu can build an externally reachable Web UI URL.

Set `public_url` in `config.yaml` to the absolute Web UI URL users should open from chat or email:

```yaml
public_url: "https://dagu.example.com"
```

You can also set it with `DAGU_PUBLIC_URL`. For Helm installs, use `config.publicUrl`:

```yaml
config:
  publicUrl: "https://dagu.example.com"
```

If Dagu runs behind a reverse-proxy subpath, include that subpath in `public_url`:

```yaml
public_url: "https://dagu.example.com/workflows"
```

When `public_url` is not configured, <code v-pre>{{run.url}}</code> and <code v-pre>{{run.link}}</code> are empty. <code v-pre>{{run.path}}</code> is still available for systems that know the Dagu base URL.

## Generic Webhook Payload

Generic webhook channels send JSON. Leave **Webhook JSON body template** blank to use Dagu's default payload. If a message template is configured, Dagu includes the rendered message alongside the structured event data.

```json
{
  "version": "v1",
  "message": "DAG daily-report failed: exit status 1\nRun: https://dagu.example.com/dag-runs/daily-report/019e3...",
  "events": [
    {
      "eventType": "dag.run.failed",
      "dagName": "daily-report",
      "dagRunId": "019e3...",
      "runPath": "/dag-runs/daily-report/019e3...",
      "runUrl": "https://dagu.example.com/dag-runs/daily-report/019e3...",
      "status": "failed",
      "error": "exit status 1",
      "observedAt": "2026-05-17T10:00:00Z"
    }
  ]
}
```

### Custom JSON Body

Set **Webhook JSON body template** when the receiving service expects a different JSON shape. For example, many chat webhooks accept a single `text` field:

```json
{
  "text": "{{message}}"
}
```

The body template supports all [message-template tokens](#message-templates), plus <code v-pre>{{message}}</code> for the rendered webhook message. Token values are escaped as JSON string content, so quotes and line breaks in names or error messages do not break a surrounding JSON string.

Custom bodies have these delivery rules:

- The rendered body must be valid JSON. Invalid output fails delivery without retrying it as a transient network error.
- Dagu validates every body in the current notification batch before sending the first request, so one invalid event cannot cause a partially delivered batch.
- Dagu sends one request per event. A transient failure retries only that request instead of resending events already accepted by the receiver.
- Custom headers and HMAC signing still apply. `X-Dagu-Signature` signs the exact rendered request body.

Keep string-valued tokens inside JSON quotes, as shown above. Leaving the body template blank restores the default batched payload.

Use HMAC signing when the receiving service needs to verify that Dagu sent the webhook.

## Delivery Behavior

Notifications are sent by the Dagu server-side event monitor, not by a workflow step. This means notification delivery works for local runs and distributed workers, including shared-nothing workers, as long as the server receives DAG-run events.

The monitor remembers delivered events so a server restart does not replay old notifications. Use the channel **Test** action when validating credentials and destination access.

## Permissions

Users need developer, manager, or admin permission to manage notification channels and rules.

## Related

- [Workspaces](/web-ui/workspaces)
- [Incident Routing](/web-ui/incidents)
- [Email Notifications](/writing-workflows/email-notifications)
- [Lifecycle Handlers](/writing-workflows/lifecycle-handlers)
- [User Management](/server-admin/authentication/user-management)
