//! T046 [US3] — `updater_install` fails closed on an unsigned/altered artifact
//! (FR-008, Principle V — supply-chain integrity).

use crate::commands::update::{verify_update_artifact, UpdateArtifact};
use sha2::{Digest, Sha256};

const PUBKEY: &str = "dummy-release-public-key";

fn sign(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

#[test]
fn verify_accepts_a_correctly_signed_artifact() {
    let bytes = b"markdit-setup-1.0.0.msi contents";
    let artifact = UpdateArtifact {
        bytes,
        signature: &sign(bytes),
        public_key: PUBKEY,
    };
    assert!(verify_update_artifact(&artifact).is_ok());
}

#[test]
fn verify_rejects_an_unsigned_artifact() {
    let bytes = b"unsigned artifact";
    let artifact = UpdateArtifact { bytes, signature: "", public_key: PUBKEY };
    let err = verify_update_artifact(&artifact).expect_err("unsigned must be rejected");
    assert_eq!(err.code, "PERMISSION_DENIED");
}

#[test]
fn verify_rejects_an_altered_artifact() {
    let original = b"trusted artifact";
    let signature = sign(original);
    // Attacker swaps the payload while keeping the original signature.
    let tampered = b"malicious artifact!!";
    let artifact = UpdateArtifact {
        bytes: tampered,
        signature: &signature,
        public_key: PUBKEY,
    };
    let err = verify_update_artifact(&artifact).expect_err("altered must be rejected");
    assert_eq!(err.code, "PERMISSION_DENIED");
}

#[test]
fn verify_fails_closed_when_no_trust_anchor_is_configured() {
    let bytes = b"any artifact";
    let artifact = UpdateArtifact { bytes, signature: &sign(bytes), public_key: "" };
    let err = verify_update_artifact(&artifact).expect_err("missing key must fail closed");
    assert_eq!(err.code, "PERMISSION_DENIED");
}
