from __future__ import annotations
import os
import time
import threading
from collections import deque
from fastapi import Request, HTTPException

_buckets: dict[str, deque] = {}
_lock = threading.Lock()

def _get_client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def _memory_check(bucket_key: str, limit: int, window: int) -> tuple[bool, int]:

    now = time.monotonic()
    cutoff = now - window
    with _lock:
        dq = _buckets.setdefault(bucket_key, deque())
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= limit:
            return False, int(dq[0] + window - now) + 1
        dq.append(now)
        return True, 0

_redis = None
_redis_ready = False

def _init_redis() -> None:

    global _redis, _redis_ready
    if _redis_ready:
        return
    _redis_ready = True
    url = os.environ.get("REDIS_URL", "").strip()
    if not url:
        return
    try:
        import redis

        client = redis.from_url(url, socket_timeout=1, socket_connect_timeout=1)
        client.ping()
        _redis = client
    except Exception as e:
        print(f"[rate_limit] Redis unavailable, falling back to memory: {e}")
        _redis = None

def _redis_check(bucket_key: str, limit: int, window: int) -> tuple[bool, int]:

    try:
        pipe = _redis.pipeline()
        pipe.incr(bucket_key, 1)
        pipe.expire(bucket_key, window, nx=True)
        count, _ = pipe.execute()
        if int(count) > limit:
            ttl = _redis.ttl(bucket_key)
            return False, max(int(ttl or 1), 1)
        return True, 0
    except Exception as e:
        print(f"[rate_limit] Redis error, using memory this request: {e}")
        return _memory_check(bucket_key, limit, window)

def rate_limit(request: Request, *, key: str, limit: int, window: int) -> None:

    if os.environ.get("APP_ENV", "").lower() == "test":
        return

    _init_redis()
    ip = _get_client_ip(request)
    bucket_key = f"rl:{key}:{ip}:{window}"

    if _redis is not None:
        allowed, retry = _redis_check(bucket_key, limit, window)
    else:
        allowed, retry = _memory_check(bucket_key, limit, window)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Слишком много запросов, попробуйте позже",
            headers={"Retry-After": str(retry)},
        )

def make_limiter(*, key: str, limit: int, window: int):

    def dep(request: Request) -> None:
        rate_limit(request, key=key, limit=limit, window=window)

    return dep
