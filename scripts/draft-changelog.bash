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

OUT=CHANGELOG-DRAFT.md
git log master..HEAD --patch | jenai -o "$(prompt)" --file CHANGELOG.md --model openrouter:z-ai/glm-4.6 --tee $OUT
cat $OUT | xclip -selection secondary
echo "Saved in $OUT and copied to clipboard"
