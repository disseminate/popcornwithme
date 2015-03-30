var app = require( "express" )();
var http = require( "http" ).Server( app );
var io = require( "socket.io" )( http );

app.get( "/", function( req, res ) {
	res.sendFile( __dirname + "/index.htm" );
} );
app.get( "/style.css", function( req, res ) {
	res.sendFile( __dirname + "/style.css" );
} );
app.get( "/client.js", function( req, res ) {
	res.sendFile( __dirname + "/client.js" );
} );

http.listen( 80, function() {
	console.log( "popcornwith.me initialized." );
} );

var playerURLs = { };
var playerTimes = { };

setInterval( function() {
	for( var i in playerTimes ) {
		playerTimes[i]++;
		io.to( i ).emit( "update-time", playerTimes[i] );
	}
}, 1000 );

function getIdFromVideo( video ) {
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
}

io.on( "connection", function( socket ) {
	socket.chatName = "Guest " + Math.floor( Math.random() * 10000 );
	socket.room = "";
	
	function getClientsInRoom() {
		var ret = [];
		var ns = io.of( "/" );
		
		if( ns ) {
			for( var id in ns.connected ) {
				var i = ns.connected[id].rooms.indexOf( socket.rooms[0] );
				if( i !== -1 ) {
					ret.push( ns.connected[id].chatName );
				}
			}
		}
		
		return ret;
	}
	
	function updateUsers() { // Update all users in my current room
		var users = getClientsInRoom( socket.room );
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
			
			for( var i = 0; i < socket.rooms.length; i++ ) {
				updateUsers();
			}
			
			if( playerURLs[socket.room] != null ) {
				socket.emit( "play-video", [ playerURLs[socket.room], playerTimes[socket.room] ] );
			} else {
				socket.emit( "stop-video" );
			}
		}
	} );
	
	socket.on( "change-video", function( data ) {
		if( data.length > 0 ) {
			var id = getIdFromVideo( data );
			
			for( var i = 0; i < socket.rooms.length; i++ ) {
				io.to( socket.rooms[i] ).emit( "play-video", [ id, 0 ] );
				playerURLs[socket.rooms[i]] = id;
				playerTimes[socket.rooms[i]] = 0;
			}
		}
	} );
	
	socket.on( "change-user", function( data ) {
		if( data.length > 0 ) {
			socket.chatName = data;
		}
		updateUsers();
	} );
	
	socket.on( "chat", function( data ) {
		if( data.length > 0 ) {
			console.log( socket.chatName + ": " + data );
			for( var i = 0; i < socket.rooms.length; i++ ) {
				socket.broadcast.to( socket.rooms[i] ).emit( "chat", [ socket.chatName, data ] );
			}
		}
	} );
} );
