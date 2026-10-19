# Markdit Web

Markdit can run as a standalone browser application, including the visual editor,
reader, right-hand table of contents, rich copy and slide generation. The web
build is separate from the desktop build; no Tauri installation is needed.

## Run locally

Use a supported Node.js LTS release (22 or later recommended):

```powershell
npm ci
npm run build:web
npm run start:web
```

Open <http://127.0.0.1:1421>. Loopback HTTP is for local use only and is treated as
a trustworthy context by supported browsers. Do not expose the Vite development
server publicly.

Drop files, folders, or a mixture of both onto the sidebar to open them through
a single entry point. Markdown files in dropped folders are discovered
recursively. Where available, dropped filesystem handles support local saving;
otherwise files remain session-only and changes must be downloaded.
Click **Open** to choose files directly, without an intermediate menu.
Browsers do not support selecting files and folders in the same native picker;
**File > Open folder** remains available for keyboard-accessible folder selection
in supported browsers.
With a supported File System Access API, you can open folders and save changes
back to a selected file. Other browsers use a standard local file chooser and
**Download (.md)**. Ctrl+S also downloads when there is no writable file handle.
The app warns before leaving with unsaved edits, subject to browser restrictions.

## Hosting with HTTPS

### Azure Static Web Apps

The deployed application is available at
<https://polite-coast-058b5cf0f.5.azurestaticapps.net>.
It uses the Free tier in East US 2, resource `swa-markdit-web` in resource group
`rg-markdit-web`. West Europe was unavailable for new resources in this
subscription at deployment time.

`npm run build:web` emits `dist-web\staticwebapp.config.json` alongside the app.
Azure uses that configuration to apply the same security headers as the local
production server, including CSP, frame protection and HSTS. Deploy only
`dist-web`, not the repository. Azure provides the public HTTPS endpoint and
managed certificate; the Node.js preview server is not needed in Azure.

For a manual production deployment to an existing Static Web App:

```powershell
npm run build:web
$env:SWA_CLI_DEPLOYMENT_TOKEN = az staticwebapp secrets list `
  --name swa-markdit-web --resource-group rg-markdit-web `
  --query properties.apiKey --output tsv
try {
  npx --yes @azure/static-web-apps-cli@2.0.10 deploy .\dist-web --env production
} finally {
  Remove-Item Env:\SWA_CLI_DEPLOYMENT_TOKEN
}
```

Never print, commit or paste the deployment token. This manual deployment does
not configure GitHub Actions or automatic redeployment on commits. The Free
tier hosts the public application without application-level authentication;
opening the site does not upload a user's documents.

### Other HTTPS hosting

The supplied production server serves only `dist-web`, never the repository.
It binds to loopback by default and refuses a non-loopback address without TLS.
For direct HTTPS hosting, supply your own trusted certificate and private key:

```powershell
$env:HOST = '0.0.0.0'
$env:PORT = '443'
$env:MARKDIT_TLS_CERT = 'C:\certificates\fullchain.pem'
$env:MARKDIT_TLS_KEY = 'C:\certificates\private.key'
npm run start:web
```

Keep certificates outside the repository. Configure DNS, certificate renewal,
firewall rules and a least-privilege service account on your hosting platform.
The server enforces TLS 1.2 or later and adds HSTS on HTTPS responses. Use a
dedicated origin, not an origin shared with untrusted applications.

Alternatively put a maintained HTTPS reverse proxy in front of the loopback
server. Terminate TLS there, redirect public HTTP to HTTPS, set HSTS at the
proxy, and preserve the application's security headers. Do not expose the
loopback upstream directly. If hosting `dist-web` on a static hosting service,
configure equivalent headers from `scripts/web-security.mjs`: the HTML's CSP
meta tag alone cannot prevent framing or supply the other response headers.

## Security and privacy boundaries

- **No account or authentication is included.** Anyone who can reach the URL
  can load the application, but there is no document storage or upload API.
  For restricted access, configure authentication at your hosting gateway
  (for example Entra ID pre-authentication). That is a separate deployment
  decision, not a security guarantee provided by this build.
- Opened documents and edits are processed in browser memory, not sent to the
  server. Edits are not automatically backed up in the cloud or stored in
  browser storage. Download/save before closing; reloading loses unsaved work.
  Preferences and, where supported, recent file handles remain on the device.
- Remote images remain blocked until explicitly enabled. If enabled, HTTPS
  image hosts receive image requests. Copy, download and email sharing remain
  explicit user actions. The server does not receive those documents.
- Rendered Markdown uses the existing sanitizer and Mermaid strict mode.
  Production CSP blocks inline JavaScript, JavaScript eval, object embeds,
  form submission and off-origin script/network connections. WebAssembly
  compilation is allowed for local syntax highlighting. Inline styles are
  allowed for editor formatting, highlighting and diagrams; HTTPS images are
  allowed by CSP but remain gated by the application.
- Response headers include frame protection, MIME sniffing protection,
  no-referrer, restricted device permissions and same-origin isolation
  policies. Responses are not cached by the supplied server. There are no
  sessions, cookies, service worker or server-side document persistence.
- These controls reduce exposure; they are not a certification or a promise of
  absolute security. Keep Node.js and dependencies patched, apply your
  organization's access policy, and review the deployment before public use.

The standalone web build also disables Markdit's native IPC bridges explicitly,
even when a browser preview is embedded in a desktop shell that exposes Tauri
globals. The regular desktop build retains its native integrations.

## Verification

```powershell
npm run test:web
npm run build:web
npx playwright test --config playwright.web.config.ts
```

The production browser tests cover local opening, editing, Markdown download,
table-of-contents navigation, blocked remote images, sanitized input, CSP,
syntax highlighting, Mermaid diagrams and slide preview.
