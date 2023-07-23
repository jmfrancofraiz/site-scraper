# Introduction

This is a script to pull down complete sites for SSG including their images. It's based on https://github.com/website-scraper/node-website-scraper

It processes all of the site's resources in order to:

 1. The home page will become `index.html`
 2. All of the `.ashx` resources will be downloaded and renamed to their proper extension based on there mime type (`png`,`jpeg`,...), both on plain html and angular apps. 
 3. Internal links will be prettified (removed trailing `.html`)


# Set up

```
$ npm install
```

# Run

```
$ npm run ssg https://mx.coolsculpting.com/
```

The result is going to be placed in a folder called `out`. The script will fail is that folder already exits, to avoid overwriting previous executions.

## Test

I recommend using a simple http server to serve the `out` directory. I'm using https://www.npmjs.com/package/http-server

```
$ npm run serve
````



