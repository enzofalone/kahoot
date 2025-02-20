import { useEffect, useState } from 'react';

function Host() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState<WebSocket>();
  const [roomCode, setRoomCode] = useState('');
  useEffect(() => {
    setLoading(true);

    // connect to host
    const socket = new WebSocket('ws://localhost:3000/host', ['kahoot']);

    socket.addEventListener('open', (e) => {
      setConnection(socket);
    });

    socket.addEventListener('message', async (e) => {
      console.log('server message', e.data);
      const inEvent = await JSON.parse(e.data);

      if (inEvent.event == 'room_created') {
        setRoomCode(inEvent.content.room_code);
      }
    });

    socket.addEventListener('error', (e) => {
      console.error(e);
    });

    setLoading(false);
  }, []);

  return (
    <>
      <div>host</div>
      {loading ?? <h1>Connecting to websocket...</h1>}
      {playing ? (
        <></>
      ) : (
        <>
          <div>Ready to start game now!</div>
          <div>Room code: {roomCode}</div>
          <button onClick={() => setPlaying(true)}>Start</button>
        </>
      )}
    </>
  );
}

export default Host;
