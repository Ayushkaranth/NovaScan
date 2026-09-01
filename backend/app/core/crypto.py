import base64
import hashlib
import os
from typing import Optional
from app.core.config import settings

def _get_derived_key(custom_secret: Optional[str] = None) -> bytes:
    secret = custom_secret or getattr(settings, "SECRET_KEY", "novascan_master_key_default_2026")
    return base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())

def encrypt_key(plain_text_key: str, custom_secret: Optional[str] = None) -> str:
    """
    Encrypts sensitive client API keys (Gemini, OpenAI, Anthropic, Jira, Notion) at rest.
    """
    if not plain_text_key:
        return ""
    key_bytes = _get_derived_key(custom_secret)
    # Simple XOR + Base64 envelope for zero-dependency portability
    raw = plain_text_key.encode('utf-8')
    cipher = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(raw)])
    return "enc_" + base64.b64encode(cipher).decode('utf-8')

def decrypt_key(cipher_text_key: str, custom_secret: Optional[str] = None) -> str:
    """
    Decrypts client API keys in-memory for ephemeral LLM / REST execution.
    """
    if not cipher_text_key:
        return ""
    if not cipher_text_key.startswith("enc_"):
        return cipher_text_key  # Return unencrypted if plain
    
    key_bytes = _get_derived_key(custom_secret)
    cipher_bytes = base64.b64decode(cipher_text_key[4:].encode('utf-8'))
    plain_bytes = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(cipher_bytes)])
    return plain_bytes.decode('utf-8')
