#!/usr/bin/env bash
set -euo pipefail

PLAYER_URL=${PLAYER_URL:-"http://localhost:3001"}
GAME_URL=${GAME_URL:-"http://localhost:3002"}
TEAM_URL=${TEAM_URL:-"http://localhost:3003"}

NODE_BIN=${NODE_BIN:-"node"}
BASE=$(( $(date +%s) % 10000 + 1000 ))

json_id() {
  ${NODE_BIN} -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));console.log(d.id);"
}

health_check() {
  curl -fsS "$1/health" >/dev/null
}

health_check "$PLAYER_URL"
health_check "$GAME_URL"
health_check "$TEAM_URL"

echo "Creating 10 players..."
player_ids=()
for i in $(seq 1 10); do
  payload=$(printf '{"nickname":"p%s_%s","firstName":"P%s","lastName":"Test","shirtNumber":%s,"rating":%s}' "$BASE" "$i" "$i" "$((BASE + i))" "$((60 + i))")
  id=$(curl -fsS -X POST "$PLAYER_URL/players" -H 'Content-Type: application/json' -d "$payload" | json_id)
  player_ids+=("$id")
  echo "  player $i -> id $id"
done

ids_csv=$(IFS=,; echo "${player_ids[*]}")

echo "Creating game..."
GAME_ID=$(curl -fsS -X POST "$GAME_URL/games" \
  -H 'Content-Type: application/json' \
  -d '{"startsAt":"2025-01-01T18:00:00Z","location":"Stadium A"}' | json_id)

echo "Game id: $GAME_ID"

echo "Adding participants..."
curl -fsS -X POST "$GAME_URL/games/$GAME_ID/participants" \
  -H 'Content-Type: application/json' \
  -d "{\"playerIds\":[${ids_csv}]}" >/dev/null

echo "Confirming participants..."
for pid in "${player_ids[@]}"; do
  curl -fsS -X PATCH "$GAME_URL/games/$GAME_ID/participants/$pid" \
    -H 'Content-Type: application/json' \
    -d '{"inviteStatus":"CONFIRMED"}' >/dev/null
 done

echo "Confirming game..."
curl -fsS -X POST "$GAME_URL/games/$GAME_ID/confirm" >/dev/null

echo "Auto-generating team set..."
TEAM_SET_ID=$(curl -fsS -X POST "$TEAM_URL/games/$GAME_ID/team-sets/auto-generate" | json_id)

echo "Team set id: $TEAM_SET_ID"

echo "Locking team set..."
curl -fsS -X POST "$TEAM_URL/team-sets/$TEAM_SET_ID/lock" >/dev/null

echo "Done. Team set $TEAM_SET_ID locked for game $GAME_ID."
