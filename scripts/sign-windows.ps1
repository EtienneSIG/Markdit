<#
.SYNOPSIS
  Authenticode-signs the Markdit Windows artifacts (markdit.exe + MSI + NSIS
  setup.exe) so Windows stops showing the "unknown publisher" prompt.

.DESCRIPTION
  SmartScreen's "Windows protected your PC" warning appears because the
  installer is unsigned and has no download reputation. Signing fixes the
  "unknown publisher" part:

    * Real EV certificate ....... removes SmartScreen instantly, for everyone.
    * Real OV certificate ....... removes "unknown publisher"; SmartScreen may
                                  still warn until the app earns download
                                  reputation.
    * Self-signed certificate ... only removes the warning on machines that
                                  TRUST this certificate (it is added to the
                                  per-user Trusted Root + Trusted Publishers
                                  stores). Good for personal/internal use only;
                                  it does NOT help other people who download the
                                  installer.

  No code change can create SmartScreen reputation — only a real certificate
  (ideally EV) does that immediately.

.PARAMETER Thumbprint
  SHA-1 thumbprint of an existing code-signing certificate in the current
  user's certificate store (use this with a real EV/OV certificate). Defaults
  to the MARKDIT_SIGN_THUMBPRINT environment variable.

.PARAMETER CreateSelfSigned
  Create (or reuse) a local self-signed code-signing certificate and trust it
  on THIS machine only. Free, for personal use. SECURITY: this adds a root
  certificate to your per-user trust store; only do this on machines you own.

.PARAMETER TimestampUrl
  RFC 3161 timestamp server. A timestamp keeps signatures valid after the
  certificate expires.

.PARAMETER BundleDir
  Folder containing the built release artifacts. Defaults to the redirected
  CARGO_TARGET_DIR used by this repo (see scripts/.. and repo build notes).

.EXAMPLE
  # Personal use (free): create/trust a self-signed cert and sign the build
  pwsh -File scripts/sign-windows.ps1 -CreateSelfSigned

.EXAMPLE
  # Distribution: sign with a real certificate already imported in the store
  pwsh -File scripts/sign-windows.ps1 -Thumbprint ABC123...DEF
#>
[CmdletBinding()]
param(
  [string]$Thumbprint = $env:MARKDIT_SIGN_THUMBPRINT,
  [switch]$CreateSelfSigned,
  [string]$TimestampUrl = 'http://timestamp.digicert.com',
  [string]$BundleDir = (Join-Path $env:LOCALAPPDATA 'markdit-cargo-target\release')
)

$ErrorActionPreference = 'Stop'
$selfSignedSubject = 'CN=Markdit Dev (Self-Signed)'

function Find-SignTool {
  $candidates = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Windows Kits\10\bin" -Recurse -Filter 'signtool.exe' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\x64\\signtool\.exe$' } |
    Sort-Object FullName -Descending
  if ($candidates) { return $candidates[0].FullName }
  return $null
}

function New-MarkditSelfSignedCert {
  $existing = Get-ChildItem Cert:\CurrentUser\My |
    Where-Object { $_.Subject -eq $selfSignedSubject -and $_.NotAfter -gt (Get-Date) } |
    Sort-Object NotAfter -Descending | Select-Object -First 1
  if ($existing) {
    Write-Host "Reusing existing self-signed certificate ($($existing.Thumbprint))."
    $cert = $existing
  }
  else {
    Write-Host 'Creating self-signed code-signing certificate...'
    $cert = New-SelfSignedCertificate `
      -Type CodeSigningCert `
      -Subject $selfSignedSubject `
      -FriendlyName 'Markdit Dev (Self-Signed)' `
      -CertStoreLocation 'Cert:\CurrentUser\My' `
      -KeyUsage DigitalSignature `
      -KeyExportPolicy Exportable `
      -KeyAlgorithm RSA -KeyLength 3072 `
      -HashAlgorithm SHA256 `
      -NotAfter (Get-Date).AddYears(5)
  }

  # Trust the certificate on THIS machine so Windows treats the signature as a
  # known publisher. Per-user stores -> no admin rights required, fully
  # reversible (remove from certmgr.msc -> Trusted Root / Trusted Publishers).
  $tmp = Join-Path $env:TEMP 'markdit-selfsigned.cer'
  Export-Certificate -Cert $cert -FilePath $tmp -Force | Out-Null
  foreach ($store in @('Cert:\CurrentUser\Root', 'Cert:\CurrentUser\TrustedPublisher')) {
    if (-not (Get-ChildItem $store | Where-Object Thumbprint -eq $cert.Thumbprint)) {
      Import-Certificate -FilePath $tmp -CertStoreLocation $store | Out-Null
      Write-Host "Trusted certificate in $store."
    }
  }
  Remove-Item $tmp -ErrorAction SilentlyContinue
  return $cert
}

# --- Resolve the signing certificate ---------------------------------------
$cert = $null
if ($CreateSelfSigned) {
  $cert = New-MarkditSelfSignedCert
  $Thumbprint = $cert.Thumbprint
}
elseif ($Thumbprint) {
  $cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object Thumbprint -eq $Thumbprint | Select-Object -First 1
  if (-not $cert) { throw "No certificate with thumbprint '$Thumbprint' found in Cert:\CurrentUser\My." }
}
else {
  throw 'Provide -Thumbprint <cert> for a real certificate, or -CreateSelfSigned for a free local certificate.'
}

# --- Collect the artifacts to sign -----------------------------------------
$files = @()
$files += Join-Path $BundleDir 'markdit.exe'
$files += Get-ChildItem (Join-Path $BundleDir 'bundle\msi') -Filter '*.msi' -ErrorAction SilentlyContinue | ForEach-Object FullName
$files += Get-ChildItem (Join-Path $BundleDir 'bundle\nsis') -Filter '*setup.exe' -ErrorAction SilentlyContinue | ForEach-Object FullName
$files = $files | Where-Object { $_ -and (Test-Path $_) }

if (-not $files) {
  throw "No artifacts found under '$BundleDir'. Run 'npm run tauri build' first."
}

# --- Sign -------------------------------------------------------------------
$signtool = Find-SignTool
foreach ($file in $files) {
  Write-Host "Signing $file ..."
  if ($signtool) {
    & $signtool sign /sha1 $Thumbprint /fd SHA256 /tr $TimestampUrl /td SHA256 $file
    if ($LASTEXITCODE -ne 0) { throw "signtool failed for $file (exit $LASTEXITCODE)." }
  }
  else {
    # Fallback when the Windows SDK signtool.exe is not installed.
    $res = Set-AuthenticodeSignature -FilePath $file -Certificate $cert -HashAlgorithm SHA256 -TimestampServer $TimestampUrl
    if ($res.Status -ne 'Valid') { throw "Set-AuthenticodeSignature failed for $file (status: $($res.Status))." }
  }
}

Write-Host ''
Write-Host "Signed $($files.Count) file(s) with certificate $Thumbprint." -ForegroundColor Green
if ($CreateSelfSigned) {
  Write-Host 'Note: a self-signed signature only suppresses the warning on machines that trust this certificate.' -ForegroundColor Yellow
  Write-Host 'For public distribution, sign with a real EV/OV certificate via -Thumbprint instead.' -ForegroundColor Yellow
}
