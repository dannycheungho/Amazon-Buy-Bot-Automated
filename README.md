AmazonPurchasingBot
====
About AmazonPurchasingBot
-------
In the past year, the demand for graphics cards has risen sharply. In order to fight against all kinds of robots, I decide to share the amazon bot that I have used for a long time.
This project is based on nodejs with puppeteer which can be configured to run full (non-headless) Chrome or Chromium.

Functionality
-------
✔Auto Login<br>  
✔Monitoring Shopping Cart, product Page, AWS page<br>  
✔Auto Purchasing <br>  
✔Fully automatic operation<br>  
✔Captcha ByPassed<br>  
✔Error page is automatically skipped and retryed<br>  
✔Allow Singe tab mode and Multi tab Mode<br>  
✔telegram alert<br>  

![image](https://github.com/dannycheungho/AmazonPurchasingBot/blob/main/botgithub.png)

Installation
-------

Requirements
-------
NodeJS Chrome or Chromium.
Python3(option)

Config Setting
-------
1.<br>  
To open those function, u have to edit config.json.<br>  
Change the number zero to one, to enable all you need function.<br>  
You can also entry amazon account infomation and telegram api to enable Auto Login and telegram alert.<br>
Modify "headless" true to false, until you test enough.

2.<br>  
Edit item depend on what item you want to monitor.<br>  
There are example on default item.json file.<br>  

3.<br> 
Captcha ByPass required Python3.
It is strongly recommended to install.

Quick Start
-------
1.npm install<br>  
2.Edit config.json and item.json<br>  
3.run npm start<br>  


