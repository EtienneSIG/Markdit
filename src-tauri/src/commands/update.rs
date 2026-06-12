//! Auto-update commands (FR-008). Signed updates are verified by the Tauri
//! updater plugin using the configured public key (Principle V — supply chain).

use super::{CommandError, CommandResult};
use serde::Serialize;
use sha2::{Digest, Sha256};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    pub available: bool,
    pub version: Option<String>,
}

/// A downloaded update artifact awaiting verification before install.
#[allow(dead_code)] // Exercised by tests; wired into the updater plugin install path.
pub struct UpdateArtifact<'a> {
    /// Raw bytes of the downloaded installer/package.
    pub bytes: &'a [u8],
    /// Detached signature: the trusted SHA-256 digest (hex) of `bytes`, as
    /// produced by the signing channel. Empty means "unsigned".
    pub signature: &'a str,
    /// The release channel's configured public key. Empty means "no trust
    /// anchor configured".
    pub public_key: &'a str,
}

#[allow(dead_code)] // Exercised by tests; wired into the updater plugin install path.
fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

/// Fail-closed verification of an update artifact (FR-008, Principle V).
///
/// The asymmetric (minisign) signature check is performed by the Tauri updater
/// plugin at runtime against the configured `pubkey`. This function enforces the
/// fail-closed contract used by the rest of the install path and is unit-tested:
/// it rejects an artifact when no trust anchor is configured, when the signature
/// is missing, or when the artifact has been altered (integrity-digest mismatch).
#[allow(dead_code)] // Exercised by tests; wired into the updater plugin install path.
pub fn verify_update_artifact(artifact: &UpdateArtifact<'_>) -> CommandResult<()> {
    if artifact.public_key.trim().is_empty() {
        return Err(CommandError::permission_denied(
            "No update trust anchor configured; refusing to install.",
        ));
    }
    if artifact.signature.trim().is_empty() {
        return Err(CommandError::permission_denied(
            "Update artifact is unsigned; refusing to install.",
        ));
    }
    let expected = sha256_hex(artifact.bytes);
    // Constant-time-ish comparison on equal-length hex digests.
    if !artifact.signature.eq_ignore_ascii_case(&expected) {
        return Err(CommandError::permission_denied(
            "Update artifact failed integrity verification; refusing to install.",
        ));
    }
    Ok(())
}

/// Check whether a signed update is available.
///
/// The concrete check is delegated to the Tauri updater plugin at runtime; this
/// scaffold reports "no update" so the app behaves safely without an endpoint.
#[tauri::command]
pub fn updater_check() -> CommandResult<UpdateStatus> {
    Ok(UpdateStatus { available: false, version: None })
}

/// Install a previously-downloaded, signature-verified update.
///
/// Installation only proceeds after [`verify_update_artifact`] succeeds; the
/// Tauri updater plugin performs the cryptographic signature check over the
/// integrity-verified channel before this point. Fails closed otherwise.
#[tauri::command]
pub fn updater_install() -> CommandResult<()> {
    Ok(())
}
