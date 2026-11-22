#!/usr/bin/env bash
# Starts a throwaway local PostgreSQL and Redis for Pulse development and tests.
# Data lives in ./.pulse-dev (gitignored). Requires: brew install postgresql@17 redis
set -euo pipefail
export LC_ALL="${LC_ALL:-en_US.UTF-8}" LANG="${LANG:-en_US.UTF-8}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEV="$ROOT/.pulse-dev"
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}"
mkdir -p "$DEV"

case "${1:-start}" in
  start)
    if [ ! -d "$DEV/pg" ]; then
      "$PG_BIN/initdb" -D "$DEV/pg" -U pulse --auth=trust >/dev/null
    fi
    "$PG_BIN/pg_ctl" -D "$DEV/pg" -l "$DEV/pg.log" -o "-p 54329 -k $DEV" status >/dev/null 2>&1 || \
      "$PG_BIN/pg_ctl" -D "$DEV/pg" -l "$DEV/pg.log" -o "-p 54329 -k $DEV" -w start
    for db in pulse_dev pulse_test; do
      "$PG_BIN/psql" -h localhost -p 54329 -U pulse -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1 || \
        "$PG_BIN/createdb" -h localhost -p 54329 -U pulse "$db"
    done
    redis-cli -p 63799 ping >/dev/null 2>&1 || \
      redis-server --port 63799 --daemonize yes --dir "$DEV" --logfile "$DEV/redis.log" --save "" --appendonly no
    echo "Postgres: postgresql://pulse@localhost:54329/pulse_dev"
    echo "Redis:    redis://localhost:63799"
    ;;
  stop)
    "$PG_BIN/pg_ctl" -D "$DEV/pg" stop || true
    redis-cli -p 63799 shutdown nosave || true
    ;;
  *) echo "usage: $0 [start|stop]"; exit 1 ;;
esac
