# Security Policy

## Supported versions

Only the latest version on the `main` branch is actively maintained while Alpha is in foundation development.

## Reporting a vulnerability

Please do not disclose security vulnerabilities in public issues. Contact the repository maintainer privately through the contact method listed on the GitHub profile.

Include a clear description, reproduction steps, affected component, and potential impact. Please allow reasonable time for investigation and remediation before public disclosure.

## Security expectations

- Never commit secrets, API keys, service-role keys, passwords, private keys, or credentials.
- Use Supabase's publishable/anon key only where appropriate; never expose a Supabase service-role key to browser code.
- Keep dependencies updated through reviewed Dependabot pull requests.
- Store deployment secrets in the deployment platform's secret manager.
