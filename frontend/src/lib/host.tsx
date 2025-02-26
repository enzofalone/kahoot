import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createEvent, Event, EventType } from '../util/event';
import EventEmitter, { EventPrompt, EventStartGame } from './event-emitter';

type HostContextData = {
  webSocket?: WebSocket;
  roomCode: string;
  loading: boolean;
  emitter: EventEmitter;
  onStart: () => void;
  onNext: () => void;
  state: EventType;
};

type Question = {
  prompt: string;
  answerBank?: string[];
  countdown: number;
};

const SUBPROTOCOL = 'kahoot';
const HOST_URL = 'ws://localhost:3000/host';

const HostContext = createContext<HostContextData>({} as HostContextData);

type HostProviderProps = {
  children: ReactNode;
};

interface hostState {
  currentQuestion: number;
  users: { username: string }[];
}

export const HostContextProvider = ({ children }: HostProviderProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [state, setState] = useState<EventType>(EventType.START); // TODO: create an idle event type
  const webSocket = useRef<WebSocket>(null);
  const emitter = new EventEmitter();

  useEffect(() => {
    setLoading(true);
    webSocket.current = new WebSocket(HOST_URL, [SUBPROTOCOL]);

    webSocket.current.onopen = (e) => {
      setLoading(false);
    };

    webSocket.current.onmessage = async (e) => {
      try {
        console.log('server message', e.data);
        const inEvent = await JSON.parse(e.data);
        const { event } = inEvent;

        setState(event);

        if (event == EventType.ROOM_CREATED) {
          setRoomCode(inEvent.content.room_code);
        }

        if (event == EventType.START) {
          emitter.emit<EventStartGame>(EventType.START, {
            sleep: inEvent.content.sleep,
          });
        }

        if (event == EventType.PROMPT) {
          const { prompt, answer_bank: answerBank, sleep } = inEvent;
          emitter.emit<EventPrompt>(EventType.PROMPT, {
            prompt,
            answerBank,
            sleep,
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }

      setLoading(false);
    };

    webSocket.current.onerror = (e) => {
      console.error('websocket error', e);
    };

    return () => {
      webSocket.current?.close();
      console.log('WebSocket closed');
    };
  }, []);

  const onNext = () => {};

  const onStart = async () => {
    webSocket.current?.send(createEvent(EventType.START));
    setLoading(true);
  };

  return (
    <HostContext.Provider
      value={{
        webSocket: webSocket.current as WebSocket,
        loading,
        state,
        roomCode,
        onNext,
        onStart,
        emitter,
      }}
    >
      {children}
    </HostContext.Provider>
  );
};

export const useHostContext = () => useContext(HostContext);
