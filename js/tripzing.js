// Variables you can change
//
// var MY_WEBSOCKET_URL = "ws://tutorial.kaazing.com/jms";
var TOPIC_NAME = "/topic/tripzing";
var TW_TOPIC = "/topic/twillio";
var IN_DEBUG_MODE = true;
var DEBUG_TO_SCREEN = true;

var MESSAGE_PROPERTIES = {
    "messageType": "MESSAGE_TYPE",
    "userId": "USERID"
};

// WebSocket and JMS variables
//
var connection;
var session;
var wsUrl;

var userId = Math.random(100000).toString();

var WEBSOCKET_URL = "ws://" + window.location.hostname + (window.location.port === "" ? "" : ":") + window.location.port + "/jms";

// Variable for log messages
//
var screenMsg = "";

// Used for development and debugging. All logging can be turned
// off by modifying this function.
//
var consoleLog = function(text) {
    if (IN_DEBUG_MODE) {
        // Logging to the browser console
        console.log(text);
    }
};

var handleException = function(e) {
    consoleLog("EXCEPTION: " + e);
};

var handleTopicMessage = function(message) {
    if (message.getStringProperty(MESSAGE_PROPERTIES.userId) != userId) {
        consoleLog("Message received: " + message.getText());
    }
};

var doSend = function(message) {
    message.setStringProperty(MESSAGE_PROPERTIES.userId, userId);
    topicProducer.send(null, message, DeliveryMode.NON_PERSISTENT, 3, 1, function() {
        consoleLog("Message sent: " + message.getText());
    });
};

// Connecting...
//
var doConnect = function() {
    // Connect to JMS, create a session and start it.
    //
    var stompConnectionFactory = new StompConnectionFactory(WEBSOCKET_URL);
    try {
        var connectionFuture = stompConnectionFactory.createConnection(function() {
            if (!connectionFuture.exception) {
                try {
                    connection = connectionFuture.getValue();
                    connection.setExceptionListener(handleException);

                    consoleLog("Connected to " + WEBSOCKET_URL);
                    session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

                    var myTopic = session.createTopic(TOPIC_NAME);
                    consoleLog("Topic created...");

                    topicProducer = session.createProducer(myTopic);
                    consoleLog("Topic producer created...");

                    topicConsumer = session.createConsumer(myTopic);
                    consoleLog("Topic consumer created...");

                    topicConsumer.setMessageListener(handleTopicMessage);

                    
                    connection.start(function() {
                        // Put any callback logic here.
                        //
                        consoleLog("JMS session created");
                        doSend(session.createTextMessage("Hello world..."));
                    });
                } catch (e) {
                    handleException(e);
                }
            } else {
                handleException(connectionFuture.exception);
            }
        });
    } catch (e) {
        handleException(e);
    }
};
