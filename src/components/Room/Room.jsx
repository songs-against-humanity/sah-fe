import React from 'react';
import { useSocketSelector } from 'react-socket-io-hooks';
import SpotifyPlayer from '../SpotifyPlayer/SpotifyPlayer';
import { SongSearch } from '../SongSearch/SongSearch';

const Room = () => {
  let { room_id, host, participants, songQueue } = useSocketSelector(state => state);

  console.log(room_id, participants, songQueue);

  return (
    <div>
      <p>Host: {host?.name}</p>
      <p>Participants</p> {
        participants.map(participant => <p key={participant?.id}>{participant?.name}</p>)
      }
      <p>You entered a room!</p>
      <p>Song Queue:</p>
      <SpotifyPlayer queue={songQueue} />
      <SongSearch/>
    </div>
  );
};
export default Room;
