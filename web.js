var http = require("http");
var express = require("express");
var ws = require("ws");
var controller = require("./scripts/Controller");
var db = require('../models');

//configure ports
var httpPort = Number(process.env.PORT || 5000);

//Configure the database
db.sequelize.sync().complete(function(err) {
	if (err) {
		throw err[0];
	} else {
		//initialise the controller
		controller.init();

		//Setup the HTTP application
		var app = express();

		app.get("/", function(req, res) {
			res.render("index.jade", {});
		});

		var server = http.createServer(app);
		server.listen(httpPort);

		//Setup the ws server
		var wss = new ws.Server({server: server, path: "/ws"});
		wss.on('connection', function(conn) {
			controller.splashScreen(conn);

			var id = setInterval(function() {
				try {
					conn.ping();
				} catch (e) {
					clearInterval(id);
				}
			}, 10000);

			conn.on('message', function(message) {
				controller.handleMessage(conn, message);
			});

			conn.on('close', function() {
				controller.deactivatePlayer(conn);
			});
		});
	}
});
