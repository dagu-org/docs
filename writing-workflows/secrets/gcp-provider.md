# Google Secret Manager Provider

The `gcp` provider reads a value from Google Secret Manager and injects it as a secret environment variable.

```yaml
secrets:
  - name: DB_PASSWORD
    provider: gcp
    key: production-database
    options:
      project_id: my-project
```

`key` can be a secret ID or a complete Google Secret Manager resource name. Keys and option values are literal strings. They are not expanded through DAG variables, params, or dotenv values.

## Authentication

Dagu uses [Google Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials) (ADC). The GCP provider does not accept credentials or a named `profile` option. The `project_id` setting identifies the project containing the secret; it does not select an authentication identity.

ADC checks these credential sources in order:

1. A credential file specified by `GOOGLE_APPLICATION_CREDENTIALS`
2. Local credentials created by the Google Cloud CLI
3. A service account attached to the Google Cloud runtime

### Local Development

Create local ADC credentials:

```bash
gcloud auth application-default login
```

This is separate from `gcloud auth login`, which authenticates the Google Cloud CLI itself.

### Credential File

Set `GOOGLE_APPLICATION_CREDENTIALS` to an ADC-compatible credential file before starting Dagu:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
dagu start-all
```

ADC supports service account key files and credential configuration files for Workload Identity Federation. Prefer federation or an attached service account for production workloads to avoid long-lived service account keys.

### Google Cloud Runtimes

On services such as Compute Engine and Cloud Run, attach a service account to the runtime. ADC obtains its credentials automatically from the metadata server. On GKE, use [Workload Identity Federation for GKE](https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity) to provide an identity to the Dagu pod.

In distributed execution, configure ADC on every worker that resolves GCP secrets.

### Required Permissions

The authenticated principal needs the `secretmanager.versions.access` permission for every referenced secret. The predefined [Secret Manager Secret Accessor](https://cloud.google.com/secret-manager/docs/access-control#secretmanager.secretAccessor) role, `roles/secretmanager.secretAccessor`, provides this permission. Grant the role on individual secrets when possible.

## Project And Location

A default project ID and optional regional location can be configured in Dagu `config.yaml`:

```yaml
secrets:
  gcp:
    project_id: my-project
    location: us-central1
```

The same settings can be provided through Dagu configuration environment variables:

```bash
export DAGU_SECRETS_GCP_PROJECT_ID=my-project
export DAGU_SECRETS_GCP_LOCATION=us-central1
```

A direct reference can override these defaults:

```yaml
secrets:
  - name: API_TOKEN
    provider: gcp
    key: production-api-token
    options:
      project_id: another-project
      location: europe-west1
```

Omit `location` for a global secret. Regional secrets use the regional Google Secret Manager endpoint for their configured location.

## Resource Names

The provider accepts these key forms:

| Key form | Example |
| --- | --- |
| Secret ID | `production-api-token` |
| Global secret resource | `projects/my-project/secrets/production-api-token` |
| Global version resource | `projects/my-project/secrets/production-api-token/versions/5` |
| Regional secret resource | `projects/my-project/locations/us-central1/secrets/production-api-token` |
| Regional version resource | `projects/my-project/locations/us-central1/secrets/production-api-token/versions/5` |

A secret ID requires a project from `options.project_id` or the global GCP configuration. A resource name already contains its project and optional location, so it cannot be combined with `options.project_id` or `options.location`.

When the key does not contain a version, Dagu uses `options.version` or defaults to `latest`. A version resource cannot be combined with `options.version`.

## JSON Fields

Use `options.field` to select one top-level field from a JSON secret:

```yaml
secrets:
  - name: DB_PASSWORD
    provider: gcp
    key: production-database
    options:
      project_id: my-project
      field: password
```

Given this secret value:

```json
{
  "username": "app",
  "password": "secret"
}
```

Dagu injects `DB_PASSWORD=secret`. String fields are returned without JSON quotes. Other JSON values are returned in compact JSON form. Field names are matched exactly, including whitespace.

Without `options.field`, Dagu returns the complete secret value.

## Supported Options

| Option | Meaning |
| --- | --- |
| `project_id` | GCP project for a secret ID |
| `location` | Regional location for a secret ID |
| `version` | Secret version number, alias, or `latest` |
| `field` | Top-level JSON field to return |

Dagu trims surrounding whitespace from project IDs, locations, and version identifiers. Field names are preserved exactly as written. The provider verifies the CRC32C checksum when Google Secret Manager returns one. If the checksum is invalid, the secret has no payload, or the secret cannot be read, DAG initialization fails before any step starts.
