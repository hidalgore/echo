"""Mint an Ed25519 credential-signing keypair for ECHO_CREDENTIAL_SIGNING_KEY.

Prints the base64 private seed (the env value) and the PEM public key (what a
Phase 5 offline bundle would ship to door devices). Run per environment; the
seed is a secret — put it in the env store, never in the repo.
"""

import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate an Ed25519 keypair for credential signing (Phase 4)."

    def handle(self, *args, **options):
        private_key = Ed25519PrivateKey.generate()
        seed_b64 = base64.b64encode(
            private_key.private_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PrivateFormat.Raw,
                encryption_algorithm=serialization.NoEncryption(),
            )
        ).decode("ascii")
        public_pem = (
            private_key.public_key()
            .public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            .decode("ascii")
        )
        self.stdout.write("ECHO_CREDENTIAL_SIGNING_KEY (secret — env store only):")
        self.stdout.write(seed_b64)
        self.stdout.write("")
        self.stdout.write("Public verification key (safe to distribute):")
        self.stdout.write(public_pem)
