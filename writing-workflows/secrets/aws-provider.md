# AWS Secrets Manager Provider

The `aws` provider reads a value from AWS Secrets Manager and injects it as a secret environment variable.

```yaml
secrets:
  - name: DB_PASSWORD
    provider: aws
    key: production/database
```

`key` can be a secret name or a complete AWS Secrets Manager ARN. Keys and option values are literal strings. They are not expanded through DAG variables, params, or dotenv values.

## Authentication

Dagu uses the standard AWS SDK credential chain. Credentials can come from environment variables, shared AWS configuration files, container credentials, instance roles, or web identity credentials.

A named AWS profile can be selected for the Dagu process:

```bash
export AWS_PROFILE=production
```

Profile selection is process-wide. `options.profile` is not supported. In distributed execution, configure credentials on each worker that resolves AWS secrets.

The credentials need permission to call `secretsmanager:GetSecretValue` for the referenced secrets. Secrets encrypted with a customer-managed KMS key may also require `kms:Decrypt`.

## Region

A global default region can be configured in Dagu `config.yaml`:

```yaml
secrets:
  aws:
    region: ap-northeast-1
```

The same setting can be provided through a Dagu configuration environment variable:

```bash
export DAGU_SECRETS_AWS_REGION=ap-northeast-1
```

A direct reference can override the global default:

```yaml
secrets:
  - name: API_TOKEN
    provider: aws
    key: production/api-token
    options:
      region: us-west-2
```

For an ARN, Dagu uses the region embedded in the ARN:

```yaml
secrets:
  - name: API_TOKEN
    provider: aws
    key: arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:production/api-token-AbCdEf
```

If `options.region` is also set, it must match the ARN region. When neither the reference nor Dagu configuration supplies a region, the AWS SDK resolves its configured default region.

## JSON Fields

Use `options.field` to select one top-level field from a JSON secret:

```yaml
secrets:
  - name: DB_PASSWORD
    provider: aws
    key: production/database
    options:
      field: password
```

Given this AWS secret value:

```json
{
  "username": "app",
  "password": "secret"
}
```

Dagu injects `DB_PASSWORD=secret`. String fields are returned without JSON quotes. Other JSON values are returned in compact JSON form. Field names are matched exactly, including whitespace.

Without `options.field`, Dagu returns the complete secret value.

## Secret Versions

Use AWS version identifiers to select a version:

```yaml
secrets:
  - name: API_TOKEN
    provider: aws
    key: production/api-token
    options:
      version_stage: AWSPREVIOUS
```

Supported options are:

| Option | Meaning |
| --- | --- |
| `region` | AWS region for a secret name |
| `field` | Top-level JSON field to return |
| `version_id` | AWS secret version ID |
| `version_stage` | AWS secret version stage, such as `AWSCURRENT` or `AWSPREVIOUS` |

Dagu preserves version IDs, version stages, and field names exactly as written. Unknown options are rejected.

## Binary Values

The AWS SDK returns binary secrets as bytes. Dagu base64-encodes those bytes before injecting the value into the environment.

If AWS returns no value or the secret cannot be read, DAG initialization fails before any step starts.
