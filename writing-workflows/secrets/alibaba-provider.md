# Alibaba Cloud KMS Provider

The `alibaba` provider reads a value from Alibaba Cloud Key Management Service (KMS) and injects it as a secret environment variable.

```yaml
secrets:
  - name: DB_PASSWORD
    provider: alibaba
    key: production/database
```

`key` can be a secret name or a complete Alibaba Cloud KMS secret ARN. Keys and option values are literal strings. They are not expanded through DAG variables, params, or dotenv values.

## Authentication

Dagu uses the [Alibaba Cloud Credentials default provider chain](https://www.alibabacloud.com/help/en/sdk/developer-reference/v2-manage-go-access-credentials). Credentials are not configured in the DAG or Dagu configuration.

The credential chain supports:

- `ALIBABA_CLOUD_ACCESS_KEY_ID`, `ALIBABA_CLOUD_ACCESS_KEY_SECRET`, and optional `ALIBABA_CLOUD_SECURITY_TOKEN` environment variables
- OIDC RAM roles
- Alibaba Cloud CLI profiles in `~/.aliyun/config.json`
- ECS instance RAM roles
- Credential URIs

Prefer temporary credentials supplied through RAM roles or federation instead of long-lived AccessKey pairs.

### Named Profiles

Select an Alibaba Cloud CLI profile for the Dagu process:

```bash
export ALIBABA_CLOUD_PROFILE=production
dagu start-all
```

Profile selection is process-wide. `options.profile` is not supported. In distributed execution, configure credentials on every worker that resolves Alibaba Cloud secrets.

### Required Permissions

The authenticated principal needs [`kms:GetSecretValue`](https://www.alibabacloud.com/help/en/kms/key-management-service/developer-reference/api-getsecretvalue) permission for every referenced secret. A secret protected by a customer-managed key also requires `kms:Decrypt` permission for that key.

## Region

A default region can be configured in Dagu `config.yaml`:

```yaml
secrets:
  alibaba:
    region: cn-hangzhou
```

The same setting can be provided through a Dagu configuration environment variable:

```bash
export DAGU_SECRETS_ALIBABA_REGION=cn-hangzhou
```

A direct reference can override the default:

```yaml
secrets:
  - name: API_TOKEN
    provider: alibaba
    key: production/api-token
    options:
      region: ap-southeast-1
```

For an ARN, Dagu uses the embedded region:

```yaml
secrets:
  - name: API_TOKEN
    provider: alibaba
    key: acs:kms:cn-hangzhou:1234567890123456:secret/production/api-token
```

If `options.region` is also set, it must match the ARN region. A secret name requires a region from `options.region` or the global configuration.

## Gateways

Without an endpoint override, the Alibaba Cloud SDK derives the shared public KMS endpoint from the region.

Configure a shared VPC endpoint explicitly when Dagu runs inside an Alibaba Cloud VPC:

```yaml
secrets:
  alibaba:
    region: cn-hangzhou
    endpoint: kms-vpc.cn-hangzhou.aliyuncs.com
```

For a dedicated gateway, configure the KMS instance endpoint and its CA certificate:

```yaml
secrets:
  alibaba:
    region: cn-hangzhou
    endpoint: kst-example.cryptoservice.kms.aliyuncs.com
    ca_file: /etc/dagu/alibaba-kms-ca.pem
```

The endpoint must be a hostname without `https://` or a path. Relative CA file paths are resolved from the Dagu process working directory.

An endpoint applies to every Alibaba Cloud secret resolved by the Dagu process. References cannot override the configured region when an endpoint is set.

The settings can also be supplied through environment variables:

```bash
export DAGU_SECRETS_ALIBABA_ENDPOINT=kst-example.cryptoservice.kms.aliyuncs.com
export DAGU_SECRETS_ALIBABA_CA_FILE=/etc/dagu/alibaba-kms-ca.pem
```

Dedicated gateways are reachable only from associated private networks. The CA certificate can be downloaded from the KMS instance details page. See the [Alibaba Cloud KMS gateway documentation](https://www.alibabacloud.com/help/en/kms/key-management-service/developer-reference/sdk-usage-overview).

## JSON Fields

Use `options.field` to select one top-level field from a JSON secret:

```yaml
secrets:
  - name: DB_PASSWORD
    provider: alibaba
    key: production/database
    options:
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

## Secret Versions

Alibaba Cloud KMS returns the version marked `ACSCurrent` when no version is specified. Select another version by ID or stage:

```yaml
secrets:
  - name: API_TOKEN
    provider: alibaba
    key: production/api-token
    options:
      version_stage: ACSPrevious
```

Supported options are:

| Option | Meaning |
| --- | --- |
| `region` | Alibaba Cloud region for a secret name |
| `field` | Top-level JSON field to return |
| `version_id` | Alibaba Cloud KMS secret version ID |
| `version_stage` | Alibaba Cloud KMS secret version stage |

Dagu preserves version IDs, version stages, and field names exactly as written. Unknown options are rejected.

If Alibaba Cloud KMS returns no value or the secret cannot be read, DAG initialization fails before any step starts.
