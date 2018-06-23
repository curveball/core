PATH:=./node_modules/.bin:$(PATH)

.PHONY:build
build:
	tsc


.PHONY:test
test:
	mocha
