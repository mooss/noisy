###########
# Phonies #

.PHONY: build setup update-modules serve test

build:
	npx vite build

setup:
	npm ci

update-modules:
	npm install --save three simplex-noise
	npm install --save-dev vite @types/three jest @types/jest ts-jest

serve:
	npx vite

test:
	npx jest

################
# Actual files #

TS_FILES := $(shell git ls-files '**/*.ts' '*.ts')

dependencies.svg: $(TS_FILES)
	npx madge game.ts -i $@

noise/ui-tips.ts: noise/algorithms.ts noise/processing.ts
	echo 'export const tips = {' > $@
	sed -rn 's| *//TIP: ([^ ]+) (.*)$$|    \1: "\2",|p' $^ >> $@
	echo '}' >> $@
