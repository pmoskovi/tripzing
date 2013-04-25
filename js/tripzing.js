// Variables you can change
//
// var MY_WEBSOCKET_URL = "ws://tutorial.kaazing.com/jms";
var TOPIC_NAME = "/topic/tripzing";
var TW_TOPIC = "/topic/twillio";
var IN_DEBUG_MODE = true;
var DEBUG_TO_SCREEN = true;
var messageHandler;

var MESSAGE_PROPERTIES = {
    "messageType" : "MESSAGE_TYPE",
    "userId" : "USERID"
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
    messageHandler(message.getText(), message.getStringProperty(MESSAGE_PROPERTIES.userId));
};

var doSend = function(message, callback, userId) {
    message.setStringProperty(MESSAGE_PROPERTIES.userId, userId);
    topicProducer.send(null, message, DeliveryMode.NON_PERSISTENT, 3, 1, function() {
        consoleLog("Message sent: " + message.getText());
        callback();
    });
};

// Connecting...
//
var doConnect = function(callback) {
    messageHandler = callback;
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

var simulateTrip = function(loc) {
    var zion = [[37.212473, -112.957156], [37.212438, -112.956233], [37.212063, -112.956061], [37.212045, -112.956769], [37.212182, -112.957542], [37.212302, -112.958336], [37.212336, -112.959216], [37.212421, -112.960010]];
    var bryce = [[37.603760, -112.167320], [37.606208, -112.169724], [37.609472, -112.171698], [37.610152, -112.172813], [37.612260, -112.174444], [37.613721, -112.175388], [37.615489, -112.175388]];
    var reverseBryce = [[37.616611,-112.176998],[37.617257,-112.176311],[37.617767,-112.175603],[37.617546,-112.175217],[37.617053,-112.174852],[37.616152,-112.174916],[37.615132,-112.175410],[37.614486,-112.175453]];
    var locArr = eval(loc);
    var index = -1;
    
    function send() {
        index++;
        if (index == locArr.length - 1) {
            return;
        }
        locMsg = locArr[index][0] + "," + locArr[index][1];
        var message = session.createTextMessage(locMsg);
        setTimeout(function() {
            doSend(message, send, loc);
        }, 2000);
    }
    send();
};

