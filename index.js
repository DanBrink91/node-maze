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
	// var ID = nextClientID; 
	// var pos = getRandomPosition();
	// var x = maze.getX(pos);
	// var y = maze.getY(pos);

	// clients.push({'ws': ws, 'ID':ID, 'position': pos, 'status': 0});
	// nextClientID++;

	// ws.send(JSON.stringify({'type': 'notification', 'payload': currentPositionString(pos)}));
	
	// ws.on("message", function(data, flags) {
	// 	var msg = JSON.parse(data);
	// 	switch(msg.type) {
	// 		// User setting a nickname
	// 		case "nick":
	// 			clients[ID].nick = msg.payload;
	// 		break;
	// 		// User trying to move
	// 		case "move":
	// 			pos = clients[ID].position;
				
	// 			switch(msg.payload) {
	// 				case "N":
	// 					if(maze.canNorth(pos)) {
	// 						clients[ID].position -= maze.width;
	// 					}
	// 					else {
	// 						ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move North.'}));
	// 						return;
	// 					}
	// 				break;
	// 				case "S":
	// 					if (maze.canSouth(pos)) {
	// 						clients[ID].position += maze.width;
	// 					}
	// 					else {
	// 						ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move South.'}));
	// 						return;
	// 					}
	// 				break;
	// 				case "W":
	// 					if (maze.canWest(pos)) {
	// 						clients[ID].position -= 1;
	// 					}
	// 					else {
	// 						ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move West.'}));
	// 						return;
	// 					}
	// 				break;
	// 				case "E":
	// 					if (maze.canEast(pos)) {
	// 						clients[ID].position += 1;
	// 					}
	// 					else {
	// 						ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move East.'}));
	// 						return;
	// 					}
	// 				break;
	// 			}
	// 			// check for collisions
	// 			var touching = findTouching(ID);
	// 			if(touching.length > 0) {
	// 				for(var i = 0; i < touching.length; i++) {
	// 					if(touching[i].nick) {
	// 						ws.send(JSON.stringify({'type': 'notification', 'payload': 'You see ' + touching[i].nick}));		
	// 					}
	// 					else{
	// 						ws.send(JSON.stringify({'type': 'notification', 'payload': 'You see ' + touching[i].ID}));
	// 					}
	// 					touching[i].ws.send(JSON.stringify({'type': 'notification', 'payload': 'You see ' + clients[ID].nick ? clients[ID].nick : ID}))
	// 				}
	// 			}
	// 			ws.send(JSON.stringify({'type': 'notification', 'payload': currentPositionString(clients[ID].position)}));
	// 		break;
	// 		// User trying to chat
	// 		case "chat":
	// 			var sendChat = {
	// 				"type": "chat",
	// 				"message": msg.payload
	// 			};
	// 			if(clients[ID].nick) {
	// 				sendChat.sender = clients[ID].nick;
	// 			}
	// 			else {
	// 				sendChat.sender = ID;
	// 			}
	// 			sendAll(JSON.stringify(sendChat));
	// 		break;
	// 	}
	// });
	
	// ws.on("close", function(){
	// 	console.log("websocket close");
	// });
});

// prevent dyno from going idle
function startKeepAlive() {
	setInterval(function(){
		var options = {
			host: 'whispering-springs-1088.herokuapp.com',
			path: '/style.css'
		};
		http.get(options, function(res){});
	}, 50 * 1000); // every 50 seconds
}
startKeepAlive();