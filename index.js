const config = require('./config.json');
const utilities = require('./utilities');

const { log, server, notify } = utilities;
const { parseEmail, parseNotification } = utilities;
const { logMessage, logNotification } = utilities;

// Hello
log.info('Starting Postbud...');

const serverSetup = (req) => {
    // Handle all messages
    req.on('message', (stream, ack) => {
        // Handle message
        parseEmail(stream)
            .then(logMessage(req, log))
            .then(parseNotification(config))
            .then(notify(config))
            .then(logNotification(req, log))
            .catch(log.error);

        // Reply
        ack.accept();
    });
};

// Run the SMTP server
server(serverSetup).listen(2526);