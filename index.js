var app = require( "express" )();
var http = require( "http" ).Server( app );
var io = require( "socket.io" )( http );
var colors = require( "colors" );

app.get( "/", function( req, res ) {
	res.sendFile( __dirname + "/index.htm" );
} );
app.get( "/style.css", function( req, res ) {
	res.sendFile( __dirname + "/style.css" );
} );
app.get( "/client.js", function( req, res ) {
	res.sendFile( __dirname + "/client.js" );
} );
app.get( "/*/style.css", function( req, res ) {
	res.sendFile( __dirname + "/style.css" );
} );
app.get( "/*/client.js", function( req, res ) {
	res.sendFile( __dirname + "/client.js" );
} );
app.get( "/*", function( req, res ) {
	res.sendFile( __dirname + "/index.htm" );
} );

http.listen( 80, function() {
	console.log( "popcornwith.me initialized.".green.bold );
} );

var playerURLs = { };
var playerTimes = { };
var playerServices = { };

setInterval( function() {
	for( var i in playerTimes ) {
		playerTimes[i]++;
		io.to( i ).emit( "update-time", playerTimes[i] );
	}
}, 1000 );

function getIdFromVideo( video, type ) {
	if( type == 1 ) {
		var id = video.split( "v=" )[1];
		if( id != null ) {
			var aP = id.indexOf( "&" );
			if( aP != -1 ) {
				id = id.substring( 0, aP );
			}
			aP = id.indexOf( "#" );
			if( aP != -1 ) {
				id = id.substring( 0, aP );
			}
			return id;
		}
		
		return video;
	} else if( type == 2 ) {
		return video;
	} else if( type == 3 ) {
		var idtab = video.split( "/" );
		var id = idtab[idtab.length - 1];
		if( id ) {
			return id;
		}
		return video;
	} else if( type == 4 ) {
		var idtab = video.split( "twitch.tv/" );
		var id = idtab[1];
		if( id ) {
			return id;
		}
		return video;
	}
}

function getServiceFromVideo( video ) {
	if( video.indexOf( "youtube." ) != -1 ) {
		return 1;
	} else if( video.indexOf( "soundcloud." ) != -1 ) {
		return 2;
	} else if( video.indexOf( "vimeo." ) != -1 ) {
		return 3;
	} else if( video.indexOf( "twitch.tv" ) != -1 ) {
		return 4;
	}
	return 0;
}

function getClientsInRoom( room ) {
	var ret = [];
	var ns = io.of( "/" );
	
	if( ns ) {
		for( var id in ns.connected ) {
			var i = ns.connected[id].rooms.indexOf( room );
			if( i !== -1 ) {
				ret.push( ns.connected[id].chatName );
			}
		}
	}
	
	return ret;
}

io.on( "connection", function( socket ) {
	socket.chatName = "Guest " + Math.floor( Math.random() * 10000 );
	socket.room = "";
	
	console.log( ( socket.chatName + " connected." ).yellow );
	
	function getClientsInMyRoom() {
		return getClientsInRoom( socket.rooms[0] );
	}
	
	function updateUsers() { // Update all users in my current room
		var users = getClientsInMyRoom();
		io.to( socket.room ).emit( "chat-users", users );
	}
	
	socket.on( "request-users", function( data ) {
		updateUsers();
	} );
	
	socket.on( "change-room", function( data ) {
		if( data.length > 0 ) {
			for( var i = 0; i < socket.rooms.length; i++ ) {
				var r = socket.rooms[i];
				socket.leave( r );
				socket.broadcast.to( r ).emit( "request-users" );
			}
			socket.join( data );
			socket.room = data;
			
			console.log( socket.chatName.yellow + " joined room \"" + data.yellow + "\"." );
			
			for( var i = 0; i < socket.rooms.length; i++ ) {
				updateUsers();
			}
			
			if( playerURLs[socket.room] != null ) {
				socket.emit( "play-video", [ playerURLs[socket.room], playerTimes[socket.room], playerServices[socket.room] ] );
			} else {
				socket.emit( "stop-video" );
			}
		}
	} );
	
	socket.on( "change-video", function( data ) {
		if( data.length > 0 ) {
			var type = getServiceFromVideo( data );
			var id = getIdFromVideo( data, type );
			
			console.log( socket.chatName.yellow + " changed the video for room \"" + socket.room.yellow + "\" to " + id.yellow + "." );
			
			for( var i = 0; i < socket.rooms.length; i++ ) {
				io.to( socket.rooms[i] ).emit( "play-video", [ id, 0, type ] );
				playerURLs[socket.rooms[i]] = id;
				playerTimes[socket.rooms[i]] = 0;
				playerServices[socket.rooms[i]] = type;
			}
		}
	} );
	
	socket.on( "change-user", function( data ) {
		if( data.length > 0 ) {
			console.log( socket.chatName.yellow + " changed their name to " + data.yellow + "." );
			socket.chatName = data;
		}
		updateUsers();
	} );
	
	socket.on( "chat", function( data ) {
		if( data.length > 0 ) {
			console.log( ( "[" + socket.room + "] " + socket.chatName + ": " + data ).gray );
			for( var i = 0; i < socket.rooms.length; i++ ) {
				socket.broadcast.to( socket.rooms[i] ).emit( "chat", [ socket.chatName, data ] );
			}
		}
	} );
} );
