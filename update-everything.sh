#!/bin/bash
set -euo pipefail

git checkout master
git pull
git checkout -b update-everything-2021-05-06-v2

cp ../new-package/.eslintrc.json .
cp ../new-package/tsconfig.json .
cp ../new-package/Makefile .
cp -R ../new-package/.github .

git rm .travis.yml || true
git rm CODE_OF_CONDUCT.md || true

npm i -D @types/node@12
npm update
npm i @curveball/http-errors@0.4
make fix

git add --all
git commit -m "Update everything to latest curveball defaults"

git push -u origin HEAD
hub pull-request -r evert -a juhangsin -l Enhancement -m "Update everything to latest curveball standards"
