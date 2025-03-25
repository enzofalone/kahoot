import { useEffect, useState } from 'react';
import { EventType } from '@util/event';
import { useCountdown } from '@hooks/useCountdown';

import { useWebSocketContext } from '@lib/websocket';
import { useGameStore, useLobbyStore } from '@lib/store';

import playerIcon1 from '@assets/face-1.webp';
import playerIcon2 from '@assets/face-2.webp';
import { LoadingBar } from '@/components/Loading/LoadingBar';
import { Player } from '@/util/player';
import { useShallow } from 'zustand/shallow';

function HostLobby() {
  const { emitter, send } = useWebSocketContext();
  const { startCountdown, countdown } = useCountdown();
  const [duration, setDuration] = useState(0);

  const roomCode = useGameStore((state) => state.roomCode);
  const setRoomCode = useGameStore((state) => state.setRoomCode);
  const setTotalQuestions = useGameStore((state) => state.setTotalQuestions);

  const players = useLobbyStore(useShallow((state) => state.players));
  const addPlayer = useLobbyStore((state) => state.addPlayer);
  const removePlayer = useLobbyStore((state) => state.removePlayer);

  useEffect(() => {
    emitter.on(EventType.START, (e) => {
      const { sleep, totalQuestions } = e || {};

      setDuration(sleep);
      startCountdown(sleep / 1000);

      setTotalQuestions(totalQuestions);
    });

    emitter.on(EventType.ROOM_CREATED, (e) => {
      console.log(e);
      setRoomCode(e.roomCode);
    });

    emitter.on(EventType.JOIN, (e) => {
      console.log('new player', e.playerId);
      addPlayer(e.playerId);
    });

    emitter.on(EventType.DISCONNECT, (e) => {
      removePlayer(e.playerId);
    });
  }, []);

  const onStart = () => {
    send(EventType.START);
  };

  return (
    <>
      {duration > 0 ? <LoadingBar duration={duration} /> : <></>}
      <div className="w-full h-full">
        <div className="flex flex-col w-full h-full">
          <div className="h-[30vh] max-w-[80vw] flex flex-col justify-center items-center mx-auto">
            <div className="flex text-3xl">
              <h2 className="font-bold mr-2">Join at</h2>
              <h2>notkahoot.it</h2>
            </div>
            <h2 className="text-2xl">Game pin:</h2>
            <h1 className="text-4xl font-extrabold">
              {roomCode.substring(0, 3).toUpperCase()}{' '}
              {roomCode.substring(3, 6).toUpperCase()}
            </h1>
            {countdown ? (
              <h1 className="mt-2 text-5xl font-extrabold">{countdown}</h1>
            ) : (
              <></>
            )}
          </div>
          <div className="bg-slate-800 h-[70vh] overflow-hidden">
            <div className="grid grid-cols-3 grid-flow-col align-center">
              <PlayerCount playerCount={players.length || 0} />
              <Logo />
              <StartButton onStart={onStart} />
            </div>
            <PlayerList players={players} />
          </div>
        </div>
      </div>
    </>
  );
}

function PlayerList({ players }: { players: Player[] }) {
  const playerIcons = [playerIcon1, playerIcon2];

  return (
    <div className="w-full flex gap-20 flex-wrap justify-center ">
      {players.map((player) => (
        <PlayerIcon
          key={player.ID}
          playerId={player.ID}
          playerIcon={playerIcons[player.profilePic]}
        />
      ))}
    </div>
  );
}

function PlayerIcon({
  playerId,
  playerIcon,
}: {
  playerId: string;
  playerIcon: string;
}) {
  return (
    <div className="w-20 flex flex-col justify-center items-center">
      <img
        className="rounded-full"
        src={playerIcon} // TODO: store this random number somewhere, add icons for the players
      ></img>
      <span className="w-fit text-3xl text-ellipsis">{playerId}</span>
    </div>
  );
}

function PlayerCount({ playerCount }: { playerCount: number }) {
  return (
    <div className="w-10 h-10 flex flex-col justify-center items-center p-8 m-5">
      <span className="w-fit h-fit font-bold text-6xl italic">
        {playerCount}
      </span>
      <span className="font-bold tracking-wide">
        Player{playerCount != 1 ? 's' : ''}
      </span>
    </div>
  );
}

function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="cursor-pointer ml-auto w-fit bg-green-700 px-4 py-2 rounded-md font-bold tracking-wide text-2xl m-5 hover:border-b-0 border-b-2 hover:border-r-0 border-r-2 border-green-900"
    >
      Start
    </button>
  );
}

function Logo() {
  return (
    <div className="flex justify-center items-center">
      <h1 className="text-5xl font-bold select-none">Not kahoot</h1>
    </div>
  );
}

export default HostLobby;
