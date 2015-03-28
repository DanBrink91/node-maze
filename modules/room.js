var EventEmitter = require('events').EventEmitter;
var uuid = require('node-uuid');

var Maze = require('./maze.js').Maze;

function Room(args) {
	EventEmitter.call(this);
	this.id = uuid.v4();
	this.clients = [];

	args = args || {};
	this.name = args.name || "Room";

	if(args.size){
		if(args.size == 'small') {
			this.maze = new Maze(20, 20);
		}
		else if(args.size == 'large') {
			this.maze = new Maze(60, 60);
		}
		// Defaults to medium
		else {
			this.maze = new Maze(40, 40);
		}
	}
	else {
		this.maze = new Maze(3, 3);
	}

	this.maze.generate();
}

Room.prototype = Object.create(EventEmitter.prototype);

Room.prototype.join = function(client) {
	if (this.clients.indexOf(client) !== -1)
		return;

	this.publish('user.join', {
		id: client.id,
		name: client.name || 'guest'
	});
	this.clients.push(client);
	var self = this;
	client.on('disconnect', function(){
		self.leave(client);
	});
	// TODO make some object to control game state stuff (moves)
	client.position = this.findStartingPosition();
	client.send('position', {
		x: this.maze.getX(client.position),
		y: this.maze.getY(client.position)
	});	
	// Try to move in the maze
	client.on('move', function(direction) {
		var moved = false;
		switch(direction){
			case "N":
				if(self.maze.canNorth(client.position)) {
					client.position -= self.maze.width;
					moved = true;
				}
				else {
					client.send('invalid.move','You cannot move North.');
					return;
				}
			break;
			case "S":
				if (self.maze.canSouth(client.position)) {
					client.position += self.maze.width;
					moved = true;
				}
				else {
					client.send('invalid.move','You cannot move South.');
					return;
				}
			break;
			case "W":
				if (self.maze.canWest(client.position)) {
					client.position -= 1;
					moved = true;
				}
				else {
					client.send('invalid.move','You cannot move West.');
					return;
				}
			break;
			case "E":
				if (self.maze.canEast(client.position)) {
					client.position += 1;
					moved = true;
				}
				else {
					client.send('invalid.move','You cannot move East.');
					return;
				}
			break;
		}
		if(moved){
			client.send('position', {
				x: self.maze.getX(client.position),
				y: self.maze.getY(client.position)
			});

			// Did we land on the same square as someone else?
			var touching_clients = [];
			for(var i = 0; i < self.clients.length; i++){
				if(client.position == self.clients[i].position) {
					touching_clients.push(self.clients[i]);
				}
			}
			if(touching_clients.length > 1){
				for(var i = 0; i < touching_clients.length; i++){
					// grab all the OTHER users
					var found_users = touching_clients.filter(function(c) { return c.id != touching_clients[i].id; }).
					map(function(c){ return {id: c.id, name:c.name || 'guest' }; });
					touching_clients[i].send('user.found', found_users)					
				}
				
			}
		}
	});

	client.on('user.nick', function(text){
		if (/^([a-z0-9\-_]){3,12}$/i.test(text)) {
	       client.name = text;

	       self.publish('user.nick', {
	           id: client.id,
	           name: text
	       });
	   }	
	});
	client.on('room.chat', function(message){
		if(message.length > 200)
			return;
		// todo regex test
		// todo time limit
		self.publish('chat', {
			id: client.id,
			message: message
		});

	});
	// sync up the users
	var users = [];
	for(var i = 0; i < this.clients.length; i++) {
		users.push({
			id: this.clients[i].id,
			name: this.clients[i].name || 'guest'
		});
	}
	client.send('user.sync', users);

	this.emit('join');
};

Room.prototype.leave = function(client) {
	var index = this.clients.indexOf(client);

	if (index === -1)
		return;

	this.clients.splice(index, 1);

	this.emit('leave');

	this.publish('user.remove', {
		id: client.id
	});
};
// todo be smarter
Room.prototype.findStartingPosition =function(){
	return Math.floor(Math.random() * (this.maze.width * this.maze.height));
};

// selective publish, group is an array of clients
Room.prototype.publishGroup = function(group, name, data){
	for(var i = 0; i < group.length; i++) {
		group[i].send(name, data);
	}
};
Room.prototype.publish = function(name, data) {
	for(var i = 0; i < this.clients.length; i++) {
		this.clients[i].send(name, data);
	}
};

module.exports = Room;