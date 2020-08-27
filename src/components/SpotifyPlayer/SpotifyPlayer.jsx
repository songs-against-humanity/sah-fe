import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSocket, useSocketSelector } from 'react-socket-io-hooks';

// Play a specified track on the Web Playback SDK's device ID

function play(device_id, _token, uri) {
  fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
    method: 'PUT',
    body: `{"uris": ["${uri}"]}`,
    headers: {
      'Authorization': `Bearer ${_token}`
    }
  });
}

function pause(device_id, _token) {
  fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${device_id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${_token}`
    }
  });
}

export default function SpotifyPlayer({ queue, isJudge }) {
  const socket = useSocket();
  const { room_id, nowPlaying } = useSocketSelector(state => state);
  const [deviceId, setDeviceId] = useState('');
  const [spotifyReady, setSpotifyReady] = useState(false);
  const [albumArt, setAlbumArt] = useState('');
  const [currentTrackName, setCurrentTrackName] = useState('');
  const { token } = useSelector(state => state);


  useEffect(() => {
    console.log('in useeffect');
    if(!nowPlaying) {
      pause(deviceId, token);
    }
  }, [nowPlaying]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      setSpotifyReady(true);
    };
    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    if(!spotifyReady) return;

    const player = new Spotify.Player({
      name: 'Web Playback SDK Template',
      getOAuthToken: cb => { cb(token); }
    });
    // Error handling
    player.on('initialization_error', e => console.error(e));
    player.on('authentication_error', e => console.error(e));
    player.on('account_error', e => console.error(e));
    player.on('playback_error', e => console.error(e));

    // Playback status updates
    player.addListener('player_state_changed', state => {

      if(state.paused) {
        setAlbumArt('');
        setCurrentTrackName('');
      } else {
        setAlbumArt(state.track_window.current_track.album.images[0].url);
        setCurrentTrackName(state.track_window.current_track.name);
      }
    });

    player.addListener('ready', data => {
      setDeviceId(data.device_id);
    });

    player.connect();

    return () => {
      player.removeListener('initialization_error');
      player.removeListener('authentication_error');
      player.removeListener('account_error');
      player.removeListener('playback_error');
      player.removeListener('player_state_changed');
      player.removeListener('ready');
      player.disconnect();
    };
  }, [spotifyReady, token]);

  const handleClick = (songData) => {
    console.log('clicked play for ' + songData.title + ' in room ' + room_id);
    socket.emit('PLAY', { room_id, songData });
  };

  const handlePause = (deviceId, token) => {
    console.log('in here');
    socket.emit('PAUSE', room_id);
    pause(deviceId, token);
  };

  const handleWinner = (participant) => {
    pause(deviceId, token);
    console.log('selected winner', participant);
    socket.emit('WINNER', { room_id, winner: participant });
  };

  useEffect(() => {
    play(deviceId, token, nowPlaying.uri);
  }, [nowPlaying]);

  return (<div>
    <img id="current-track" src={albumArt}/>
    <h3 id="current-track-name">{currentTrackName}</h3>
    <div className="song-list">
      {
        queue.map((queueItem, i) => {
          const { participant, songData } = queueItem;
          return <>
            <p>{songData.artist} - {songData.title}</p>
            { isJudge && <>
              <button
                key={i}
                disabled={!deviceId}
                onClick={() => handleClick(songData)}>
              Play
              </button>
              <button
                key={i}
                disabled={!deviceId}
                onClick={() => handlePause(deviceId, token)}>
              Pause
              </button>
              <button
                key={i}
                disabled={!deviceId}
                onClick={() => handleWinner(participant)}>
              Select Winner
              </button>
            </>}
          </>;
        })
      }
    </div>
  </div>);
}
