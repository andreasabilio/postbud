const { post } = require('axios');
const smtp = require("smtp-protocol");
const simpleParser = require('mailparser').simpleParser;
const { createLogger, format, transports } = require('winston');

// XXX
// const url = 'http://push.abilio.dk/message?token=AcQUrkKOv2PJxWF';

const getTitle = (message) => message.headerLines
    .filter(h => 'from' === h.key)
    .pop().line.split('@').pop();

const gettarget = (config, notification) => config.find(c => c.origin === notification.title);

module.exports = {
    // Basic logger
    log: createLogger({
        level: 'info',
        format: format.simple(),
        transports: [ new transports.Console() ],
    }),

    // SMTP Server
    server: smtp.createServer,

    // Parse email message into workable object
    parseEmail: simpleParser,

    parseNotification: (config) => (message) => {
        const { text } = message;
        const title = getTitle(message);

        return {
            "message": text, 
            "title": title || 'System unknown!', 
            "priority":5, 
            "extras": {
              "client::display": {
                "contentType": "text/markdown"
              }
            }
          };
    },

    // Send the actual notifications
    notify: (config) => (notification) => {
        const { endpoint, token} = gettarget(config, notification);
        const url = [endpoint, `token=${token}`].join('?');

        post(url, notification);
    },

    logMessage: (req, log) => (message) => {
        log.info('Incomming message');

        return message;
    },

    logNotification: (req, log) => () => {
        log.info('Notification sent');
    }
};