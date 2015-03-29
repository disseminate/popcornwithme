var socket = io();

var room = "room-" + Math.floor( Math.random() * 32768 );
var user = "Guest " + Math.floor( Math.random() * 10000 );
socket.emit( "change-room", room );
socket.emit( "change-user", user );

socket.on( "chat", function( data ) {
	$( "#chat-list" ).append( $( "<li>" ).append( $( "<b>" ).text( data[0] ), ": ", $( "<span />" ).text( data[1] ) ) );
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
			socket.emit( "chat", $( this ).val() ); // .text( ": " + $( this ).val() )
			$( "#chat-list" ).append( $( "<li>" ).append( $( "<b>" ).text( user ), ": ", $( "<span />" ).text( $( this ).val() ) ) );
			$( this ).val( "" );
		}
	} );
} );
