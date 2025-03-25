import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createEvent, EventPayloads, EventType } from '../util/event';
import EventEmitter from './event-emitter';

type WebSocketContextData = {
  webSocket?: WebSocket;
  loading: boolean;
  emitter: ReturnType<typeof EventEmitter<EventPayloads>>;
  send: (event: EventType, content?: EventType) => void;
  state: EventType;
};

const SUBPROTOCOL = 'kahoot';
const HOST_URL = 'ws://localhost:3000/host';

const WebSocketContext = createContext<WebSocketContextData>(
  {} as WebSocketContextData
);

type WebSocketProviderProps = {
  children: ReactNode;
};

// Events that can change the screen
const validStateEvents: Record<string, boolean> = {
  [EventType.PROMPT]: true,
  [EventType.QUESTION]: true,
  [EventType.ROOM_CREATED]: true,
  [EventType.REVEAL_SCORE]: true,
};

export const WebSocketContextProvider = ({
  children,
}: WebSocketProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<EventType>(EventType.START); // TODO: create an idle event type
  const webSocket = useRef<WebSocket>(null);
  const emitter = EventEmitter<EventPayloads>();

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

        if (validStateEvents[event]) {
          setState(event);
        }

        if (Object.values(EventType).includes(event)) {
          emitter.emit(event, inEvent.content);
        } else {
          throw new Error(`${event} not yet defined!`);
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

  const send = (event: EventType, content: any) => {
    webSocket.current?.send(createEvent(event, content));
    setLoading(true);
  };

  return (
    <WebSocketContext.Provider
      value={{
        webSocket: webSocket.current as WebSocket,
        loading,
        state,
        send,
        emitter,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);
