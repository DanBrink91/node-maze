	var host = location.origin.replace(/^http/, 'ws');
	var ws = new WebSocket(host);

	var users = [];

	function userIndexOf(users, id) {
		for(var i = 0; i < users.length; i++)
		{
			if (users[i].id == id)
				return i;
		}
		return -1;
	}
	ws.onopen = function(event) {

		document.querySelector("#createRoomButton").onclick = function(e) {
			var name = document.querySelector("#roomNameText").value;

			var createRoom = {
				'name': 'create.room',
				'data': {'name': name}
			};
			console.log("trying to create room");
			ws.send(JSON.stringify(createRoom));
		};
		document.querySelector("#nickButton").onclick = function(e) {
			var name = document.querySelector("#userNick").value;

			if (name.length == 0)
				return;

			var updateNick = {
				'name': 'user.nick',
				'data': name
			};
			ws.send(JSON.stringify(updateNick));
		};
		document.querySelector("#north").onclick = function(e) {
			var move = {
				'type': 'move',
				'payload': 'N'
			};
			ws.send(JSON.stringify(move));
		};
		document.querySelector("#south").onclick = function(e) {
			var move = {
				'type': 'move',
				'payload': 'S'
			};
			ws.send(JSON.stringify(move));
		};
		document.querySelector("#west").onclick = function(e) {
			var move = {
				'type': 'move',
				'payload': 'W'
			};
			ws.send(JSON.stringify(move));
		};
		document.querySelector("#east").onclick = function(e) {
			var move = {
				'type': 'move',
				'payload': 'E'
			};
			ws.send(JSON.stringify(move));
		};
	};
	ws.onmessage = function(event) {
		console.log(event.data);
		var obj = JSON.parse(event.data);
		switch(obj.name){
			case 'hub.enter':
				var rooms = obj.data;
				for(var i = 0; i < rooms.length; i++) {
					var li = document.createElement('li');
					li.innerHTML = rooms[i];
					document.querySelector("#roomList").appendChild(li);
				}
			break;
			
			case 'user.join':
				var user = obj.data;
				users.push(user);

				var li = document.createElement('li');
				li.innerHTML = user.name;
				document.querySelector("#userList").appendChild(li);
			break;
			// This doubles as a "entered room" event
			case 'user.sync':
				// hide Hub and show room specific
				document.querySelector("#hub").classList.add('hidden');
				document.querySelector("#room").className = "";

				users = [];
				var user_list = obj.data;
				var list_element = document.querySelector("#userList")
				
				// empty out the element
				while(list_element.firstChild) {
					list_element.removeChild(list_element.firstChild);
				}

				for(var i = 0; i < user_list.length; i++) {
					users.push(user_list[i]);
					var li = document.createElement('li');
					li.innerHTML = user_list[i].name;
					list_element.appendChild(li);	
				}
			break;
			case 'user.nick':
				var user = obj.data;
				var user_index = userIndexOf(users, user.id);
				if (user_index === -1)
					return;
				var user_names = document.querySelector("#userList").childNodes;
				for(child in user_names) {
					if(user_names[child].innerHTML == users[user_index].name) { 
						user_names[child].innerHTML = user.name;
					}
				}
				users[user_index].name = user.name;
			break;
			case 'user.remove':
				var user = obj.data;
				var user_index = userIndexOf(users, user.id);
				if (user_index === -1)
					return;
				users.splice(user_index, 1);
			break;	
			case "chat":
				var li = document.createElement('li');
				li.innerHTML = obj.sender + ": " +obj.message;
				document.querySelector("#content").appendChild(li);
			break;
		}
	};
