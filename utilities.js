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
const fallbackHandler = (conf) => ({
    run: (data) => ({
        method: conf.method,
        url: conf.endpoint
    })
});

module.exports = {
    // Basic logger
    log: log,

    // SMTP Server
    server: smtp.createServer,
    
    // Parse email message and add metadata
    getEmail: (stream) => simpleParser(stream).then(message => {
        const body = message?.text || '[missing "body"]';
        const from = message.headerLines.filter(h => 'from' === h.key);
        const [ user, host ] = from.split('@');

        // The notification object
        const notification = { 
            body,
            from: { user, host } 
        };

        // The data object
        return { message, notification };
    }),

    // Load and run configured handlers
    // to compose axios config objects (`requests`).
    compose: (config) => {
        // Run a handler with the given data
        const runner = (data) => (handler) => handler(data);

        // Ensure a handler is loaded and configured
        const loader = (conf) => {
            try {
                const handler = require(`../handlers/${conf.name}`);
                return handler(conf);
            } catch(e) {
                log.warning('Handler not found', name);
                return fallbackHandler(config.fallback);
            }
        };

        // Request configs builder
        return (data) => {
            const requests = config.handlers
                .map(loader)
                .map(runner(data))
                .filter(req => !!req);

            return { ...data, requests };
        }
    },

    // Send the HTTP notifications
    notify: ({ requests }) => Promise.all(requests.map(axios.post)),

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
