# Install on Kubernetes

The official Helm chart installs Dagu in a plug-and-play standalone mode by default. One pod runs the Web UI, scheduler, and local workflow executor, so a regular `ReadWriteOnce` volume is enough for most installations.

## Prerequisites

- Kubernetes 1.19 or newer
- Helm 3
- A default `StorageClass` that supports `ReadWriteOnce`, or the name of one to select

An Ingress controller, DNS record, and TLS certificate are needed only when the UI should be reachable through Ingress.

## Install

```bash
helm repo add dagu https://dagucloud.github.io/dagu
helm repo update
helm upgrade --install dagu dagu/dagu \
  --namespace dagu \
  --create-namespace \
  --wait
```

The default installation creates:

- one Dagu Deployment running the server, scheduler, and local executor
- a 10 Gi `ReadWriteOnce` PersistentVolumeClaim
- a `ClusterIP` Service for the UI and API

The PVC is retained when the Helm release is uninstalled.

If the cluster has no default StorageClass, select one explicitly:

```bash
helm upgrade --install dagu dagu/dagu \
  --namespace dagu \
  --create-namespace \
  --set-string persistence.storageClass=standard \
  --wait
```

## Open the UI

For temporary access, forward the UI Service:

```bash
kubectl --namespace dagu port-forward service/dagu-ui 8080:8080
```

Open <http://localhost:8080> and complete the administrator setup. Run `helm get notes dagu --namespace dagu` to see access commands for the installed release.

## Configure Ingress

Create `dagu-values.yaml` and replace the ingress class, hostname, and TLS Secret with values for the cluster:

```yaml
ingress:
  enabled: true
  className: your-ingress-class
  host: dagu.example.com
  path: /
  pathType: Prefix
  tls:
    enabled: true
    secretName: dagu-tls

config:
  publicUrl: https://dagu.example.com
```

The TLS Secret must exist in the Dagu namespace. Leave `secretName` empty only when the ingress controller supplies a default certificate.

Apply the values:

```bash
helm upgrade --install dagu dagu/dagu \
  --namespace dagu \
  --create-namespace \
  --values dagu-values.yaml \
  --wait
```

Point `dagu.example.com` at the ingress controller, then check the resource:

```bash
kubectl --namespace dagu get ingress dagu-ui
```

Open <https://dagu.example.com>. The bundled UI and API use the same origin, so no CORS setting is needed. With OIDC, use the same URL for `auth.oidc.clientUrl` and register `https://dagu.example.com/oidc-callback` with the identity provider.

Proxy-header authentication has a separate trust model and cannot use the chart-managed Ingress. Follow [Proxy Authentication](/server-admin/authentication/proxy) before enabling it.

## Customize storage

Set the size or StorageClass with a values file:

```yaml
persistence:
  size: 20Gi
  storageClass: standard
```

To reuse a PVC managed outside the release:

```yaml
persistence:
  existingClaim: dagu-data
```

The existing PVC must be in the release namespace. The chart does not create, resize, or delete it.

## Use distributed mode

Distributed mode runs the UI server, scheduler, coordinator, and workers in separate Deployments. The server-side components require shared `ReadWriteMany` storage:

```yaml
deploymentMode: distributed

persistence:
  accessMode: ReadWriteMany
  storageClass: nfs-client
```

Workers use ephemeral local storage and report results through the coordinator. See [Kubernetes deployment](/server-admin/deployment/kubernetes#distributed-mode) for worker pools and operational details.

## Upgrade

```bash
helm repo update
helm upgrade dagu dagu/dagu \
  --namespace dagu \
  --values dagu-values.yaml \
  --wait
```

Keep the release configuration in a values file and pass the same file on every upgrade. If the release uses only chart defaults, omit the `--values` line.

## Install from a source checkout

From the Dagu repository root:

```bash
helm upgrade --install dagu ./charts/dagu \
  --namespace dagu \
  --create-namespace \
  --wait
```

## Image version

The chart uses its `appVersion` as the image tag by default. Override the tag only when a different Dagu version is required:

```yaml
image:
  tag: "<dagu-version>"
```

## Verify

```bash
kubectl --namespace dagu get pods
kubectl --namespace dagu get pvc
helm test dagu --namespace dagu
```

For all chart settings, troubleshooting, and distributed configuration, see [Kubernetes deployment](/server-admin/deployment/kubernetes). To remove the release, see [Uninstall](/getting-started/installation/uninstall#helm).
