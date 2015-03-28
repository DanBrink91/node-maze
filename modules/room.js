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
		this.maze = new Maze(40, 40);
	}
	
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
	
	// Try to move in the maze
	client.on('move', function(data) {
		client.send('notification', {'msg':'Move request recieved'});
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

Room.prototype.publish = function(name, data) {
	for(var i = 0; i < this.clients.length; i++) {
		this.clients[i].send(name, data);
	}
};

module.exports = Room;