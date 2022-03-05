const { log, server, post, parse }

const smtp = require("smtp-protocol");
const { post } = require('axios');
const { createLogger, format, transports } = require('winston');
const simpleParser = require('mailparser').simpleParser;

// Logger
const logger = createLogger({
    level: 'info',
    format: format.simple(),
    transports: [ new transports.Console() ],
});

// Hello
logger.info('Starting Postbud...');

const relayMessage = (message) => {
    logger.info('Message recieved');

    const { text, from } = message;

    // XXX
    console.log('>>>', message.from);
    console.log(' ');

    post('http://push.abilio.dk/message?token=AcQUrkKOv2PJxWF', {
        "message": text, 
        "title": "System " + from.value.pop().name, 
        "priority":5, 
        "extras": {
          "client::display": {
            "contentType": "text/markdown"
          }
        }
      });
};

const onIncomingMessage = (req) => (stream, ack) => {
    logger.info('Incomming message:');
    logger.info('> Message from:', req.from);
    logger.info('> Message to:', req.to);
    
    stream.pipe(process.stdout, { end : false });
    // ack.accept();

    // Relay the message
    simpleParser(stream)
        .then(relayMessage)
        .catch(logger.error);

    // Finish
    ack.accept();
};

const server = smtp.createServer(function (req) {
    req.on('message', onIncomingMessage(req));
});

server.listen(2526);