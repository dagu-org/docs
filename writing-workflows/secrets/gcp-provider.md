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

Dagu uses Google Application Default Credentials. Credentials can come from the environment, a local Application Default Credentials file, an attached service account, or workload identity.

In distributed execution, configure credentials on each worker that resolves GCP secrets. The credentials need permission to access the referenced secret versions.

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
