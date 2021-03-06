import React, { useState } from 'react';
import { useSocket, useSocketSelector } from 'react-socket-io-hooks';
const SpotifyWebApi = require('spotify-web-api-js');
const spotifyApi = new SpotifyWebApi();

export const SongSearch = () => {
  const [songQuery, setSongQuery] = useState('');
  const socket = useSocket();
  let { room_id, token } = useSocketSelector(state => state);
  const [searchResults, setSearchResults] = useState([]);

  const handleChange = ({ target }) => {
    setSongQuery(target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    spotifyApi.setAccessToken(token);
    spotifyApi.searchTracks(songQuery)
      .then(data => {
        const relevantData = data.tracks.items.map(result => ({
          uri: result.uri,
          title: result.name,
          artist: result.artists[0].name
        }));

        setSearchResults(relevantData);
      }, error => {
        // eslint-disable-next-line no-console
        console.error(error);
      });
  };

  const handleSelect = (songData) => {
    socket.emit('CHOICE', { room_id, songData });
  };

  return (
    <>
      <form className="song-search" onSubmit={handleSubmit}>
        <input
          type='text'
          name='song-search'
          placeholder='song-search'
          onChange={handleChange}>
        </input>
        <button>Search</button>
      </form>
      <div className="song-list">
        {
          searchResults.map((songData, i) => {
            const { title, artist } = songData;
            return <ul key={i}>
              <li><b>{title},</b> {artist} <button onClick={() => handleSelect(songData)}>Select</button></li>
            </ul>;
          })
        }
      </div>
    </>
  );
};
