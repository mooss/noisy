#!/usr/bin/env bash

set -euo pipefail
INVOCATION="$0 $@"

function concat-comment() {
  grep -m1 '//:CONCAT' "$1"
}

function concat-list() {
  sed 's|//:CONCAT ||'
}

# Content of the file before the //:CONCAT comment.
function unconcat() {
  sed -r '/^\/\/:CONCAT/Q' "$1"
}

function refreshed() {
  local -r filename="$1"
  local -r comment=$(concat-comment "$filename")

  unconcat "$filename"

  echo "$comment"
  echo "// Everything after this point was generated with \`$0 $filename\`."
  echo

  for dep in $(echo "$comment" | concat-list); do
    echo //$dep
    cat "$dep"
    echo
  done
}

# Consumes stdin and *then* writes it to $1 (prevents preemptive write).
function sponge() {
  local -r content=$(cat)
  echo "$content" > "$1"
}

for filename in "$@"; do
  if ! concat-comment "$filename" >/dev/null 2>&1; then
    echo "Nothing to do in $filename".
    continue
  fi

  before=$(wc -l "$filename")
  refreshed "$filename" | sponge "$filename"
  after=$(wc -l "$filename")
  echo "$filename lines: $before -> $after"
done
