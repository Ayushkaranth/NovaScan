import base64
import hashlib
import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def _get_derived_key(custom_secret: Optional[str] = None) -> bytes:
    secret = custom_secret or getattr(settings, "ENCRYPTION_SECRET_KEY", None) or getattr(settings, "SECRET_KEY", "novascan_master_key_default_2026")
    return hashlib.sha256(secret.encode()).digest()

def encrypt_key(plain_text_key: str, custom_secret: Optional[str] = None) -> str:
    """
    Encrypts sensitive client API keys (Gemini, OpenAI, Anthropic, Jira, Notion) at rest.
    """
    if not plain_text_key:
        return ""
    nonce = os.urandom(12)
    cipher = AESGCM(_get_derived_key(custom_secret)).encrypt(nonce, plain_text_key.encode("utf-8"), None)
    return "a256gcm_" + base64.urlsafe_b64encode(nonce + cipher).decode("ascii")

def decrypt_key(cipher_text_key: str, custom_secret: Optional[str] = None) -> str:
    """
    Decrypts client API keys in-memory for ephemeral LLM / REST execution.
    """
    if not cipher_text_key:
        return ""
    if cipher_text_key.startswith("a256gcm_"):
        payload = base64.urlsafe_b64decode(cipher_text_key[8:].encode("ascii"))
        nonce, ciphertext = payload[:12], payload[12:]
        return AESGCM(_get_derived_key(custom_secret)).decrypt(nonce, ciphertext, None).decode("utf-8")
    if not cipher_text_key.startswith("enc_"):
        return cipher_text_key  # Return unencrypted if plain
    
    # Read legacy XOR-encrypted values and re-encrypt them with AES-GCM on the next save.
    key_bytes = base64.urlsafe_b64encode(_get_derived_key(custom_secret))
    cipher_bytes = base64.b64decode(cipher_text_key[4:].encode('utf-8'))
    plain_bytes = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(cipher_bytes)])
    return plain_bytes.decode('utf-8')
