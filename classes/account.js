const Tesseract = require('tesseract.js');
const UserAgent = require('user-agents');
const config = require('../config.json');
const logger = require('../lib/logger');
let {PythonShell} = require('python-shell')
const sound = require("sound-play");
require('../lib/log');
const { createWorker } = require('tesseract.js');



class Account {

    static loginIfNeeded = async () => {
        logger.info('[Login] Checking Login State');
        const page = await Account.browser.newPage();
        await page.setUserAgent(new UserAgent().toString());
        await page.goto('https://www.amazon.com/gp/css/order-history?ref_=nav_orders_first' , {  waitUntil: 'networkidle0' });
        //await page.goto('https://www.amazon.com/ap/cnep?openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fyour-account&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.ns.pape=http%3A%2F%2Fspecs.openid.net%2Fextensions%2Fpape%2F1.0&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&', { waitUntil: 'domcontentloaded' });
        const content = await page.content();

        await page.screenshot({ path: 'log/login0.png' });

      //  await Account.CaptchaPage(page);
        if (isCaptchaPage(content)) {
            logger.info('isLoginCaptcha');
            const imgSrc = await page.$eval(
                'img',
                (el) => el.src
            );
            const captcha = await Account.detectCaptcha(imgSrc);
            await page.type('input#captchacharacters', captcha, { delay: 50 });
        //    await page.clickAndWaitForNavigation('button[type="submit"]', {}, { waitUntil: 'domcontentloaded' });
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({
                waitUntil: 'domcontentloaded', timeout: 15000
                }),
             ]);
        }
        
        if ( /ap\/signin/.test(page.url()) ){
            logger.info('[Login] Need to login');
            await Account.ifLoginNeeded(page);
        }

        logger.info('[Login] State: logged in');
        await page.close();
    }

    static ifLoginNeeded = async (page) => {
        const timestamp = Date.now();
        try{
            let content = await page.content();
            if( /Email or mobile phone number/.test(content) ){
                logger.info('[Login] Typing email');
                await page.waitForSelector('#ap_email');
                await page.waitForTimeout(1000);
                await page.type('#ap_email', config.amazon_account);
                //await page.click('input[name="rememberMe"]');
                await page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
                //await page.clickAndWaitForNavigation('#continue', {}, { waitUntil: 'domcontentloaded' });
                await Promise.all([
                    page.click('#continue'),
                    page.waitForNavigation({
                    waitUntil: 'domcontentloaded', timeout: 10000
                    }),
                 ]);
                await page.waitForTimeout(1000);
            }
            content = await page.content();
            if( /Password/.test(content) ){
                logger.info('[Login] Typing password');
                await page.waitForSelector('#ap_password');
                await page.waitForTimeout(1000);
                await page.type('#ap_password', config.amazon_password);
                //await page.click('input[type=checkbox]', {clickCount:1});
                await page.$eval("input[type='checkbox']", c => c.checked = true);
                await Promise.all([
                    page.click('#signInSubmit'),
                    page.waitForNavigation({
                    waitUntil: 'domcontentloaded', timeout: 10000
                    }),
                 ]);
               // await page.clickAndWaitForNavigation('#signInSubmit', {}, { waitUntil: 'domcontentloaded' });
            }
            content = await page.content();
            
            if( /To continue, approve the notification sent to:/.test(content) ){
                sound.play(__dirname+"/beep.mp3");
                logger.warn("[Login] OTP Needed");
                await page.waitForNavigation({ timeout: 0 });
                logger.warn("[Login] OTP Success");
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
               // await page.clickAndWaitForNavigation('input#signInSubmit', {}, { waitUntil: 'domcontentloaded' });
                await Promise.all([
                    page.click('input#signInSubmit'),
                    page.waitForNavigation({
                    waitUntil: 'domcontentloaded', timeout: 10000
                    }),
                 ]);
            }
            if( /Switch accounts/.test(content) ){
                await Promise.all([
                    page.click('#cvf-account-switcher-add-accounts-link > div.a-fixed-left-grid > div > div > div > div.a-column > div'),
                    page.waitForNavigation({
                    waitUntil: 'domcontentloaded', timeout: 6000
                    }),
                 ]);
                await this.ifLoginNeeded(page);
            }
    
            //await page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
            logger.warn("[Login] Success");
            logger.warn("[Login] "+page.url());
        }catch(e3){
            await page.screenshot({path: `${__dirname}/../log/${timestamp}.png`});
            logger.warn("[Login] Error : "+e3 + '||' + page.url());
        }
        //sound.play(__dirname+"/beep.mp3");
    }

    static CaptchaPage = async (page) => {
        let content = await page.content();
            if (isCaptchaPage(content)) {
                logger.info('isCaptchaPage');
                const imgSrc = await page.$eval(
                    'img',
                    (el) => el.src
                );
                logger.info(imgSrc);
                let options = {
                    mode: 'text',
                    args: [imgSrc]
                };
                let captcha ='';
                //const captcha = await Account.detectCaptcha(imgSrc);
                PythonShell.run('cap.py', options, function (err,results) {
                    if (err) throw err;
                    captcha = results.toString();
                    logger.info(captcha);
                  }); 
                  await page.waitForTimeout(3000);
                  await page.type('input#captchacharacters', captcha, { delay: 100 });
                  await page.click('body > div > div.a-row.a-spacing-double-large > div.a-section > div > div > form > div.a-section.a-spacing-extra-large > div > span > span > button');       
                  if(captcha=='')
                    await this.CaptchaPage(page);
                  else
                  logger.info('captcha by passed');
            }
    }

    

    static detectCaptcha = async (imageUrl) => {
        /*
        const result = await Tesseract.recognize(
            imageUrl,
            'eng'
        );
        logger.info(`detected captcha: ${result.data.text}`);
        return result.data.text;
        */

        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(imageUrl);
        logger.info(`detected captcha: ${text}`);
        return text;
    }

}

module.exports = Account;
