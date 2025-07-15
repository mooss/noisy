###########
# Phonies #

.PHONY: setup update-modules serve build

setup:
	npm ci

update-modules:
	npm install --save three simplex-noise
	npm install --save-dev vite

serve:
	npx vite

build:
	npx vite build

################
# Actual files #

dependencies.svg: ainulindale.js
	npx madge $^ -i dependencies.svg
