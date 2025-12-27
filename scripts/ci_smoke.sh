#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/api/v1}"

wait_for_gateway() {
  local attempts=30
  until curl -sSf "${API_URL}/health" >/dev/null 2>&1; do
    attempts=$((attempts - 1))
    if [ "$attempts" -le 0 ]; then
      echo "Gateway did not become ready"
      exit 1
    fi
    sleep 2
  done
}

create_player() {
  local nickname="$1"
  local first="$2"
  local last="$3"
  local shirt="$4"
  local rating="$5"
  curl -sSf -X POST "${API_URL}/players" \
    -H 'Content-Type: application/json' \
    -d "{\"nickname\":\"${nickname}\",\"firstName\":\"${first}\",\"lastName\":\"${last}\",\"shirtNumber\":${shirt},\"rating\":${rating}}"
}

echo "Waiting for API Gateway..."
wait_for_gateway

echo "Creating players..."
create_player "p1" "John" "One" 7 80 >/dev/null
create_player "p2" "Mike" "Two" 9 75 >/dev/null
create_player "p3" "Alex" "Three" 11 90 >/dev/null

echo "Fetching players..."
players_json=$(curl -sSf "${API_URL}/players?page=1&limit=10&sortBy=rating&order=desc&includeDeleted=false")
players_count=$(echo "$players_json" | jq -r '.items | length')
if [ "$players_count" -lt 3 ]; then
  echo "Expected at least 3 players, got ${players_count}"
  exit 1
fi

echo "Creating game..."
game_payload='{"startsAt":"2025-01-01T10:00:00Z","location":"CI Arena"}'
game_json=$(curl -sSf -X POST "${API_URL}/games" -H 'Content-Type: application/json' -d "$game_payload")
game_location=$(echo "$game_json" | jq -r '.location')
if [ "$game_location" != "CI Arena" ]; then
  echo "Game location mismatch: ${game_location}"
  exit 1
fi

echo "Smoke tests passed"
