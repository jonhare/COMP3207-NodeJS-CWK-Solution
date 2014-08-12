var express = require("express");
var logfmt = require("logfmt");
var net = require('net');

//configure ports
var httpPort = Number(process.env.PORT || 5000);

//Setup the HTTP application
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.render('index.jade', {tcpURI: tcpURI})
});

app.listen(httpPort, function() {
  console.log("Listening on " + port);
});

//Setup the ws server

var wss = new WebSocketServer({server: server});
console.log('websocket server created');
ws.on('message', function(message) {
	console.log('received: %s', message);
    ws.send(message);
});

});
