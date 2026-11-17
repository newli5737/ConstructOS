#!/usr/bin/env bash
set -e

echo "=============================================="
echo "    constructOS — VPS Deployment Setup        "
echo "=============================================="

# 1. Update & dependencies
echo ">>> Checking docker and docker compose..."
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com | sh
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo ">>> Installing Docker Compose plugin..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 2. Pull / Build
echo ">>> Building and starting constructOS containers..."
docker compose down || true
docker compose up -d --build

echo ">>> Checking status..."
docker compose ps

echo "=============================================="
echo " Deployment Complete!"
echo " Frontend: http://construct.bloxtcgshop.com (or via SSL reverse proxy)"
echo " Backend:  http://api-construct.bloxtcgshop.com (or via SSL reverse proxy)"
echo "=============================================="

