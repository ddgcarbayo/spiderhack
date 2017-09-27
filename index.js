#!/usr/bin/env node

'use strict';

var version = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
if(version < 8) {
  console.log('Spiderhack requires node v.8+');
  console.log('Install with Node Version Manager (NVM)');
  console.log('https://github.com/creationix/nvm');
  console.log('');
  process.exit(1);
}


const SpiderHack = require('./lib/SpiderHack');
const s = new SpiderHack();
s.init();