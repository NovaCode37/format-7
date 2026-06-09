#!/usr/bin/env bash
set -euo pipefail

OS="$(uname -s)"
KEYS_DIR="${HOME}/.config/sops/age"
KEY_FILE="${KEYS_DIR}/keys.txt"

cmd_exists() { command -v "$1" >/dev/null 2>&1; }

if ! cmd_exists sops; then
  echo "[sops-bootstrap] installing sops…"
  case "$OS" in
    Darwin) brew install sops ;;
    Linux)
      ARCH="$(uname -m)"
      case "$ARCH" in
        x86_64)  SOPS_ARCH=amd64 ;;
        aarch64) SOPS_ARCH=arm64 ;;
        *) echo "Unsupported arch: $ARCH"; exit 1 ;;
      esac
      curl -L "https://github.com/getsops/sops/releases/latest/download/sops-v3.8.1.linux.${SOPS_ARCH}" \
        -o /tmp/sops && sudo mv /tmp/sops /usr/local/bin/sops && sudo chmod +x /usr/local/bin/sops
      ;;
    *) echo "Install sops manually for: $OS"; exit 1 ;;
  esac
fi

if ! cmd_exists age-keygen; then
  echo "[sops-bootstrap] installing age…"
  case "$OS" in
    Darwin) brew install age ;;
    Linux)  sudo apt-get update && sudo apt-get install -y age ;;
    *) echo "Install age manually for: $OS"; exit 1 ;;
  esac
fi

mkdir -p "$KEYS_DIR"
chmod 700 "$KEYS_DIR"
if [ ! -f "$KEY_FILE" ]; then
  echo "[sops-bootstrap] generating new age key at $KEY_FILE"
  age-keygen -o "$KEY_FILE"
  chmod 600 "$KEY_FILE"
fi

PUBLIC_KEY="$(grep '^# public key:' "$KEY_FILE" | sed 's/.*: //')"
echo
echo "Public key: $PUBLIC_KEY"
echo

cd "$(dirname "$0")/.."
if [ ! -f .sops.yaml ]; then
  cat > .sops.yaml <<EOF
creation_rules:
  - path_regex: \.env\.enc$
    age: ${PUBLIC_KEY}
  - path_regex: secrets/.*\.enc\.yaml$
    age: ${PUBLIC_KEY}
EOF
  echo "[sops-bootstrap] wrote .sops.yaml"
fi

echo "✓ Done. Next:"
echo "    sops -e .env > .env.enc      # encrypt"
echo "    sops -d .env.enc > .env      # decrypt"
echo "  Commit .env.enc, NEVER .env"
