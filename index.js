const config = require('./config');
const utilities = require('./utilities');

// Extract utilities
const { log, logIncomming, logOutgoing } = utilities;
const { server, getEmail, compose, notify } = utilities;

// Handle incoming email
const onMessage = (stream, ack) => {
    const onError = (err) => log.error(err) || ack.reject(err);
    const onSuccess = (responses) => logOutgoing(responses) || ack.accept();

    // Start processing
    getEmail(stream)
        .then(logIncomming)
        .then(compose(config))
        .then(notify)
        // Done processing
        .then(onSuccess)
        .catch(onError);
};

// Server setup that accepts all emails
const acceptAll = (req) => req.on('message', onMessage) && undefined;

// Hello
log.info('Starting Postbud...');

// Run the SMTP server
server(acceptAll).listen(config.port);
