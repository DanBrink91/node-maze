var EventEmitter = require('events').EventEmitter;
var WebSocketServer = require("ws").Server;

var Client = require('./client');

function Server(args) {
	EventEmitter.call(this);
	args = args || {};

	this.socket = new WebSocketServer({server: args.server});

	this.socket.on('connection', this._onconnection.bind(this));
}
Server.prototype = Object.create(EventEmitter.prototype);

Server.prototype._onconnection = function(socket) {
	this.emit('connection', new Client(socket));
};

module.exports = Server;