# License Comparison

This page compares the Community, Team, and Pro self-host plans. It does not list prices; see the [pricing page](https://dagu.sh/pricing) for current commercial terms.

## At a Glance

| Capability | Community | Team | Pro |
| --- | --- | --- | --- |
| Core workflow orchestration | ✓ | ✓ | ✓ |
| Web UI | ✓ | ✓ | ✓ |
| Workers | ✓ | ✓ | ✓ |
| Docker run action | ✓ | ✓ | ✓ |
| API keys | △ Up to 2 | ✓ | ✓ |
| OIDC/SSO | - | ✓ | ✓ |
| User management | - | ✓ | ✓ |
| Audit logs | - | ✓ | ✓ |
| Notification routing | ✓ | ✓ | ✓ |
| Incident routing | - | ✓ | ✓ |

## Notes

- **Workers:** run jobs outside the server. Self-hosted workers are not licensed separately.
- **Server licenses:** Team includes 3 self-host server licenses; Pro includes 15.
- **API keys:** Community self-host supports up to 2 API keys.
- **OIDC/SSO:** login with an external identity provider.
- **User management:** create, update, disable, and delete users.
- **Audit logs:** review administrative and security-relevant activity.
- **Notification routing:** send workflow events to team channels.
- **Incident routing:** open and resolve provider incidents for failed workflows.

## Related Pages

- [Builtin Authentication](/server-admin/authentication/builtin)
- [OIDC Authentication](/server-admin/authentication/oidc)
- [Audit Logging](/server-admin/server#audit-logging)
- [Notifications](/web-ui/notifications)
- [Incident Routing](/web-ui/incidents)
- [Pricing](https://dagu.sh/pricing)
