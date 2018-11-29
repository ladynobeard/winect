'use strict';
const awsIot = require('aws-iot-device-sdk');

var app = {}
var JSONpayload = {}
app.TOPIC_TEXT = "Winect:new-text"

// Setup our AWS IoT device and receive messages
app.setup = function() {
  /*
   * cert path
   */
  app.device = awsIot.device({
   keyPath: './certs/8ac0cb41c8-private.key',
   certPath: './certs/8ac0cb41c8-certificate.key',
	caPath: './certs/root-CA.crt',
	clientId: 'Winect',
	host: 'a2iv64xdl7wtt6.iot.us-east-1.amazonaws.com'	  
  });

  /*
   * AWS IoT - Connecting to topic
   */
  console.log("Attempt to connect to AWS ");
  app.device.on("connect", function() {
    console.log("Connected to AWS IoT");

    app.device.subscribe(app.TOPIC_TEXT);
    console.log("Subscribed: " + app.TOPIC_TEXT);
	
	
	
  });
	  
  // Listeners
  app.device.on("message", function(topic, payload) {
	JSONpayload = payload.toString();
	JSONpayload = JSONpayload.substring(
					JSONpayload.indexOf(':')+2,
					JSONpayload.lastIndexOf('"'));
    // If successfull, let's let our application know
    for (var i = 0; i < app.callbacks.length; i++) {
      app.callbacks[i](topic, JSONpayload);  
    }
  });

}

// Callbacks that will be invoked when a message is received
app.callbacks = [];

app.onMessage = function(callback) {
  app.callbacks.push(callback);
}

module.exports = app
