import path from 'node:path';
import {chromium} from 'playwright';import fs from 'node:fs/promises';
const outputDir=process.env.AEROSTAT_TEST_OUTPUT||'test-results';await fs.mkdir(outputDir,{recursive:true});
let browser;for(const opts of [{channel:'msedge'},{channel:'chrome'},{}]){try{browser=await chromium.launch({headless:true,...opts});break;}catch(e){console.log('Browser unavailable: '+(opts.channel||'bundled'));}}if(!browser)throw Error('No test browser');const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>console.log('PAGE_ERROR '+e.message));await page.goto(process.env.AEROSTAT_TEST_URL||'http://localhost:4173');await page.waitForTimeout(3500);console.log('TITLE '+await page.title());console.log('MAP_TILES '+await page.locator('.leaflet-tile-loaded').count());await page.screenshot({path:path.join(outputDir,'aerostat-ilk-gorunum.png'),fullPage:true});await browser.close();


