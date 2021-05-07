const https = require('https');
const config = require('../config.json');

class TelegramBot {

    static send = (message) => {
        https.get(`https://api.telegram.org/bot${config.tgBotApiToken}/sendMessage?chat_id=${config.tgBotChatId}&text=${encodeURIComponent(message)}`);
    }

}

module.exports = TelegramBot;
