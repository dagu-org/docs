---
description: Prepare private HTTPS access for a Dagu cloud VM with Tailscale.
---

# Private HTTPS for VMs

Complete this once before using the Google Cloud, AWS, Azure, or DigitalOcean guide. Dagu stays on localhost and Tailscale provides private HTTPS. No inbound Dagu port or SSH session is required.

## Prepare Tailscale

1. Enable [MagicDNS and HTTPS](https://tailscale.com/docs/how-to/set-up-https-certificates).
2. Merge a Dagu tag and grant into the [tailnet policy](https://tailscale.com/docs/features/access-control/grants). Replace the email address:

```json
{
  "tagOwners": {
    "tag:dagu": ["admin@example.com"]
  },
  "grants": [
    {
      "src": ["admin@example.com"],
      "dst": ["tag:dagu"],
      "ip": ["tcp:443"]
    }
  ]
}
```

Grants are additive. Remove any broader rule that already gives other users access to `tag:dagu`.

3. Generate a non-reusable auth key with `tag:dagu` and the shortest useful expiry. If device approval is enabled, make the key pre-approved.
4. Paste that key and a unique hostname into the provider script.

The provider stores the script in instance metadata. Never use a reusable key there. If setup fails before the VM joins the tailnet, revoke the key and create another one.

After deployment, open the exact HTTPS name shown on Tailscale's **Machines** page and create the first Dagu administrator. Only the identity allowed by the grant can reach the setup page.

Tailscale publishes the machine and tailnet names in Certificate Transparency logs when HTTPS is enabled. Do not put sensitive information in either name.

See Tailscale's [server setup](https://tailscale.com/docs/how-to/set-up-servers) and [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
