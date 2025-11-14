###########
# Phonies #

.PHONY: build setup update-modules serve test codegen

build:
	npx vite build src/app/noisy

setup:
	npm ci

update-modules:
	npm install --save three simplex-noise
	npm install --save-dev vite @types/three jest @types/jest ts-jest tinybench

serve:
	npx vite src/app/noisy

test:
	npx jest

codegen: src/ui/tips.ts src/shaders/strings.ts

################
# Actual files #

TS_FILES := $(shell git ls-files '**/*.ts' '*.ts')

dependencies.svg: $(TS_FILES)
	npx madge src/app/noisy/noisy.ts -i $@

src/ui/tips.ts: src/noise/algorithms/* src/noise/processing/*.ts src/ui/noise.ts src/state/*.ts
	echo 'export const tips = {' > $@
	sed -rn 's| *//TIP: ([^ ]+) (.*)$$|    \1: "\2",|p' $^ | sed -r 's/\. /.\\n/g' >> $@
	echo '}' >> $@

src/shaders/strings.ts: src/shaders/literate.org scripts/tangle_shaders.py
	python3 scripts/tangle_shaders.py
