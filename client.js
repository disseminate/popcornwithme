var socket = io();

var room = "room-" + Math.floor( Math.random() * 32768 );
var user = "Guest " + Math.floor( Math.random() * 10000 );
socket.emit( "change-room", room );
socket.emit( "change-user", user );

socket.on( "chat", function( data ) {
	$( "#chat-list" ).append( $( "<li>" ).append( $( "<b>" ).text( data[0] ), ": ", $( "<span />" ).text( data[1] ) ) );
} );

var player;

var playerURLs = { };
var playerTimes = { };

function onYouTubeIframeAPIReady() {
	if( player == null ) {
		player = new YT.Player( "video", {
			height: '480',
			width: '848',
			videoId: 'N1uiLR6luWo',
			events: {
				"onReady": playVid
			}
		} );
	}
}

function playVid( ev ) {
	ev.target.playVideo();
}

$( document ).ready( function() {
	$( "#room-entry-entry" ).val( room );
	$( "#room-name" ).text( room );
	$( "#chat-name" ).val( user );
	
	$( "#room-entry" ).submit( function( ev ) {
		room = $( "#room-entry-entry" ).val();
		socket.emit( "change-room", room );
		
		$( "#room-name" ).text( room );
		$( "#chat-list" ).empty();
		
		ev.preventDefault();
	} );
	
	$( "#video-url-submit" ).click( function() {
		if( $( "#video-url" ).val().length > 0 ) {
			socket.emit( "change-video", $( "#video-url" ).val() );
		}
	} );
	
	$( "#chat-entry" ).keyup( function( ev ) {
		if( ev.keyCode == 13 ) {
			var a = $( this ).val();
			if( a.length > 0 ) {
				socket.emit( "chat", a );
				$( "#chat-list" ).append( $( "<li>" ).append( $( "<b>" ).text( user ), ": ", $( "<span />" ).text( a ) ) );
				$( this ).val( "" );
				$( "#chat" ).scrollTop( $( "#chat" ).prop( "scrollHeight" ) );
			}
		}
	} );
	
	$( "#chat-entry" ).width( $( "#chat" ).width() + 40 );
	$( window ).resize( function() {
		$( "#chat-entry" ).width( $( "#chat" ).width() + 40 );
	} );
	
	$( "#chat-name" ).keyup( function( ev ) {
		if( ev.keyCode == 13 && $( this ).val().length > 0 ) {
			user = $( this ).val();
			socket.emit( "change-user", user );
			$( this ).blur();
		}
	} );
	
	$( "#chat-name-submit" ).click( function() {
		if( $( "#chat-name" ).val().length > 0 ) {
			user = $( "#chat-name" ).val();
			socket.emit( "change-user", user );
		}
	} );
} );
