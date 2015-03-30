var socket = io();

var room = "room-" + Math.floor( Math.random() * 32768 );
var user = "Guest " + Math.floor( Math.random() * 10000 );
socket.emit( "change-room", room );
socket.emit( "change-user", user );

var player;

var playerURL;
var playerTime;

var timeCounter;

$( document ).ready( function() {
	function clearPlayerDiv() {
		$( "#video-src" ).remove();
		$( "#video" ).append( "<div id=\"video-src\"></div>" );
		player = null;
	}
	
	socket.on( "stop-video", function( data ) {
		clearPlayerDiv();
	} );
	
	socket.on( "chat", function( data ) {
		$( "#chat-list" ).append( $( "<li>" ).append( $( "<b>" ).text( data[0] ), ": ", $( "<span />" ).text( data[1] ) ) );
		$( "#chat" ).scrollTop( $( "#chat" ).prop( "scrollHeight" ) );
	} );
	
	socket.on( "chat-users", function( data ) {
		$( "#chat-users-list" ).empty();
		for( var i in data ) {
			$( "#chat-users-list" ).append( $( "<li>" ).text( data[i] ) );
		}
	} );
	
	socket.on( "request-users", function( data ) {
		socket.emit( "request-users" );
	} );
	
	socket.on( "update-time", function( data ) {
		if( player != null && data < player.getDuration() ) {
			var diff = data - player.getCurrentTime();
			if( diff < 0 ) {
				diff *= -1;
			}
			
			if( diff > 2 ) {
				player.seekTo( data );
			}
		}
	} );
	
	socket.on( "play-video", function( data ) {
		playerURL = data[0];
		playerTime = data[1];
		
		console.log( "Changing video to \"" + playerURL + "\"" );
		
		if( player == null ) {
			console.log( "New Player" );
			player = new YT.Player( "video-src", {
				height: '480',
				width: '848',
				videoId: playerURL,
				playerVars: {
					disablekb: 1,
					modestbranding: 1,
					autoplay: 1,
					start: playerTime
				},
				events: {
					"onStateChange": onStateChange
				}
			} );
			
			function onStateChange( ev, data ) {
				if( data == 2 ) {
					player.playVideo();
				}
			}
		} else {
			console.log( "Old Player" );
			player.loadVideoById( playerURL, playerTime, "large" );
		}
	} );
	
	$( "#room-entry-entry" ).val( room );
	$( "#room-name" ).text( room );
	$( "#chat-name" ).val( user );
	
	$( "#room-entry" ).submit( function( ev ) {
		room = $( "#room-entry-entry" ).val();
		socket.emit( "change-room", room );
		
		$( "#room-name" ).text( room );
		$( "#chat-list" ).empty();
		$( "#chat-users-list" ).empty();
		
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
