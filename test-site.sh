#!/bin/sh
set -eu

base_url="http://127.0.0.1:8765"

python3 -m http.server 8765 >/tmp/stories-challenge4-http.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

i=0
until curl -fsS "$base_url/index.html" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -lt 20 ] || exit 1
  sleep 0.05
done

curl -fsS "$base_url/chapters.json" |
  jq -e 'length == 1 and .[0].story == 1 and .[0].chapter == 1' >/dev/null
curl -fsS "$base_url/story%201%20chapter%201.md" | grep -q "Make Rhodey Want to Draw"
curl -fsS "$base_url/story%201%20chapter%201.json" |
  jq -e '
    .id == "rhodey_wants_to_draw" and
    (.outcomes | length == 9) and
    (.grids | length == 3 and all(.[]; .backgroundID == "background_classroom"))
  ' >/dev/null

page_source=$(curl -fsS "$base_url/index.html")
printf '%s' "$page_source" | grep -Fq 'location.hostname.endsWith(".github.io")'
printf '%s' "$page_source" | grep -Fq 'searchParams.set("_fresh", Date.now())'
[ "$(printf '%s' "$page_source" | grep -Fo 'cache: "no-store"' | wc -l | tr -d ' ')" -eq 3 ]

echo "site smoke check passed"
