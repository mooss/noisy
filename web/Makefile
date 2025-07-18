###########
# Phonies #

.PHONY: setup update-modules serve build

setup:
	npm ci

update-modules:
	npm install --save three simplex-noise
	npm install --save-dev vite @types/three

serve:
	npx vite

build:
	npx vite build

################
# Actual files #

TS_FILES := $(shell git ls-files '**/*.ts' '*.ts')

dependencies.svg: $(TS_FILES)
	npx madge game.ts -i dependencies.svg
