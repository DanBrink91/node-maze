var EventEmitter = require('events').EventEmitter;
var uuid = require('node-uuid');

function Client(socket) {
	this._uuid = uuid.v4();
	this.socket = socket;

	this.socket.on('close', this._onclose.bind(this));
	this.socket.on('error', this._onerror.bind(this));
	this.socket.on('message', this._onmessage.bind(this));
}
Client.prototype = Object.create(EventEmitter.prototype);

Object.defineProperty(Client.prototype, 'id', {
	get: function() {
		return this._uuid;
	}
});

Client.prototype._onclose = function(code) {
	this.emit('disconnect', code);
};

Client.prototype._onerror = function(data) {
	this.emit('error', data);
};

Client.prototype._onmessage = function(data) {
	var obj;
	try{
		obj = JSON.parse(data);	
	} catch(ex) {
		console.log(ex);
		return;
	}
	this.emit('message', obj.name, obj.data);
	this.emit(obj.name, obj.data);
};

Client.prototype.send = function(name, data) {
	console.log(name, data);
	var msg = JSON.stringify({
		name: name,
		data: data
	});
	this.socket.send(msg);

	return msg;
};

module.exports = Client;