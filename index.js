var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;


app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);
console.log("http server listening on %d", port);

var WebSocketServer = require("./modules/server");
var wss = new WebSocketServer({server: server});
console.log("websocket server created");

var Hub = require('./modules/hub');
var hub = new Hub();

wss.on("connection", function(client){
	client.send('init', {
		id: client.id
	});

	hub.join(client);
});

// prevent dyno from going idle if people are playing
function startKeepAlive() {
	setInterval(function(){
		if(hub.activeUsers() > 0) {
			var options = {
				host: 'whispering-springs-1088.herokuapp.com',
				path: '/style.css'
			};
			http.get(options, function(res){});	
		}
			
	}, 50 * 1000); // every 50 seconds
}
startKeepAlive();