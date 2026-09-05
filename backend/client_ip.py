from __future__ import annotations

import ipaddress
import logging
import os

from fastapi import Request

log = logging.getLogger("client_ip")

def trusted_proxy_networks() -> list[ipaddress.IPv4Network | ipaddress.IPv6Network]:
    raw = os.environ.get("TRUSTED_PROXY_CIDRS", "127.0.0.1/32,::1/128")
    networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = []
    for part in (raw or "").split(","):
        cidr = part.strip()
        if not cidr:
            continue
        try:
            networks.append(ipaddress.ip_network(cidr, strict=False))
        except ValueError:
            log.warning("invalid TRUSTED_PROXY_CIDRS entry: %s", cidr)
    return networks

def is_trusted_proxy(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in trusted_proxy_networks())

def get_client_ip(request: Request | None) -> str:

    if request is None:
        return ""
    peer = request.client.host if request.client else ""
    if not peer or not is_trusted_proxy(peer):
        return peer

    fwd = request.headers.get("x-forwarded-for", "")
    if not fwd:
        return peer
    return fwd.split(",")[0].strip() or peer
