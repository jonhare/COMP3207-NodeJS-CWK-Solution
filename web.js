var express = require("express");
var logfmt = require("logfmt");
var net = require('net');

//configure ports
var tcpPort = Number(process.env.RUPPELLS_SOCKETS_LOCAL_PORT || 1337);
var httpPort = Number(process.env.PORT || 5000);

var tcpServer = process.env.RUPPELLS_SOCKETS_FRONTEND_URI || "localhost:" + tcpPort;

//Setup the HTTP application
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.render('index.jade', {tcpURI: tcpURI})
});

app.listen(httpPort, function() {
  console.log("Listening on " + port);
});

//Setup the tcp server
net.createServer(socketHandler).listen(ruppells_sockets_local_port);

