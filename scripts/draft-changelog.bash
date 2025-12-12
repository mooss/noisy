#!/usr/bin/env bash

set -euo pipefail

function prompt() {
    cat <<EOF
Complete CHANGELOG.md by listing and summarizing the major new features and changes implemented in the given commits.
Don't include commit hashes, simply write a list of features and descriptions like '- **Feature name**: Feature description in one sentence.'
Use the same style as the original changelog, grouping the changes by category.
Group the implementation details (changes that are not directly visible to the user) into an '## Implementation details' section at the very end.
Do not repeat the original changelog, only write what is new.
EOF
}

function complete() {
    echo "The changelog for Elderberry is already mostly done, as can be seen in CHANGELOG.md, only look for and report the important things that are not yet written. Do not repeat what is already written."
}

function commit-log() {
    git log master..HEAD
}

function patch-log() {
    git log master..HEAD --patch
}

OUT=CHANGELOG-DRAFT.md
model=qwen/qwen3-235b-a22b-2507 # Context: 262k
model=deepseek/deepseek-v3.2 # Context: 163,840
model=moonshotai/kimi-k2-0905 # Context: 262k
commit-log | jenai -o "$(prompt)\n$(complete)" --file CHANGELOG.md doc/TODO.org --model openrouter:$model --tee $OUT
cat $OUT | xclip -selection secondary
echo "Saved in $OUT and copied to clipboard"
