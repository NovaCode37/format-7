from __future__ import annotations
import os
import logging
from pathlib import Path
from typing import BinaryIO

log = logging.getLogger("storage")

UPLOADS_DIR = (Path(__file__).parent / "uploads").resolve()
UPLOADS_DIR.mkdir(exist_ok=True)

def backend() -> str:
    return os.environ.get("STORAGE_BACKEND", "local").lower()

def _local_save(stored_name: str, data: bytes) -> None:
    path = (UPLOADS_DIR / stored_name).resolve()
    if UPLOADS_DIR not in path.parents:
        raise ValueError("path traversal blocked")
    path.write_bytes(data)

def _local_open(stored_name: str) -> BinaryIO | None:
    path = (UPLOADS_DIR / stored_name).resolve()
    if UPLOADS_DIR not in path.parents:
        return None
    if not path.exists():
        return None
    return open(path, "rb")

def _local_delete(stored_name: str) -> None:
    path = (UPLOADS_DIR / stored_name).resolve()
    if UPLOADS_DIR in path.parents and path.exists():
        try:
            path.unlink()
        except OSError:
            pass

_s3_client = None
_s3_bucket = None

def _get_s3():

    global _s3_client, _s3_bucket
    if _s3_client is not None:
        return _s3_client, _s3_bucket
    import boto3
    from botocore.client import Config

    _s3_bucket = os.environ["S3_BUCKET"]
    _s3_client = boto3.client(
        "s3",
        endpoint_url=os.environ.get("S3_ENDPOINT_URL") or None,
        region_name=os.environ.get("S3_REGION", "ru-central1"),
        aws_access_key_id=os.environ["S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["S3_SECRET_KEY"],
        config=Config(signature_version="s3v4"),
    )
    return _s3_client, _s3_bucket

def _s3_save(stored_name: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    client, bucket = _get_s3()
    client.put_object(
        Bucket=bucket,
        Key=f"uploads/{stored_name}",
        Body=data,
        ContentType=content_type,
    )

def _s3_open(stored_name: str) -> BinaryIO | None:
    client, bucket = _get_s3()
    try:
        resp = client.get_object(Bucket=bucket, Key=f"uploads/{stored_name}")
        return resp["Body"]
    except client.exceptions.NoSuchKey:
        return None
    except Exception as e:
        log.warning("s3 get failed: %s", e)
        return None

def _s3_delete(stored_name: str) -> None:
    client, bucket = _get_s3()
    try:
        client.delete_object(Bucket=bucket, Key=f"uploads/{stored_name}")
    except Exception as e:
        log.warning("s3 delete failed: %s", e)

def save(stored_name: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    if backend() == "s3":
        _s3_save(stored_name, data, content_type)
    else:
        _local_save(stored_name, data)

def open_stream(stored_name: str) -> BinaryIO | None:
    if backend() == "s3":
        return _s3_open(stored_name)
    return _local_open(stored_name)

def delete(stored_name: str) -> None:
    if backend() == "s3":
        _s3_delete(stored_name)
    else:
        _local_delete(stored_name)

def exists(stored_name: str) -> bool:

    if backend() == "local":
        return (UPLOADS_DIR / stored_name).exists()

    return True
