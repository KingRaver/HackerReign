#!/bin/bash
# Start DL-CodeGen Flask server with gunicorn

cd "$(dirname "$0")"

# Check if gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "[DL-Server] gunicorn not found. Installing..."
    pip3 install -r requirements.txt
fi

# Ensure .data directory exists
mkdir -p ../../../.data

echo "[DL-Server] Starting DL-CodeGen server with gunicorn..."
echo "[DL-Server] Binding to 127.0.0.1:5001 with 4 workers"

# Start gunicorn with configuration
exec gunicorn \
    --config gunicorn.conf.py \
    server:app
