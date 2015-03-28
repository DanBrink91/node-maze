var Maze = function (width, height) {
	this.cellWidth = 50;
	this.cellHeight = 50;

	this.North = 0x01;
	this.South = 0x02;
	this.East = 0x04;
	this.West = 0x08;
	this.Full = this.North | this.South | this.East | this.West;
	this.opposite = {
		0x01: this.South,
		0x02: this.North,
		0x04: this.West,
		0x08: this.East
	};

	this.width = width;
	this.height = height;


	this.mazeData = new Array(height*width);
	for(var i = 0; i < height * width; i++) {
		this.mazeData[i] = this.Full;
	}
	this.walls = [];
	this.visited = [];
}

Maze.prototype.gridPosition = function(current, direction) {
	switch(direction) {
		case this.North: return current - this.width;
		case this.South: return current + this.width;
		case this.West: return current - 1;
		case this.East: return current + 1;
	}
};

Maze.prototype.generate = function() {
	// Start with a random tile/spot	
	var current = Math.floor(Math.random() * this.width) + Math.floor(Math.random() * this.height) * this.height;
	do {

		// add to visited list
		this.visited.push(current);
		// potential neighbors
		var potiential = [];
		// north/up
		if (current > this.width) potiential.push(this.North); // current-this.width
		// south/down
		if (current < this.width * (this.height-1)) potiential.push(this.South); // current+this.width
		// west/left
		if(current % this.width != 0) potiential.push(this.West); // current-1
		// east/right
		if( (current+1) % this.width != 0) potiential.push(this.East); // current+1
		
		// add neighbors to wall list
		for(var i = 0; i < potiential.length; i++) {
			var dir = potiential[i];
			var neighbor = this.gridPosition(current, dir);
			if(this.visited.indexOf(neighbor) == -1) {
				this.walls.push({index: neighbor, from:this.opposite[dir]});
			}
		}
		// Grab a random wall
		var randWall = this.walls.splice(Math.floor(Math.random() * (this.walls.length)), 1)[0];
		var randIndex = randWall['index'];
		var other = this.gridPosition(randIndex, randWall['from']);
		this.mazeData[randIndex] &= ~randWall['from'];
		this.mazeData[other] &= ~this.opposite[randWall['from']];
		this.walls = this.walls.filter(function(i) { return i.index != randIndex || Math.random() < .3; });
		var current = randIndex;	
	} while (this.walls.length > 0);
};
Maze.prototype.Draw = function(ctx) {
	var len = this.mazeData.length;
	ctx.fillStyle = "lightblue";
	//ctx.clearRect(0, 0, 1000, 1000);
	for(var i = 0; i < len; i++) {
		var cell = this.mazeData[i];

		var x = Math.floor(i % this.width);
		var y = Math.floor(i / this.width);
		var px = x * this.cellWidth;
		var py = y * this.cellHeight;
		ctx.fillRect(px, py, this.cellWidth, this.cellHeight);
		ctx.beginPath();
		
		if( (cell & this.North) == this.North){
			ctx.lineTo(px + this.cellWidth, py);
		}

		if( (cell & this.South) == this.South){
			ctx.moveTo(px, py+ this.cellHeight);
			ctx.lineTo(px + this.cellWidth, py + this.cellHeight);
		}

		if( (cell & this.West) == this.West){
			ctx.moveTo(px, py);
			ctx.lineTo(px, py  + this.cellHeight);
		}

		if( (cell & this.East) == this.East){
			ctx.moveTo(px + this.cellWidth, py);
			ctx.lineTo(px + this.cellWidth, py + this.cellHeight);
		}
		ctx.closePath();
		ctx.stroke();
	}
};
Maze.prototype.getX = function(index) {
	return Math.floor(index % this.width);
};

Maze.prototype.getY = function(index) {
	return Math.floor(index / this.width);
};

Maze.prototype.canNorth = function(index) {
	return index > this.width && (this.mazeData[index] & this.North) != this.North;
};

Maze.prototype.canSouth = function(index) {
	return index < this.width * (this.height-1) && (this.mazeData[index] & this.South) != this.South;
};

Maze.prototype.canWest = function(index) {
	return index % this.width != 0 && (this.mazeData[index] & this.West) != this.West;
};

Maze.prototype.canEast = function(index) {
	return  (index+1) % this.width != 0 && (this.mazeData[index] & this.East) != this.East;
};
 // debug stuff
Maze.prototype.getXY = function(i) {
	console.log(Math.floor(i % this.width), Math.floor(i / this.width));
};
Maze.prototype.directionName = function(dir) {
	if(dir== this.North) {
		return "North";
	}
	if (dir==this.South) {
		return "South";
	}
	if (dir==this.West) {
		return "West";
	}
	if (dir==this.East) {
		return "East";
	}
	return "Error!!!";
}

exports.Maze = Maze;