var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;
var Maze = require('./maze.js').Maze;

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);
console.log("http server listening on %d", port);


var wss = new WebSocketServer({server: server});
console.log("websocket server created");

var maze = new Maze(40, 40);

var clients = [];
var nextClientID = 0;

function sendAll(msg) {
	for(var i = 0; i < clients.length; i++){
		console.log(clients[i]);
		clients[i].ws.send(msg);
	}
}
function getRandomPosition() {
	return Math.floor(Math.random() * (40*40));
}
function currentPositionString(pos) {
	var x = maze.getX(pos);
	var y = maze.getY(pos);

	return 'You are at ' + x + ", " + y;
}
wss.on("connection", function(ws){
	var ID = nextClientID++; 
	var pos = getRandomPosition();
	var x = maze.getX(pos);
	var y = maze.getY(pos);

	clients.push({'ws': ws, 'ID':ID, 'position': pos, 'status': 0});
	nextClientID++;

	ws.send(JSON.stringify({'type': 'notification', 'payload': currentPositionString(pos)}));
	
	ws.on("message", function(data, flags) {
		var msg = JSON.parse(data);
		switch(msg.type) {
			// User setting a nickname
			case "nick":
				clients[ID].nick = msg.payload;
			break;
			// User trying to move
			case "move":
				pos = clients[ID].position;
				
				switch(msg.payload) {
					case "N":
						if(maze.canNorth(pos)) {
							clients[ID].position -= maze.width;
						}
						else {
							ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move North.'}));
							return;
						}
					break;
					case "S":
						if (maze.canSouth(pos)) {
							clients[ID].position += maze.width;
						}
						else {
							ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move South.'}));
							return;
						}
					break;
					case "W":
						if (maze.canWest(pos)) {
							clients[ID].position -= 1;
						}
						else {
							ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move West.'}));
							return;
						}
					break;
					case "E":
						if (maze.canEast(pos)) {
							clients[ID].position += 1;
						}
						else {
							ws.send(JSON.stringify({'type': 'notification', 'payload': 'You cannot move East.'}));
							return;
						}
					break;
				}
				// TODO check for collisions
				ws.send(JSON.stringify({'type': 'notification', 'payload': currentPositionString(clients[ID].position)}));
			break;
			// User trying to chat
			case "chat":
				var sendChat = {
					"type": "chat",
					"message": msg.payload
				};
				if(clients[ID].nick) {
					sendChat.sender = clients[ID].nick;
				}
				else {
					sendChat.sender = ID;
				}
				sendAll(JSON.stringify(sendChat));
			break;
		}
	});
	
	ws.on("close", function(){
		console.log("websocket close");
	});
});
