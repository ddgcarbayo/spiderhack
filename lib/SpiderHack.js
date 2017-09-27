'use strict';

const chalk = require('chalk');
const clear = require('clear');
const mkdirp = require('mkdirp');
const figlet = require('figlet');
const inquirer = require('inquirer');
const fs = require('fs');
const SlideShare = require('./Slideshare');
const path = require('path');

class SpiderHack {
  async init () {
    clear();
    this.hello();
    const info = await this.getInfo();
    if(path.extname(info.folder)) {
      info.folder = path.dirname(info.folder);
    }
    this.generateOutputFolder(info.folder);
    this.hack(info);
  }

  hello() {
    console.log(
      chalk.yellow(
        figlet.textSync('SpiderHack', { horizontalLayout: 'full' })
      )
    );
  }

  generateOutputFolder(dir) {
    if (!fs.existsSync(dir)){
      mkdirp.sync(dir);
    }
  }


  hack(params) {
    let instance;
    switch (params.type) {
      case 'SlideShare':
        instance = new SlideShare(params);
    }
    instance.hack();
  }

  getInfo() {
    return inquirer.prompt([
      {
      name: 'type',
      type: 'list',
      choices : [
        'SlideShare'
      ],
      message: 'What´s the Target?',
    },
      {
        name: 'folder',
        type: 'input',
        message: 'Path of the new output folder',
        default : path.normalize(__dirname + '/../output')
      },
      {
        name: 'file',
        type: 'input',
        message: 'Base name of the output file/s',
        default : 'output.pdf',
        validate : (input) => path.extname(input) === '.pdf' ? true : 'Not pdf file'
      }
    ]);
  }
}

module.exports = SpiderHack;