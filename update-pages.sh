#!/bin/sh
# Update example code on gh-pages branch.

git checkout gh-pages
git checkout master -- *.js index.html font sound style.css *.png
git commit -am "update from master"
git checkout master
