#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/juliusng/Documents/judooo"
cd "$ROOT_DIR"

if [ -f .env.crawl ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.crawl | xargs)
fi

mkdir -p logs
npm run crawl:events >> logs/crawl.log 2>&1
