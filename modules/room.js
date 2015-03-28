var EventEmitter = require('events').EventEmitter;
var uuid = require('node-uuid');

var Maze = require('./maze.js').Maze;

function Room(args) {
	EventEmitter.call(this);
	this.id = uuid.v4();
	// list of ALL clients
	this.clients = [];
	// only the clients who are monsters
	this.monsters = [];
	// only the clients who are survivors
	this.survivors = [];

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
	// decide which team the client should join
	this.determineTeam(client);
	this.findStartingPosition(client);

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
			// there was a collision
			if(touching_clients.length > 1){
				
				var monsters = self.monsters.map(function(m) { return m.id; });
				var touching_monsters = [];
				var touching_survivors = [];
				for(var i = 0; i < touching_clients.length; i++){
					// they are a monster
					if(monsters.indexOf(touching_clients[i].id) !== -1) {
						touching_monsters.push(touching_clients[i]);
					}
					// they are survivors
					else {
						touching_survivors.push(touching_clients[i])
					}	
				}				
				// some people died.
				if(touching_monsters.length > 0 && touching_survivors.length > 0){
					var monsters = touching_monsters.map(function(m) { return {id: m.id, name:m.name || 'guest'};})
					var survivors = touching_survivors.map(function(s) { return {id: s.id, name:s.name || 'guest'};})

					var monster_names = monsters.map(function(m) { return m.name; }).join(", ");
					var survivor_names = survivors.map(function(s) { return s.name; }).join(", ");
					self.publish("kill.message", monster_names + " have killed " + survivor_names);
					for(var i = 0; i < touching_monsters.length; i++) {
						touching_monsters[i].kills = (touching_monsters[i].kills + 1) || 1; 
					}
					for(var i = 0; i < touching_survivors.length; i++) {
						touching_survivors[i].alive = false;
						var survivor_index = self.survivors.indexOf(touching_survivors[i]);
						if(survivor_index !== -1)
							self.survivors.splice(survivor_index, 1);
						self.monsters.push(touching_survivors[i]);
						touching_survivors[i].send('dead', {}); 
					}
					if(self.survivors.length == 0){
						self.publish('gameover', {'winner': 'monsters'});
					}
				}
				// everyone on the same team, nobody dies
				else {
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
	if(client.alive){
		var survivor_index = this.survivors.indexOf(client);
		if(survivor_index != -1)
			this.survivors.splice(survivor_index, 1);
	}
	else {
		var monster_index = this.monsters.indexOf(client);
		if(monster_index != -1)
			this.monsters.splice(survivor_index, 1);
	}
	this.clients.splice(index, 1);

	this.emit('leave');

	this.publish('user.remove', {
		id: client.id
	});
};
// todo be smarter
Room.prototype.findStartingPosition =function(client){
	client.position = Math.floor(Math.random() * (this.maze.width * this.maze.height));
};

// Determine which team should person join
Room.prototype.determineTeam = function(client){
	var monster_count = this.monsters.length;
	var survivor_count = this.survivors.length;
	var is_monster = false;
	if(monster_count == 0 && survivor_count==0) {
		// just pick a random team
		is_monster = Math.random() >= 0.5;
	}
	else if(monster_count == 0) {
		is_monster = true;
	}
	else if(survivor_count == 0) {
		is_monster = false;
	}
	// only if there are more then 3 survivors per monster
	else {
		is_monster = (survivor_count > (monster_count * 3));
	}
	if(is_monster) {
		this.monsters.push(client);
		client.alive = false;
		client.send('team.join', 'You are a monster, find the other players and turn them into monsters.');
	}
	else {
		this.survivors.push(client);
		client.alive = true;
		client.send('team.join', 'You are a survivor, avoid the monsters in the maze till you reach a goal I have not created yet.');
	}
	
};
Room.prototype.publish = function(name, data) {
	for(var i = 0; i < this.clients.length; i++) {
		this.clients[i].send(name, data);
	}
};

module.exports = Room;