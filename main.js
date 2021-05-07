//const puppeteer = require('puppeteer');
const puppeteer = require('./lib/puppeteer.js');
const { aws, cart, Account, checkout,mon, Item } = require('./classes');
//const sound = require("sound-play");
const config = require('./config.json');
const items = require('./item');

//const items = require('./items');
var store = require('store')
const logger = require('./lib/logger');
require('./lib/log');


//const puppeteer = require('puppeteer-extra');
//puppeteer.use(require('puppeteer-extra-plugin-click-and-wait')());


(async () => {
    const browser = await puppeteer.launch({
        //executablePath: 'G:/amazonbot/Puppeteer/discord/chrome-win/chrome.exe',
        headless: config.headless,
        defaultViewport: { width: 1366, height: 768 },
        userDataDir: './cookie',
        //defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process'
          ]
      });
    logger.info("initializing...");  
    Account.browser = browser;
    await Account.loginIfNeeded();

    store.set('getProgressState', false);
    
    if( config.cart==1) {
        cart.browser = browser;
        let Cart = new cart();
        Cart.cart();
    }
    if (config.SingleMode==1 ){
        mon.browser = browser;
        const SingleMode = new mon();
        SingleMode.main();
    }

    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

    for (let i = 0; i < items.length; i++) {
        const item = new Item(items[i]);
        if (item.selected != 1) {
            console.log(`Monitoring ${item.column}`);
            continue;
        }

        try{
                //console.log(`${item.column}`);
                if( config.MultiMode==1){
                    checkout.browser = browser;
                    const Checkout = new checkout(item);
                    Checkout.main();
                }if (config.aws==1 ){
                    aws.browser = browser;
                    const Aws = new aws(item);
                    Aws.aws();
                }
                await sleep(4000);

        }catch(e1){
            console.log(e1.message)

        }

    }



    
})();


