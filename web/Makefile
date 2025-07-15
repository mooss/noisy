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

dependencies.svg: game.ts
	npx madge $^ -i dependencies.svg
