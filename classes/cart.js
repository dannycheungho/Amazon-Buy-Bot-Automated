
var config = require('../config.json');
//const sound = require("sound-play");
const logger = require('../lib/logger');
const UserAgent = require('user-agents');
var store = require('store');
const Account = require('./account');
const tgBot = require('../lib/telegramBot'); 
require('../lib/log');
require('../lib/err');

class cart{
    constructor() {     
        this.page = null;
    }

    async cart() {
        if (this.page == null){
           // this.page = await cart.browser.newPage();
           this.page = (await cart.browser.pages())[0];
           await this.page.setUserAgent(new UserAgent({ deviceCategory: 'desktop' }).toString());
           await Account.CaptchaPage(this.page);
        }

        if( store.get('getProgressState') == false) {
          try{
            //await this.page.clickAndWaitForNavigation('input[name="proceedToRetailCheckout"]', {}, { waitUntil: 'domcontentloaded' });
            await this.page.goto('https://www.amazon.com/gp/cart/view.html?ref_=nav_cart', {}, { waitUntil: 'domcontentloaded' });

            if( await this.page.$('input[value="Proceed to checkout"]') != null) {
                const a = await this.page.$('input[value="Proceed to checkout"]');
                tgBot.send(`[Cart]  Product On Shopping Cart, moving to cart`)
                logger.warn(`[Cart]  Product On Shopping Cart, moving to cart`)
                store.set('getProgressState', true);
                await this.CartCheck();
                logger.warn(`[Cart]  Seem Failed`)
                store.set('getProgressState', false);
                this.cart();
            }else if( await this.page.$('input[value="Move to cart"]') != null){
                    //sound.play(__dirname+"/beep.mp3");
                    store.set('getProgressState', true);
                    logger.warn(`[Cart] Checked Product On Stuck,checking price`)
                    const price = config.price;
                    const Code = await this.page.evaluate( ( price ) => {
                    let Arraycode = [];
                    let on = document.querySelectorAll('input[data-action="move-to-cart"]');
                    var on2 = document.querySelectorAll('input[data-action="add-best-offer"]');    
                    if(on){
                        for ( let i = 0 ;i<on.length; i+=2 ) {
                            const cartdata = on[i].closest(".sc-java-remote-feature") || 0;
                            try{
                                var code = cartdata.getAttributeNode('data-asin').value;
                            }catch(e11){  code = null; }
                            try{
                                var ItemSprice = cartdata.getAttributeNode('data-price').value;
                            }catch(e12){  ItemSprice = null;       }

                            if( price >parseInt(ItemSprice)){
                                Arraycode.push(code);
                                on[i].click();
                            }
                        }
                    }
                    if(on2){
                        for ( let i = 0 ;i<on2.length; i+=2 ) {
                            const cartdata = on2[i].closest(".sc-java-remote-feature") || 0;
                            try{
                                var code = cartdata.getAttributeNode('data-asin').value;
                            }catch(e11){  code = null; }
                            try{
                                var ItemSprice = cartdata.getAttributeNode('data-price').value;
                            }catch(e12){  ItemSprice = null;       }

                            if( price >parseInt(ItemSprice)){
                                Arraycode.push(code);
                                on2[i].click();
                            }
                        }
                    }
                        return Arraycode;
                    },price)

                    if(Code.length>0) {
                        console.log(Code);
                        tgBot.send(`[Cart] ${Code} On Shopping Cart, moving to cart`);
                        await this.page.waitForSelector('input[value="Proceed to checkout"]' , {timeout: 5000});
                        logger.warn(`[Cart] ${Code} Moving Success`)
                        await this.CartCheck();
                    }else{
                        const date = new Date().toLocaleString();
                        console.log(`[${date}][Cart] Over Budget, no move`);
                        store.set('getProgressState', false);
                        await this.page.waitForTimeout(config.CartRreshInterval);
                        await this.cart();
                        /*
                        await this.page.waitForTimeout(config.CartRreshInterval);
                        await this.cart();*/
                    }
            }else{
                await Account.CaptchaPage(this.page);
                const date = new Date().toLocaleString();
                console.log(`[${date}][Cart] OUT OF STOCK`);
                await this.page.waitForTimeout(config.CartRreshInterval);
                await this.cart();
            }
            }catch(er1) {
                await this.page.waitForTimeout(config.CartRreshInterval);
                logger.warn('[Cart] Something error| Message : '+er1);
                store.set('getProgressState', false);
                await this.cart();
            }
    }
        logger.warn('[Cart] Other Page placing order,will stop this page for a while.');
        await this.page.waitForTimeout(15000);
        await this.cart();
    }

    async CartCheck(){
        if(await err(this.page))  {  //
            //logger.info('[Cart] Going to checkout');
        }
        const priceStr = await this.page.$eval("#sc-subtotal-amount-buybox", el => el.textContent) || 0;
        let price = priceStr.replace(/[&\/\\#,+()$~¥%'":*?<>{}]/g, '');
        logger.info(`[Cart] Total Price: ${price}`);
        if( config.price >= parseFloat(price)) {
            await Promise.all([
                await this.page.click('input[value="Proceed to checkout"]'),
                await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000 })
            ]);
            await this.checkout();
            logger.info(`[Cart] checkout end`);
            store.set('getProgressState', false);
            await this.cart();
        /*    try{
                await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000 });
            }catch(e2){
                logger.info('Fail to entry checkout page. Retrying! || ' + e2);
                store.set('getProgressState', false);
                await this.cart();
            }
            await this.checkout();*/
        }else{
            await this.page.waitForTimeout(1000);
            const del = await this.page.waitForSelector('div.sc-list-item-content > div > div.a-column.a-span10 > div > div > div.a-fixed-left-grid-col.a-col-right > div.a-row.sc-action-links > span.a-size-small.sc-action-delete > span > input');
            await del.click();
            logger.info('[Cart] OverPrice,deleted');
            store.set('getProgressState', false);
            await this.page.waitForTimeout(config.CartRreshInterval);
            await this.cart();
        }
    }

    async checkout () {
        if(isLoadingCheckout(this.page.url())){
            await this.page.waitForTimeout(1000);
        }

        if(await err(this.page))  {  //
            await this.placeOrder();
        }else if (isCheckoutPage(this.page.url())) {
            logger.info('[Cart] Ready For Place Order! Good Luck');
            await this.placeOrder();
        }else if (isShippingAddressPage(this.page.url())) {
            try{
            logger.info(`[Cart] selecting shipping address`);
           // await this.page.clickAndWaitForNavigation('.ship-to-this-address a', {}, { waitUntil: 'domcontentloaded' });
           await Promise.all([
                await this.page.click('.ship-to-this-address a'),
                logger.info(`[Cart] Loading to next page`),
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
                    logger.info(`[Cart] selecting payment option`);
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

            
                logger.info('[Cart] Shipping Select End');
                logger.warn(`[Cart]${this.page.url()}`);
                await this.placeOrder();
            }catch(ship){
                const timestamp = Math.floor(Date.now() / 1000);
                await this.page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
                logger.info('[Cart] Shipping Failed to checkout || '+ship);
                store.set('getProgressState', false);
                await this.cart();
            }


        }else if (isCheckoutPage(this.page.url())) {
            logger.info('[Cart] Ready For Place Order! Good Luck');
            await this.placeOrder();
        }else{
            logger.warn(`[Cart]${this.page.url()}`);
            logger.info('[Cart] Failed to checkout');
            store.set('getProgressState', false);
            await this.cart();
        }
    }




async placeOrder() {
    
        try{
            if(isLoadingCheckout(this.page.url())){
                await this.page.waitForTimeout(1000);
            }
            await Promise.all([
                this.page.click('input[name="placeYourOrder1"]'),
                this.page.waitForNavigation({
                waitUntil: 'domcontentloaded',
                }),
            ]);
            //await this.page.click('input[name="placeYourOrder1"]');
            await this.page.waitForNavigation({ timeout: 10000 });
            await this.page.waitForTimeout(1500);
           // const content = await this.page.content();
           // logger.info(this.page.url());
            if (isPlacedOrder(this.page.url())) {
                //sound.play(__dirname+"\/beep\/beep.mp3");
                tgBot.send('[Cart] Thank you, your order has been placed.');
                logger.info('[Cart] Thank you, your order has been placed.');
                store.set('getProgressState', false);
                const timestamp = Math.floor(Date.now() / 1000);
                await this.page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
                await this.page.waitForTimeout(config.CartRreshInterval);
                return 0
               // await this.cart();
            } else {
                console.log('[Cart] failed to place order');
                store.set('getProgressState', false);
                await this.cart();
            }
        }catch(eeeer){
            console.log('[Cart] placeOrder Page Wrong,failed to place order ' +  eeeer);
            store.set('getProgressState', false);
            await this.cart();
        }
}

async nativeClick(page,button) {
    await page.evaluate((button) => {
        document.querySelector(button).click();
      }, button);
}

}
module.exports = cart