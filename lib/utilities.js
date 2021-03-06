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
    url: conf.endpoint,
    data: {
        body: 'BODY: ' + data.notification.body,
        from: {
            user: data.notification.from.user,
            host: data.notification.from.host
        }
    }
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

    // Email message parser from stream
    getEmailMessage: simpleParser,

    // Create a notification out of an email
    // using the configured handlers.
    compose: (config) => {

        // Ensure a handler is loaded and configured
        const loader = (conf) => {
            try {
                const handlerFactory = require(`./handlers/${conf.name}`);
                return handlerFactory(conf, log);
            } catch(e) {
                log.warn(`Failed to load handler "${conf.name}"`);
                return fallbackHandler(config.fallback);
            }
        };

        // Run a handler with the given data
        const runner = (data) => (handler) => handler(data);

        // Hanlde each incoming email
        return (mail) => {
            const subject = mail?.subject || '[missing "subject"]';
            const body = mail?.text || '[missing "body"]';
            const [ user, host ] = (mail.from?.text || 'unknown@unknown').split('@');

            // Upstream data
            const data = { 
                mail, 
                notification: { 
                    body, 
                    subject, 
                    from: { user, host }
                }
            };

            // Use handlers to build requests for Axios
            const requests = config.handlers
                .map(loader)
                .map(runner(data))
                .filter(req => !!req);

            return { ...data, requests };
        };
    },

    // Send the HTTP notifications
    notify: (data) => Promise.all(data.requests.map(doNotify))
        .then(responses => ({ ...data, responses })),

    // Log incomming SMTP message
    logIncomming: (mail) => {
        log.info(`Received message from "${mail.from.text}"`);
        return mail;
    },

    // Log notifications
    logOutgoing: (data) => {
        log.info(`Notification(s) for "${data.mail.from.text}" dispatched`);
        return data;
    }
};
