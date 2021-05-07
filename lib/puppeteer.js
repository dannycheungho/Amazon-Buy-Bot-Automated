const puppeteer = require('puppeteer-extra');

const adblockerPlugin = require('puppeteer-extra-plugin-adblocker')({
    blockTrackers: true
});
puppeteer.use(adblockerPlugin);

const stealthPlugin = require('puppeteer-extra-plugin-stealth')();
puppeteer.use(stealthPlugin);


const clickAndWaitPlugin = require('puppeteer-extra-plugin-click-and-wait')();
puppeteer.use(clickAndWaitPlugin);

module.exports = puppeteer;
