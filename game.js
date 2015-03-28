	var host = location.origin.replace(/^http/, 'ws');
	var ws = new WebSocket(host);

	var users = [];
	var rooms = [];

	function userIndexOf(users, id) {
		for(var i = 0; i < users.length; i++)
		{
			if (users[i].id == id)
				return i;
		}
		return -1;
	}
	// create and add room
	function createRoom(room) {
		var li = document.createElement('li');
		li.className = "room";
		li.innerHTML = room.name + "("+room.count + "/8)";
		li.dataset.id = room.id
		li.onclick = function(e) {
			var enterRoom = {
				'name': 'enter.room',
				'data': this.dataset.id
			};
			console.log(enterRoom);
			ws.send(JSON.stringify(enterRoom));
		};
		document.querySelector("#roomList").appendChild(li);		
	}

	function localNotifcation(msg, className){
		var chatBox = document.querySelector("#chatArea");
		chatBox.innerHTML += "<span class='"+className+"'>"+msg+"</span><br />";
		chatBox.scrollTop = chatBox.scrollHeight;
	}

	ws.onopen = function(event) {

		document.querySelector("#createRoomButton").onclick = function(e) {
			var name = document.querySelector("#roomNameText").value;

			var create_room = {
				'name': 'create.room',
				'data': {'name': name}
			};
			console.log("trying to create room");
			ws.send(JSON.stringify(create_room));
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
		document.querySelector("#chatButton").onclick = function(e) {
			var chatMessageEl = document.querySelector("#chatMessage");
			var message = chatMessageEl.value;

			if (message.length == 0)
				return;
			
			chatMessageEl.value = "";

			var userChat = {
				'name': 'room.chat',
				'data': message
			};
			
			ws.send(JSON.stringify(userChat));
			chatMessageEl.focus();
		};
		document.querySelector("#chatMessage").onkeyup = function(e){
			// hit enter to send message
			if(e.keyCode == 13){
				var chatMessageEl = document.querySelector("#chatMessage");
				var message = chatMessageEl.value;

				if (message.length == 0)
					return;
				
				chatMessageEl.value = "";

				var userChat = {
					'name': 'room.chat',
					'data': message
				};
				
				ws.send(JSON.stringify(userChat));
			}
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
				var free_rooms = obj.data;
				rooms = free_rooms;
				for(var i = 0; i < free_rooms.length; i++) {
					createRoom(free_rooms[i]);
				}
			break;
			case 'room.add':
				var room = obj.data;
				room.count = 1;
				rooms.push(room);
				createRoom(room);
			break;
			case 'room.update':
				var room = obj.data;
				var roomListChildren = document.querySelector("#roomList").childNodes;
				
				for(var i = 0; i < roomListChildren.length; i++) {
					var child = roomListChildren[i];
					console.log(child);
					if(child.dataset.id == room.id) { 
						child.innerHTML = room.name + "("+room.count + "/8)";
						break;
					}
				}
			break;
			case 'room.full':
				var room = obj.data;
				var roomList = document.querySelector("#roomList");
				var roomListChildren = roomList.childNodes;
				for(child in roomListChildren) {
					if(roomListChildren[child].dataset.id == room.id) { 
						roomList.removeChild(roomListChildren[child]);
						break;
					}
				}
			break;
			case 'user.join':
				var user = obj.data;
				users.push(user);
				// TODO announce join
				var li = document.createElement('li');
				li.innerHTML = user.name;
				li.dataset.id = user.id
				document.querySelector("#userList").appendChild(li);
				localNotifcation(user.name + " has joined the room!", "join");
			break;
			// This doubles as a "entered room" event
			case 'user.sync':
				// hide Hub and show room specific
				document.querySelector("#hub").classList.add('hidden');
				document.querySelector("#room").className = "";
				document.querySelector("#chatSection").className = "";
				
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
					li.dataset.id = user_list[i].id
					list_element.appendChild(li);	
				}
				document.querySelector("#chatMessage").focus();
			break;
			case 'user.nick':
				var user = obj.data;
				var user_index = userIndexOf(users, user.id);
				if (user_index === -1)
					return;
				
				var user_names = document.querySelector("#userList").childNodes;
				for(var i = 0; i < user_names.length; i++) {
					var child = user_names[i];
					if(child.dataset.id == users[user_index].id) { 
						child.innerHTML = user.name;
						break;
					}
				}
				localNotifcation(users[user_index].name + " is now known as " +user.name, "notice");
				users[user_index].name = user.name;
			break;
			case 'user.remove':
				var user = obj.data;
				var user_index = userIndexOf(users, user.id);
				if (user_index === -1)
					return;
				users.splice(user_index, 1);
				
				var user_name_list = document.querySelector("#userList"); 
				var user_names = user_name_list.childNodes;
				
				// TODO announce left				
				for(var i = 0; i < user_names.length; i++) {
					var child = user_names[i];
					if(child.dataset.id == user.id) { 
						var name = child.innerHTML;
						user_name_list.removeChild(child);
						break;
					}
				}
				localNotifcation(name + " has left the room.", "leave");
			break;	
			case "chat":
				var user_id = obj.data.id;
				var msg = obj.data.message;
				var user_index = userIndexOf(users, user_id);
				if (user_index === -1)
					return;
				var name = users[user_index].name;
				var chatBox = document.querySelector("#chatArea")
				chatBox.innerHTML += "<strong>"+name+"</strong>: "+msg+"<br />";
				chatBox.scrollTop = chatBox.scrollHeight;
			break;
		}
	};