import {
  useWebSocketContext,
  WebSocketContextProvider,
} from '../lib/websocket';
import { EventType } from '../util/event';
import Loading from '../components/Loading/Loading';

import HostPrompt from './HostPrompt';
import HostLobby from './HostLobby';
import HostQuestion from './HostQuestion';

function Host() {
  return (
    <WebSocketContextProvider>
      <HostStateManager />
    </WebSocketContextProvider>
  );
}

function HostStateManager() {
  const { state, loading } = useWebSocketContext();

  const getState = (s: EventType) => {
    switch (s) {
      case EventType.PROMPT:
        return <HostPrompt />;
      case EventType.QUESTION:
        return <HostQuestion />;
      default:
        return <HostLobby />;
    }
  };

  return (
    <>
      {loading && <Loading />}
      {getState(state)}
    </>
  );
}

export default Host;
