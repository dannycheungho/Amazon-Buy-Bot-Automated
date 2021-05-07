const logger = require('../lib/logger');
var store = require('store')
var config = require('../config.json');
const Account  = require('../classes/account');
/*
isAddedToCart = (url) => {
     /https:\/\/www\.amazon\.com\/gp\/huc\/view\.html/.test(url);
}*/

errCaptcha = async(page,content) => {
    logger.info('Loading...');
    await Account.CaptchaPage(page);
}



err = async(page) => {
    switch(true){
        case /ap\/signin/.test(page.url()):
            logger.warn('Need to be Login')
            await Account.ifLoginNeeded(page);
            await this.err(page);
            return true
        case /item-dispatch/.test(page.url()):
            store.set('getProgressState', false);
            console.log('Error page 2')
            return true
        case /primeinterstitial/.test(page.url()):
            logger.warn('Error page primeinterstitial');
            await page.waitForSelector('a[class="prime-nothanks-button prime-checkout-continue-link primeEvent checkout-continue-link a-button-text"]');
            //await page.click('a[class="prime-nothanks-button prime-checkout-continue-link primeEvent checkout-continue-link a-button-text"]');

            await Promise.all([
                //this.page.click('#primeAutomaticPopoverAdContent > div > div > div.a-column.a-span6.updp-left-option.no-thanks-link > a'),
                await page.evaluate(() => {
                    document.querySelector('a[class="prime-nothanks-button prime-checkout-continue-link primeEvent checkout-continue-link a-button-text"]').click();
                  }),
                await page.waitForNavigation({
                waitUntil: 'domcontentloaded', timeout: 5000
                }),
            ]);
            return true
        case /ref=checkout_entry_handler/.test(page.url()):
            store.set('getProgressState', false);
            console.log('Error page 4')
            return true
        case /validateCaptcha/.test(page.url()):
                logger.info('isCaptcha');
                const captcha = await Account.CaptchaPage(page);

            return true
        default:
            return false
    }
}
/*
ifLoginNeeded = async(page) => {
    const timestamp = Math.floor(Date.now() / 1000);
    try{
        let content = await page.content();
        if( /Email or mobile phone number/.test(content) ){
            await page.waitForSelector('#ap_email');
            await page.type('#ap_email', config.amazon_account);
            await page.clickAndWaitForNavigation('#continue', {}, { waitUntil: 'domcontentloaded' });
        }       
        if( /Password/.test(content) ){
            await page.waitForSelector('#ap_password');
            await page.type('#ap_password', config.amazon_password);
            //await page.click('input[type=checkbox]', {clickCount:1});
            await page.clickAndWaitForNavigation('#signInSubmit', {}, { waitUntil: 'domcontentloaded' });
        }
        content = await page.content();
        
        if( /To continue, approve the notification sent to:/.test(content) ){
            sound.play(__dirname+"/beep.mp3");
            logger.warn("[Login] OTP Needed");
        }

        if (isLoginCaptcha(content)) {
            logger.info('encounter captcha');
            await page.type('input#ap_password', config.amazon_password, { delay: 50 });
            const imgSrc = await page.$eval(
                'img[alt="Visual CAPTCHA image, continue down for an audio option."]',
                (el) => el.src
            );
            const captcha = await Account.detectCaptcha(imgSrc);
            await page.type('input#auth-captcha-guess', captcha, { delay: 50 });
            await page.clickAndWaitForNavigation('input#signInSubmit', {}, { waitUntil: 'domcontentloaded' });
        }

        //await page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
        logger.warn("[Login] "+page.url());
    }catch(e3){
        await page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
        logger.warn("[Login] Error : "+e3 + '||' + page.url());
    }
    //sound.play(__dirname+"/beep.mp3");
}

    detectCaptcha = async (imageUrl) => {
        const result = await Tesseract.recognize(
            imageUrl,
            'eng'
        );
        logger.info(`detected captcha: ${result.data.text}`);
        return result.data.text;
    }
    */