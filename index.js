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

io.on( "connection", function( socket ) {
	var chatName = "Guest " + Math.floor( Math.random() * 10000 );
	
	socket.on( "change-room", function( data ) {
		for( var i = 0; i < socket.rooms.length; i++ ) {
			socket.leave( socket.rooms[i] );
		}
		socket.join( data );
	} );
	
	socket.on( "change-user", function( data ) {
		chatName = data;
	} );
	
	socket.on( "chat", function( data ) {
		console.log( chatName + ": " + data );
		for( var i = 0; i < socket.rooms.length; i++ ) {
			socket.broadcast.to( socket.rooms[i] ).emit( "chat", [ chatName, data ] );
		}
	} );
} );
