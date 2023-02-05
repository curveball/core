SOURCE_FILES:=$(shell find src/ -type f -name '*.ts')

.PHONY:all
all: build

.PHONY:build
build: cjs/build esm/build

.PHONY:test
test:
	npx nyc mocha

.PHONY:test-cjs
test-cjs:
	mkdir -p cjs-test
	cd test; npx tsc --module commonjs --outdir ../cjs-test
	echo '{"type": "commonjs"}' > cjs-test/package.json
	cd cjs-test; npx mocha --no-package

.PHONY:lint
lint:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts'

.PHONY:lint-fix
lint-fix: fix

.PHONY:fix
fix:
	npx eslint --quiet 'src/**/*.ts' 'test/**/*.ts' --fix

.PHONY:watch
watch:
	npx tsc --watch

.PHONY:start
start: build

.PHONY:clean
clean:
	rm -rf dist esm cjs cjs-test

cjs/build: $(SOURCE_FILES)
	npx tsc --module commonjs --outDir cjs/
	echo '{"type": "commonjs"}' > cjs/package.json
	@# Creating a small file to keep track of the last build time
	touch cjs/build


esm/build: $(SOURCE_FILES)
	npx tsc --module es2022 --outDir esm/
	echo '{"type": "module"}' > esm/package.json
	@# Creating a small file to keep track of the last build time
	touch esm/build
