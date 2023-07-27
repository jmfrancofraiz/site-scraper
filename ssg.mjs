import scrape from 'website-scraper';
import ProcessorPlugin from './ProcessorPlugin.mjs';

const pulldownUrl = process.argv[2]; // 'https://www.coolsculpting.dk/'
const parsedUrl = new URL(pulldownUrl);
const resultPath = './out';

const options = {
  urls: [pulldownUrl],
  urlFilter: (url) => url.startsWith(parsedUrl.origin),
  recursive: true,
  directory: resultPath,
  plugins: [ new ProcessorPlugin(parsedUrl.href,resultPath) ],
  sources: [

    // defaults
    { selector: 'style' },
	{ selector: '[style]', attr: 'style' },
	//{ selector: 'img', attr: 'src' },
	//{ selector: 'img', attr: 'srcset' },
	{ selector: 'input', attr: 'src' },
	{ selector: 'object', attr: 'data' },
	{ selector: 'embed', attr: 'src' },
	{ selector: 'param[name="movie"]', attr: 'value' },
	{ selector: 'script', attr: 'src' },
	{ selector: 'link[rel="stylesheet"]', attr: 'href' },
	{ selector: 'link[rel*="icon"]', attr: 'href' },
	{ selector: 'svg *[xlink\\:href]', attr: 'xlink:href' },
	{ selector: 'svg *[href]', attr: 'href' },
	{ selector: 'picture source', attr: 'srcset' },
	{ selector: 'meta[property="og\\:image"]', attr: 'content' },
	{ selector: 'meta[property="og\\:image\\:url"]', attr: 'content' },
	{ selector: 'meta[property="og\\:image\\:secure_url"]', attr: 'content' },
	{ selector: 'meta[property="og\\:audio"]', attr: 'content' },
	{ selector: 'meta[property="og\\:audio\\:url"]', attr: 'content' },
	{ selector: 'meta[property="og\\:audio\\:secure_url"]', attr: 'content' },
	{ selector: 'meta[property="og\\:video"]', attr: 'content' },
	{ selector: 'meta[property="og\\:video\\:url"]', attr: 'content' },
	{ selector: 'meta[property="og\\:video\\:secure_url"]', attr: 'content' },
	{ selector: 'video', attr: 'src' },
	{ selector: 'video source', attr: 'src' },
	{ selector: 'video track', attr: 'src' },
	{ selector: 'audio', attr: 'src' },
	{ selector: 'audio source', attr: 'src' },
	{ selector: 'audio track', attr: 'src' },
	{ selector: 'frame', attr: 'src' },
	{ selector: 'iframe', attr: 'src' },
	{ selector: '[background]', attr: 'background' },

    // custom
    { selector: 'img:not([src^="{{"])', attr: 'src' },
    { selector: 'img:not([datasrc^="{{"])', attr: 'datasrc' },
	{ selector: 'img:not([srcset^="{{"])', attr: 'srcset' },
	//{ selector: 'img', attr: 'datasrc' },
    { selector: 'link', attr: 'href' },

  ],
};

const result = await scrape(options);

// TO DO
// Pull down sitemap.xml and robots.txt to the ./out dir
// Some other steps mentioned in https://allerganbt.atlassian.net/wiki/spaces/AAAEM/pages/2445279242/Tips+Tricks+Gotchas+for+SSG+sites could be done in ProcessorPlugin afterResponse or onResourceSaved call backs
