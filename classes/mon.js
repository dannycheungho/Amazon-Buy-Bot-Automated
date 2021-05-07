
var config = require('../config.json');
//const sound = require("sound-play");
var store = require('store')
const logger = require('../lib/logger');
const UserAgent = require('user-agents');
const Account = require('./account');
const tgBot = require('../lib/telegramBot'); 
const items = require('../item');
const Item = require('./item');
const colors = require('colors');
require('../lib/log');
require('../lib/err');

class mon {

    constructor(item) {
        this.item = item;
        this.page = null;
        this.page2 = null;
        this.i = 0;
        this.ii = 0;
        //this.d = new Date();
        //this.Huc = Huc;
    }

    async main(){
        if (this.page == null){
            this.page = await mon.browser.newPage();
            await this.page.setUserAgent(new UserAgent({ deviceCategory: 'desktop' }).toString());
            await this.page.setDefaultNavigationTimeout(35000);
            //this.Huc = Huc;
        }

        if( store.get('getProgressState') == false) {
           await this.checkItem();
           try{
               await this.page.goto(`https://www.amazon.com/dp/${this.item.code}` ,{ waitUntil: 'domcontentloaded' });

                 //checking add to cart button exist
                if (await this.page.$('#add-to-cart-button') != null) {
                    await this.dp();
                    //await this.main2();
                }else{
                    await Account.CaptchaPage(this.page);
                    //await this.page.waitForTimeout(config.refreshInterval);
                   // if(config.offerList==1)
                        //await this.main2();
                }
                await this.page.waitForTimeout(config.refreshInterval);
                if(config.offerList==1){
                    await this.main2();
                }else{
                    const date = new Date().toLocaleString();
                    console.log(`[${date}]`.green+`[Info]`+ ` ${this.item.name}`.yellow + ` OUT OF STOCK.`.red);
                    await this.main();
                }
            }catch(er){
                await this.page.waitForTimeout(config.refreshInterval);
                logger.warn('[Main] Something error| Message : '+er);
                await this.main();
        }
    }//outside 
        //logger.warn(`[Main] Other Page placing order, will stop monitoring ${this.item.name}for a while.`);
        await this.page.waitForTimeout(20000);
        await this.main();
    }

    async dp(){
        const priceStr = await this.page.$eval("#priceblock_ourprice", el => el.textContent);

        let price = priceStr.replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '');

        if(  this.item.price  >= parseFloat(price)) {
            tgBot.send(`[DP]${this.item.name} on stock`);
            store.set('getProgressState', true);
            
            logger.warn('[DP]add to cart step 1');
            try{
                if( await this.page.$("#attach-warranty-display > h1")){
                    await this.page.click('#add-to-cart-button');
                    logger.info("[DP] Promote Page canceling");
                    await this.page.waitForSelector("#attach-warranty-display > h1", {visible: true})
                    await this.page.waitForTimeout(100)
                    await this.page.click("#attachSiNoCoverage");
                    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                    logger.info("[DP] Promote Page canceled");
                    await this.addToCart();
                }else{
                    await this.page.click('#add-to-cart-button');
                    logger.warn('[DP] Item meet the price, going to checkout');
                    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                    await this.addToCart();
                }
            }catch(dperr){
                await Account.CaptchaPage(this.page);
                logger.warn('[DP] error| Message : '+dperr);
                store.set('getProgressState', false);
                await this.dp();
            }
            //await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' });
            //await this.addToCart();

        }else{
            const date = new Date().toLocaleString();
            console.log(`[${date}]`.green+`[Info]`+ ` Selling price ${parseFloat(price)} higher than setting price ${this.item.price}`);
            if(config.offerList==1)
                await this.main2();
        }
    }

    async main2(){
        if (this.page == null){
            this.page = await mon.browser.newPage();
        }
        if( store.get('getProgressState') == false) {

            //await this.page.goto('https://www.amazon.com/dp/B08164VTWH/ref=olp_aod_early_redir?_encoding=UTF8&aod=1' ,{ waitUntil: 'domcontentloaded' }); //test
            await this.page.goto(`https://www.amazon.com/dp/${this.item.code}/ref=olp_aod_early_redir?_encoding=UTF8&aod=1` ,{ waitUntil: 'domcontentloaded' });
 
           try{
                await this.page.waitForSelector('#aod-offer-list');
               // .then(() => logger.info(`Monitoring ${this.item.name} Offerlising`));

                let count = await this.page.$$eval("#aod-offer",
                    elements=> elements.length) 

                const priceList = await this.page.evaluate(() => Array.from(document.querySelectorAll('.a-price-whole'), element => element.textContent));
                for (let i=0;i<count;i++){
                //count++;
                    let price = priceList[i].replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '');
                    //logger.info(i+1+" "+parseFloat(price) );

                if( this.item.price >= parseFloat(price)) {
                    tgBot.send(`[Main]${this.item.name} on stock`);
                    //sound.play(__dirname+"/beep.mp3");
                    store.set('getProgressState', true);
                    logger.info("[Main] The "+(i+1)+ "th product price meets the standard！" );
                    const productinfo = await this.page.$$('input[name="submit.addToCart"]');
                    try{
                        logger.info("[Main] Click add to cart button" );
                        await productinfo[i].click();
                    }catch(e1){
                        logger.info("[Main] Click add to cart button" );
                        await productinfo[i+1].click();
                    }
                    // if(err(this.page.url()))
                    //      await this.main();
                    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' , timeout: 4000, }),
                    await this.addToCart();
                }
            }
            //no result, refresh 
                const date = new Date().toLocaleString();
                console.log(`[${date}]`.green+`[Info]`+ ` ${this.item.name}`.yellow + ` OUT OF STOCK.`.red);
                await this.page.waitForTimeout(config.refreshInterval);
                await this.main();
            }catch(er){
                await Account.CaptchaPage(this.page);
                store.set('getProgressState', false);
                logger.warn('[Main] On OfferLising Page, Something error| Message : '+er);
                await this.page.waitForTimeout(1000);
                await this.main();
        }
    }//outside 
        logger.warn('[OfferList]：Other Page placing order,will stop this page for a while.');
        await this.page.waitForTimeout(config.ConflictInterval);
        await this.main();
    }




    async addToCart() {
        await this.page.waitForNavigation({  timeout: 4000, waitUntil: 'domcontentloaded' });

        if(isAddedToCart(this.page.url())){
            if (isAddedToCart(this.page.url())) {
                logger.warn('[Main] added to cart');
                await this.checkout();
            }else{
                const content = await this.page.content();
                if (isAddedToCartBefore(content)) {
                    logger.warn('[Main] added to cart before');
                    await this.checkout();
                }else{
                    logger.warn('[Main] failed to add to cart');
                    store.set('getProgressState', false);
                    await this.main();
                }
            }
        }else{
            logger.warn('[Main] Retrying,failed to add to cart');
            store.set('getProgressState', false);
            await this.main();
        }

        }
    
        async checkout () {
            await this.page.clickAndWaitForNavigation('#hlb-ptc-btn-native', {}, { waitUntil: 'domcontentloaded' });

            if(isLoadingCheckout(this.page.url())){
                await this.page.waitForTimeout(1000);
            }
    
            if(await err(this.page))  {  //
                //logger.info('[Main] Going to checkout');
            }else if (isCheckoutPage(this.page.url())) {
                logger.info('[Main] Ready For Place Order! Good Luck');
                await this.placeOrder();
            }else if (isShippingAddressPage(this.page.url())) {
                try{
                logger.info(`[Main] selecting shipping address`);
               // await this.page.clickAndWaitForNavigation('.ship-to-this-address a', {}, { waitUntil: 'domcontentloaded' });
               await Promise.all([
                    await this.page.click('.ship-to-this-address a'),
                    logger.info(`[Main] Loading to next page`),
                    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000})
                ]);
    
                if (isshipoptionselectPage(this.page.url())) {
                    logger.info(`[Main] selecting shipping option`);
                        await this.page.waitForSelector('span.a-button-inner > input[value="Continue"]');
                        await Promise.all([
                             //this.page.click('#shippingOptionFormId > div.a-row.a-spacing-medium > div.save-sosp-button-box.a-column.a-span4.a-span-last.a-box.a-color-alternate-background.a-right > div > span.sosp-continue-button.a-button.a-button-primary.a-button-span12.a-padding-none.continue-button > span > input'),
                           //  this.page.evaluate(() => {
                           //     document.querySelector(('#shippingOptionFormId > div.a-row.a-spacing-medium > div.save-sosp-button-box.a-column.a-span4.a-span-last.a-box.a-color-alternate-background.a-right > div > span.sosp-continue-button.a-button.a-button-primary.a-button-span12.a-padding-none.continue-button > span > input')).click();
                          //    }),
                            await this.nativeClick(this.page,'span.a-button-inner > input[value="Continue"]'),
                            await this.page.waitForNavigation({
                            waitUntil: 'load', timeout: 15000
                           }),
                         ]); 
                }
    
                if (isPaySelectPage(this.page.url())) {
                        logger.info(`[Main] selecting payment option`);
                      /*  await this.page.evaluate(() => { () => {
                            if( document.getElementsByName("ppw-instrumentRowSelection")[0] ){
                                let check = document.getElementsByName("ppw-instrumentRowSelection")[0].checked;
                                if(check==false)
                                    document.getElementsByName("ppw-instrumentRowSelection")[0].checked = true;
                            }
                            document.querySelector('span.a-button-inner > input').click();
                        }});*/
    
                        await this.page.waitForSelector('input[name="ppw-widgetEvent:SetPaymentPlanSelectContinueEvent"]');
                        await Promise.all([
                                this.page.click('input[name="ppw-widgetEvent:SetPaymentPlanSelectContinueEvent"]'),
                                this.nativeClick(this.page,'input[name="ppw-widgetEvent:SetPaymentPlanSelectContinueEvent"]'),
                                this.page.waitForNavigation({
                                waitUntil: 'networkidle2', timeout: 15000
                                }),
                        ]);
                        if(!await err(this.page))  
                            await this.placeOrder();
                }
    
                    logger.info('[Main] Shipping Select End');
                    logger.warn(`[Main]${this.page.url()}`);
                    await this.placeOrder();
                }catch(ship){
                    const timestamp = Math.floor(Date.now() / 1000);
                    await this.page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
                    logger.info('[Main] Shipping Failed to checkout || '+ship)+'||'+this.page.url();
                    store.set('getProgressState', false);
                    await this.main();
                }
    
    
            }else if (isCheckoutPage(this.page.url())) {
                logger.info('[Main] Ready For Place Order! Good Luck');
                await this.placeOrder();
            }else{
                logger.warn(`[Main]${this.page.url()}`);
                logger.info('[Main] Failed to checkout');
                store.set('getProgressState', false);
                await this.main();
            }
        }
    

    async placeOrder() {
            if(isLoadingCheckout(this.page.url())){
                await this.page.waitForTimeout(1000);
            }
           logger.warn('[Main] Prepare to place order!')
           try{
               // await this.page.clickAndWaitForNavigation('#placeYourOrder > span > input' , {}, { timeout:1500, waitUntil: 'domcontentloaded' });
               await this.page.click('#placeYourOrder > span > input');
                logger.warn('[Main] PlaceButton Click!')
                await this.page.waitForNavigation({ timeout: 5000 });
                logger.warn(this.page.url() + ' Waiting Result' );
                await this.page.waitForNavigation({ timeout: 5000 });
                const content = await this.page.content();
                if (isPlacedOrder(this.page.url())) {
                    //sound.play(__dirname+"\/beep\/beep.mp3");
                    tgBot.send('[Main] Thank you, your order has been placed.');
                    logger.warn('[Main] Thank you, your order has been placed.');
                    store.set('getProgressState', false);
                    //await this.main();
                    return 0
                } else {
                    logger.warn('[Main] Failed to place order in : ' + this.page.url());
                    store.set('getProgressState', false);
                    await this.main();
                }
           }catch(e){
               await this.page.waitForTimeout(1000);
               if(this.i<5) {
                    await this.placeOrder();
                    this.i++;
               }else{
                    this.i = 0;
                    store.set('getProgressState', false);
                    await this.main();
               }
            /*
                console.log(e + ' Try again to place order!')
                await this.page.clickAndWaitForNavigation('input[name="placeYourOrder1"]' ,{}, { timeout:2000, waitUntil: 'domcontentloaded' });
                await this.page.waitForNavigation({ timeout: 10000 });
                logger.warn('Thank you??, your order maybe been placed lol.');*/
           }

    }

    async checkItem(){
        if( this.ii == items.length)
            this.ii = 0;
        this.item = new Item(items[this.ii]);
            if (this.item.selected != 1) {
                this.ii++;
                console.log('skip');
                await this.main();
            }
        this.ii++;
    }


}

module.exports = mon