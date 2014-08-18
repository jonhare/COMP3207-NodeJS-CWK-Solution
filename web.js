var http = require("http");
var express = require("express");
var logfmt = require("logfmt");
var ws = require("ws");
var handler = require('./scripts/handler');

//configure ports
var httpPort = Number(process.env.PORT || 5000);

//Configure the database
db.sequelize.sync().complete(function(err) {
	if (err) {
		throw err[0];
	} else {
		handler.startup();

		//Setup the HTTP application
		var app = express();

		app.use(logfmt.requestLogger());

		app.get('/', function(req, res) {
			res.render('index.jade', {});
		});

		var server = http.createServer(app);
		server.listen(httpPort);

		//Setup the ws server
		var wss = new ws.Server({server: server, path: "/ws"});
		console.log('websocket server created');
		wss.on('connection', function(conn) {
			var address = conn.upgradeReq.headers['x-forwarded-for'] || conn.upgradeReq.connection.remoteAddress;
			console.log('Init new connection with IP ' + address);

			handler.splashScreen(conn);

			var id = setInterval(function() {
				try {
        			conn.ping();
        		} catch (e) {
        			clearInterval(id);
        		}
    		}, 10000);

    		conn.on('message', function(message) {
				handler.handleMessage(conn, message);
			});

			conn.on('close', function() {
				console.log('Close connection with IP ' + address);
				handler.deactivatePlayer(conn);
			});
		});
	}
});
