const config = require('./config');
const utilities = require('./utilities');

// Extract utilities
const { log, logIncomming, logOutgoing } = utilities;
const { server, getEmail, compose, notify } = utilities;
// XXX
const { getEmailMessage } = require('./utilities');
const { emailParser, _compose } = utilities;

// Handle incoming email
const onMessage = (stream, ack) => {
    // Accept all messages
    // and intiate stream
    ack.accept();

    // Process message stream
    // and send notification(s)
    getEmailMessage(stream)
        .then(logIncomming)
        // .then(tap => console.log('--- TAP 0:', tap) || tap)
        .then(compose(config))
        // .then(tap => console.log('--- TAP 1:', tap.requests) || tap)
        .then(notify)
        // .then(tap => console.log('--- TAP 2:', !!tap) || tap)
        .then(logOutgoing)
        // .catch(log.error);

    // Start processing
    // return getEmail(stream)
    //     // .catch(onError)
    //     .then(logIncomming)
    //     .then(_compose(config))
    //     // .then(notify)
    //     // .then(onSuccess)
    //     // .catch(onError);
};

// // Server setup that accepts all emails
// const acceptAll = (req) => req.on('message', (stream, ack) => {
//     // Accept all messages
//     // and intiate stream
//     ack.accept();

//     getEmailMessage(stream)
//         // .then(logIncomming)
//         // .then(tap => console.log('--- TAP 0:', tap) || tap)
//         .then(compose(config))
//         .then(tap => console.log('--- TAP 1:', tap.requests) || tap)
//         .then(notify)
//         .then(tap => console.log('--- TAP 2:', !!tap) || tap)
//     // onMessage(stream)
//         // .then(() => ack.accept())
//         .catch(e => ack.reject());
// });

// Server setup that accepts all emails
const acceptAll = (req) => req.on('message', onMessage);

// Hello
log.info('Starting Postbud...');

// Run the SMTP server
server(acceptAll).listen(config.port);
