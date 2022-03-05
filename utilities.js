const { post } = require('axios');
const smtp = require("smtp-protocol");
const simpleParser = require('mailparser').simpleParser;
const { createLogger, format, transports } = require('winston');

module.exports = {
    // Basic logger
    log: createLogger({
        level: 'info',
        format: format.simple(),
        transports: [ new transports.Console() ],
    }),

    // SMTP Server
    server: smtp.createServer,

    // Use Axios for now
    post: post,

    // Parse email message into workable object
    parseEmail: simpleParser,

    parseNotification: () => {}
};