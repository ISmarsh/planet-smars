# GCP OAuth Token Exchange Pattern

Server-side token exchange for SPAs that need persistent Google API auth without requiring users to re-authenticate on every page refresh.

## Problem

Google Identity Services (GIS) implicit OAuth flow stores access tokens in memory only. Tokens expire after ~1 hour and are lost on page refresh. FedCM only applies to Sign-In with Google (identity), not OAuth token requests (API authorization). SPAs with no backend have no way to silently refresh tokens.

## Solution

A lightweight GCP Cloud Run function (gen2) acts as an OAuth token exchange proxy:

1. Client gets an authorization code via GIS `initCodeClient` (popup)
2. Cloud Function exchanges the code for access + refresh tokens using the client secret
3. Refresh token persists in client localStorage
4. On page load, client sends refresh token to Cloud Function for a fresh access token -- no popup, no user interaction

```
Browser (GitHub Pages)          Cloud Function              Google OAuth
  |                                |                           |
  |-- popup (initCodeClient) ----->|                           |
  |<-- authorization code ---------|                           |
  |-- POST /exchange {code} ------>|-- code + secret --------->|
  |<-- {access, refresh} ----------|<-- tokens ----------------|
  |                                |                           |
  |  (page refresh)                |                           |
  |-- POST /refresh {refresh} ---->|-- refresh + secret ------>|
  |<-- {access} -------------------|<-- new access token ------|
```

## Client-Side Integration

### Config

Add a `TOKEN_EXCHANGE_URL` env var (e.g., `VITE_TOKEN_EXCHANGE_URL`). When set, the auth layer uses the code flow. When empty, it falls back to the implicit flow -- zero breaking change for dev environments without the function.

### Auth layer

Gate on `useCodeFlow = !!TOKEN_EXCHANGE_URL`:

- **`initDriveAuth()`**: init `CodeClient` (code flow) or `TokenClient` (implicit)
- **`requestAccessToken('')`**: try `silentRefresh()` (code flow) or GIS silent attempt (implicit)
- **`requestAccessToken('consent')`**: open popup, exchange code via Cloud Function (code flow) or GIS consent popup (implicit)
- **`silentRefresh()`**: restore cached access token from localStorage, or call Cloud Function with stored refresh token. Deduplicates concurrent calls.
- **`disconnectDrive()`**: revoke token, clear localStorage

### Token storage

| Key | Storage | Lifetime |
|-----|---------|----------|
| Refresh token | localStorage | Until revoked or disconnected |
| Access token | localStorage (cache) | ~1 hour, checked with 60s buffer |
| Token expiry | localStorage | Paired with access token |

### Auth level diagnostics

Export a `getAuthLevel()` function for UI diagnostics. Returns 0-3 based on **actual state**, not just config:

| Level | Meaning | Condition |
|-------|---------|-----------|
| 0 | Storage unavailable | localStorage throws on write |
| 1 | Local only | No GIS loaded or no client ID configured |
| 2 | Session sync | GIS available but no refresh token stored (implicit flow, or code flow pre-connect) |
| 3 | Persistent sync | Code flow configured AND refresh token in localStorage |

Level 3 requires a stored refresh token -- not just `TOKEN_EXCHANGE_URL` being set. This accurately reflects whether the user will survive a page refresh without re-authenticating.

### Redirect URI

For GIS popup-based code flow, use `'postmessage'` as the `redirect_uri` in the exchange request. This is the standard convention -- no redirect URI registration needed in GCP Console for popup mode.

### Testing module-level state

The auth module has module-level variables (`useCodeFlow`, `accessToken`, etc.) that are set on import. To test different configurations in the same test suite, use `vi.resetModules()` + dynamic `import()` to get a fresh module instance per test:

```typescript
async function importFresh() {
  vi.resetModules();
  vi.doMock('../config/drive', () => ({ ...mockConfig }));
  return import('./google-drive');
}
```

Each test can modify `mockConfig` before calling `importFresh()` to simulate different environments (code flow vs implicit, missing client ID, etc.).

## Cloud Function

Single HTTP-triggered function with two actions:

```
POST /token-exchange
Content-Type: application/json
X-App-Id: my-app

{ "action": "exchange", "code": "...", "redirect_uri": "postmessage" }
{ "action": "refresh", "refresh_token": "..." }
```

### Security

- **Client secret**: loaded from GCP Secret Manager at runtime, never exposed to the browser
- **CORS**: explicit origin allowlist (no `*`), returns specific requesting origin
- **Origin validation**: rejects requests from unlisted origins
- **X-App-Id header**: logged for per-app usage tracking (not authenticated)

### Adding a new app

1. Add the app's origin to the CORS allowlist in the function
2. Redeploy the function
3. Set `TOKEN_EXCHANGE_URL` in the app's build env

If the new app uses a different OAuth client, create additional secrets and pass the client ID/secret pair based on the `X-App-Id` header or a separate config mechanism.

## GCP Setup

### Prerequisites

- GCP project with OAuth 2.0 Web Application client
- `gcloud` CLI authenticated
- Google Drive API enabled (or whichever API the app needs)

### 1. Enable APIs

```bash
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com
```

### 2. Create secrets

```bash
echo -n "YOUR_CLIENT_ID" | gcloud secrets create ohm-client-id --data-file=-
echo -n "YOUR_CLIENT_SECRET" | gcloud secrets create ohm-client-secret --data-file=-
```

### 3. Grant secret access

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) \
  --format='value(projectNumber)')

for SECRET in ohm-client-id ohm-client-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 4. Deploy

Each cloud function directory contains a `deploy.config.json` with project-specific values:

```json
{
  "functionName": "ohm-token-exchange",
  "entryPoint": "ohmTokenExchange",
  "secrets": "GOOGLE_CLIENT_ID=ohm-client-id:latest,GOOGLE_CLIENT_SECRET=ohm-client-secret:latest"
}
```

Deploy using the shared script (lives in `planet-smars/scripts/`):

```bash
cd cloud-functions/token-exchange
npm run deploy
# package.json points to: powershell -ExecutionPolicy Bypass -File ../../.planet-smars/scripts/deploy-cloud-function.ps1
```

The script reads `deploy.config.json` and provides defaults for `region` (us-central1) and `runtime` (nodejs22). Override per-function by adding those fields to the config.

### 5. Wire up deployment

Add `TOKEN_EXCHANGE_URL` (the deployed function URL) as a secret/env var in the app's CI pipeline.

## Deployment Gotchas

Lessons from first deployment (ohm project, March 2025):

- **Gen2 deploys are slow**: 2-5 minutes is normal. The first deploy provisions a Cloud Build, builds a container, and pushes to Cloud Run. Don't assume it hung.
- **Node.js runtime deprecation**: Google deprecates Node.js versions on the community EOL date. Node 20 EOL is April 2026. Use `nodejs22` to stay current. The deploy script defaults to nodejs22.
- **PowerShell quoting**: the `--set-secrets` flag uses commas. PowerShell splits on unquoted commas. If deploying manually, quote the value: `--set-secrets="KEY1=val:latest,KEY2=val:latest"`. The shared deploy script handles this.
- **No CI deploy**: Cloud Function changes are infrequent and require `gcloud` auth. Manual deploy via `npm run deploy` is sufficient. Note this in the consuming project's CLAUDE.md.
- **Vitest test leakage**: if the cloud function directory has its own `node_modules`, vitest may pick up tests from those dependencies. Add `'cloud-functions'` to the vitest `exclude` array.
- **`gcloud` on Windows**: the default installer puts the CLI in `%LOCALAPPDATA%\Google\Cloud SDK\`. The `setup-path.sh` hook adds it to Claude's bash PATH. The deploy script uses PowerShell where gcloud is on the user PATH natively.

## Free Tier Limits

Cloud Run functions gen2 free tier (us-central1, per billing account, monthly):

| Resource | Free allocation |
|----------|----------------|
| Requests | 2,000,000 |
| vCPU-seconds | 180,000 |
| Memory (GiB-seconds) | 360,000 |
| Cloud Monitoring metrics | Free for Cloud Run |
| Cloud Logging | 50 GiB/month |

A token exchange function uses ~2 requests per user session (initial exchange + occasional refresh). Even with multiple apps sharing the function, this is negligible relative to the free tier.

**Free tier regions**: us-central1, us-east1, us-west1. Deploy in one of these to stay free.

## Monitoring

### Built-in (free)

- **Cloud Run metrics dashboard**: invocation count, error rate, latency per function
- **Cloud Logging**: structured logs with `[app-id]` prefix for per-app breakdowns
- **Billing budget alert**: set a $1 threshold to catch unexpected usage

### Per-app tracking

Clients send an `X-App-Id` header. The function logs it with every request. Use Cloud Logging filters to break down usage:

```
resource.type="cloud_run_revision"
textPayload=~"\[my-app\]"
```

### Recommended alert

Create a budget alert at the billing account level:

```bash
# In GCP Console: Billing > Budgets & alerts > Create budget
# Set amount: $1.00
# Alert at: 50%, 90%, 100%
# Email notifications to billing admins
```

## Edge Cases

- **Refresh token revoked** (user revokes in Google Account settings): Cloud Function returns 400/401. Client clears stored tokens, shows reconnect UI.
- **Missing refresh token on re-grant**: Google may omit the refresh token on subsequent grants. Client preserves any existing refresh token -- does not overwrite with undefined.
- **Concurrent refresh calls**: Deduplicated via a shared in-flight promise. Only one Cloud Function call at a time.
- **Cloud Function unreachable**: `silentRefresh()` catches the error, returns null. App falls back to reconnect UI.
- **No `TOKEN_EXCHANGE_URL`**: implicit flow, identical to pre-migration behavior. Zero breaking change.

## Reusable Code Patterns

### GIS type declarations

TypeScript projects using Google Identity Services need ambient type declarations. Drop this into `src/types/google-identity.d.ts`:

```typescript
declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(overrides?: { prompt?: string }): void;
    callback: (response: TokenResponse) => void;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    error?: string;
    error_description?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;

  // --- Authorization code flow (used with server-side token exchange) ---

  interface CodeClient {
    requestCode(): void;
    callback: (response: CodeResponse) => void;
  }

  interface CodeResponse {
    code: string;
    scope: string;
    error?: string;
    error_description?: string;
  }

  interface CodeClientConfig {
    client_id: string;
    scope: string;
    ux_mode: 'popup' | 'redirect';
    redirect_uri?: string;
    callback: (response: CodeResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
  }

  function initCodeClient(config: CodeClientConfig): CodeClient;

  function revoke(token: string, callback?: () => void): void;
  function hasGrantedAllScopes(response: TokenResponse, ...scopes: string[]): boolean;
}
```

### Config module pattern

Centralize Google API config in one file. Apps customize the env var prefix:

```typescript
// src/config/drive.ts (Vite example -- adjust import.meta.env for other bundlers)
export const DRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
export const DRIVE_FILE_NAME = 'my-app-data.json';
export const DRIVE_MIME_TYPE = 'application/json';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
export const TOKEN_EXCHANGE_URL = import.meta.env.VITE_TOKEN_EXCHANGE_URL ?? '';
```

### CORS allowlist pattern

The Cloud Function validates origins explicitly. Localhost is allowed for dev but production origins are an explicit allowlist:

```typescript
const ALLOWED_ORIGINS = ['https://myuser.github.io'];

function getCorsOrigin(requestOrigin: string | undefined): string | null {
  if (!requestOrigin) return null;
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  if (/^https?:\/\/localhost(:\d+)?$/.test(requestOrigin)) return requestOrigin;
  return null;
}
```

Apply in the handler: return the specific requesting origin (not `*`), set `Vary: Origin`, and reject requests with no valid origin after the preflight check.

### Cloud Function template

The function handles two actions (`exchange` and `refresh`) with shared error handling. Key patterns:

- Secrets from env vars (injected via `--set-secrets` at deploy time)
- `X-App-Id` header for per-app logging (not auth -- just tracking)
- Return only the fields the client needs (don't proxy the full Google response)
- TypeScript with `@google-cloud/functions-framework` types

```typescript
import type { HttpFunction } from '@google-cloud/functions-framework';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

export const myTokenExchange: HttpFunction = async (req, res) => {
  const origin = getCorsOrigin(req.headers.origin);

  // CORS headers on every response (including errors)
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-App-Id');
  res.set('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!origin) { res.status(403).json({ error: 'Origin not allowed' }); return; }

  const appId = req.headers['x-app-id'] ?? 'unknown';
  const { action } = req.body;

  // ... handle 'exchange' and 'refresh' actions
  // POST to https://oauth2.googleapis.com/token with appropriate grant_type
};
```

### Dual-flow auth switching

Gate on a single boolean to support both flows in the same module:

```typescript
const useCodeFlow = !!TOKEN_EXCHANGE_URL;

// Initialization
if (useCodeFlow) {
  codeClient = google.accounts.oauth2.initCodeClient({ ... });
} else {
  tokenClient = google.accounts.oauth2.initTokenClient({ ... });
}

// Token request
if (useCodeFlow) {
  // prompt='' -> silentRefresh(), prompt='consent' -> popup + exchange
} else {
  // prompt='' -> GIS silent attempt, prompt='consent' -> GIS popup
}
```

### Silent refresh with deduplication

Prevent concurrent refresh calls (e.g., multiple components mounting simultaneously):

```typescript
let refreshPromise: Promise<string | null> | null = null;

export function silentRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doSilentRefresh().finally(() => { refreshPromise = null; });
  return refreshPromise;
}
```

### Drive appDataFolder helpers

`appDataFolder` is a hidden, app-specific storage space -- no OAuth scope for full Drive access needed. Key patterns:

- **Find file**: `GET /drive/v3/files?spaces=appDataFolder&q=name='filename'`
- **Read file**: `GET /drive/v3/files/{id}?alt=media`
- **Update file**: `PATCH /upload/drive/v3/files/{id}?uploadType=media`
- **Create file**: `POST /upload/drive/v3/files?uploadType=multipart` with `parents: ['appDataFolder']` in metadata
- Cache the file ID after first lookup to avoid repeated list calls
- On 404 during update (file deleted externally), clear cache and fall through to create

## Reference Implementation

First deployed in the [ohm](https://github.com/ISmarsh/ohm) project (PR #11). Key files:

- `cloud-functions/token-exchange/index.ts` -- Cloud Function source
- `cloud-functions/token-exchange/deploy.config.json` -- deploy parameters
- `src/utils/google-drive.ts` -- client-side auth layer (dual-flow)
- `src/utils/google-drive.test.ts` -- 19 tests covering both flows
- `src/config/drive.ts` -- env var config
- `src/types/google-identity.d.ts` -- GIS type declarations
