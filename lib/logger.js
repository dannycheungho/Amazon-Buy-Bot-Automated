const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
var colors = require('colors');

const logger = createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        printf(({ level, message, timestamp }) => {
            return `[${timestamp}] [${level}] ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: `${__dirname}/../log/error.log`, level: 'error' }),
        new transports.File({ filename: `${__dirname}/../log/app.log` })

    ]
});

module.exports = logger;
