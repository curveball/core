PATH:=./node_modules/.bin:$(PATH)

.PHONY:build
build:
	tsc

.PHONY:test
test:
	nyc mocha

.PHONY:lint
lint:
	tslint -p .

.PHONY:watch
watch:
	tsc --watch
