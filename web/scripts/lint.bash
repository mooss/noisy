#!/bin/bash
# To run this, make sure that eslint and the necessary modules are installed:
# > npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
# Alternatively, `make setup` should suffice.

set -euo pipefail

if [[ $# -eq 0 ]]; then
    files=$(find . -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*")
else
    files="$@"
fi

if ! npm ls | grep @eslint/ -q; then
    echo 'No eslint found, try running `make setup`.'
    exit 1
fi

for file in $files; do
    npx eslint "$file" --ext .ts --parser @typescript-eslint/parser --plugin @typescript-eslint
done
