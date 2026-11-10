# Security policy

## Supported deployment

The current public release is a local-first browser MVP. Supabase is optional and must be configured by the store owner. The repository's CI checks source-level guardrails; they are not a penetration test or proof of live tenant isolation.

## Reporting a vulnerability

Please do not publish exploitable security details in a public issue. Use GitHub's private vulnerability reporting / Security Advisories for this repository when that feature is available. If private reporting is unavailable, contact the repository maintainer privately through GitHub before sharing technical details.

Include the affected version or commit, impact, reproduction steps, and any relevant logs. Do not include real customer data, passwords, access tokens, or secret keys.

## Deployment safety

- Never place Supabase `service_role`, `sb_secret_`, database passwords, or other privileged credentials in browser code, Git history, issues, or screenshots.
- Use only a public publishable/anon key in the browser, and only after applying and testing the RLS migrations.
- Keep Supabase Auth redirect URLs restricted to the intended deployment domains.
- Apply database migrations in order and review them before execution.
- Test tenant isolation with two unrelated accounts before storing real customer information.
- Do not treat GitHub Pages or browser local storage as a secure private server or encrypted backup.
- Revoke and rotate any credential that may have been exposed.

## Scope

The project currently has no dedicated private backend operated by this repository. Store owners control their own Supabase projects and are responsible for access, backups, retention, and incident response for those projects.
