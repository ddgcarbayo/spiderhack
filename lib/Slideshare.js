'use strict';

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const PDF = require('pdfkit');
const mkdirp = require('mkdirp');
const path = require('path');
const inquirer = require('inquirer');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk');


class SlideShare {

  constructor(params) {
    this.folder = params.folder;
    this.file = params.file;
    this.loading = new Spinner('Generating...');
  }

  async hack() {
    try {
      if (await this.isMultiple()) {
        await this.scanMultiple();
      } else {
        await this.scanSimple();
      }
      this.exit();
    } catch (e) {
      this.exit(e);
    }
  }

  async scanMultiple() {
    const self = this;
    const urls = await this.getUrls();
    const promises = [];
    this.loading.start();
    urls.forEach((url, i) => {
      if(!url) {
        return;
      }
      promises.push(self.generate({
        url,
        file : self.file.replace('.pdf', '.' + i + '.pdf'),
        mainSelector : '.slide_container',
        imgSelector : 'img',
        srcSelector : 'data-full'
      }));
    });
    return Promise.all(promises);
  }

  async getUrls() {
    const path = await this.getFilePath();
    const urls = fs.readFileSync(path, 'utf8').split('\n');
    return urls;
  }

  getFilePath() {
    return new Promise((resolve) => {
      inquirer.prompt([{
        name: 'path',
        type: 'input',
        message: 'Urls file path (one url per line)',
        default : path.normalize(__dirname + '/../urls.txt'),
        validate : (path) => fs.existsSync(path) ? true : 'Non-existing file'
      }]).then((data) => resolve(data.path));
    });
  }

  async scanSimple() {
    const url = await this.getUrl();
    this.loading.start();
    await this.generate({
      url,
      file : this.file,
      mainSelector : '.slide_container',
      imgSelector : 'img',
      srcSelector : 'data-full'
    });
  }

  exit(err){
    this.loading.stop();
    if(err) {
      console.log(chalk.red('Error! Details:'));
      console.log(chalk.red(err.message));
    } else {
      console.log(chalk.blue('Completed!'));
    }
  }

  getUrl() {
    return new Promise((resolve) => {
      inquirer.prompt([{
        name: 'url',
        type: 'input',
        message: 'Set the Slideshare url (https://www.slideshare.net/*)',
        validate : (input) => input.startsWith('https://www.slideshare.net/') ? true : 'Url not valid'
      }]).then((data) => resolve(data.url));
    });
  }

  isMultiple() {
    return new Promise((resolve) => {
      inquirer.prompt([{
        name: 'multiple',
        type: 'confirm',
        default : false,
        message: 'You need to extract more than one slideshare document?'
      }]).then((data) => resolve(data.multiple));
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
        if(!err && body && response.statusCode === 200) {
          resolve(body);
        } else {
          reject(err || new Error(`error in request. Code ${ response.statusCode }`));
        }
      });
    });
  }

  async generate({ url, file, mainSelector, imgSelector, srcSelector }) {
    try {
      const fileName = this.folder + '/' + file;
      const body = await this.getFile(url);
      const $ = cheerio.load(body);
      const imgs = $(mainSelector).find(imgSelector);
      const urls = [];
      imgs.each((i, img) => {
        const $img = cheerio(img);
        const source = $img.attr(srcSelector);
        if(source) {
          urls.push(source);
        }
      });
      if(urls.length) {
        const doc = this.getPdf(fileName);
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
        return true;
      } else {
        throw new Error(`slides not found in ${ url }`);
      }
    } catch (e) {
      e.message += ` in ${ url }`;
      throw e;
    }
  }

  getPdf(file) {
    const doc = new PDF({ size : [1024,576]});
    doc.pipe(fs.createWriteStream(file));
    fs.writeFileSync(file, '');
    return doc;
  }
}

module.exports = SlideShare;
