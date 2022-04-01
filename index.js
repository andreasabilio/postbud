const config = require('./config');
const utilities = require('./lib/utilities');

// Extract utilities
const { log, logIncomming, logOutgoing } = utilities;
const { server, getEmailMessage, compose, notify } = utilities;

// Handle incoming email
const onMessage = (stream, ack) => {
    // Accept all messages
    // and intiate the stream
    ack.accept();

    // Process message stream
    // and send notification(s)
    getEmailMessage(stream)
        .then(logIncomming)
        .then(compose(config))
        .then(notify)
        .then(logOutgoing)
        // .catch(log.error);
};

// Server setup that accepts all emails
const acceptAll = (req) => req.on('message', onMessage);

// Hello
log.info('Starting Postbud...');

// Run the SMTP server
server(acceptAll).listen(config.port);
