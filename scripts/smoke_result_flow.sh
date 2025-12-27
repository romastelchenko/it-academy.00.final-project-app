#!/usr/bin/env bash
set -euo pipefail

PLAYER_URL=${PLAYER_URL:-"http://localhost:3001"}
GAME_URL=${GAME_URL:-"http://localhost:3002"}
TEAM_URL=${TEAM_URL:-"http://localhost:3003"}
RESULT_URL=${RESULT_URL:-"http://localhost:3004"}

NODE_BIN=${NODE_BIN:-"node"}
BASE=$(( $(date +%s) % 10000 + 2000 ))

json_id() {
  ${NODE_BIN} -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));console.log(d.id);"
}

json_team_ids() {
  ${NODE_BIN} -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));console.log(d.teams.map(t=>t.id).join(','));"
}

health_check() {
  curl -fsS "$1/health" >/dev/null
}

health_check "$PLAYER_URL"
health_check "$GAME_URL"
health_check "$TEAM_URL"
health_check "$RESULT_URL"

echo "Creating 10 players..."
player_ids=()
for i in $(seq 1 10); do
  payload=$(printf '{"nickname":"r%s_%s","firstName":"R%s","lastName":"Test","shirtNumber":%s,"rating":%s}' "$BASE" "$i" "$i" "$((BASE + i))" "$((60 + i))")
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

echo "Fetching team set details..."
TEAM_IDS=$(curl -fsS "$TEAM_URL/team-sets/$TEAM_SET_ID" | json_team_ids)
TEAM_A_ID=$(echo "$TEAM_IDS" | cut -d',' -f1)
TEAM_B_ID=$(echo "$TEAM_IDS" | cut -d',' -f2)

echo "Creating result for two teams..."
RESULT=$(curl -fsS -X POST "$RESULT_URL/games/$GAME_ID/results" \
  -H 'Content-Type: application/json' \
  -d "{\"format\":\"TWO_TEAMS\",\"teamAId\":${TEAM_A_ID},\"teamBId\":${TEAM_B_ID},\"scoreA\":5,\"scoreB\":3}")

echo "Result created: $RESULT"

echo "Fetching result..."
curl -fsS "$RESULT_URL/games/$GAME_ID/results"

echo "Done. Result stored for game $GAME_ID."
