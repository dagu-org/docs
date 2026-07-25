# Azure Key Vault Provider

The `azure` provider reads a value from Azure Key Vault and injects it as a secret environment variable.

```yaml
secrets:
  - name: DB_PASSWORD
    provider: azure
    key: production-database
    options:
      vault_url: https://my-vault.vault.azure.net
```

`key` can be a secret name or a complete Azure Key Vault secret URL. Keys and option values are literal strings. They are not expanded through DAG variables, params, or dotenv values.

## Authentication

Dagu uses Azure SDK [`DefaultAzureCredential`](https://learn.microsoft.com/azure/developer/go/sdk/authentication/credential-chains#defaultazurecredential-overview). Credentials are not configured in the DAG or Dagu configuration, and the Azure provider does not support named profiles.

`DefaultAzureCredential` attempts these authentication methods in order:

1. Environment credentials
2. Workload identity
3. Managed identity
4. Azure CLI
5. Azure Developer CLI
6. Azure PowerShell

### Local Development

Authenticate with one of the supported development tools before starting Dagu:

```bash
az login
# or
azd auth login
```

Azure PowerShell credentials created by `Connect-AzAccount` are also supported.

### Service Principal

Configure an application service principal through environment variables:

```bash
export AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
export AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
export AZURE_CLIENT_SECRET=your-client-secret
dagu start-all
```

Prefer workload identity or managed identity for production workloads to avoid long-lived client secrets.

### Azure Runtimes

On an Azure service that supports managed identities, enable a system-assigned identity or attach a user-assigned identity. For a user-assigned managed identity, set `AZURE_CLIENT_ID` to its client ID. On Azure Kubernetes Service, use Microsoft Entra Workload ID to provide an identity to the Dagu pod.

To restrict `DefaultAzureCredential` to production credentials, set:

```bash
export AZURE_TOKEN_CREDENTIALS=prod
```

This restricts the chain to environment, workload identity, and managed identity credentials. A specific credential name, such as `ManagedIdentityCredential`, can also be selected with `AZURE_TOKEN_CREDENTIALS`.

In distributed execution, configure credentials on every worker that resolves Azure secrets.

### Sovereign Clouds

`DefaultAzureCredential` authenticates against Azure Public Cloud by default. When environment credentials authenticate to Azure Government or Azure China, set the matching authority before starting Dagu:

```bash
# Azure Government
export AZURE_AUTHORITY_HOST=https://login.microsoftonline.us/

# Azure China
export AZURE_AUTHORITY_HOST=https://login.chinacloudapi.cn/
```

Set only the authority that matches the vault endpoint. Developer-tool credentials use the cloud configured in that tool, so configure Azure CLI for the matching cloud before running `az login`.

### Required Permissions

The authenticated principal needs permission to read the referenced secrets. For vaults using Azure role-based access control, assign the [Key Vault Secrets User](https://learn.microsoft.com/azure/key-vault/general/rbac-guide) role at the narrowest practical scope. For vaults using legacy access policies, grant the `Get` secret permission.

## Vault URL

A default vault URL can be configured in Dagu `config.yaml`:

```yaml
secrets:
  azure:
    vault_url: https://my-vault.vault.azure.net
```

The same setting can be provided through a Dagu configuration environment variable:

```bash
export DAGU_SECRETS_AZURE_VAULT_URL=https://my-vault.vault.azure.net
```

A direct reference can override the default:

```yaml
secrets:
  - name: API_TOKEN
    provider: azure
    key: production-api-token
    options:
      vault_url: https://another-vault.vault.azure.net
```

Vault URLs must use HTTPS and an Azure Key Vault endpoint in Azure Public Cloud, Azure Government, or Azure China.

## Secret URLs

The provider accepts these key forms:

| Key form | Example |
| --- | --- |
| Secret name | `production-api-token` |
| Secret URL | `https://my-vault.vault.azure.net/secrets/production-api-token` |
| Version URL | `https://my-vault.vault.azure.net/secrets/production-api-token/0123456789abcdef0123456789abcdef` |

A secret name requires a vault URL from `options.vault_url` or the global Azure configuration. A complete secret URL already contains its vault, so it cannot be combined with `options.vault_url`.

When the URL does not contain a version, Dagu uses `options.version` or retrieves the latest version. Azure generates each version as a 32-character identifier. A version URL cannot be combined with `options.version`.

## JSON Fields

Use `options.field` to select one top-level field from a JSON secret:

```yaml
secrets:
  - name: DB_PASSWORD
    provider: azure
    key: production-database
    options:
      vault_url: https://my-vault.vault.azure.net
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
| `vault_url` | Vault URL for a secret name |
| `version` | Azure Key Vault secret version |
| `field` | Top-level JSON field to return |

Dagu normalizes vault URLs. Version identifiers and field names are preserved exactly as written. Unknown options are rejected. If the secret has no value or cannot be read, DAG initialization fails before any step starts.
