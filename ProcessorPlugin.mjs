import * as Url from 'url';
import normalize from 'normalize-url';
import path from 'path';
import fs from 'fs';
import cheerio from 'cheerio';
import got from 'got';
import mime from 'mime';

export default class ProcessorPlugin {

  baseUrl;

  constructor(url) {
    this.baseUrl = url;
  }

  /**
   * Hashes the url parameters
   * @param {string} url 
   * @returns the hash
   */
  hashParams(url) {
    const str = (url.query || '') + (url.hash || '');
    if (str === '') return '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
       const charCode = str.charCodeAt(i);
       hash = ((hash << 5) - hash) + charCode;
       hash |= 0; // Convert to 32-bit integer
    }
    const hashCode = Math.abs(hash).toString(16).substring(0, 8);
    return hashCode;
  }

  /**
   * Proceses the response (html) looking for angular apps to
   * download ashx and replace their references
   * @param {*} response 
   */
  async processNgApp(response) {
    const $ = cheerio.load(response.body.toString());
    console.log(`Looking for ng-apps in ${response.requestUrl}`);

    await Promise.all(
      $('div[data-ng-init*="ashx"],div[ng-init*="ashx"]').map(async (index, element) => {

        let attr = 'data-ng-init';
        let $ngApp = $(element).attr(attr);
        if (!$ngApp) {
          attr = 'ng-init';
          $ngApp = $(element).attr(attr);
        }

        // extract the ashx files
        let files = $ngApp.match(/(?<=)(\/[-\w\/\.]+\.ashx)(?=)/g);
        if (files.length > 0) {

          //remove dups
          files = [...new Set(files)];

          await Promise.all(
            files.map(async (file) => {
              console.log(`Downloading ${file} for ng-app`);
              const response = await got(this.baseUrl + file, { responseType: 'buffer' });
              const mimeType = response.headers['content-type'];
              const ext = mime.getExtension(mimeType);
              const parsed = path.parse(file);
              const dir = path.join('out', parsed.dir);
              const name = `${parsed.name}.${ext}`;
              const newUrl = path.join(parsed.dir, name);
              const filePath = path.join(dir, name);
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(filePath, response.body);
              $ngApp = $ngApp.replaceAll(file, newUrl);
            })
          );

          $(element).attr(attr, $ngApp);
          response.body = Buffer.from($.html());

        }

      })
    );
  }

  /**
   * 1. Removes trailing .html from internal links.
   * 2. Transforms "index.html" into "/"
   * @param {*} htmlFilePath 
   * @param {*} baseUrl 
   */
  processInternalLinks(htmlFilePath,baseUrl) {
    console.log(`${htmlFilePath} > Removing html extension on internal links`);
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const $ = cheerio.load(htmlContent);
    const selectors = [
      'a:not([href^="http"], [href^="//"])',
      `a[href^=${baseUrl}]`,
    ]
    $(selectors.join(',')).each((index, element) => {
        const $element = $(element);
        const oldValue = $element.attr('href');
        if (oldValue) {
          let newValue = oldValue;
          if (oldValue == 'index.html') {
            newValue = '/';
          } else if (oldValue.endsWith('.html')) {
            newValue = oldValue.replace(/\.html$/i, '');
          }
          if (oldValue != newValue) {
            $element.attr('href', newValue);
          }
        }
    });
    fs.writeFileSync(htmlFilePath, $.html(), 'utf-8');
  }

  apply(registerAction) {

    /**
     * Transforms resources' names to download them to the required 
     * path and updates the html accordingly.
     * Returns the new file name of the resource to be downloaded
     */
    registerAction('generateFilename', ({resource, responseData}) => {

      const url = Url.parse(normalize(resource.getUrl(),{removeTrailingSlash: false, stripHash: true}));
      let filePath = decodeURIComponent(url.pathname)
      //filePath = filePath.substring(1); // remove trailing '/'

      if (filePath == '/') {
        filePath = 'index.html';
      }

      // http://example.com/image.png?q=123 --> http://example.com/image_aef12dc0.png
      if (url.query || url.hash) {
        const parsed = path.parse(filePath);
        const basename = path.join(parsed.dir, parsed.name);
        const ext = parsed.ext || '';
        const hashedParams = this.hashParams(url);
        filePath = `${basename}_${hashedParams}${ext}`;
      }

      // http://example.com/whatever --> http://example.com/whatever/index.html
      if (resource.isHtml()) {
        const endsWithHtmlOrHtm = /(\.html|\.htm)$/i;
        if (!endsWithHtmlOrHtm.test(filePath)) {
          filePath = `${filePath}.html`;
        }
      }

      if (filePath.endsWith(".ashx")) {
        const parsed = path.parse(filePath);
        const mimeType = responseData.mimeType;
        let ext = mimeType.split('/').pop();
        ext = ext.split('+')[0]; // removes "+xml" from svg+xml
        if (ext === 'x-javascript') ext = 'js';
        const basename = path.join(parsed.dir, parsed.name);
        filePath = `${basename}.${ext}`;
      }

      console.log(`${resource.getUrl()} --> ${filePath}`);
      return {
        filename: filePath
      }

    });

    registerAction('afterResponse', async ({response}) => {
      if (response.statusCode === 404) {
        return null;
      } else {
        if (response.headers['content-type'].startsWith('text/html')) {
          await this.processNgApp(response);
        }
        return response;
      }
    });
    

    registerAction('onResourceSaved', ({resource}) => {
      // post process
      if (resource.getFilename().endsWith('.html')) {
        this.processInternalLinks('./out/' + resource.getFilename(), this.baseUrl);
      }
    });

  }

}
