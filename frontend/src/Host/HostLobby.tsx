import { useEffect, useRef, useState } from 'react';
import { EventStartGame } from '../lib/event-emitter';
import { useHostContext } from '../lib/host';
import { EventType } from '../util/event';

type Props = {};
function HostLobby({}: Props) {
  const { roomCode, emitter, onStart } = useHostContext();
  const [startCountdown, setStartCountdown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleStartGame = (e: EventStartGame) => {
      setCountdown(e.sleep / 1000);
      setStartCountdown(true);
    };

    emitter.on<EventStartGame>(EventType.START, handleStartGame);
  }, [emitter]);

  useEffect(() => {
    if (!startCountdown) return;

    intervalRef.current = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current!);
    };
  }, [startCountdown]);

  return (
    <div>
      <div>
        <div>Ready to start game now!</div>
        <div>Room code: {roomCode}</div>
        <button
          onClick={onStart}
          className="cursor-pointer bg-green-700 px-5 py-3 rounded-md font-bold hover:bg-green-800"
        >
          Start
        </button>
        <div>Countdown: {countdown}</div> {/* Display the countdown */}
      </div>
    </div>
  );
}

export default HostLobby;
