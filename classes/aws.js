
var config = require('../config.json');
//const sound = require("sound-play");
var store = require('store')
const logger = require('../lib/logger');
const UserAgent = require('user-agents');
const tgBot = require('../lib/telegramBot'); 
require('../lib/log');
require('../lib/err');


class aws{

    constructor(item) {
        this.item = item;
        this.page = null;
        this.i = 0;
    }

    async aws(){
        if(this.item.aws == 1){
        if (this.page == null){
            this.page = await aws.browser.newPage();
            await this.page.setUserAgent(new UserAgent({ deviceCategory: 'desktop' }).toString());
            await this.page.setDefaultNavigationTimeout(35000);
        }

        if( store.get('getProgressState') == false) {       
            try{
                await this.page.goto(`https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=${this.item.code}&Quantity.1=1`,{ waitUntil: 'domcontentloaded' });
                //await this.page.waitForSelector('td[class="price item-row"]')
                
                if(await this.page.evaluate(() => document.querySelector('td[class="price item-row"]')) != null ){
                    let priceStr = await this.page.evaluate(() => document.querySelector('td[class="price item-row"]').innerHTML);
                    console.log(priceStr);
                    let price = parseFloat(priceStr.replace("$", ''));
                    console.log(price);
                    if(  this.item.price  >= parseFloat(price)) {
                        logger.warn('[Aws] The product price meets the standard！');
                        tgBot.send('[Aws] The product price meets the standard！');
                        store.set('getProgressState', true);
                        //sound.play(__dirname+"/beep.mp3");
                        await this.page.click('input[value="add"]');
                        await this.page.waitForNavigation({ timeout: 4000, waitUntil: 'domcontentloaded' });
                        await this.awsCart();
                    }else{
                        console.log('[Aws] Over Budget');
                        await this.page.waitForTimeout(config.AwsRefreshInterval);
                        await this.aws();
                    }

                }else{
                    console.log(`[Aws] ${this.item.name} OUT OF STOCK`);
                    await this.page.waitForTimeout(config.AwsRefreshInterval);
                    store.set('getProgressState', false);
                    await this.aws();
                }
            }catch(errr){
                await this.page.waitForTimeout(1000);
                logger.warn('[Aws] Something error| Message : '+errr);
                store.set('getProgressState', false);
                await this.aws();
            }
        }
        }else{
            logger.warn('[AWS]：Other Page placing order,will stop this page for a while.');
            await this.page.waitForTimeout(config.ConflictInterval);
            await this.aws();
        }
            // const message = await this.page.evaluate(() => document.querySelector('td[class="col"]').innerText) || 'Error';
                //console.log(price+" " + message);
        }

    async awsCart(){
        try{
            const target = await this.page.$('input[value="Proceed to checkout"]');
            if(target){
                await this.page.click('input[value="Proceed to checkout"]');
                await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
                //await this.page.clickAndWaitForNavigation('input[value="Proceed to checkout"]', {}, { waitUntil: 'domcontentloaded' });
                if (isCheckoutPage(this.page.url())) {
                    logger.warn('[Aws] Going to checkout');
                    await this.checkout();
                } 
            }else{
                logger.warn('[Aws] Fail, ready to go back')
                //await this.page.goBack();
                store.set('getProgressState', false);
                await this.aws();

            }
        }catch(e1){
            logger.warn('[AWS]Proceed to checkout not found' + e1)
            store.set('getProgressState', false);
            await this.aws();
        }
    }

    async checkout () {

        if(isLoadingCheckout(this.page.url())){
            await this.page.waitForTimeout(1000);
        }

        if(await err(this.page))  {  //
            //logger.info('[AWS] Going to checkout');
        }else if (isCheckoutPage(this.page.url())) {
            logger.info('[AWS] Ready For Place Order! Good Luck');
            await this.placeOrder();
        }else if (isShippingAddressPage(this.page.url())) {
            try{
            logger.info(`[AWS] selecting shipping address`);
           // await this.page.clickAndWaitForNavigation('.ship-to-this-address a', {}, { waitUntil: 'domcontentloaded' });
           await Promise.all([
                await this.page.click('.ship-to-this-address a'),
                logger.info(`[AWS] Loading to next page`),
                await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000})
            ]);

            if (isshipoptionselectPage(this.page.url())) {
                logger.info(`[AWS] selecting shipping option`);
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
                    logger.info(`[AWS] selecting payment option`);
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

            
                logger.info('[AWS] Shipping Select End');
                logger.warn(`[AWS]${this.page.url()}`);
                await this.placeOrder();
            }catch(ship){
                const timestamp = Math.floor(Date.now() / 1000);
                await this.page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
                logger.info('[AWS] Shipping Failed to checkout || '+ship);
                store.set('getProgressState', false);
                await this.main();
            }


        }else if (isCheckoutPage(this.page.url())) {
            logger.info('[AWS] Ready For Place Order! Good Luck');
            await this.placeOrder();
        }else{
            logger.warn(`[AWS]${this.page.url()}`);
            logger.info('[AWS] Failed to checkout');
            store.set('getProgressState', false);
            await this.main();
        }
    }


    async placeOrder() {
        if(isLoadingCheckout(this.page.url())){
            await this.page.waitForTimeout(1000);
        }
       logger.warn('[AWS] Prepare to place order! ||' + this.i);
       try{
           // await this.page.clickAndWaitForNavigation('#placeYourOrder > span > input' , {}, { timeout:1500, waitUntil: 'domcontentloaded' });
           await this.page.click('#placeYourOrder > span > input');
            logger.warn('[AWS] PlaceButton Click!')
            await this.page.waitForNavigation({ timeout: 5000 });
            logger.warn(this.page.url() + ' Waiting Result' );
            await this.page.waitForNavigation({ timeout: 5000 });
            const content = await this.page.content();
            if (isPlacedOrder(this.page.url())) {
                //sound.play(__dirname+"\/beep\/beep.mp3");
                tgBot.send('[AWS] Thank you, your order has been placed.');
                logger.warn('[AWS] Thank you, your order has been placed.');
                store.set('getProgressState', false);
                return 0
            } else {
                logger.warn('[AWS] Failed to place order in : ' + this.page.url());
                store.set('getProgressState', false);
                return 0
            }
       }catch(e){
           await this.page.waitForTimeout(1000);
           logger.warn('[AWS] Failed to place order in : ' + e);

       }



}

}

module.exports = aws