FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/uploads /app/data
VOLUME ["/app/uploads", "/app/data"]

ENV DATABASE_URL="sqlite:////app/data/format7.db"

EXPOSE 8000

CMD ["sh", "-c", "\
  if echo \"$DATABASE_URL\" | grep -q '^postgres'; then \
    alembic upgrade head || true; \
  elif [ ! -f /app/data/format7.db ]; then \
    python seed.py; \
  fi && \
  uvicorn main:app --host 0.0.0.0 --port 8000 \
"]
