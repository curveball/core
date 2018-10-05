PATH:=./node_modules/.bin:$(PATH)

.PHONY:build
build:
	tsc

.PHONY:test
test:
	nyc mocha

.PHONY:quick-test
quick-test:
	mocha -b

.PHONY:lint
lint:
	tslint -p .

.PHONY:lint-fix
lint-fix:
	tslint -p . --fix

.PHONY:watch
watch:
	tsc --watch
