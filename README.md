# Introduction

This is a script to pull down complete sites for SSG

## Set up

```
$ npm install
```

## Run

```
$ node ssg.mjs https://mx.coolsculpting.com/
```

The result is going to be placed in a folder called `out`. The script will fail is that folder already exits, to avoid overwriting previous executions.

## Test

I recommend using a simple http server to serve the `out` directory. I'm using https://www.npmjs.com/package/http-server

```
$ npx http-server -o out -e html
````



