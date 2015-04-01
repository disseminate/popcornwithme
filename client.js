var socket = io();

var room = "room-" + Math.floor( Math.random() * 32768 );
var user = "Guest " + Math.floor( Math.random() * 10000 );

var player;

var playerService;
var playerURL;
var playerTime;

var serverTime;

var timeCounter;

$( document ).ready( function() {
	var s = document.URL.split( "/" );
	if( s.length >= 3 ) {
		if( s[3].length > 0 ) {
			room = s[3];
		}
	}
	
	socket.emit( "change-room", room );
	socket.emit( "change-user", user );
	
	socket.emit( "request-users" );
	
	function clearPlayerDiv() {
		window.removeEventListener( 'message', onVimeoMessage, false );
		if( playerService == 1 ) {
			$( "#video-src" ).remove();
			$( "#video" ).append( "<div id=\"video-src\"></div>" );
			player = null;
		} else if( playerService == 2 ) {
			$( "#video-src" ).remove();
			$( "#video" ).append( "<div id=\"video-src\"></div>" );
			player = null;
		} else if( playerService == 3 ) {
			$( "#video-src" ).remove();
			$( "#video" ).append( "<div id=\"video-src\"></div>" );
			player = null;
		} else if( playerService == 3 ) {
			$( "#video-src" ).remove();
			$( "#video" ).append( "<div id=\"video-src\"></div>" );
			player = null;
		}
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
	
	function vimeoPost( action, value ) {
		if( player ) {
			var url = player.attr( 'src' ).split( '?' )[0];
			var data = { method: action };
			
			if( value ) {
				data.value = value;
			}
			
			var message = JSON.stringify( data );
			player[0].contentWindow.postMessage( data, url );
		}
	}

	function onVimeoMessage( e ) {
		if( player ) {
			var data = JSON.parse( e.data );
			
			if( data.event == "ready" ) {
				vimeoPost( "seekTo", playerTime );
				vimeoPost( "play" );
			} else if( data.method == "getCurrentTime" ) {
				if( player != null ) {
					var diff = serverTime - data.value;
					if( diff < 0 ) {
						diff *= -1;
					}
					
					if( diff > 2 ) {
						vimeoPost( "seekTo", serverTime );
					}
				}
			}
		}
	}
	window.addEventListener( 'message', onVimeoMessage, false );
	
	socket.on( "update-time", function( data ) {
		serverTime = data;
		if( playerService == 1 ) {
			if( player != null && data < player.getDuration() ) {
				var diff = data - player.getCurrentTime();
				if( diff < 0 ) {
					diff *= -1;
				}
				
				if( diff > 2 ) {
					player.seekTo( data );
				}
			}
		} else if( playerService == 2 ) {
			if( player != null ) {
				player.getDuration( function( duration ) {
					if( player != null && data < duration ) {
						player.getPosition( function( pos ) {
							if( player != null ) {
								var diff = data - ( pos / 1000 );
								if( diff < 0 ) {
									diff *= -1;
								}
								
								if( diff > 2 ) {
									player.seekTo( data * 1000 );
								}
							}
						} );
					}
				} );
			}
		} else if( playerService == 3 ) {
			if( player != null ) {
				vimeoPost( "getCurrentTime" );
			}
		}
	} );
	
	socket.on( "play-video", function( data ) {
		clearPlayerDiv();
		
		playerURL = data[0];
		playerTime = data[1];
		playerService = data[2];
		
		console.log( "Changing video to \"" + playerURL + "\" [" + playerService + "]" );
		
		if( playerService == 1 ) {
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
		} else if( playerService == 2 ) {
			if( player == null ) {
				$( "#video-src" ).remove();
				$( "#video" ).append( "<iframe id=\"video-src\" width=\"848\" height=\"480\" frameborder=\"no\" scrolling=\"no\" src=\"https://w.soundcloud.com/player/?url=" + playerURL + "\"></iframe>" );
				player = new SC.Widget( "video-src" );
			}
			player.load( playerURL, {
				auto_play: true,
				buying: false,
				liking: false,
				download: false,
				sharing: false,
				show_comments: false
			} );
			player.bind( SC.Widget.Events.READY, function() {
				player.seekTo( playerTime * 1000 );
				player.play();
			} );
		} else if( playerService == 3 ) {
			$( "#video-src" ).remove();
			$( "#video" ).append( "<iframe id='video-src' src='https://player.vimeo.com/video/" + playerURL + "/?api=1&player_id=video-src' width='848' height='480' frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>" );
			player = $( "#video-src" );
		} else if( playerService == 3 ) {
			$( "#video-src" ).remove();
			$( "#video" ).append( "<iframe id='video-src' width='848' height='480' frameborder='0' scrolling='no' src='http://www.twitch.tv/" + playerURL + "/embed'></iframe>" );
			player = $( "#video-src" );
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
	
	$( "#video-url" ).keydown( function( ev ) {
		if( ev.keyCode == 13 ) {
			if( $( "#video-url" ).val().length > 0 ) {
				socket.emit( "change-video", $( "#video-url" ).val() );
			}
		}
	} );
	
	$( "#video-url-submit" ).click( function() {
		if( $( "#video-url" ).val().length > 0 ) {
			socket.emit( "change-video", $( "#video-url" ).val() );
		}
	} );
	
	$( "#chat-entry" ).keydown( function( ev ) {
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
	
	$( "#chat-name" ).keydown( function( ev ) {
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
