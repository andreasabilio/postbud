const axios = require('axios');
const smtp = require("smtp-protocol");
const simpleParser = require('mailparser').simpleParser;
const { createLogger, format, transports } = require('winston');

// Winston init
const log = createLogger({
    level: 'info',
    format: format.simple(),
    transports: [ new transports.Console() ],
});

// Fallback handler for worng configs
const fallbackHandler = (conf) => (data) => ({
    method: conf.method,
    url: conf.endpoint
});

// Sen request to notification endpoint
const doNotify = ({ method, url, data }) => {
    const handler = axios[method];
    return handler(url, data);
};

module.exports = {
    // Basic logger
    log: log,

    // SMTP Server
    server: smtp.createServer,

    getEmailMessage: simpleParser,

    getEmail: async (stream) => {

        // XXX
        // console.log('>>> DING ! ! !');

        // This works...
        // simpleParser(stream).then(mail => console.log('+++', mail, '+++') || mail);


        // XXX
        // console.log('>>> DONG ! ! !');


        return Promise.resolve({
            mail: {},
            notification: {
                body: 'postbud body',
                from: {
                    user: 'operations',
                    host: 'magallanes.h.abilio.dk'
                }
            }
        });


        // This doesn't work
        return simpleParser(stream).then(mail => {    
            const body = mail?.text || '[missing "body"]';
            const from = mail.from.text;
            const [ user, host ] = from.split('@');
    
            // The notification object
            const notification = { 
                body,
                from: { user, host } 
            };
    
            // The data object
            return { mail, notification };
        });
    },
    
    // Parse email message and add metadata
    // _getEmail: (stream) => simpleParser(stream).then(message => {

    //     // XXX
    //     console.log('>>> DUNG ! ! !');

    //     const body = message?.text || '[missing "body"]';
    //     const from = message.headerLines.filter(h => 'from' === h.key);
    //     const [ user, host ] = from.split('@');

    //     // The notification object
    //     const notification = { 
    //         body,
    //         from: { user, host } 
    //     };

    //     // The data object
    //     return { message, notification };
    // }),

    // Load and run configured handlers
    // to compose axios config objects (`requests`).
    _compose: (config) => {
        // Run a handler with the given data
        const runner = (data) => (handler) => handler(data);

        // Ensure a handler is loaded and configured
        const loader = (conf) => {
            try {
                const handler = require(`./handlers/${conf.name}`);
                return handler(conf);
            } catch(e) {
                log.warn('Failed to load handler', conf.name);
                return fallbackHandler(config.fallback);
            }
        };

        // Request configs builder
        return (data) => {
            const requests = config.handlers
                .map(loader)
                .map(runner(data))
                .filter(req => !!req);

            // XXX
            // console.log('___', data);

            return { ...data, requests };
        }
    },

    // Create a notification out of an email
    // using the configured handlers.
    compose: (config) => {
        // Run a handler with the given data
        const runner = (data) => (handler) => handler(data);

        // Ensure a handler is loaded and configured
        const loader = (conf) => {
            try {
                const handler = require(`./handlers/${conf.name}`);
                return handler(conf);
            } catch(e) {
                log.warn('Failed to load handler', conf.name);
                return fallbackHandler(config.fallback);
            }
        };

        return (mail) => {

            // XXX
            // console.log('>>>', mail);

            const body = mail?.text || '[missing "body"]';
            const [ user, host ] = (mail.from?.text || '').split('@');
            const data = { mail, notification: { body, from: { user, host }}};

            // Use handlers to build requests for Axios
            const requests = config.handlers
                .map(loader)
                .map(runner(data))
                .filter(req => !!req);

            return { ...data, requests };
        };
    },

    // Send the HTTP notifications
    notify: ({ requests }) => Promise.all(requests.map(doNotify)),

    // Log incomming SMTP message
    logIncomming: (data) => {
        log.info('Incomming message');
        return data;
    },

    // Log notifications
    logOutgoing: (responses) => {
        log.info('Notification sent');
        return responses;
    }
};
