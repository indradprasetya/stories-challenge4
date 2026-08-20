#!/bin/sh
set -eu

base_url="http://127.0.0.1:4175"

python3 -m http.server 4175 >/tmp/stories-challenge4-http.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

i=0
until curl -fsS "$base_url/index.html" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -lt 20 ] || exit 1
  sleep 0.05
done

curl -fsS "$base_url/chapters.json" |
  jq -e '
    length == 8 and
    ([.[] | select(.type == "chapter")] | length == 6) and
    ([.[] | select(.type == "assets")] | length == 1) and
    ([.[] | select(.type == "tech" and .markdown == "tech.md" and has("json") == false)] | length == 1)
  ' >/dev/null
curl -fsS "$base_url/story%201%20chapter%201.md" | grep -q "Make Rhodey Want to Draw"
curl -fsS "$base_url/story%201%20chapter%201.json" |
  jq -e '
    .id == "rhodey_wants_to_draw" and
    .schemaVersion == 5 and
    .maximumPlacements == 8 and
    .starThresholds == {"threeStars": 3, "twoStars": 5} and
    (.outcomes | length == 9) and
    (.grids | length == 3 and all(.[]; .backgroundID == "background_classroom")) and
    (.grids | map(.dropSlots | length) == [1, 1, 0])
  ' >/dev/null

for chapter_file in \
  story%201%20chapter%202 \
  story%201%20chapter%203 \
  story%202%20chapter%201 \
  story%202%20chapter%202 \
  story%202%20chapter%203
do
  curl -fsS "$base_url/$chapter_file.md" >/dev/null
  curl -fsS "$base_url/$chapter_file.json" | jq -e '
    .schemaVersion == 5 and
    (.maximumPlacements > .choiceCount) and
    (.starThresholds.threeStars < .starThresholds.twoStars) and
    (.starThresholds.twoStars < .maximumPlacements)
  ' >/dev/null
done

curl -fsS "$base_url/artist%20assets.md" | grep -q "Artist Assets"
if curl -fsS "$base_url/artist%20assets.md" | grep -q "Reuse Summary"; then
  exit 1
fi
curl -fsS "$base_url/artist%20assets.json" | jq -e '.assets | length > 0' >/dev/null
curl -fsS "$base_url/tech.md" >/dev/null

page_source=$(curl -fsS "$base_url/index.html")
printf '%s' "$page_source" | grep -Fq 'location.hostname.endsWith(".github.io")'
printf '%s' "$page_source" | grep -Fq 'searchParams.set("_fresh", Date.now())'
[ "$(printf '%s' "$page_source" | grep -Fo 'cache: "no-store"' | wc -l | tr -d ' ')" -eq 3 ]

echo "site smoke check passed"
