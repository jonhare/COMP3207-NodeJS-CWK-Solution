var http = require("http");
var express = require("express");
var logfmt = require("logfmt");
var ws = require("ws");

//configure ports
var httpPort = Number(process.env.PORT || 5000);

//Setup the HTTP application
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.render('index.jade', {})
});

var server = http.createServer(app);
server.listen(httpPort);

//Setup the ws server
var wss = new ws.Server({server: server, path: "/ws"});
console.log('websocket server created');
wss.on('connection', function(conn) {
    conn.on('message', function(message) {
        console.log('received: %s', message);
    	conn.send(message);
    });
});