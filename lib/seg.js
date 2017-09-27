'use strict';

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const PDF = require('pdfkit');

class SlideShare {
  async getImage(url) {
    return new Promise((resolve, reject) => {
      request.get({ url, encoding : null, method : 'GET' }, (err, response, body) => {
        if(err) {
          reject(err);
        } else if (!body) {
          reject(new Error('no body'));
        } else {
          resolve(body);
        }
      });
    });
  }

  getFile(url, binary) {
    return new Promise((resolve, reject) => {
      const options = {
        uri : url,
        method : 'GET'
      };
      if(binary) {
        options.encoding = null;
      }
      request(options, (err, response, body) => {
        if(!err && body) {
          resolve(body);
        } else {
          reject(err || new Error('no body'));
        }
      });
    });
  }

  async generate(url, file, mainSelector, imgSelector, srcSelector) {
    try {
      const body = await this.getFile(url);
      const $ = cheerio.load(body);
      const imgs = $(mainSelector).find(imgSelector);
      const urls = [];
      imgs.each((i, img) => {
        const $img = cheerio(img);
        const source = $img.attr('data-full');
        if(source) {
          urls.push(source);
        }
      });
      if(urls.length) {
        const dir = folder + '/' + domain.domain + '/';
        const doc = this.getPdf(dir);
        for(let i = 0; i<urls.length; i++) {
          const url = urls[i];
          const img = await this.getFile(url, true);
          const mul = 0.75;
          if(i !== 0) {
            doc.addPage({ layout : 'landscape'});
          }
          doc.image(img, 0, 0, { width: 1024 * mul, height: 576 * mul });
        }
        doc.end();
        return domain;
      } else {
        const e = Error('No images');
        e.url = domain.url;
        e.domain = domain.domain;
        throw e;
      }
    } catch (e) {
      e.url = domain.url;
      e.domain = domain.domain;
      throw e;
    }
  }

  getPdf(dir) {
    const doc = new PDF({ size : [1024,576]});
    const file = dir + 'out.pdf';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    fs.writeFileSync(file, '');
    doc.pipe(fs.createWriteStream(file));
    return doc;
  }
}


const downloader = new slide();
downloader.generateMulti(urls).then(() => console.log('ok'), err => console.log('err', err));
