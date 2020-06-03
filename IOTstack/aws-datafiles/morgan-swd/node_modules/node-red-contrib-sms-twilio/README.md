node-red-contrib-sms-twilio
===========================

<a href="http://nodered.org" target="_new">Node-RED</a> node to send bulk SMS messages via Twilio.


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-contrib-sms-twilio



Properties
----------

- **Message** Text to be sent. If left empty it will use msg.payload
- **Numbers** Comma separated list of mobile numbers. Defaults to msg.topic
- **Throttle** Number of milliseconds to wait between messages. Might be useful if the SMS provider throttles the message rates.
