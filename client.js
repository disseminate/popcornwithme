var socket = io();

var room = "room-" + Math.floor( Math.random() * 32768 );
var user = "Guest " + Math.floor( Math.random() * 10000 );
socket.emit( "change-room", room );
socket.emit( "change-user", user );

socket.on( "chat", function( data ) {
	$( "#chat-list" ).append( $( "<li>" ).text( data[1] + ": " + data[2] ) );
} );

$( document ).ready( function() {
	$( "#room-entry-entry" ).val( room );
	$( "#room-name" ).text( room );
	
	$( "#room-entry" ).submit( function( ev ) {
		room = $( "#room-entry-entry" ).val();
		socket.emit( "change-room", room );
		
		$( "#room-name" ).text( room );
		$( "#chat-list" ).empty();
		
		ev.preventDefault();
	} );
	
	$( "#chat-entry" ).keyup( function( ev ) {
		if( ev.keyCode == 13 ) {
			socket.emit( "chat", $( this ).val() );
			$( "#chat-list" ).append( $( "<li>" ).text( user + ": " + $( this ).val() ) );
			$( this ).val( "" );
		}
	} );
} );
