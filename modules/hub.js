var EventEmitter = require('events').EventEmitter;
var Room = require('./room');

function Hub() {
	this.freeClients = [];
	this.rooms = [];
}
Hub.prototype.join = function(client) {
	if (this.freeClients.indexOf(client) !== -1)
		return;

	this.freeClients.push(client);
	
	
	var self = this;
	
	client.on('enter.room', function(room){
		if (self.rooms.indexOf(room) === -1)
			return;
		var clientIndex = self.freeClients.indexOf(client);
		if (clientIndex === -1)
			return;		
		var room = self.rooms[room];
		if (room.clients.length > 8)
			return;
		
		room.on('leave', function(){
			self.join(client);
		});		
		
		room.join(client);

		if (room.clients.length == 8) {
			self.publish('room.full', {
				'id': room.id
			});
		}
		self.freeClients.splice(clientIndex, 1);
	});
	
	client.on('create.room', function(room) {
		var clientIndex = self.freeClients.indexOf(client);
		if (clientIndex === -1)
			return;
		var addedRoom = new Room(room);

		addedRoom.on('leave', function(){
			self.join(client);
		});
		
		self.rooms.push(addedRoom);
		self.freeClients.splice(clientIndex, 1);
		
		self.publish('room.add', {
			'id' : addedRoom.id,
			'name': addedRoom.name || 'room'
		});
		addedRoom.join(client);
	});

	// Give user a room list
	var availableRooms = [];
	for(var i = 0; i < this.rooms.length; i++) {
		if (this.rooms[i].clients.length < 8)
			availableRooms.push(this.rooms[i]);
	}

	client.send('hub.enter', availableRooms);
};

Hub.prototype.publish = function(name, data) {
	for(var i = 0; i < this.freeClients; i++) {
		this.freeClients[i].send(name, data);
	}
};
module.exports = Hub;