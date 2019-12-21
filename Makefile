export PATH:=./node_modules/.bin:$(PATH)
SOURCE_FILES:=$(shell find src/ -type f -name '*.ts')

.PHONY:all
all: build

.PHONY:build
build: dist/build

.PHONY:test
test:
	nyc mocha

.PHONY:lint
lint:
	tslint -p .

.PHONY:lint-fix
lint-fix: fix

.PHONY:fix
fix:
	tslint -p . --fix

.PHONY:watch
watch:
	tsc --watch

.PHONY:start
start: build

.PHONY:clean
clean:
	rm -r dist

dist/build: $(SOURCE_FILES)
	tsc
	@# Creating a small file to keep track of the last build time
	touch dist/build
