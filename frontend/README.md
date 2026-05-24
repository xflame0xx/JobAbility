# JobAbility Frontend

React/Vite frontend for the JobAbility vacancy platform.

## Local Development

```bash
npm ci
npm run dev:mock
```

`npm run dev:mock` runs the full interface on demonstration data. Use
`npm run dev:backend` when Django is available at `http://127.0.0.1:9003`.

## GitHub Pages

GitHub Pages serves static frontend files only; it cannot run Django or host a
database. The Pages build therefore opens in a complete demo mode by default.
The published repository site is:

```text
https://xflame0xx.github.io/JobAbility/
```

The deployment workflow derives the `/JobAbility/` base path from the current
GitHub repository name, so future repository renames do not require a manual
Vite path edit.

To use real data, deploy Django on a public HTTPS host and create this GitHub
repository variable:

```text
JOBABILITY_API_BASE_URL=https://your-api.example.com
```

The Pages workflow will then build the frontend in live API mode. On the
deployed Django host configure:

```text
CORS_ALLOWED_ORIGINS=https://xflame0xx.github.io
CSRF_TRUSTED_ORIGINS=https://xflame0xx.github.io
SESSION_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SAMESITE=None
CSRF_COOKIE_SECURE=True
```

`CORS_ALLOWED_ORIGIN_REGEXES` already accepts GitHub Pages origins in the
project settings. The cookie values above are required for authentication
requests made from Pages to a separate backend domain.
