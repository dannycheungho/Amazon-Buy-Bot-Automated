"# AmazonPurchasingBot" 

About AmazonPurchasingBot
In the past year, the demand for graphics cards has risen sharply. In order to fight against all kinds of robots, I decide to share the amazon bot that I have used for a long time.
This project is based on nodes with puppeteer which can be configured to run full (non-headless) Chrome or Chromium.

Functionality
✔Auto Login
✔Monitoring Shopping Cart, product Page, AWS page
✔Auto Purchasing 
✔Fully automatic operation
✔Captcha ByPassed
✔Error page is automatically skipped and retryed
✔Allow Singe tab mode and Multi tab Mode
✔telegram alert

Installation

Requirements
NodeJS Chrome or Chromium.

Config setting
1.
To open those function, u have to edit config.json.
Change the number zero to one, to enable all you need function.
You can also entry amazon account infomation and telegram api to enable Auto Login and telegram alert.
2.
Edit item depend on what item you want to monitor.
There are example on default item.json file.

Quick Start

1.npm install
2.Edit config.json 
3.run npm start


